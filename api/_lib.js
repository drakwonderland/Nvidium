import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export const CODE_TTL_MINUTES = 10;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_COOLDOWN_SECONDS = 30;
let schemaPromise = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not configured');
  }
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS nvidium_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          totp_secret TEXT,
          totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE nvidium_users ALTER COLUMN totp_secret DROP NOT NULL`;
      await sql`ALTER TABLE nvidium_users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`
        CREATE TABLE IF NOT EXISTS nvidium_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES nvidium_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_nvidium_sessions_expires ON nvidium_sessions(expires_at)`;
      await sql`
        CREATE TABLE IF NOT EXISTS nvidium_email_codes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES nvidium_users(id) ON DELETE CASCADE,
          code_hash TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          expires_at TIMESTAMPTZ NOT NULL,
          last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS nvidium_purchases (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES nvidium_users(id) ON DELETE CASCADE,
          order_ref TEXT NOT NULL,
          item_kind TEXT NOT NULL,
          build_title TEXT NOT NULL,
          qty INTEGER NOT NULL,
          hardware_total_php INTEGER NOT NULL,
          due_today_php INTEGER NOT NULL,
          payment_plan TEXT NOT NULL,
          sla_label TEXT NOT NULL,
          status_label TEXT NOT NULL,
          quote_state_json TEXT NOT NULL,
          receipt_text TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_nvidium_purchases_user_created ON nvidium_purchases(user_id, created_at DESC)`;
      await sql`
        CREATE TABLE IF NOT EXISTS nvidium_rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 1,
          reset_at TIMESTAMPTZ NOT NULL
        )
      `;
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

export async function purgeExpiredAuthRecords(sql) {
  await sql`DELETE FROM nvidium_sessions WHERE expires_at <= NOW()`;
  await sql`DELETE FROM nvidium_email_codes WHERE expires_at <= NOW()`;
  await sql`DELETE FROM nvidium_rate_limits WHERE reset_at <= NOW()`;
}

export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for') || '';
  const first = xff.split(',')[0].trim();
  if (first) return first.slice(0, 64);
  const realIp = (request.headers.get('x-real-ip') || '').trim();
  return realIp ? realIp.slice(0, 64) : 'unknown';
}

export async function checkRateLimit(sql, scope, identifier, maxRequests, windowSeconds) {
  const keyHash = sha256Hex(scope + ':' + String(identifier || 'unknown'));
  const rows = await sql`
    INSERT INTO nvidium_rate_limits (key, count, reset_at)
    VALUES (${keyHash}, 1, NOW() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN nvidium_rate_limits.reset_at <= NOW() THEN 1
        ELSE nvidium_rate_limits.count + 1
      END,
      reset_at = CASE
        WHEN nvidium_rate_limits.reset_at <= NOW() THEN NOW() + make_interval(secs => ${windowSeconds})
        ELSE nvidium_rate_limits.reset_at
      END
    RETURNING count, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (reset_at - NOW()))))::INTEGER AS retry_after
  `;
  const row = rows[0];
  return {
    allowed: row.count <= maxRequests,
    retryAfterSeconds: Number(row.retry_after) || windowSeconds
  };
}

export function verifySameOrigin(request) {
  const method = String(request.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(',')[0].trim().toLowerCase();
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      return originHost === host;
    } catch (_err) {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase();
      return refererHost === host;
    } catch (_err) {
      return false;
    }
  }

  return true;
}

export function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers
  });
}

export function sanitizeText(value, maxLen = 200) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeMultilineText(value, maxLen = 8000) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function hashPassword(password, salt) {
  const derived = crypto.scryptSync(String(password), String(salt), 64, {
    N: 16384,
    r: 8,
    p: 1
  }).toString('hex');
  return 'scrypt$' + derived;
}

export function verifyPassword(password, salt, expectedHash) {
  const expectedStr = String(expectedHash || '');
  if (expectedStr.startsWith('scrypt$')) {
    const actualBuf = Buffer.from(hashPassword(password, salt).slice(7), 'hex');
    const expectedBuf = Buffer.from(expectedStr.slice(7), 'hex');
    if (actualBuf.length !== expectedBuf.length || actualBuf.length === 0) {
      return false;
    }
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  }
  // Legacy PBKDF2-HMAC-SHA256 verification for existing accounts
  const actualBuf = Buffer.from(
    crypto.pbkdf2Sync(String(password), String(salt), 120000, 32, 'sha256').toString('hex'),
    'hex'
  );
  const expectedBuf = Buffer.from(expectedStr, 'hex');
  if (actualBuf.length !== expectedBuf.length || actualBuf.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function dummyVerifyPassword() {
  crypto.scryptSync('dummy-password-for-timing', '0000000000000000', 64, {
    N: 16384,
    r: 8,
    p: 1
  });
}

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function getSigningKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET environment variable must be configured (minimum 16 characters)');
  }
  return crypto.createHash('sha256').update('nvidium-auth:' + secret).digest();
}

export function generateEmailCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

export function hashEmailCode(codeId, code) {
  return crypto.createHmac('sha256', getSigningKey()).update(codeId + ':' + code).digest('hex');
}

export function emailCodeMatches(codeId, code, expectedHex) {
  const normalized = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const a = Buffer.from(hashEmailCode(codeId, normalized), 'hex');
  const b = Buffer.from(String(expectedHex || ''), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendCodeEmail(toEmail, fullName, code, purpose) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not configured');
  }
  const from = process.env.RESEND_FROM || 'Nvidium <no-reply@l-ala.studio>';
  const firstName = sanitizeText(String(fullName || '').split(' ')[0], 40) || 'there';
  const action = purpose === 'signup' ? 'finish creating your Nvidium account' : 'sign in to Nvidium';
  const subject = code + ' is your Nvidium verification code';
  const text = 'Hi ' + firstName + ',\n\nUse this code to ' + action + ':\n\n' + code + '\n\nIt expires in ' + CODE_TTL_MINUTES + ' minutes. If you did not request it, you can ignore this email.\n\nNvidium';
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#15292B;max-width:420px;margin:0 auto;padding:24px">' +
    '<p style="font-size:15px;margin:0 0 16px">Hi ' + escapeHtml(firstName) + ',</p>' +
    '<p style="font-size:15px;margin:0 0 16px">Use this code to ' + action + ':</p>' +
    '<p style="font-family:Consolas,Menlo,monospace;font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 16px">' + code + '</p>' +
    '<p style="font-size:13px;color:#5A6B6D;margin:0">It expires in ' + CODE_TTL_MINUTES + ' minutes. If you did not request it, you can ignore this email.</p>' +
    '</div>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to: [toEmail], subject, html, text })
  });
  if (!res.ok) {
    throw new Error('Resend send failed: HTTP ' + res.status);
  }
}

export async function issueEmailCode(sql, userRow, purpose) {
  const codeId = crypto.randomUUID();
  const code = generateEmailCode();
  await sql`DELETE FROM nvidium_email_codes WHERE user_id = ${userRow.id}`;
  await sql`
    INSERT INTO nvidium_email_codes (id, user_id, code_hash, attempts, expires_at, last_sent_at)
    VALUES (${codeId}, ${userRow.id}, ${hashEmailCode(codeId, code)}, 0, NOW() + make_interval(mins => ${CODE_TTL_MINUTES}), NOW())
  `;
  await sendCodeEmail(userRow.email, userRow.full_name, code, purpose);
  return codeId;
}

export function createChallengeToken(userId, codeId, purpose) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, cid: codeId, purpose, exp: Date.now() + CODE_TTL_MINUTES * 60 * 1000 }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningKey()).update(payload).digest('base64url');
  return payload + '.' + sig;
}

export function verifyChallengeToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto.createHmac('sha256', getSigningKey()).update(payloadB64).digest('base64url');
  const a = Buffer.from(sigB64, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed || !parsed.uid || !parsed.cid || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch (_err) {
    return null;
  }
}

export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!domain) return email;
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2);
  return visible + '•••@' + domain;
}

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  const map = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      if (k) {
        try {
          map[k] = decodeURIComponent(v);
        } catch (_err) {
          map[k] = v;
        }
      }
    }
  });
  return map;
}

export function buildSessionCookieHeader(token, request, maxAgeSec = 604800) {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = (request.headers.get('host') || '').toLowerCase();
  const isLocalHttp = proto === 'http' && (host.startsWith('localhost') || host.startsWith('127.0.0.1'));
  const secureFlag = isLocalHttp ? '' : '; Secure';
  return `nvidium_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secureFlag}`;
}

export async function getSessionUser(request) {
  await ensureSchema();
  const cookies = parseCookies(request);
  const rawToken = cookies.nvidium_session;
  if (!rawToken) return null;
  const tokenHash = sha256Hex(rawToken);
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.email, u.full_name, u.email_verified
    FROM nvidium_sessions s
    JOIN nvidium_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash} AND s.expires_at > NOW()
    LIMIT 1
  `;
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    emailVerified: Boolean(row.email_verified)
  };
}
