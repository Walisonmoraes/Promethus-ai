"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  kind: 'income' | 'expense';
  date: string;
  created_at?: string;
}

export default function LancamentosPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        console.error('Failed to load transactions');
        return;
      }
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setTransactions((current) => current.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filter === 'all') return true;
        return t.kind === filter;
      })
      .filter((t) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, searchTerm]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      const key = t.category;
      if (!acc[key]) {
        acc[key] = { count: 0, total: 0 };
      }
      acc[key].count += 1;
      acc[key].total += t.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return Object.entries(grouped)
      .map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
        avg: data.total / data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b13] flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b13] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-[#b7b7c7] hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Histórico de Lançamentos</h1>
          <p className="text-[#b7b7c7]">Todos os seus lançamentos financeiros</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#141428] backdrop-blur-lg rounded-[20px] p-6 border border-[#27273b]">
            <div className="text-[#b7b7c7] text-sm mb-1">Receitas</div>
            <div className="text-2xl font-bold text-[#39d0ff]">{currency.format(totals.income)}</div>
          </div>
          <div className="bg-[#141428] backdrop-blur-lg rounded-[20px] p-6 border border-[#27273b]">
            <div className="text-[#b7b7c7] text-sm mb-1">Despesas</div>
            <div className="text-2xl font-bold text-[#ff6ad5]">{currency.format(totals.expense)}</div>
          </div>
          <div className="bg-[#141428] backdrop-blur-lg rounded-[20px] p-6 border border-[#27273b]">
            <div className="text-[#b7b7c7] text-sm mb-1">Saldo</div>
            <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-[#39d0ff]' : 'text-[#ff6ad5]'}`}>
              {currency.format(totals.balance)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#141428] backdrop-blur-lg rounded-[20px] p-4 border border-[#27273b] mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0b0b13] border border-[#27273b] rounded-[14px] px-4 py-2 text-white placeholder-[#b7b7c7] focus:outline-none focus:ring-2 focus:ring-[#7c5cff]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-[14px] transition-colors ${
                  filter === 'all' ? 'bg-[#7c5cff] text-white' : 'bg-[#1a1a32] text-[#b7b7c7] hover:bg-[#27273b]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('income')}
                className={`px-4 py-2 rounded-[14px] transition-colors ${
                  filter === 'income' ? 'bg-[#39d0ff] text-white' : 'bg-[#1a1a32] text-[#b7b7c7] hover:bg-[#27273b]'
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setFilter('expense')}
                className={`px-4 py-2 rounded-[14px] transition-colors ${
                  filter === 'expense' ? 'bg-[#ff6ad5] text-white' : 'bg-[#1a1a32] text-[#b7b7c7] hover:bg-[#27273b]'
                }`}
              >
                Despesas
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-[#141428] backdrop-blur-lg rounded-[20px] border border-[#27273b] overflow-hidden">
              <div className="p-4 border-b border-[#27273b]">
                <h2 className="text-xl font-semibold text-white">
                  {filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? 's' : ''}
                </h2>
              </div>
              <div className="divide-y divide-[#27273b]">
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-[#b7b7c7]">
                    Nenhum lançamento encontrado
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 hover:bg-[#1a1a32] transition-colors flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.kind === 'income' ? 'bg-[#39d0ff]' : 'bg-[#ff6ad5]'
                          }`} />
                          <div>
                            <div className="text-white font-medium">{transaction.description}</div>
                            <div className="text-[#b7b7c7] text-sm">
                              {transaction.category} · {shortDate.format(new Date(transaction.date))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-right ${
                          transaction.kind === 'income' ? 'text-[#39d0ff]' : 'text-[#ff6ad5]'
                        }`}>
                          <div className="font-semibold">
                            {transaction.kind === 'income' ? '+' : '-'}{currency.format(transaction.amount)}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-[#b7b7c7] hover:text-[#ff6ad5] transition-colors p-2"
                          title="Excluir"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Category Summary */}
          <div>
            <div className="bg-[#141428] backdrop-blur-lg rounded-[20px] border border-[#27273b] overflow-hidden">
              <div className="p-4 border-b border-[#27273b]">
                <h2 className="text-xl font-semibold text-white">Resumo por Categoria</h2>
              </div>
              <div className="divide-y divide-[#27273b]">
                {categoryTotals.length === 0 ? (
                  <div className="p-8 text-center text-[#b7b7c7]">
                    Sem dados
                  </div>
                ) : (
                  categoryTotals.map((item) => (
                    <div key={item.category} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium">{item.category}</div>
                        <div className="text-white font-semibold">{currency.format(item.total)}</div>
                      </div>
                      <div className="text-[#b7b7c7] text-sm">
                        {item.count} lançamento{item.count !== 1 ? 's' : ''} · média {currency.format(item.avg)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
