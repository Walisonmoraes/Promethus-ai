import { NextRequest, NextResponse } from 'next/server'
import { pluggyClient, mapPluggyTransactionToSupabase } from '@/lib/pluggy'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!pluggyClient || !supabaseAdmin) {
      return NextResponse.json({ error: 'Clients not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { itemId, accountId } = body

    if (!itemId || !accountId) {
      return NextResponse.json({ error: 'Missing itemId or accountId' }, { status: 400 })
    }

    const userId = session.user.email

    // Sincronizar item para obter dados atualizados
    console.log('Syncing item:', itemId)
    await pluggyClient.syncItem(itemId)

    // Buscar todas as transações (com paginação)
    let allTransactions: any[] = []
    let page = 1
    let totalPages = 1

    do {
      console.log(`Fetching transactions page ${page}`)
      const response = await pluggyClient.listTransactions(accountId, page)
      allTransactions = [...allTransactions, ...response.results]
      totalPages = response.totalPages
      page++
    } while (page <= totalPages)

    console.log(`Total transactions fetched: ${allTransactions.length}`)

    // Mapear e salvar transações no Supabase
    const transactionsToInsert = allTransactions.map((tx) =>
      mapPluggyTransactionToSupabase(tx, userId)
    )

    // Inserir transações em batch
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(transactionsToInsert)
      .select()

    if (error) {
      console.error('Error inserting transactions:', error)
      return NextResponse.json({ error: 'Failed to insert transactions', details: error.message }, { status: 500 })
    }

    console.log(`Successfully inserted ${data?.length || 0} transactions`)
    return NextResponse.json({ 
      success: true, 
      inserted: data?.length || 0,
      total: allTransactions.length 
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json({ error: 'Failed to sync transactions', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
