import { NextRequest, NextResponse } from 'next/server'
import { createSmartTransactionFromText, createTransaction } from '@/lib/transactionService'
import { supabaseAdmin } from '@/lib/supabase'

type WhatsAppMessage = {
  from?: string
  text?: { body?: string }
  type?: string
}

type GenericPayload = Record<string, unknown>

const normalizePhone = (value: string) => value.replace(/\D/g, '')

const parseUserMap = () => {
  const raw = process.env.WHATSAPP_USER_MAP || ''
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const [phone, userId] = entry.split(':').map((part) => part.trim())
      if (phone && userId) {
        acc[normalizePhone(phone)] = userId
      }
      return acc
    }, {})
}

const resolveUserId = async (payload: GenericPayload, senderPhone: string) => {
  const explicitUser = payload.userId || payload.user_id || payload.email
  if (typeof explicitUser === 'string' && explicitUser.trim()) {
    return explicitUser.trim()
  }

  const normalizedPhone = normalizePhone(senderPhone)
  if (supabaseAdmin && normalizedPhone) {
    const { data } = await supabaseAdmin
      .from('whatsapp_user_mappings')
      .select('user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (data?.user_id) return data.user_id
  }

  const userMap = parseUserMap()
  return userMap[normalizedPhone] || null
}

const parseIncomingMessage = (body: GenericPayload): { from: string; text: string } | null => {
  if (typeof body.message === 'string' && body.from) {
    return { from: String(body.from), text: body.message.trim() }
  }

  const entry = Array.isArray(body.entry) ? body.entry[0] as GenericPayload : undefined
  const changes = Array.isArray(entry?.changes) ? entry?.changes[0] as GenericPayload : undefined
  const value = (changes?.value || {}) as GenericPayload
  const messages = Array.isArray(value.messages) ? value.messages : []
  const message = messages[0] as WhatsAppMessage | undefined

  if (!message?.from || message?.type !== 'text' || !message?.text?.body) {
    return null
  }

  return {
    from: message.from,
    text: message.text.body.trim()
  }
}

const isAuthorized = (request: NextRequest) => {
  const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN
  if (!expectedToken) return false

  const headerToken = request.headers.get('x-webhook-token') || request.headers.get('authorization')?.replace('Bearer ', '')
  const queryToken = new URL(request.url).searchParams.get('token')

  return headerToken === expectedToken || queryToken === expectedToken
}

export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  const { searchParams } = new URL(request.url)

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
    return new NextResponse(challenge || 'ok', { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized webhook call' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as GenericPayload
    const incoming = parseIncomingMessage(body)

    if (!incoming) {
      return NextResponse.json({ success: true, ignored: true, reason: 'No supported text message in payload' })
    }

    const userId = await resolveUserId(body, incoming.from)
    if (!userId) {
      return NextResponse.json(
        {
          error: 'User not mapped for sender phone',
          details: 'Use WHATSAPP_USER_MAP="5511999999999:user@email.com" or send userId in payload'
        },
        { status: 400 }
      )
    }

    if (body.transaction && typeof body.transaction === 'object') {
      const transaction = body.transaction as Record<string, unknown>
      const { amount, category, description, kind, date } = transaction
      if (!amount || !category || !description || !kind) {
        return NextResponse.json({ error: 'Invalid transaction payload' }, { status: 400 })
      }
      if (kind !== 'expense' && kind !== 'income') {
        return NextResponse.json({ error: 'Invalid transaction kind' }, { status: 400 })
      }

      const directResult = await createTransaction({
        userId,
        amount: Number(amount),
        category: String(category),
        description: String(description),
        kind,
        date: typeof date === 'string' ? date : undefined
      })

      if ('error' in directResult) {
        return NextResponse.json({ error: 'Failed to create transaction', details: directResult.error }, { status: directResult.status })
      }

      return NextResponse.json({
        success: true,
        source: 'whatsapp',
        mode: 'direct',
        transaction: directResult.transaction
      })
    }

    const result = await createSmartTransactionFromText(userId, incoming.text)

    if ('error' in result) {
      return NextResponse.json(
        {
          error: result.error,
          parsed: result.parsed,
          category: result.category
        },
        { status: result.status }
      )
    }

    return NextResponse.json({
      success: true,
      source: 'whatsapp',
      mode: 'smart',
      transaction: result.transaction,
      parsed: result.parsed,
      category: result.category
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
