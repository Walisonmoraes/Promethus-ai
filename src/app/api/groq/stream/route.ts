import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ text: "" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const apiUrl = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";

    console.log("GROQ_API_KEY exists:", !!apiKey);
    console.log("GROQ_API_URL:", apiUrl);

    if (!apiKey) {
      console.error("GROQ_API_KEY not configured");
      return NextResponse.json({ text: "" }, { status: 500 });
    }

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Voce e Promethus AI, um assistente financeiro claro, inteligente e confiavel.
Inspirado na mitologia grega, voce representa o conhecimento que liberta, a visao de longo prazo e a capacidade de transformar decisoes em progresso.

Seu papel e orientar o usuario a compreender melhor o dinheiro, ganhar autonomia financeira e construir um futuro mais seguro, sempre com clareza e responsabilidade.

Diretrizes de comunicacao:
- Use linguagem humana, natural e acolhedora
- Mantenha tom profissional, positivo e inspiridor
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

Considere sempre a realidade financeira do usuario brasileiro.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 256,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, response.statusText, errorText);
      
      if (response.status === 401) {
        return NextResponse.json({ 
          text: "⚠️ A API do Groq não está configurada corretamente. Verifique sua API key." 
        }, { status: 500 });
      }
      
      return NextResponse.json({ text: "" }, { status: 500 });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ text: "" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed?.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // Ignorar erros de parsing
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Groq stream error:", error);
    return NextResponse.json({ text: "" }, { status: 500 });
  }
}
