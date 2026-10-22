import { getStore } from "@netlify/blobs";
import { validAnswers, cleanName, evaluate } from "../lib/quiz.mjs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// Recebe nome + respostas (índices 0..3), calcula NO SERVIDOR e guarda.
// Devolve apenas uma prévia. O resultado completo só sai em /api/result após o pagamento.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const name = cleanName(body?.name);
  if (!name || !validAnswers(body?.answers)) return json({ error: "invalid_data" }, 400);

  const sid = crypto.randomUUID();
  const result = evaluate(name, body.answers);

  await getStore("sessions").setJSON(sid, {
    name,
    answers: body.answers,
    result,
    paid: false,
    createdAt: new Date().toISOString(),
  });

  return json({
    sid,
    preview: { name, profile: result.profile, color: result.color, percent: result.percent },
  });
};

export const config = { path: "/api/submit" };
