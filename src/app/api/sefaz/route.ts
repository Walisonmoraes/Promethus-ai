import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createDecipheriv, createHash } from 'crypto'

const execAsync = promisify(exec);

const extractJsonFromStdout = (stdout: string) => {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
  }

  const match = trimmed.match(/(\[[\s\S]*\]|\{[\s\S]*\})\s*$/);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

const getKey = () => {
  const secret = process.env.SEFAZ_SESSION_SECRET || ''
  if (!secret) return null
  return createHash('sha256').update(secret).digest()
}

const decrypt = (ciphertextB64: string) => {
  const key = getKey()
  if (!key) return null
  const buf = Buffer.from(ciphertextB64, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}

const launchChromium = async () => {
  try {
    return await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const likelyMissingBrowsers =
      message.includes('Executable doesn’t exist') ||
      message.includes("Executable doesn't exist") ||
      message.includes('playwright install');

    if (!likelyMissingBrowsers) throw error;

    return await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
};

export async function POST(request: NextRequest) {
  let browser = null;
  
  try {
    const body = await request.json();
    const { cpf, senha, month = 5, year = 2026 } = body;

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }

    // Remove caracteres não numéricos do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve conter 11 dígitos' },
        { status: 400 }
      );
    }

    let storedStorageState: any | null = null
    let useStoredSession = false
    if (!senha) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
      }
      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
      }
      const key = getKey()
      if (!key) {
        return NextResponse.json({ error: 'Missing SEFAZ_SESSION_SECRET' }, { status: 500 })
      }
      const { data } = await supabaseAdmin
        .from('sefaz_connections')
        .select('storage_state_encrypted,status')
        .eq('user_id', session.user.email)
        .maybeSingle()
      if (!data?.storage_state_encrypted || data?.status !== 'connected') {
        return NextResponse.json({ error: 'Sem conexão com Notas MT. Use "Conectar" primeiro.' }, { status: 400 })
      }
      const decrypted = decrypt(data.storage_state_encrypted)
      if (!decrypted) {
        return NextResponse.json({ error: 'Falha ao ler sessão salva' }, { status: 500 })
      }
      storedStorageState = JSON.parse(decrypted)
      useStoredSession = true
    }

    // Tenta usar o script Python primeiro (mais robusto)
    try {
      if (!senha) throw new Error('skip-python')
      const appCwd = process.cwd();
      const pythonCommand = `python3 ${appCwd}/sefaz_scraper.py --cpf ${cleanCpf} --month ${month} --year ${year} --headless`;
      
      const { stdout, stderr } = await execAsync(pythonCommand, {
        cwd: appCwd,
        env: {
          ...process.env,
          SEFAZ_MT_SENHA: senha
        },
        timeout: 120000 // 2 minutos
      });

      if (stderr && !stderr.includes('Extraídas')) {
        console.error('Erro no script Python:', stderr);
      }

      const notas = extractJsonFromStdout(stdout);

      if (Array.isArray(notas) && notas.length >= 0) {
        console.log(`Sucesso: ${notas.length} notas extraídas via Python`);
        return NextResponse.json({
          success: true,
          data: notas,
          message: `${notas.length} notas fiscais importadas com sucesso`,
          method: 'python'
        });
      }
    } catch (pythonError) {
      console.error('Erro ao executar script Python, tentando TypeScript/Playwright:', pythonError);
    }

    // Fallback para TypeScript/Playwright se Python falhar
    console.log('Usando TypeScript/Playwright como fallback');

    // Inicia o navegador
    browser = await launchChromium();

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...(useStoredSession ? { storageState: storedStorageState } : {})
    });

    const page = await context.newPage();

    // Navega para a página da SEFAZ-MT
    const url = `https://www.sefaz.mt.gov.br/notamt/nota/lista/${month}/${year}`;
    console.log('Navegando para:', url);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // Aguarda carregamento da página
    await page.waitForTimeout(2000);

    if (useStoredSession) {
      const loginStillVisible = await page.$('input[name*="cpf"], input[id*="cpf"], #cpf')
      if (loginStillVisible) {
        const content = await page.content().catch(() => '')
        const lower = content.toLowerCase()
        const antiBot =
          lower.includes('bobcmn') ||
          lower.includes('captcha') ||
          lower.includes('datadome') ||
          lower.includes('cloudflare') ||
          lower.includes('access denied')

        const session = await getServerSession(authOptions)
        if (session?.user?.email && supabaseAdmin) {
          await supabaseAdmin
            .from('sefaz_connections')
            .update({ status: 'invalid' })
            .eq('user_id', session.user.email)
        }
        await browser.close();
        if (antiBot) {
          return NextResponse.json(
            {
              error: 'Acesso bloqueado por proteção anti-bot da SEFAZ (servidor)',
              suggestion: 'Conectar/buscar pelo Fly pode falhar por bloqueio. Use modo local ou exportação manual.'
            },
            { status: 403 }
          )
        }
        return NextResponse.json(
          { error: 'Sessão do Notas MT expirou. Conecte novamente.' },
          { status: 401 }
        );
      }
    }

    if (!useStoredSession) {
      const cpfSelectors = [
        'input[name*="cpf"]',
        'input[id*="cpf"]',
        'input[placeholder*="cpf"]',
        'input[placeholder*="CPF"]',
        'input[type="text"]',
        '#cpf'
      ];

      let cpfInput = null;
      for (const selector of cpfSelectors) {
        cpfInput = await page.$(selector);
        if (cpfInput) {
          console.log(`Campo CPF encontrado com seletor: ${selector}`);
          break;
        }
      }

      if (!cpfInput) {
        await browser.close();
        return NextResponse.json(
          { error: 'Campo de CPF não encontrado na página da SEFAZ' },
          { status: 400 }
        );
      }

      await cpfInput.fill(cleanCpf);

      const senhaSelectors = [
        'input[name*="senha"]',
        'input[name*="password"]',
        'input[id*="senha"]',
        'input[id*="password"]',
        'input[type="password"]',
        '#senha',
        '#password'
      ];

      let senhaInput = null;
      for (const selector of senhaSelectors) {
        senhaInput = await page.$(selector);
        if (senhaInput) {
          console.log(`Campo senha encontrado com seletor: ${selector}`);
          break;
        }
      }

      if (senhaInput && senha) {
        await senhaInput.fill(senha);
      } else {
        console.log('Campo de senha não encontrado, continuando sem senha');
      }

      const buttonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Consultar")',
        'button:has-text("Buscar")',
        'button:has-text("Pesquisar")',
        'button:has-text("Consultar Notas")',
        '.btn-consultar',
        '#btn-consultar'
      ];

      let submitButton = null;
      for (const selector of buttonSelectors) {
        try {
          submitButton = await page.$(selector);
          if (submitButton) {
            console.log(`Botão encontrado com seletor: ${selector}`);
            break;
          }
        } catch (e) {
        }
      }

      if (!submitButton) {
        await browser.close();
        return NextResponse.json(
          { error: 'Botão de consulta não encontrado na página da SEFAZ' },
          { status: 400 }
        );
      }

      await submitButton.click();
    }

    // Aguarda processamento e carregamento dos resultados
    await page.waitForTimeout(5000);

    // Tenta esperar por elementos específicos que indicam carregamento
    try {
      await page.waitForSelector('table, .resultado, .notas', { timeout: 10000 });
    } catch (e) {
      console.log('Timeout esperando tabela, continuando mesmo assim');
    }

    // Extrai dados das notas fiscais
    const notas = await page.evaluate(() => {
      const results = [];
      
      // Tenta encontrar tabela de notas
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td');
          
          if (cells.length >= 3) {
            const nota = {
              data: cells[0]?.textContent?.trim() || '',
              numero: cells[1]?.textContent?.trim() || '',
              valor: cells[2]?.textContent?.trim() || '',
              cnpj: cells[3]?.textContent?.trim() || '',
              empresa: cells[4]?.textContent?.trim() || '',
              data_extracao: new Date().toISOString()
            };
            
            if (nota.data && nota.valor) {
              results.push(nota);
            }
          }
        }
      }
      
      // Se não encontrou na tabela, tenta em listas ou divs
      if (results.length === 0) {
        const listItems = document.querySelectorAll('.nota, .nf, .item-nota, [class*="nota"]');
        
        for (const item of listItems) {
          const text = item.textContent || '';
          const valorMatch = text.match(/R?\$\s*[\d.,]+/);
          const dataMatch = text.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
          
          if (valorMatch && dataMatch) {
            results.push({
              data: dataMatch[0],
              valor: valorMatch[0],
              numero: '',
              cnpj: '',
              empresa: text.substring(0, 50),
              data_extracao: new Date().toISOString()
            });
          }
        }
      }
      
      return results;
    });

    await browser.close();

    if (notas.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Nenhuma nota fiscal encontrada para o período. Verifique se o CPF está correto e se há notas para o mês/ano informados.'
      });
    }

    console.log(`Sucesso: ${notas.length} notas extraídas via TypeScript/Playwright`);
    return NextResponse.json({
      success: true,
      data: notas,
      message: `${notas.length} notas fiscais importadas com sucesso`,
      method: 'playwright'
    });

  } catch (error: any) {
    console.error('Erro ao extrair notas fiscais:', error);
    
    if (browser) {
      await browser.close();
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao extrair notas fiscais', 
        details: error?.message,
        suggestion: 'Verifique se o site da SEFAZ-MT está acessível. Se for erro do Playwright, instale o browser com `npx playwright install chromium`.'
      },
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
      senha: 'string (obrigatório)',
      month: 'number (opcional, 1-12, padrão 5)',
      year: 'number (opcional, padrão 2026)'
    }
  });
}
