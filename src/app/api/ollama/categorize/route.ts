import { NextResponse } from "next/server";

const CATEGORIES = [
  "Alimentacao",
  "Transporte",
  "Moradia",
  "Saude",
  "Lazer",
  "Compras",
  "Receita",
  "Outros",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body?.text?.trim();
    if (!text) {
      return NextResponse.json({ category: "" }, { status: 400 });
    }

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt:
          "Voce e Promethus AI Prometheus, um assistente financeiro claro e confiavel. " +
          "Classifique o texto em uma unica categoria desta lista: " +
          CATEGORIES.join(", ") +
          ". Responda apenas com o nome da categoria. Texto: " +
          text,
        stream: false,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ category: "" }, { status: 500 });
    }

    const data = await response.json();
    const raw = String(data?.response || "").trim();
    const normalized = raw.replace(/[^a-zA-Z\\u00C0-\\u017F]/g, "");
    const match = CATEGORIES.find(
      (cat) => cat.toLowerCase() === normalized.toLowerCase()
    );
    return NextResponse.json({ category: match ?? "" });
  } catch {
    return NextResponse.json({ category: "" }, { status: 500 });
  }
}
