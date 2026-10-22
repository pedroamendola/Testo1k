// Conteúdo PROTEGIDO: pontuação, perfis e textos ficam só no servidor.
// c = categoria | p = pontos de bloqueio de cada alternativa (na mesma ordem do site)
export const CATS = {
  app: "Estratégia de candidaturas",
  cv: "Currículo e perfil online",
  renda: "Posicionamento para renda extra",
  mind: "Rotina e constância",
};

export const QUESTIONS = [
  { c: "app", p: [0, 1, 2, 3] },
  { c: "app", p: [0, 1, 2, 3] },
  { c: "cv", p: [0, 1, 2, 3] },
  { c: "cv", p: [0, 1, 2, 3] },
  { c: "cv", p: [0, 1, 2, 3] },
  { c: "app", p: [0, 1, 2, 3] },
  { c: "renda", p: [0, 1, 2, 3] },
  { c: "renda", p: [0, 1, 2, 3] },
  { c: "renda", p: [0, 1, 2, 3] },
  { c: "mind", p: [0, 1, 2, 3] },
  { c: "mind", p: [0, 1, 2, 3] },
  { c: "mind", p: [0, 1, 2, 3] },
  { c: "app", p: [0, 1, 2, 3] },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
const MAX = QUESTIONS.length * 3;

const PROFILES = [
  {
    max: 12,
    name: "Candidato em Ajuste Fino",
    color: "#13A89E",
    text: (n) =>
      `${n}, você já tem boa base: age com regularidade e entende o básico do mercado. Seus resultados indicam que o que falta não é esforço, e sim detalhes que ainda passam despercebidos e reduzem o retorno que você poderia ter.`,
  },
  {
    max: 25,
    name: "Talento Subaproveitado",
    color: "#E69F00",
    text: (n) =>
      `${n}, suas respostas mostram que você tem o que oferecer, mas isso não está chegando com clareza a quem decide. Você se esforça, só que a mensagem que passa não reflete o seu valor, e isso costuma gerar o sentimento de fazer muito e receber pouco.`,
  },
  {
    max: 39,
    name: "Profissional Invisível",
    color: "#E5484D",
    text: (n) =>
      `${n}, o padrão das suas respostas indica que suas candidaturas e sua renda extra estão sendo travadas por um bloqueio que você ainda não conseguiu enxergar. Isso é mais comum do que parece e tem solução quando se sabe onde olhar. O problema raramente é falta de capacidade.`,
  },
];

const FOCUS = {
  app: "O ponto mais crítico nas suas respostas está na estratégia das candidaturas: como, quando e para quem você se candidata.",
  cv: "O ponto mais crítico nas suas respostas está em como seu currículo e seu perfil apresentam o seu valor em poucos segundos.",
  renda:
    "O ponto mais crítico nas suas respostas está no posicionamento: transformar o que você sabe em uma oferta clara que as pessoas queiram contratar.",
  mind: "O ponto mais crítico nas suas respostas está na rotina e na constância, que afetam diretamente o retorno das suas tentativas.",
};

export function validAnswers(answers) {
  return (
    Array.isArray(answers) &&
    answers.length === QUESTIONS.length &&
    answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 3)
  );
}

export function cleanName(raw) {
  const v = String(raw || "").trim().split(/\s+/)[0].slice(0, 20);
  if (v.length < 2) return null;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

// answers = índice (0 a 3) da alternativa escolhida em cada pergunta
export function evaluate(name, answers) {
  let score = 0;
  const byCat = { app: 0, cv: 0, renda: 0, mind: 0 };
  const catMax = { app: 0, cv: 0, renda: 0, mind: 0 };
  QUESTIONS.forEach((q, i) => {
    const pts = q.p[answers[i]];
    score += pts;
    byCat[q.c] += pts;
    catMax[q.c] += 3;
  });

  const profile = PROFILES.find((x) => score <= x.max) || PROFILES[PROFILES.length - 1];
  const percent = Math.round((score / MAX) * 100);

  let worst = "app";
  for (const c of Object.keys(byCat)) {
    if (byCat[c] / catMax[c] > byCat[worst] / catMax[worst]) worst = c;
  }

  return {
    name,
    profile: profile.name,
    color: profile.color,
    score,
    max: MAX,
    percent,
    text: profile.text(name),
    focus: FOCUS[worst] + " Foi aí que seu diagnóstico apontou o seu Inimigo Invisível.",
    cats: Object.keys(CATS).map((k) => ({
      label: CATS[k],
      pct: Math.round((byCat[k] / catMax[k]) * 100),
    })),
  };
}
