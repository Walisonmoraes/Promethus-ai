import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const prompt = formData.get('prompt') as string;
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Process files - for now, just return file info
    // In a real implementation, you might:
    // - Extract text from PDFs
    // - Analyze images with OCR
    // - Store files temporarily
    // - Send to vision-capable models
    
    const fileInfos = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      isImage: file.type.startsWith('image/'),
      isPDF: file.type === 'application/pdf'
    }));

    // Enhanced prompt with file context
    const enhancedPrompt = `Analise os seguintes arquivos:
${fileInfos.map((file, index) => 
  `${index + 1}. ${file.name} (${file.type}, ${file.isImage ? 'Imagem' : file.isPDF ? 'PDF' : 'Documento'})`
).join('\n')}

${prompt ? `Pergunta do usuário: ${prompt}` : 'Por favor, analise estes arquivos e me diga o que encontrou.'}`;

    // Call Ollama with enhanced prompt
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

${enhancedPrompt}`,
        stream: false,
        options: {
          num_ctx: 2048,
          num_predict: 256,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to process files" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ 
      text: data?.response ?? "Não consegui processar os arquivos.",
      files: fileInfos 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
