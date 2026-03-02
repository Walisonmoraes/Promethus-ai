import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;
    
    if (!text) {
      return NextResponse.json({ category: "Outros" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const apiUrl = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";

    if (!apiKey) {
      console.error("GROQ_API_KEY not configured");
      return NextResponse.json({ category: "Outros" }, { status: 500 });
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
            content: `Voce e um classificador financeiro especializado. Sua unica tarefa e analisar o texto fornecido e retornar APENAS uma das seguintes categorias exatas:

Categorias validas:
- Alimentacao
- Transporte
- Moradia
- Saude
- Educacao
- Lazer
- Compras
- Servicos
- Investimentos
- Salario
- Freelancer
- Outros

Regras:
- Retorne APENAS o nome da categoria, sem explicacoes
- Seja especifico e preciso
- Analise o contexto financeiro
- Use exatamente uma das categorias listadas acima

Exemplos:
"paguei 50 no restaurante" -> Alimentacao
"gastei 20 no uber" -> Transporte
"recebi 3000 de salario" -> Salario`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      console.error("Groq categorization error:", response.status, response.statusText);
      return NextResponse.json({ category: "Outros" }, { status: 500 });
    }

    const data = await response.json();
    const category = data?.choices?.[0]?.message?.content?.trim() || "Outros";
    
    // Validar se a categoria retornada é válida
    const validCategories = ["Alimentacao", "Transporte", "Moradia", "Saude", "Educacao", "Lazer", "Compras", "Servicos", "Investimentos", "Salario", "Freelancer", "Outros"];
    const finalCategory = validCategories.includes(category) ? category : "Outros";
    
    return NextResponse.json({ category: finalCategory });
  } catch (error) {
    console.error("Groq categorization error:", error);
    return NextResponse.json({ category: "Outros" }, { status: 500 });
  }
}
