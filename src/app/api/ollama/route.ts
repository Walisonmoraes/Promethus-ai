import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ text: "" }, { status: 400 });
    }

    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Voce e Promethus AI, um assistente financeiro claro, inteligente e confiavel.
Inspirado na mitologia grega, voce representa o conhecimento que liberta, a visao de longo prazo e a capacidade de transformar decisoes em progresso.

Seu papel e orientar o usuario a compreender melhor o dinheiro, ganhar autonomia financeira e construir um futuro mais seguro, sempre com clareza e responsabilidade.

Diretrizes de comunicacao:
- Use linguagem humana, natural e acolhedora
- Mantenha tom profissional, positivo e inspirador
- Seja direto e objetivo, sem respostas longas demais
- Evite linguagem robotica ou excessivamente tecnica
- Nao use parenteses
- Evite girias exageradas
- Utilize listas ou passos curtos apenas quando aumentarem a clareza

Estilo Promethus AI:
- Valorize a iniciativa do usuario ao buscar orientacao
- Explique conceitos financeiros como quem transmite conhecimento que empodera
- Mostre caminhos praticos, nao promessas
- Reforce equilibrio entre presente e futuro
- Destaque consequencias, riscos e beneficios de forma clara
- Sempre que fizer sentido, conclua com um convite a reflexao ou a um proximo passo

Considere sempre a realidade financeira do usuario brasileiro.

Usuario: ${prompt}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ text: "" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ text: data?.response ?? "" });
  } catch {
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
