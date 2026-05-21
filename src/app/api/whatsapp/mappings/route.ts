import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

const normalizePhone = (value: string) => value.replace(/\D/g, '')

const mapDbError = (error: PostgrestError, fallback: string) => {
  if (error.code === '42P01') {
    return {
      status: 500,
      body: {
        error: 'Tabela de mapeamento WhatsApp não existe no banco',
        details: 'Execute a migration do arquivo supabase-schema.sql para criar whatsapp_user_mappings'
      }
    }
  }

  return {
    status: 500,
    body: {
      error: fallback,
      details: error.message
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_user_mappings')
      .select('id, phone, created_at')
      .eq('user_id', session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      const mapped = mapDbError(error, 'Failed to fetch mappings')
      return NextResponse.json(mapped.body, { status: mapped.status })
    }

    return NextResponse.json({ mappings: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
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
    const rawPhone = typeof body?.phone === 'string' ? body.phone : ''
    const phone = normalizePhone(rawPhone)

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_user_mappings')
      .insert({ user_id: session.user.email, phone })
      .select('id, phone, created_at')
      .single()

    if (error) {
      const conflict = error.message.toLowerCase().includes('duplicate') || error.code === '23505'
      if (conflict) {
        return NextResponse.json({ error: 'Esse telefone já está vinculado a um usuário' }, { status: 409 })
      }
      const mapped = mapDbError(error, 'Failed to create mapping')
      return NextResponse.json(mapped.body, { status: mapped.status })
    }

    return NextResponse.json({ mapping: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing mapping id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('whatsapp_user_mappings')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.email)

    if (error) {
      const mapped = mapDbError(error, 'Failed to delete mapping')
      return NextResponse.json(mapped.body, { status: mapped.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
