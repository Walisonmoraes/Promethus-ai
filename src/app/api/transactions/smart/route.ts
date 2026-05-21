import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createSmartTransactionFromText } from '@/lib/transactionService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.error('No session or email found')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    const userId = session.user.email
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json({ error: 'Missing text field' }, { status: 400 })
    }

    const result = await createSmartTransactionFromText(userId, text)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, parsed: result.parsed, category: result.category },
        { status: result.status }
      )
    }

    return NextResponse.json(
      {
        transaction: result.transaction,
        parsed: result.parsed,
        category: result.category
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
