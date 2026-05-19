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
          <button
            onClick={() => router.push('/')}
            className="text-[#d2ddff] hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <p className="mb-kicker">Histórico Financeiro</p>
          <h1 className="mb-title">Lançamentos</h1>
          <p className="mb-subtitle">Todos os seus lançamentos financeiros em um só lugar</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-game-strip">
          <div className="mb-game-card">
            <span>Receitas</span>
            <strong className="text-[#c3f3d2]">{currency.format(totals.income)}</strong>
          </div>
          <div className="mb-game-card">
            <span>Despesas</span>
            <strong className="text-[#ffd2dc]">{currency.format(totals.expense)}</strong>
          </div>
          <div className="mb-game-card">
            <span>Saldo</span>
            <strong className={totals.balance >= 0 ? 'text-[#c3f3d2]' : 'text-[#ffd2dc]'}>
              {currency.format(totals.balance)}
            </strong>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-card">
          <div className="mb-row-2">
            <div className="mb-field">
              <span>Buscar</span>
              <input
                type="text"
                placeholder="Descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-input"
              />
            </div>
            <div className="mb-field">
              <span>Filtro</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`mb-btn ${filter === 'all' ? 'bg-[#59d4ff]/20 border-[#59d4ff]' : ''}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className={`mb-btn ${filter === 'income' ? 'bg-[#c3f3d2]/20 border-[#c3f3d2]' : ''}`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className={`mb-btn ${filter === 'expense' ? 'bg-[#ffd2dc]/20 border-[#ffd2dc]' : ''}`}
                >
                  Despesas
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-top-grid">
          {/* Transactions List */}
          <div className="mb-section">
            <div className="mb-section-header">
              <div className="mb-section-headline">
                <h3>Lançamentos</h3>
                <span className="mb-step-summary">{filteredTransactions.length} itens</span>
              </div>
            </div>
            <div className="mb-list">
              {filteredTransactions.length === 0 ? (
                <div className="mb-empty">Nenhum lançamento encontrado</div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="mb-expense-item">
                    <div>
                      <p className="text-[#e9edff]">{transaction.description}</p>
                      <div className="mb-expense-meta">
                        <span className="mb-badge mb-badge--need">{transaction.category}</span>
                        <span className="text-[#9fb0dc] text-xs">
                          {shortDate.format(new Date(transaction.date))}
                        </span>
                      </div>
                    </div>
                    <div className="mb-expense-meta">
                      <span className={transaction.kind === 'income' ? 'text-[#c3f3d2]' : 'text-[#ffd2dc]'}>
                        {transaction.kind === 'income' ? '+' : '-'}{currency.format(transaction.amount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="mb-remove"
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
          <div className="mb-section">
            <div className="mb-section-header">
              <h3>Resumo por Categoria</h3>
            </div>
            <div className="mb-list">
              {categoryTotals.length === 0 ? (
                <div className="mb-empty">Sem dados</div>
              ) : (
                categoryTotals.map((item) => (
                  <div key={item.category} className="mb-expense-item">
                    <div>
                      <p className="text-[#e9edff]">{item.category}</p>
                      <div className="text-[#9fb0dc] text-xs">
                        {item.count} lançamento{item.count !== 1 ? 's' : ''} · média {currency.format(item.avg)}
                      </div>
                    </div>
                    <span className="text-[#e9edff]">{currency.format(item.total)}</span>
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
