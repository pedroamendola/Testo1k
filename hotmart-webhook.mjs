import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APPROVE = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKE = new Set(["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED"]);

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

export default async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // 1) Autenticidade: o hottok enviado pela Hotmart deve bater com o configurado no Netlify.
  const expected = Netlify.env.get("HOTMART_HOTTOK");
  const received = req.headers.get("x-hotmart-hottok");
  if (!expected || !safeEqual(received, expected)) return new Response("unauthorized", { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }

  const event = body?.event;
  const purchase = body?.data?.purchase || {};
  const transaction = purchase.transaction || "";
  const sid = purchase?.origin?.sck || purchase?.origin?.xcod || "";

  // 2) (Opcional) só aceita o produto certo.
  const wantedProduct = Netlify.env.get("HOTMART_PRODUCT_ID");
  if (wantedProduct && String(body?.data?.product?.id || "") !== String(wantedProduct)) {
    return new Response("ignored", { status: 200 });
  }

  const sessions = getStore("sessions");
  const payments = getStore("payments");

  const grant = APPROVE.has(event);
  const revoke = REVOKE.has(event);
  if (!grant && !revoke) return new Response("ignored", { status: 200 });

  // Registro da transação (auditoria + idempotência)
  if (transaction) {
    await payments.setJSON(transaction, {
      event,
      sid: UUID.test(sid) ? sid : null,
      email: body?.data?.buyer?.email || null,
      at: new Date().toISOString(),
    });
  }

  if (UUID.test(sid)) {
    const rec = await sessions.get(sid, { type: "json" });
    if (rec) {
      rec.paid = grant;
      rec.transaction = transaction || rec.transaction;
      rec.paidAt = grant ? new Date().toISOString() : rec.paidAt;
      await sessions.setJSON(sid, rec);
    }
  }
  return new Response("ok", { status: 200 });
};

export const config = { path: "/api/hotmart-webhook" };
