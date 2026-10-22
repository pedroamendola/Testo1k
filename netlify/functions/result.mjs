import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Resultado completo SOMENTE se o webhook da Hotmart marcou a sessão como paga.
export default async (req) => {
  const sid = new URL(req.url).searchParams.get("sid") || "";
  if (!UUID.test(sid)) return json({ error: "not_found" }, 404);

  const rec = await getStore("sessions").get(sid, { type: "json" });
  if (!rec) return json({ error: "not_found" }, 404);

  if (!rec.paid) {
    const r = rec.result;
    return json(
      { paid: false, preview: { name: r.name, profile: r.profile, color: r.color, percent: r.percent } },
      402
    );
  }
  return json({ paid: true, result: rec.result });
};

export const config = { path: "/api/result" };
