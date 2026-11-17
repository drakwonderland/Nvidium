import crypto from 'node:crypto';
import {
  checkRateLimit,
  ensureSchema,
  getSessionUser,
  getSql,
  jsonResponse,
  sanitizeMultilineText,
  sanitizeText,
  verifySameOrigin
} from './_lib.js';

export async function GET(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return jsonResponse({ error: 'Sign in required.' }, { status: 401 });
    }
    const sql = getSql();
    const rows = await sql`
      SELECT id, order_ref, item_kind, build_title, qty, hardware_total_php, due_today_php, payment_plan, sla_label, status_label, quote_state_json, receipt_text, created_at
      FROM nvidium_purchases
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `;
    return jsonResponse({ purchases: rows });
  } catch (err) {
    console.error('GET /api/purchases error:', err);
    return jsonResponse({ error: 'Could not load saved builds.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!verifySameOrigin(request)) {
      return jsonResponse({ error: 'Cross-origin request rejected.' }, { status: 403 });
    }

    await ensureSchema();
    const user = await getSessionUser(request);
    if (!user) {
      return jsonResponse({ error: 'Sign in required to save purchases.' }, { status: 401 });
    }

    const sql = getSql();
    const limit = await checkRateLimit(sql, 'purchases:write:user', user.id, 30, 60);
    if (!limit.allowed) {
      return jsonResponse(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
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

    const id = crypto.randomUUID();
    const orderRef = sanitizeText(body.orderRef || ('NV-SAVED-' + Math.floor(1000 + (Date.now() % 9000))), 64);
    const itemKind = body.itemKind === 'confirmed_order' ? 'confirmed_order' : 'saved_quote';
    const buildTitle = sanitizeText(body.buildTitle || 'Custom Workstation Build', 140) || 'Custom Workstation Build';
    const qty = Math.min(100, Math.max(1, parseInt(body.qty, 10) || 1));
    const hardwareTotalPhp = Math.min(50000000, Math.max(0, parseInt(body.hardwareTotalPhp, 10) || 0));
    const dueTodayPhp = Math.min(50000000, Math.max(0, parseInt(body.dueTodayPhp, 10) || 0));
    const paymentPlan = sanitizeText(body.paymentPlan || '70/30 Split', 80) || '70/30 Split';
    const slaLabel = sanitizeText(body.slaLabel || 'Free 1-Yr Warranty', 120) || 'Free 1-Yr Warranty';
    const statusLabel = sanitizeText(body.statusLabel || 'Saved Build', 80) || 'Saved Build';

    let quoteStateJson;
    try {
      quoteStateJson = typeof body.quoteState === 'string'
        ? JSON.stringify(JSON.parse(body.quoteState))
        : JSON.stringify(body.quoteState || {});
    } catch (_err) {
      return jsonResponse({ error: 'Invalid quoteState format.' }, { status: 400 });
    }
    if (quoteStateJson.length > 16384) {
      return jsonResponse({ error: 'Quote payload exceeds maximum allowed size.' }, { status: 413 });
    }

    const receiptText = sanitizeMultilineText(body.receiptText || '', 8000);

    await sql`
      INSERT INTO nvidium_purchases (
        id, user_id, order_ref, item_kind, build_title, qty, hardware_total_php,
        due_today_php, payment_plan, sla_label, status_label, quote_state_json, receipt_text
      )
      VALUES (
        ${id}, ${user.id}, ${orderRef}, ${itemKind}, ${buildTitle}, ${qty}, ${hardwareTotalPhp},
        ${dueTodayPhp}, ${paymentPlan}, ${slaLabel}, ${statusLabel}, ${quoteStateJson}, ${receiptText}
      )
    `;

    return jsonResponse({
      saved: true,
      purchase: {
        id,
        order_ref: orderRef,
        item_kind: itemKind,
        build_title: buildTitle,
        qty,
        hardware_total_php: hardwareTotalPhp,
        due_today_php: dueTodayPhp,
        payment_plan: paymentPlan,
        sla_label: slaLabel,
        status_label: statusLabel,
        quote_state_json: quoteStateJson
      }
    });
  } catch (err) {
    console.error('POST /api/purchases error:', err);
    return jsonResponse({ error: 'Could not save build to account.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!verifySameOrigin(request)) {
      return jsonResponse({ error: 'Cross-origin request rejected.' }, { status: 403 });
    }

    await ensureSchema();
    const user = await getSessionUser(request);
    if (!user) {
      return jsonResponse({ error: 'Sign in required.' }, { status: 401 });
    }

    const sql = getSql();
    const limit = await checkRateLimit(sql, 'purchases:write:user', user.id, 30, 60);
    if (!limit.allowed) {
      return jsonResponse(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const url = new URL(request.url);
    const id = sanitizeText(url.searchParams.get('id') || '', 64);
    if (!id) {
      return jsonResponse({ error: 'Purchase id is required.' }, { status: 400 });
    }
    const deleted = await sql`
      DELETE FROM nvidium_purchases WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;
    if (deleted.length === 0) {
      return jsonResponse({ error: 'Saved item not found.' }, { status: 404 });
    }
    return jsonResponse({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/purchases error:', err);
    return jsonResponse({ error: 'Could not remove saved item.' }, { status: 500 });
  }
}
