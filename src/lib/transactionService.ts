import { supabaseAdmin } from '@/lib/supabase'
import { parseTransaction } from '@/lib/transactionParser'
import { categorizeLocally } from '@/lib/transactionCategorizer'

export type CreateTransactionInput = {
  userId: string
  amount: number
  category: string
  description: string
  kind: 'expense' | 'income'
  date?: string
}

export async function createTransaction(input: CreateTransactionInput) {
  if (!supabaseAdmin) {
    return { error: 'Database not configured', status: 500 as const }
  }

  const transactionData = {
    user_id: input.userId,
    amount: Number(input.amount),
    category: input.category.trim(),
    description: input.description.trim(),
    kind: input.kind,
    date: input.date || new Date().toISOString().split('T')[0]
  }

  const { data: transaction, error } = await supabaseAdmin
    .from('transactions')
    .insert(transactionData)
    .select()
    .single()

  if (error) {
    return { error: error.message, status: 500 as const }
  }

  return { transaction }
}

export async function createSmartTransactionFromText(userId: string, text: string) {
  const parsed = parseTransaction(text)

  if (!parsed.amount) {
    return {
      error: 'Could not extract amount from text. Please include a value.',
      status: 400 as const,
      parsed
    }
  }

  const category = categorizeLocally(text)

  const result = await createTransaction({
    userId,
    amount: parsed.amount,
    category,
    description: parsed.description,
    kind: parsed.kind,
    date: new Date().toISOString().split('T')[0]
  })

  if ('error' in result) {
    return {
      error: result.error,
      status: result.status,
      parsed,
      category
    }
  }

  return {
    transaction: result.transaction,
    parsed,
    category
  }
}
