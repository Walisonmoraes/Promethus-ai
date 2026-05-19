import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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

    // Caminho para o script Python
    const scriptPath = path.join(process.cwd(), 'sefaz_scraper.py');
    
    // Constrói comando Python
    const pythonCommand = `python3 ${scriptPath} --cpf ${cpf}${month ? ` --month ${month}` : ''}${year ? ` --year ${year}` : ''}`;

    // Executa script Python
    const { stdout, stderr } = await execAsync(pythonCommand, {
      timeout: 60000, // 60 segundos timeout
    });

    if (stderr) {
      console.error('Erro no script Python:', stderr);
    }

    // Tenta parsear o JSON de saída
    let notas;
    try {
      notas = JSON.parse(stdout);
    } catch (e) {
      // Se não for JSON, retorna o stdout como texto
      notas = { raw_output: stdout };
    }

    return NextResponse.json({
      success: true,
      data: notas,
      message: 'Notas fiscais extraídas com sucesso'
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
    }
  });
}
