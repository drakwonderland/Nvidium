import crypto from 'node:crypto';
import {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_COOLDOWN_SECONDS,
  buildSessionCookieHeader,
  createChallengeToken,
  emailCodeMatches,
  ensureSchema,
  generateSalt,
  getSessionUser,
  getSql,
  hashPassword,
  issueEmailCode,
  maskEmail,
  parseCookies,
  sha256Hex,
  verifyChallengeToken,
  verifyPassword
} from './_lib.js';

function codeChallengeResponse(userRow, codeId, purpose) {
  return Response.json({
    step: 'verify_code',
    purpose,
    challengeToken: createChallengeToken(userRow.id, codeId, purpose),
    maskedEmail: maskEmail(userRow.email),
    resendAfterSeconds: CODE_RESEND_COOLDOWN_SECONDS
  });
}

function isEmailServiceError(err) {
  const msg = String((err && err.message) || '');
  return msg.includes('RESEND_API_KEY') || msg.includes('Resend send failed');
}

export async function GET(request) {
  try {
    const user = await getSessionUser(request);
    return Response.json({
      authenticated: Boolean(user),
      user: user
    });
  } catch (err) {
    console.error('GET /api/auth error:', err);
    return Response.json({ error: 'Unable to verify session' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const action = String((body && body.action) || '').trim();
    const sql = getSql();

    if (action === 'signup') {
      const fullName = String(body.fullName || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (fullName.length < 2) {
        return Response.json({ error: 'Enter your full name.' }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      const existing = await sql`
        SELECT id, email_verified, totp_enabled FROM nvidium_users WHERE email = ${email} LIMIT 1
      `;
      if (existing.length > 0 && (existing[0].email_verified || existing[0].totp_enabled)) {
        return Response.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const userId = existing.length > 0 ? existing[0].id : crypto.randomUUID();

      if (existing.length > 0) {
        await sql`
          UPDATE nvidium_users
          SET full_name = ${fullName}, salt = ${salt}, password_hash = ${passwordHash}, email_verified = FALSE
          WHERE id = ${userId}
        `;
      } else {
        await sql`
          INSERT INTO nvidium_users (id, email, full_name, salt, password_hash, email_verified)
          VALUES (${userId}, ${email}, ${fullName}, ${salt}, ${passwordHash}, FALSE)
        `;
      }

      const userRow = { id: userId, email, full_name: fullName };
      const codeId = await issueEmailCode(sql, userRow, 'signup');
      return codeChallengeResponse(userRow, codeId, 'signup');
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) {
        return Response.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const rows = await sql`
        SELECT id, email, full_name, salt, password_hash
        FROM nvidium_users
        WHERE email = ${email}
        LIMIT 1
      `;
      if (rows.length === 0 || !verifyPassword(password, rows[0].salt, rows[0].password_hash)) {
        return Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
      }

      const codeId = await issueEmailCode(sql, rows[0], 'login');
      return codeChallengeResponse(rows[0], codeId, 'login');
    }

    if (action === 'resend_code') {
      const challenge = verifyChallengeToken(body.challengeToken);
      if (!challenge) {
        return Response.json({ error: 'This code request expired. Start again.' }, { status: 401 });
      }
      const codeRows = await sql`
        SELECT EXTRACT(EPOCH FROM (NOW() - last_sent_at)) AS age_seconds
        FROM nvidium_email_codes
        WHERE id = ${challenge.cid} AND user_id = ${challenge.uid}
        LIMIT 1
      `;
      if (codeRows.length === 0) {
        return Response.json({ error: 'This code request expired. Start again.' }, { status: 401 });
      }
      const age = Number(codeRows[0].age_seconds);
      if (age < CODE_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(CODE_RESEND_COOLDOWN_SECONDS - age);
        return Response.json({ error: 'Wait ' + wait + 's before requesting another code.', resendAfterSeconds: wait }, { status: 429 });
      }
      const users = await sql`
        SELECT id, email, full_name FROM nvidium_users WHERE id = ${challenge.uid} LIMIT 1
      `;
      if (users.length === 0) {
        return Response.json({ error: 'Account not found.' }, { status: 404 });
      }
      const codeId = await issueEmailCode(sql, users[0], challenge.purpose);
      return codeChallengeResponse(users[0], codeId, challenge.purpose);
    }

    if (action === 'verify_code') {
      const challenge = verifyChallengeToken(body.challengeToken);
      if (!challenge) {
        return Response.json({ error: 'This code expired. Start again.' }, { status: 401 });
      }
      const codeRows = await sql`
        SELECT id, code_hash, attempts, expires_at > NOW() AS is_live
        FROM nvidium_email_codes
        WHERE id = ${challenge.cid} AND user_id = ${challenge.uid}
        LIMIT 1
      `;
      if (codeRows.length === 0 || !codeRows[0].is_live) {
        return Response.json({ error: 'This code expired. Request a new one.' }, { status: 401 });
      }
      const codeRow = codeRows[0];
      if (codeRow.attempts >= CODE_MAX_ATTEMPTS) {
        await sql`DELETE FROM nvidium_email_codes WHERE id = ${codeRow.id}`;
        return Response.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
      }
      if (!emailCodeMatches(codeRow.id, body.code, codeRow.code_hash)) {
        const used = codeRow.attempts + 1;
        await sql`UPDATE nvidium_email_codes SET attempts = ${used} WHERE id = ${codeRow.id}`;
        const left = CODE_MAX_ATTEMPTS - used;
        const msg = left > 0
          ? 'That code is incorrect. ' + left + (left === 1 ? ' attempt' : ' attempts') + ' left.'
          : 'Too many attempts. Request a new code.';
        return Response.json({ error: msg, attemptsLeft: left }, { status: 401 });
      }

      await sql`DELETE FROM nvidium_email_codes WHERE id = ${codeRow.id}`;
      const rows = await sql`
        UPDATE nvidium_users SET email_verified = TRUE WHERE id = ${challenge.uid}
        RETURNING id, email, full_name
      `;
      if (rows.length === 0) {
        return Response.json({ error: 'Account not found.' }, { status: 404 });
      }
      const userRow = rows[0];

      const rawSessionToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = sha256Hex(rawSessionToken);
      await sql`
        INSERT INTO nvidium_sessions (token_hash, user_id, expires_at)
        VALUES (${tokenHash}, ${userRow.id}, NOW() + INTERVAL '7 days')
      `;

      return new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: userRow.id,
            email: userRow.email,
            fullName: userRow.full_name,
            emailVerified: true
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': buildSessionCookieHeader(rawSessionToken, request, 604800)
          }
        }
      );
    }

    if (action === 'logout') {
      const cookies = parseCookies(request);
      if (cookies.nvidium_session) {
        await sql`
          DELETE FROM nvidium_sessions WHERE token_hash = ${sha256Hex(cookies.nvidium_session)}
        `;
      }
      return new Response(JSON.stringify({ authenticated: false, user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': buildSessionCookieHeader('', request, 0)
        }
      });
    }

    return Response.json({ error: 'Unsupported auth action.' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/auth error:', err);
    if (isEmailServiceError(err)) {
      return Response.json({ error: 'We could not send the verification email. Try again in a moment.' }, { status: 503 });
    }
    return Response.json({ error: 'Authentication service error.' }, { status: 500 });
  }
}
