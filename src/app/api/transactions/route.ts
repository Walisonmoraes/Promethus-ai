import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTransaction } from '@/lib/transactionService'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'development' || request.headers.get('x-middleware-skip') || !supabaseAdmin) {
    return NextResponse.json({ transactions: [] })
  }

  try {
    const session = await getServerSession(authOptions)

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
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    const userId = session.user.email
    const body = await request.json()
    const { amount, category, description, kind, date } = body

    if (!amount || !category || !description || !kind) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['expense', 'income'].includes(kind)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    const result = await createTransaction({
      userId,
      amount: parseFloat(amount),
      category,
      description,
      kind,
      date
    })

    if ('error' in result) {
      return NextResponse.json({ error: 'Failed to create transaction', details: result.error }, { status: result.status })
    }

    return NextResponse.json({ transaction: result.transaction }, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    const userId = session.user.email
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete transaction', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    const userId = session.user.email
    const body = await request.json()
    const { id, amount, category, description, kind, date } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 })
    }

    if (kind && !['expense', 'income'].includes(kind)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = Number(amount)
    if (category !== undefined) updateData.category = String(category).trim()
    if (description !== undefined) updateData.description = String(description).trim()
    if (kind !== undefined) updateData.kind = kind
    if (date !== undefined) updateData.date = String(date)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update transaction', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
