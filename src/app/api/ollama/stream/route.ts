import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const response = await fetch("http://192.168.2.22:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b",
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
        stream: true,
        options: {
          num_ctx: 2048,
          num_predict: 256,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "No response body" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.response) {
                    controller.enqueue(encoder.encode(parsed.response));
                  }
                  if (parsed.done) {
                    controller.close();
                    return;
                  }
                } catch (e) {
                  // Ignora erros de parsing
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
