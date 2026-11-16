import crypto from 'node:crypto';
import QRCode from 'qrcode';
import {
  buildSessionCookieHeader,
  createChallengeToken,
  ensureSchema,
  generateSalt,
  generateTotpSecret,
  getSessionUser,
  getSql,
  hashPassword,
  parseCookies,
  sha256Hex,
  verifyChallengeToken,
  verifyPassword,
  verifyTotpCode
} from './_lib.js';

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
        return Response.json({ error: 'Enter your full name (at least 2 characters).' }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }

      const existing = await sql`
        SELECT id, totp_enabled FROM nvidium_users WHERE email = ${email} LIMIT 1
      `;
      if (existing.length > 0 && existing[0].totp_enabled) {
        return Response.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
      }

      const salt = generateSalt();
      const passwordHash = hashPassword(password, salt);
      const totpSecret = generateTotpSecret();
      const userId = existing.length > 0 ? existing[0].id : crypto.randomUUID();

      if (existing.length > 0) {
        await sql`
          UPDATE nvidium_users
          SET full_name = ${fullName}, salt = ${salt}, password_hash = ${passwordHash}, totp_secret = ${totpSecret}, totp_enabled = FALSE
          WHERE id = ${userId}
        `;
      } else {
        await sql`
          INSERT INTO nvidium_users (id, email, full_name, salt, password_hash, totp_secret, totp_enabled)
          VALUES (${userId}, ${email}, ${fullName}, ${salt}, ${passwordHash}, ${totpSecret}, FALSE)
        `;
      }

      const otpauthUri = `otpauth://totp/Nvidium:${encodeURIComponent(email)}?secret=${totpSecret}&issuer=Nvidium&algorithm=SHA1&digits=6&period=30`;
      const qrSvg = await QRCode.toString(otpauthUri, { type: 'svg', margin: 1, width: 176 });
      const challengeToken = createChallengeToken(userId, 'enroll_2fa');

      return Response.json({
        step: 'verify_2fa',
        isEnrollment: true,
        challengeToken,
        totpSecret,
        otpauthUri,
        qrSvg
      });
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email || !password) {
        return Response.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const rows = await sql`
        SELECT id, email, full_name, salt, password_hash, totp_secret, totp_enabled
        FROM nvidium_users
        WHERE email = ${email}
        LIMIT 1
      `;
      if (rows.length === 0 || !verifyPassword(password, rows[0].salt, rows[0].password_hash)) {
        return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const userRow = rows[0];
      const isEnabled = Boolean(userRow.totp_enabled);
      const challengeToken = createChallengeToken(userRow.id, isEnabled ? 'login_2fa' : 'enroll_2fa');

      if (!isEnabled) {
        const otpauthUri = `otpauth://totp/Nvidium:${encodeURIComponent(userRow.email)}?secret=${userRow.totp_secret}&issuer=Nvidium&algorithm=SHA1&digits=6&period=30`;
        const qrSvg = await QRCode.toString(otpauthUri, { type: 'svg', margin: 1, width: 176 });
        return Response.json({
          step: 'verify_2fa',
          isEnrollment: true,
          challengeToken,
          totpSecret: userRow.totp_secret,
          otpauthUri,
          qrSvg
        });
      }

      return Response.json({
        step: 'verify_2fa',
        isEnrollment: false,
        challengeToken
      });
    }

    if (action === 'verify_2fa') {
      const challenge = verifyChallengeToken(body.challengeToken);
      if (!challenge) {
        return Response.json({ error: '2FA challenge expired or invalid. Please sign in again.' }, { status: 401 });
      }
      const code = String(body.code || '').trim();
      const rows = await sql`
        SELECT id, email, full_name, totp_secret, totp_enabled
        FROM nvidium_users
        WHERE id = ${challenge.uid}
        LIMIT 1
      `;
      if (rows.length === 0) {
        return Response.json({ error: 'Account not found.' }, { status: 404 });
      }
      const userRow = rows[0];
      if (!verifyTotpCode(userRow.totp_secret, code)) {
        return Response.json({ error: 'Invalid 6-digit authenticator code.' }, { status: 401 });
      }

      if (!userRow.totp_enabled) {
        await sql`
          UPDATE nvidium_users SET totp_enabled = TRUE WHERE id = ${userRow.id}
        `;
      }

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
            totpEnabled: true
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
    return Response.json({ error: 'Authentication service error.' }, { status: 500 });
  }
}
