import { NextRequest, NextResponse } from 'next/server'
import { pluggyClient } from '@/lib/pluggy'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.error('No session or email found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!pluggyClient) {
      console.error('Pluggy client not configured')
      return NextResponse.json({ error: 'Pluggy client not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { connectorId, parameters } = body

    console.log('Creating item with connectorId:', connectorId, 'parameters:', parameters)

    if (!connectorId || !parameters) {
      console.error('Missing connectorId or parameters')
      return NextResponse.json({ error: 'Missing connectorId or parameters' }, { status: 400 })
    }

    const userId = session.user.email
    console.log('Creating item for user:', userId)
    
    const item = await pluggyClient.createItem(connectorId, parameters, userId)

    console.log('Item created successfully:', item.id, 'for user:', userId)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to create item', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!pluggyClient) {
      return NextResponse.json({ error: 'Pluggy client not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'Missing item id' }, { status: 400 })
    }

    const item = await pluggyClient.getItem(itemId)
    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
  }
}
