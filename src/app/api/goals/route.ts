import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Skip static generation
  if (process.env.NODE_ENV === 'development' || request.headers.get('x-middleware-skip') || !supabaseAdmin) {
    return NextResponse.json({ goals: [] })
  }

  try {
    const session = await getServerSession(authOptions)
    
    // Se não houver sessão, retorna metas vazias (para não bloquear o frontend)
    if (!session?.user?.email) {
      return NextResponse.json({ goals: [] })
    }

    const userId = session.user.email

    const { data: goals, error } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }

    return NextResponse.json({ goals })
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
    const { title, category, target, progress = 0 } = body

    // Validação dos campos
    if (!title || !category || !target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Creating goal for user:', userId)
    console.log('Goal data:', { title, category, target, progress })

    const goalData = {
      user_id: userId,
      title: title.trim(),
      category: category.trim(),
      target: parseFloat(target),
      progress: parseFloat(progress)
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: goal, error } = await supabaseAdmin
      .from('goals')
      .insert(goalData)
      .select()
      .single()

    if (error) {
      console.error('Error creating goal:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to create goal', details: error.message }, { status: 500 })
    }

    console.log('Goal created successfully:', goal)
    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
