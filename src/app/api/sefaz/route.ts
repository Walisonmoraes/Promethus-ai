import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, month, year } = body;

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // Simulação de resposta - em produção, isso seria integrado com o script Python
    // Por enquanto, retorna dados de exemplo para testar a interface
    const mockNotas = [
      {
        data: '18/05/2026',
        numero: '12345',
        valor: 'R$ 150,00',
        cnpj: '12.345.678/0001-90',
        empresa: 'Supermercado Exemplo',
        data_extracao: new Date().toISOString()
      },
      {
        data: '15/05/2026',
        numero: '12346',
        valor: 'R$ 89,90',
        cnpj: '98.765.432/0001-10',
        empresa: 'Farmácia Central',
        data_extracao: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockNotas,
      message: 'Notas fiscais importadas com sucesso (modo demonstração)',
      note: 'Para usar o scraping real, configure o ambiente Python com Playwright'
    });

  } catch (error: any) {
    console.error('Erro ao extrair notas fiscais:', error);
    return NextResponse.json(
      { error: 'Erro ao extrair notas fiscais', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para scraping de notas fiscais da SEFAZ-MT',
    method: 'POST',
    body: {
      cpf: 'string (obrigatório)',
      month: 'number (opcional, 1-12)',
      year: 'number (opcional, padrão 2026)'
    },
    note: 'Atualmente em modo demonstração - retorna dados de exemplo'
  });
}
