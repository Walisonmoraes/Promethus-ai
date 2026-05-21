import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

type NotaFiscal = {
  data?: string
  numero?: string
  valor?: string
  cnpj?: string
  empresa?: string
  data_extracao?: string
}

const parseBRL = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  const cleaned = value.replace(/[^\d.,-]/g, '').trim()
  if (!cleaned) return 0
  const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.')
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseDate = (value: unknown) => {
  if (typeof value !== 'string') return new Date().toISOString().split('T')[0]
  const trimmed = value.trim()
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) {
    const [, dd, mm, yyyy] = br
    return `${yyyy}-${mm}-${dd}`
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`
  }
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const notas: NotaFiscal[] = body?.notas

    if (!Array.isArray(notas) || notas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma nota informada' }, { status: 400 })
    }

    const userId = session.user.email

    const transactionsToInsert = notas.map((nota) => {
      const amount = parseBRL(nota.valor)
      const date = parseDate(nota.data)
      const title = (nota.empresa || nota.cnpj || 'Nota Fiscal').trim()
      const nf = (nota.numero || '').trim()
      const description = nf ? `${title} - NF ${nf}` : title

      return {
        user_id: userId,
        amount,
        category: 'Notas MT',
        description,
        kind: 'expense' as const,
        date
      }
    })

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(transactionsToInsert)
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to insert transactions', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      transactions: data || []
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

