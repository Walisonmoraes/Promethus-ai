// Cliente Pluggy.ai para integração bancária

const PLUGGY_API_URL = 'https://api.pluggy.ai'
const PLUGGY_API_KEY = process.env.PLUGGY_API_KEY

export interface PluggyConnector {
  id: number
  name: string
  country: string
  sandbox: boolean
  credentials: any[]
  mfa: boolean
}

export interface PluggyItem {
  id: string
  connectorId: number
  status: string
  lastExecuted: string
  createdAt: string
  updatedAt: string
}

export interface PluggyAccount {
  id: string
  itemId: string
  type: string
  subtype: string
  balance: number
  currency: string
  name: string
}

export interface PluggyTransaction {
  id: string
  accountId: string
  amount: number
  description: string
  date: string
  category: string
  type: string
}

class PluggyClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${PLUGGY_API_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Pluggy API error: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  // Listar conectores disponíveis (bancos)
  async listConnectors(): Promise<PluggyConnector[]> {
    const data = await this.request('/connectors')
    return data.results || []
  }

  // Criar Item (conectar conta bancária)
  async createItem(connectorId: number, parameters: any, clientUserId: string): Promise<PluggyItem> {
    const body = {
      connectorId,
      parameters,
      clientUserId,
    }
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Obter Item (status da conexão)
  async getItem(itemId: string): Promise<PluggyItem> {
    return this.request(`/items/${itemId}`)
  }

  // Listar contas bancárias de um Item
  async listAccounts(itemId: string): Promise<PluggyAccount[]> {
    const data = await this.request(`/accounts?itemId=${itemId}`)
    return data.results || []
  }

  // Listar transações de uma conta
  async listTransactions(accountId: string, page: number = 1): Promise<{
    results: PluggyTransaction[]
    total: number
    totalPages: number
    page: number
  }> {
    return this.request(`/transactions?accountId=${accountId}&page=${page}`)
  }

  // Sincronizar Item (atualizar dados)
  async syncItem(itemId: string): Promise<PluggyItem> {
    return this.request(`/items/${itemId}/sync`, {
      method: 'POST',
    })
  }

  // Enviar MFA (Multi-Factor Authentication)
  async sendMFA(itemId: string, parameter: any): Promise<PluggyItem> {
    return this.request(`/items/${itemId}/mfa`, {
      method: 'POST',
      body: JSON.stringify(parameter),
    })
  }
}

// Exportar instância do cliente
export const pluggyClient = PLUGGY_API_KEY ? new PluggyClient(PLUGGY_API_KEY) : null

// Funções auxiliares para categorização
export function mapPluggyTransactionToSupabase(transaction: PluggyTransaction, userId: string) {
  return {
    user_id: userId,
    amount: Math.abs(transaction.amount),
    category: transaction.category || 'Outros',
    description: transaction.description || 'Transação bancária',
    kind: transaction.amount < 0 ? 'expense' : 'income',
    date: transaction.date.split('T')[0],
  }
}
