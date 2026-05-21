import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createCipheriv, createHash, randomBytes } from 'crypto'

const getKey = () => {
  const secret = process.env.SEFAZ_SESSION_SECRET || ''
  if (!secret) return null
  return createHash('sha256').update(secret).digest()
}

const encrypt = (plaintext: string) => {
  const key = getKey()
  if (!key) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

const launchChromium = async () => {
  try {
    return await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const likelyMissingBrowsers =
      message.includes('Executable doesn’t exist') ||
      message.includes("Executable doesn't exist") ||
      message.includes('playwright install')

    if (!likelyMissingBrowsers) throw error

    return await chromium.launch({
      headless: true,
      channel: 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}

export async function POST(request: NextRequest) {
  let browser: import('playwright').Browser | null = null

  try {
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

    const body = await request.json()
    const cpf: string = body?.cpf || ''
    const senha: string = body?.senha || ''
    const month = body?.month ?? new Date().getMonth() + 1
    const year = body?.year ?? new Date().getFullYear()

    const cleanCpf = String(cpf).replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      return NextResponse.json({ error: 'CPF deve conter 11 dígitos' }, { status: 400 })
    }
    if (!senha) {
      return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 })
    }

    browser = await launchChromium()
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    const page = await context.newPage()

    const url = `https://www.sefaz.mt.gov.br/notamt/nota/lista/${month}/${year}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
    })
    await page.waitForTimeout(2500)

    const cpfSelectors = [
      'input[name*="cpf"]',
      'input[id*="cpf"]',
      'input[placeholder*="cpf"]',
      'input[placeholder*="CPF"]',
      'input[type="text"]',
      '#cpf'
    ]

    let cpfInput = null
    for (const selector of cpfSelectors) {
      cpfInput = await page.$(selector)
      if (cpfInput) break
    }
    if (!cpfInput) {
      const inputs = await page.$$('input')
      for (const input of inputs) {
        const attrs = await input.evaluate((el) => ({
          id: el.id || '',
          name: el.getAttribute('name') || '',
          placeholder: el.getAttribute('placeholder') || '',
          type: el.getAttribute('type') || ''
        }))
        const hay = `${attrs.id} ${attrs.name} ${attrs.placeholder}`.toLowerCase()
        if (hay.includes('cpf')) {
          cpfInput = input
          break
        }
      }
    }
    if (!cpfInput) {
      const currentUrl = page.url()
      const title = await page.title().catch(() => '')
      const content = await page.content().catch(() => '')
      const snippet = content.slice(0, 1500)
      const lower = content.toLowerCase()
      const antiBot =
        lower.includes('bobcmn') ||
        lower.includes('captcha') ||
        lower.includes('datadome') ||
        lower.includes('cloudflare') ||
        lower.includes('access denied')

      if (antiBot) {
        return NextResponse.json(
          {
            error: 'Acesso bloqueado por proteção anti-bot da SEFAZ (servidor)',
            suggestion: 'Use um modo local (rodar o scraper no seu computador) ou exporte o arquivo no portal e faça upload/importação no sistema.',
            details: { url: currentUrl, title, snippet }
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Campo de CPF não encontrado', details: { url: currentUrl, title, snippet } },
        { status: 400 }
      )
    }

    await cpfInput.fill(cleanCpf)

    const senhaSelectors = [
      'input[name*="senha"]',
      'input[name*="password"]',
      'input[id*="senha"]',
      'input[id*="password"]',
      'input[type="password"]',
      '#senha',
      '#password'
    ]

    let senhaInput = null
    for (const selector of senhaSelectors) {
      senhaInput = await page.$(selector)
      if (senhaInput) break
    }
    if (senhaInput) {
      await senhaInput.fill(senha)
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
    ]

    let submitButton = null
    for (const selector of buttonSelectors) {
      try {
        submitButton = await page.$(selector)
        if (submitButton) break
      } catch {
      }
    }
    if (!submitButton) {
      return NextResponse.json({ error: 'Botão de consulta não encontrado' }, { status: 400 })
    }

    await submitButton.click()
    await page.waitForTimeout(3500)

    const stillHasCpfInput = await page.$(cpfSelectors[0])
    const hasResults = await page.$('table, .resultado, .notas')

    if (!hasResults && stillHasCpfInput) {
      return NextResponse.json({ error: 'Login parece ter falhado (a página não avançou)' }, { status: 401 })
    }

    const storageState = await context.storageState()
    const encrypted = encrypt(JSON.stringify(storageState))
    if (!encrypted) {
      return NextResponse.json({ error: 'Failed to encrypt session' }, { status: 500 })
    }

    const userId = session.user.email
    const cpfLast4 = cleanCpf.slice(-4)

    const { data: existing } = await supabaseAdmin
      .from('sefaz_connections')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from('sefaz_connections')
        .update({
          cpf_last4: cpfLast4,
          storage_state_encrypted: encrypted,
          last_validated_at: new Date().toISOString(),
          status: 'connected'
        })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to persist connection', details: error.message }, { status: 500 })
      }
    } else {
      const { error } = await supabaseAdmin
        .from('sefaz_connections')
        .insert({
          user_id: userId,
          cpf_last4: cpfLast4,
          storage_state_encrypted: encrypted,
          last_validated_at: new Date().toISOString(),
          status: 'connected'
        })

      if (error) {
        return NextResponse.json({ error: 'Failed to persist connection', details: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, connected: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao conectar no Notas MT', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {
      }
    }
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ connected: false }, { status: 200 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ connected: false }, { status: 200 })
  }
  const { data } = await supabaseAdmin
    .from('sefaz_connections')
    .select('status,last_validated_at,cpf_last4')
    .eq('user_id', session.user.email)
    .maybeSingle()

  return NextResponse.json({
    connected: data?.status === 'connected',
    cpf_last4: data?.cpf_last4 || null,
    last_validated_at: data?.last_validated_at || null
  })
}
