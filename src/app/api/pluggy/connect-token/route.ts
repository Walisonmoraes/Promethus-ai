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
    const { connectorId } = body

    console.log('Creating connect token with connectorId:', connectorId)

    if (!connectorId) {
      console.error('Missing connectorId')
      return NextResponse.json({ error: 'Missing connectorId' }, { status: 400 })
    }

    const userId = session.user.email
    console.log('Creating connect token for user:', userId)
    
    const apiKey = process.env.PLUGGY_API_KEY
    console.log('API Key exists:', !!apiKey)
    
    // Gerar connectToken usando a API do Pluggy
    const response = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey || '',
      },
      body: JSON.stringify({
        connectorId,
        clientUserId: userId,
      }),
    })

    console.log('Pluggy API response status:', response.status)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('Error creating connect token:', error)
      return NextResponse.json({ error: 'Failed to create connect token', details: error.message }, { status: 500 })
    }

    const data = await response.json()
    console.log('Connect token created successfully')
    return NextResponse.json({ connectToken: data.connectToken })
  } catch (error) {
    console.error('Error creating connect token:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json({ error: 'Failed to create connect token', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
