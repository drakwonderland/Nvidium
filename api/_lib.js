import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
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
          totp_secret TEXT NOT NULL,
          totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS nvidium_sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES nvidium_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

export function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), 120000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password, salt, expectedHex) {
  const actualBuf = Buffer.from(hashPassword(password, salt), 'hex');
  const expectedBuf = Buffer.from(String(expectedHex || ''), 'hex');
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buf.length; i += 1) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(str) {
  const clean = String(str || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i += 1) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function generateTotpCode(secret, stepOffset = 0, timestampMs = Date.now()) {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 30000) + stepOffset;
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

export function verifyTotpCode(secret, code) {
  const normalized = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const codeBuf = Buffer.from(normalized, 'utf8');
  for (const offset of [-1, 0, 1]) {
    const candidate = Buffer.from(generateTotpCode(secret, offset), 'utf8');
    if (candidate.length === codeBuf.length && crypto.timingSafeEqual(candidate, codeBuf)) {
      return true;
    }
  }
  return false;
}

function getSigningKey() {
  const seed = process.env.AUTH_SECRET || process.env.DATABASE_URL || '';
  return crypto.createHash('sha256').update('nvidium-auth:' + seed).digest();
}

export function createChallengeToken(userId, mode) {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, mode, exp: Date.now() + 5 * 60 * 1000 }),
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
    if (!parsed || !parsed.uid || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch (_err) {
    return null;
  }
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
      if (k) map[k] = decodeURIComponent(v);
    }
  });
  return map;
}

export function buildSessionCookieHeader(token, request, maxAgeSec = 604800) {
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const secureFlag = proto === 'http' ? '' : '; Secure';
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
    SELECT u.id, u.email, u.full_name, u.totp_enabled
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
    totpEnabled: Boolean(row.totp_enabled)
  };
}
