import crypto from 'node:crypto';
import { ensureSchema, getSessionUser, getSql } from './_lib.js';

export async function GET(request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return Response.json({ error: 'Sign in required.' }, { status: 401 });
    }
    const sql = getSql();
    const rows = await sql`
      SELECT id, order_ref, item_kind, build_title, qty, hardware_total_php, due_today_php, payment_plan, sla_label, status_label, quote_state_json, receipt_text, created_at
      FROM nvidium_purchases
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `;
    return Response.json({ purchases: rows });
  } catch (err) {
    console.error('GET /api/purchases error:', err);
    return Response.json({ error: 'Could not load saved builds.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureSchema();
    const user = await getSessionUser(request);
    if (!user) {
      return Response.json({ error: 'Sign in required to save purchases.' }, { status: 401 });
    }
    const body = await request.json();
    const id = crypto.randomUUID();
    const orderRef = String(body.orderRef || 'NV-SAVED-' + Math.floor(1000 + (Date.now() % 9000))).slice(0, 64);
    const itemKind = body.itemKind === 'confirmed_order' ? 'confirmed_order' : 'saved_quote';
    const buildTitle = String(body.buildTitle || 'Custom Workstation Build').slice(0, 140);
    const qty = Math.max(1, parseInt(body.qty, 10) || 1);
    const hardwareTotalPhp = Math.max(0, parseInt(body.hardwareTotalPhp, 10) || 0);
    const dueTodayPhp = Math.max(0, parseInt(body.dueTodayPhp, 10) || 0);
    const paymentPlan = String(body.paymentPlan || '70/30 Split').slice(0, 80);
    const slaLabel = String(body.slaLabel || 'Free 1-Yr Warranty').slice(0, 120);
    const statusLabel = String(body.statusLabel || 'Saved Build').slice(0, 80);
    const quoteStateJson = typeof body.quoteState === 'string'
      ? body.quoteState
      : JSON.stringify(body.quoteState || {});
    const receiptText = String(body.receiptText || '').slice(0, 8000);

    const sql = getSql();
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

    return Response.json({
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
    return Response.json({ error: 'Could not save build to account.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await ensureSchema();
    const user = await getSessionUser(request);
    if (!user) {
      return Response.json({ error: 'Sign in required.' }, { status: 401 });
    }
    const url = new URL(request.url);
    const id = String(url.searchParams.get('id') || '').trim();
    if (!id) {
      return Response.json({ error: 'Purchase id is required.' }, { status: 400 });
    }
    const sql = getSql();
    await sql`
      DELETE FROM nvidium_purchases WHERE id = ${id} AND user_id = ${user.id}
    `;
    return Response.json({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/purchases error:', err);
    return Response.json({ error: 'Could not remove saved item.' }, { status: 500 });
  }
}
