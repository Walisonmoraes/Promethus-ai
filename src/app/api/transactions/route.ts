import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Skip static generation
  if (process.env.NODE_ENV === 'development' || request.headers.get('x-middleware-skip') || !supabaseAdmin) {
    return NextResponse.json({ transactions: [] })
  }

  try {
    const session = await getServerSession(authOptions)
    
    // Se não houver sessão, retorna transações vazias (para não bloquear o frontend)
    if (!session?.user?.email) {
      return NextResponse.json({ transactions: [] })
    }

    const { searchParams } = new URL(request.url)
    const userId = session.user.email
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json({ transactions })
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
    const { amount, category, description, kind, date } = body

    // Validação dos campos
    if (!amount || !category || !description || !kind) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['expense', 'income'].includes(kind)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    console.log('Creating transaction for user:', userId)
    console.log('Transaction data:', { amount, category, description, kind, date })

    const transactionData = {
      user_id: userId,
      amount: parseFloat(amount),
      category: category.trim(),
      description: description.trim(),
      kind,
      date: date || new Date().toISOString().split('T')[0]
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to create transaction', details: error.message }, { status: 500 })
    }

    console.log('Transaction created successfully:', transaction)
    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
