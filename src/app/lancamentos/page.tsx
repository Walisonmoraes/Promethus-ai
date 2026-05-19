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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="app" style={{ background: 'var(--bg)' }}>
      <div className="layout">
        {/* Header */}
        <div className="header">
          <div>
            <button
              onClick={() => router.push('/')}
              className="text-white/70 hover:text-white flex items-center gap-2 transition-colors"
              style={{ fontSize: '14px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--ink)', marginTop: '8px' }}>
              Histórico de Lançamentos
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginTop: '4px' }}>
              Todos os seus lançamentos financeiros
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--line)' }}>
            <div style={{ color: 'var(--ink-soft)', fontSize: '13px', marginBottom: '8px' }}>Receitas</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>{currency.format(totals.income)}</div>
          </div>
          <div className="card" style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--line)' }}>
            <div style={{ color: 'var(--ink-soft)', fontSize: '13px', marginBottom: '8px' }}>Despesas</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171' }}>{currency.format(totals.expense)}</div>
          </div>
          <div className="card" style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--line)' }}>
            <div style={{ color: 'var(--ink-soft)', fontSize: '13px', marginBottom: '8px' }}>Saldo</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: totals.balance >= 0 ? '#4ade80' : '#f87171' }}>
              {currency.format(totals.balance)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--panel-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: filter === 'all' ? 'var(--accent)' : 'var(--panel-2)',
                  color: 'var(--ink)',
                  transition: 'all 0.2s ease',
                }}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('income')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: filter === 'income' ? '#4ade80' : 'var(--panel-2)',
                  color: 'var(--ink)',
                  transition: 'all 0.2s ease',
                }}
              >
                Receitas
              </button>
              <button
                onClick={() => setFilter('expense')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: filter === 'expense' ? '#f87171' : 'var(--panel-2)',
                  color: 'var(--ink)',
                  transition: 'all 0.2s ease',
                }}
              >
                Despesas
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Transactions List */}
          <div className="card" style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--line)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ink)' }}>
                {filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filteredTransactions.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Nenhum lançamento encontrado
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: transaction.kind === 'income' ? '#4ade80' : '#f87171'
                        }} />
                        <div>
                          <div style={{ color: 'var(--ink)', fontWeight: '500', fontSize: '14px' }}>{transaction.description}</div>
                          <div style={{ color: 'var(--ink-soft)', fontSize: '12px', marginTop: '2px' }}>
                            {transaction.category} · {shortDate.format(new Date(transaction.date))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right', color: transaction.kind === 'income' ? '#4ade80' : '#f87171' }}>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>
                          {transaction.kind === 'income' ? '+' : '-'}{currency.format(transaction.amount)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--ink-soft)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.background = 'transparent'; }}
                        title="Excluir"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category Summary */}
          <div className="card" style={{ background: 'var(--panel)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--line)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--ink)' }}>Resumo por Categoria</h2>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {categoryTotals.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Sem dados
                </div>
              ) : (
                categoryTotals.map((item) => (
                  <div key={item.category} style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ color: 'var(--ink)', fontWeight: '500', fontSize: '14px' }}>{item.category}</div>
                      <div style={{ color: 'var(--ink)', fontWeight: '600', fontSize: '15px' }}>{currency.format(item.total)}</div>
                    </div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>
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
  );
}
