import crypto from 'node:crypto';
import {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_COOLDOWN_SECONDS,
  buildSessionCookieHeader,
  checkRateLimit,
  createChallengeToken,
  dummyVerifyPassword,
  emailCodeMatches,
  ensureSchema,
  generateSalt,
  getClientIp,
  getSessionUser,
  getSql,
  hashPassword,
  issueEmailCode,
  jsonResponse,
  maskEmail,
  parseCookies,
  purgeExpiredAuthRecords,
  sanitizeText,
  sha256Hex,
  verifyChallengeToken,
  verifyPassword,
  verifySameOrigin
} from './_lib.js';

function codeChallengeResponse(userRow, codeId, purpose) {
  return jsonResponse({
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

function rateLimitResponse(retryAfterSeconds) {
  return jsonResponse(
    { error: 'Too many requests. Please try again later.', retryAfterSeconds },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export async function GET(request) {
  try {
    const user = await getSessionUser(request);
    return jsonResponse({
      authenticated: Boolean(user),
      user
    });
  } catch (err) {
    console.error('GET /api/auth error:', err);
    return jsonResponse({ error: 'Unable to verify session' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!verifySameOrigin(request)) {
      return jsonResponse({ error: 'Cross-origin request rejected.' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch (_err) {
      return jsonResponse({ error: 'Invalid JSON request body.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Invalid request payload.' }, { status: 400 });
    }

    await ensureSchema();
    const action = sanitizeText(body.action, 32);
    const sql = getSql();
    const clientIp = getClientIp(request);

    if (action === 'signup') {
      const ipLimit = await checkRateLimit(sql, 'auth:signup:ip', clientIp, 5, 900);
      if (!ipLimit.allowed) {
        return rateLimitResponse(ipLimit.retryAfterSeconds);
      }

      const fullName = sanitizeText(body.fullName, 100);
      const email = sanitizeText(body.email, 254).toLowerCase();
      const password = String(body.password || '');

      if (fullName.length < 2) {
        return jsonResponse({ error: 'Enter your full name.' }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: 'Enter a valid email address.' }, { status: 400 });
      }
      if (password.length < 8) {
        return jsonResponse({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }
      if (password.length > 128) {
        return jsonResponse({ error: 'Password must be 128 characters or fewer.' }, { status: 400 });
      }

      const emailLimit = await checkRateLimit(sql, 'auth:signup:email', email, 5, 900);
      if (!emailLimit.allowed) {
        return rateLimitResponse(emailLimit.retryAfterSeconds);
      }

      await purgeExpiredAuthRecords(sql);

      const existing = await sql`
        SELECT id, email_verified, totp_enabled FROM nvidium_users WHERE email = ${email} LIMIT 1
      `;
      if (existing.length > 0 && (existing[0].email_verified || existing[0].totp_enabled)) {
        return jsonResponse({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
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
        await sql`DELETE FROM nvidium_purchases WHERE user_id = ${userId}`;
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
      const ipLimit = await checkRateLimit(sql, 'auth:login:ip', clientIp, 10, 900);
      if (!ipLimit.allowed) {
        return rateLimitResponse(ipLimit.retryAfterSeconds);
      }

      const email = sanitizeText(body.email, 254).toLowerCase();
      const password = String(body.password || '');
      if (!email || !password || password.length > 128) {
        return jsonResponse({ error: 'Email and password are required.' }, { status: 400 });
      }

      const emailLimit = await checkRateLimit(sql, 'auth:login:email', email, 8, 900);
      if (!emailLimit.allowed) {
        return rateLimitResponse(emailLimit.retryAfterSeconds);
      }

      await purgeExpiredAuthRecords(sql);

      const rows = await sql`
        SELECT id, email, full_name, salt, password_hash
        FROM nvidium_users
        WHERE email = ${email}
        LIMIT 1
      `;
      if (rows.length === 0) {
        dummyVerifyPassword();
        return jsonResponse({ error: 'Incorrect email or password.' }, { status: 401 });
      }
      if (!verifyPassword(password, rows[0].salt, rows[0].password_hash)) {
        return jsonResponse({ error: 'Incorrect email or password.' }, { status: 401 });
      }

      if (!String(rows[0].password_hash || '').startsWith('scrypt$')) {
        const newSalt = generateSalt();
        const newHash = hashPassword(password, newSalt);
        await sql`
          UPDATE nvidium_users SET salt = ${newSalt}, password_hash = ${newHash} WHERE id = ${rows[0].id}
        `;
      }

      const codeId = await issueEmailCode(sql, rows[0], 'login');
      return codeChallengeResponse(rows[0], codeId, 'login');
    }

    if (action === 'resend_code') {
      const ipLimit = await checkRateLimit(sql, 'auth:resend:ip', clientIp, 5, 900);
      if (!ipLimit.allowed) {
        return rateLimitResponse(ipLimit.retryAfterSeconds);
      }

      const challenge = verifyChallengeToken(body.challengeToken);
      if (!challenge) {
        return jsonResponse({ error: 'This code request expired. Start again.' }, { status: 401 });
      }
      const codeRows = await sql`
        SELECT EXTRACT(EPOCH FROM (NOW() - last_sent_at)) AS age_seconds
        FROM nvidium_email_codes
        WHERE id = ${challenge.cid} AND user_id = ${challenge.uid}
        LIMIT 1
      `;
      if (codeRows.length === 0) {
        return jsonResponse({ error: 'This code request expired. Start again.' }, { status: 401 });
      }
      const age = Number(codeRows[0].age_seconds);
      if (age < CODE_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(CODE_RESEND_COOLDOWN_SECONDS - age);
        return jsonResponse({ error: 'Wait ' + wait + 's before requesting another code.', resendAfterSeconds: wait }, { status: 429 });
      }
      const users = await sql`
        SELECT id, email, full_name FROM nvidium_users WHERE id = ${challenge.uid} LIMIT 1
      `;
      if (users.length === 0) {
        return jsonResponse({ error: 'Account not found.' }, { status: 404 });
      }
      const codeId = await issueEmailCode(sql, users[0], challenge.purpose);
      return codeChallengeResponse(users[0], codeId, challenge.purpose);
    }

    if (action === 'verify_code') {
      const ipLimit = await checkRateLimit(sql, 'auth:verify:ip', clientIp, 15, 900);
      if (!ipLimit.allowed) {
        return rateLimitResponse(ipLimit.retryAfterSeconds);
      }

      const challenge = verifyChallengeToken(body.challengeToken);
      if (!challenge) {
        return jsonResponse({ error: 'This code expired. Start again.' }, { status: 401 });
      }
      const codeRows = await sql`
        SELECT id, code_hash, attempts, expires_at > NOW() AS is_live
        FROM nvidium_email_codes
        WHERE id = ${challenge.cid} AND user_id = ${challenge.uid}
        LIMIT 1
      `;
      if (codeRows.length === 0 || !codeRows[0].is_live) {
        return jsonResponse({ error: 'This code expired. Request a new one.' }, { status: 401 });
      }
      const codeRow = codeRows[0];
      if (codeRow.attempts >= CODE_MAX_ATTEMPTS) {
        await sql`DELETE FROM nvidium_email_codes WHERE id = ${codeRow.id}`;
        return jsonResponse({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
      }
      if (!emailCodeMatches(codeRow.id, body.code, codeRow.code_hash)) {
        const used = codeRow.attempts + 1;
        await sql`UPDATE nvidium_email_codes SET attempts = ${used} WHERE id = ${codeRow.id}`;
        const left = CODE_MAX_ATTEMPTS - used;
        const msg = left > 0
          ? 'That code is incorrect. ' + left + (left === 1 ? ' attempt' : ' attempts') + ' left.'
          : 'Too many attempts. Request a new code.';
        return jsonResponse({ error: msg, attemptsLeft: left }, { status: 401 });
      }

      await sql`DELETE FROM nvidium_email_codes WHERE id = ${codeRow.id}`;
      const rows = await sql`
        UPDATE nvidium_users SET email_verified = TRUE WHERE id = ${challenge.uid}
        RETURNING id, email, full_name
      `;
      if (rows.length === 0) {
        return jsonResponse({ error: 'Account not found.' }, { status: 404 });
      }
      const userRow = rows[0];

      const rawSessionToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = sha256Hex(rawSessionToken);
      await sql`
        INSERT INTO nvidium_sessions (token_hash, user_id, expires_at)
        VALUES (${tokenHash}, ${userRow.id}, NOW() + INTERVAL '7 days')
      `;

      return jsonResponse(
        {
          authenticated: true,
          user: {
            id: userRow.id,
            email: userRow.email,
            fullName: userRow.full_name,
            emailVerified: true
          }
        },
        {
          status: 200,
          headers: {
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
      await purgeExpiredAuthRecords(sql);
      return jsonResponse(
        { authenticated: false, user: null },
        {
          status: 200,
          headers: {
            'Set-Cookie': buildSessionCookieHeader('', request, 0)
          }
        }
      );
    }

    return jsonResponse({ error: 'Unsupported auth action.' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/auth error:', err);
    if (isEmailServiceError(err)) {
      return jsonResponse({ error: 'We could not send the verification email. Try again in a moment.' }, { status: 503 });
    }
    return jsonResponse({ error: 'Authentication service error.' }, { status: 500 });
  }
}
