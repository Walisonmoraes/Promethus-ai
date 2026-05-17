import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Skip static generation
  if (process.env.NODE_ENV === 'development' || request.headers.get('x-middleware-skip') || !supabaseAdmin) {
    return NextResponse.json({ agendaItems: [] })
  }

  try {
    const session = await getServerSession(authOptions)
    
    // Se não houver sessão, retorna agenda vazia (para não bloquear o frontend)
    if (!session?.user?.email) {
      return NextResponse.json({ agendaItems: [] })
    }

    const userId = session.user.email

    const { data: agendaItems, error } = await supabaseAdmin
      .from('agenda_items')
      .select('*')
      .eq('user_id', userId)
      .order('due', { ascending: true })

    if (error) {
      console.error('Error fetching agenda items:', error)
      return NextResponse.json({ error: 'Failed to fetch agenda items' }, { status: 500 })
    }

    return NextResponse.json({ agendaItems })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.error('No session or email found')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    const userId = session.user.email
    const body = await request.json()
    const { title, due, amount } = body

    // Validação dos campos
    if (!title || !due || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Creating agenda item for user:', userId)
    console.log('Agenda data:', { title, due, amount })

    const agendaData = {
      user_id: userId,
      title: title.trim(),
      due: due.trim(),
      amount: parseFloat(amount)
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: agendaItem, error } = await supabaseAdmin
      .from('agenda_items')
      .insert(agendaData)
      .select()
      .single()

    if (error) {
      console.error('Error creating agenda item:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to create agenda item', details: error.message }, { status: 500 })
    }

    console.log('Agenda item created successfully:', agendaItem)
    return NextResponse.json({ agendaItem }, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
