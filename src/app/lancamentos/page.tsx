"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import "@/features/modo-babilonia/modo-babilonia.css";

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
  const [importingNotas, setImportingNotas] = useState(false);

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

  const importNotasFiscais = async () => {
    setImportingNotas(true);
    try {
      const cpf = prompt('Digite seu CPF (apenas números):');
      if (!cpf) {
        setImportingNotas(false);
        return;
      }

      const response = await fetch('/api/sefaz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, month: 5, year: 2026 }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Notas fiscais importadas com sucesso!');
        console.log('Notas importadas:', data);
        // Recarregar transações após importação
        loadTransactions();
      } else {
        alert('Erro ao importar notas fiscais');
      }
    } catch (error) {
      console.error('Error importing notas fiscais:', error);
      alert('Erro ao importar notas fiscais');
    } finally {
      setImportingNotas(false);
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
      <div className="mb-page flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="mb-page">
      <div className="mb-shell">
        {/* Header */}
        <div className="mb-hero">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="text-[#d2ddff] hover:text-white flex items-center gap-2 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
            <button
              type="button"
              className="mb-btn"
              title="Conectar banco"
              style={{
                background: 'linear-gradient(120deg, rgba(124, 92, 255, 0.6), rgba(59, 130, 246, 0.5))',
                borderColor: 'rgba(124, 92, 255, 0.8)',
                boxShadow: '0 0 20px rgba(124, 92, 255, 0.4)',
                padding: '10px 16px'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </button>
          </div>
          <div className="flex justify-end mb-4">
            <button
              type="button"
              className="mb-btn"
              title="Importar notas fiscais"
              onClick={importNotasFiscais}
              disabled={importingNotas}
              style={{
                background: importingNotas 
                  ? 'linear-gradient(120deg, rgba(100, 100, 100, 0.6), rgba(80, 80, 80, 0.5))'
                  : 'linear-gradient(120deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.5))',
                borderColor: importingNotas ? 'rgba(100, 100, 100, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                boxShadow: importingNotas ? 'none' : '0 0 20px rgba(34, 197, 94, 0.4)',
                padding: '10px 16px',
                opacity: importingNotas ? 0.6 : 1,
                cursor: importingNotas ? 'not-allowed' : 'pointer'
              }}
            >
              {importingNotas ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.9)', animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
              )}
            </button>
          </div>
          <p className="mb-kicker">Histórico Financeiro</p>
          <h1 className="mb-title">Lançamentos</h1>
          <p className="mb-subtitle">Todos os seus lançamentos financeiros em um só lugar</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-game-strip">
          <div className="mb-game-card" style={{
            background: 'radial-gradient(circle at 85% 12%, rgba(34, 197, 94, 0.3), transparent 42%), linear-gradient(140deg, rgba(21, 128, 61, 0.6), rgba(5, 46, 22, 0.95))',
            borderColor: 'rgba(34, 197, 94, 0.6)'
          }}>
            <span style={{ color: '#86efac' }}>Receitas</span>
            <strong style={{ color: '#4ade80', textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}>{currency.format(totals.income)}</strong>
          </div>
          <div className="mb-game-card" style={{
            background: 'radial-gradient(circle at 85% 12%, rgba(239, 68, 68, 0.3), transparent 42%), linear-gradient(140deg, rgba(153, 27, 27, 0.6), rgba(69, 10, 10, 0.95))',
            borderColor: 'rgba(239, 68, 68, 0.6)'
          }}>
            <span style={{ color: '#fca5a5' }}>Despesas</span>
            <strong style={{ color: '#f87171', textShadow: '0 0 20px rgba(248, 113, 113, 0.5)' }}>{currency.format(totals.expense)}</strong>
          </div>
          <div className="mb-game-card" style={{
            background: totals.balance >= 0 
              ? 'radial-gradient(circle at 85% 12%, rgba(34, 197, 94, 0.3), transparent 42%), linear-gradient(140deg, rgba(21, 128, 61, 0.6), rgba(5, 46, 22, 0.95))'
              : 'radial-gradient(circle at 85% 12%, rgba(239, 68, 68, 0.3), transparent 42%), linear-gradient(140deg, rgba(153, 27, 27, 0.6), rgba(69, 10, 10, 0.95))',
            borderColor: totals.balance >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)'
          }}>
            <span style={{ color: totals.balance >= 0 ? '#86efac' : '#fca5a5' }}>Saldo</span>
            <strong style={{ 
              color: totals.balance >= 0 ? '#4ade80' : '#f87171',
              textShadow: totals.balance >= 0 ? '0 0 20px rgba(74, 222, 128, 0.5)' : '0 0 20px rgba(248, 113, 113, 0.5)'
            }}>
              {currency.format(totals.balance)}
            </strong>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-card" style={{
          background: 'radial-gradient(circle at 92% 12%, rgba(147, 51, 234, 0.2), transparent 38%), linear-gradient(140deg, rgba(30, 27, 75, 0.95), rgba(17, 24, 39, 0.95))',
          borderColor: 'rgba(147, 51, 234, 0.5)'
        }}>
          <div className="mb-row-2">
            <div className="mb-field">
              <span style={{ color: '#c4b5fd' }}>Buscar</span>
              <input
                type="text"
                placeholder="Descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-input"
                style={{
                  borderColor: 'rgba(147, 51, 234, 0.4)',
                  background: 'rgba(17, 24, 39, 0.95)',
                  color: '#e9edff'
                }}
              />
            </div>
            <div className="mb-field">
              <span style={{ color: '#c4b5fd' }}>Filtro</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className="mb-btn"
                  style={{
                    background: filter === 'all' 
                      ? 'linear-gradient(120deg, rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.5))'
                      : 'linear-gradient(120deg, rgba(52, 129, 255, 0.3), rgba(15, 198, 217, 0.2))',
                    borderColor: filter === 'all' ? 'rgba(147, 51, 234, 0.9)' : 'rgba(107, 219, 255, 0.5)',
                    boxShadow: filter === 'all' ? '0 0 20px rgba(147, 51, 234, 0.4)' : 'none'
                  }}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className="mb-btn"
                  style={{
                    background: filter === 'income' 
                      ? 'linear-gradient(120deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.5))'
                      : 'linear-gradient(120deg, rgba(52, 129, 255, 0.3), rgba(15, 198, 217, 0.2))',
                    borderColor: filter === 'income' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(107, 219, 255, 0.5)',
                    boxShadow: filter === 'income' ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none'
                  }}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className="mb-btn"
                  style={{
                    background: filter === 'expense' 
                      ? 'linear-gradient(120deg, rgba(239, 68, 68, 0.6), rgba(239, 68, 68, 0.5))'
                      : 'linear-gradient(120deg, rgba(52, 129, 255, 0.3), rgba(15, 198, 217, 0.2))',
                    borderColor: filter === 'expense' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(107, 219, 255, 0.5)',
                    boxShadow: filter === 'expense' ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
                  }}
                >
                  Despesas
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-top-grid">
          {/* Transactions List */}
          <div className="mb-section" style={{
            background: 'radial-gradient(circle at 92% 12%, rgba(59, 130, 246, 0.15), transparent 38%), linear-gradient(140deg, rgba(30, 58, 138, 0.95), rgba(15, 23, 42, 0.95))',
            borderColor: 'rgba(59, 130, 246, 0.4)'
          }}>
            <div className="mb-section-header">
              <div className="mb-section-headline">
                <h3 style={{ color: '#93c5fd' }}>Lançamentos</h3>
                <span className="mb-step-summary" style={{
                  color: '#60a5fa',
                  background: 'rgba(59, 130, 246, 0.15)',
                  borderColor: 'rgba(59, 130, 246, 0.4)'
                }}>{filteredTransactions.length} itens</span>
              </div>
            </div>
            <div className="mb-list">
              {filteredTransactions.length === 0 ? (
                <div className="mb-empty" style={{ color: '#94a3b8' }}>Nenhum lançamento encontrado</div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="mb-expense-item" style={{
                    background: 'radial-gradient(circle at 88% 12%, rgba(59, 130, 246, 0.08), transparent 40%), rgba(15, 23, 42, 0.88)',
                    borderColor: 'rgba(59, 130, 246, 0.3)'
                  }}>
                    <div>
                      <p style={{ color: '#e2e8f0' }}>{transaction.description}</p>
                      <div className="mb-expense-meta">
                        <span className="mb-badge" style={{
                          color: transaction.kind === 'income' ? '#86efac' : '#fca5a5',
                          background: transaction.kind === 'income' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          borderColor: transaction.kind === 'income' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                        }}>{transaction.category}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                          {shortDate.format(new Date(transaction.date))}
                        </span>
                      </div>
                    </div>
                    <div className="mb-expense-meta">
                      <span style={{ 
                        color: transaction.kind === 'income' ? '#4ade80' : '#f87171',
                        textShadow: transaction.kind === 'income' ? '0 0 15px rgba(74, 222, 128, 0.4)' : '0 0 15px rgba(248, 113, 113, 0.4)',
                        fontWeight: '700'
                      }}>
                        {transaction.kind === 'income' ? '+' : '-'}{currency.format(transaction.amount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="mb-remove"
                        style={{ color: '#f87171' }}
                        title="Excluir"
                      >
                        −
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Category Summary */}
          <div className="mb-section" style={{
            background: 'radial-gradient(circle at 92% 12%, rgba(168, 85, 247, 0.15), transparent 38%), linear-gradient(140deg, rgba(88, 28, 135, 0.95), rgba(30, 27, 75, 0.95))',
            borderColor: 'rgba(168, 85, 247, 0.4)'
          }}>
            <div className="mb-section-header">
              <h3 style={{ color: '#c4b5fd' }}>Resumo por Categoria</h3>
            </div>
            <div className="mb-list">
              {categoryTotals.length === 0 ? (
                <div className="mb-empty" style={{ color: '#94a3b8' }}>Sem dados</div>
              ) : (
                categoryTotals.map((item, index) => (
                  <div key={item.category} className="mb-expense-item" style={{
                    background: `radial-gradient(circle at 88% 12%, ${index % 2 === 0 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)'}, transparent 40%), rgba(30, 27, 75, 0.88)`,
                    borderColor: index % 2 === 0 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.4)'
                  }}>
                    <div>
                      <p style={{ color: '#e2e8f0' }}>{item.category}</p>
                      <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                        {item.count} lançamento{item.count !== 1 ? 's' : ''} · média {currency.format(item.avg)}
                      </div>
                    </div>
                    <span style={{ 
                      color: index % 2 === 0 ? '#c4b5fd' : '#93c5fd',
                      textShadow: index % 2 === 0 ? '0 0 15px rgba(168, 85, 247, 0.4)' : '0 0 15px rgba(59, 130, 246, 0.4)',
                      fontWeight: '700'
                    }}>{currency.format(item.total)}</span>
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
