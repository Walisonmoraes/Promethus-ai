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

const toDateInputValue = (date: string) => date.split('T')[0] || '';

type DateFilter = 'all' | 'year' | 'month' | 'day' | 'period';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const escapePdfText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '-')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const downloadBlob = (content: BlobPart, type: string, fileName: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  kind: 'income' | 'expense';
  date: string;
  created_at?: string;
}

interface NotaFiscal {
  data?: string;
  numero?: string;
  valor?: string;
  cnpj?: string;
  empresa?: string;
  data_extracao?: string;
}

interface WhatsAppMapping {
  id: string;
  phone: string;
  created_at: string;
}

export default function LancamentosPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(toDateInputValue(new Date().toISOString()).slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(toDateInputValue(new Date().toISOString()));
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [importingNotas, setImportingNotas] = useState(false);
  const [showSefaz] = useState(false);
  const [sefazCpf, setSefazCpf] = useState('');
  const [sefazSenha, setSefazSenha] = useState('');
  const [sefazMonth, setSefazMonth] = useState<number>(new Date().getMonth() + 1);
  const [sefazYear, setSefazYear] = useState<number>(new Date().getFullYear());
  const [sefazConnected, setSefazConnected] = useState(false);
  const [sefazConnecting, setSefazConnecting] = useState(false);
  const [sefazLastValidatedAt, setSefazLastValidatedAt] = useState<string | null>(null);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [notasError, setNotasError] = useState<string>('');
  const [selectedNotas, setSelectedNotas] = useState<Record<string, boolean>>({});
  const [savingNotas, setSavingNotas] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMappings, setWhatsappMappings] = useState<WhatsAppMapping[]>([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappError, setWhatsappError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (!showSefaz) return;
    fetch('/api/sefaz/connect')
      .then((r) => r.json())
      .then((data) => {
        setSefazConnected(!!data?.connected);
        setSefazLastValidatedAt(data?.last_validated_at || null);
      })
      .catch(() => {
      });
  }, [showSefaz]);

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

  const loadWhatsappMappings = async () => {
    setWhatsappLoading(true);
    setWhatsappError('');
    try {
      const response = await fetch('/api/whatsapp/mappings');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setWhatsappError(data.error || 'Erro ao carregar números');
        return;
      }
      setWhatsappMappings(data.mappings || []);
    } catch (error) {
      console.error('Error loading whatsapp mappings:', error);
      setWhatsappError('Erro ao carregar números');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const openWhatsappModal = async () => {
    setShowWhatsappModal(true);
    await loadWhatsappMappings();
  };

  const addWhatsappMapping = async () => {
    setWhatsappSaving(true);
    setWhatsappError('');
    try {
      const response = await fetch('/api/whatsapp/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: whatsappPhone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setWhatsappError(data.error || 'Erro ao salvar número');
        return;
      }
      setWhatsappPhone('');
      setWhatsappMappings((current) => [data.mapping, ...current]);
    } catch (error) {
      console.error('Error adding whatsapp mapping:', error);
      setWhatsappError('Erro ao salvar número');
    } finally {
      setWhatsappSaving(false);
    }
  };

  const removeWhatsappMapping = async (id: string) => {
    setWhatsappError('');
    try {
      const response = await fetch(`/api/whatsapp/mappings?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setWhatsappError(data.error || 'Erro ao remover número');
        return;
      }
      setWhatsappMappings((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting whatsapp mapping:', error);
      setWhatsappError('Erro ao remover número');
    }
  };

  const openEditTransaction = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction, date: toDateInputValue(transaction.date) });
    setEditError('');
    setShowEditModal(true);
  };

  const saveEditedTransaction = async () => {
    if (!editingTransaction) return;
    if (!editingTransaction.description.trim()) {
      setEditError('Descrição é obrigatória');
      return;
    }
    if (!editingTransaction.category.trim()) {
      setEditError('Categoria é obrigatória');
      return;
    }
    if (!editingTransaction.amount || editingTransaction.amount <= 0) {
      setEditError('Valor deve ser maior que zero');
      return;
    }
    if (!editingTransaction.date) {
      setEditError('Data é obrigatória');
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTransaction.id,
          amount: editingTransaction.amount,
          category: editingTransaction.category,
          description: editingTransaction.description,
          kind: editingTransaction.kind,
          date: editingTransaction.date
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setEditError(data.error || 'Erro ao salvar edição');
        return;
      }

      const updated = data.transaction as Transaction;
      setTransactions((current) =>
        current.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                amount: Number(updated.amount),
                category: updated.category,
                description: updated.description,
                kind: updated.kind,
                date: updated.date,
              }
            : item
        )
      );
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error saving edited transaction:', error);
      setEditError('Erro ao salvar edição');
    } finally {
      setEditSaving(false);
    }
  };

  const buildNotaKey = (nota: NotaFiscal) => {
    return [
      nota.data || '',
      nota.numero || '',
      nota.valor || '',
      nota.cnpj || '',
      nota.empresa || ''
    ].join('|');
  };

  const formatErrorPart = (value: unknown) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const connectNotasMt = async () => {
    setNotasError('');
    setSefazConnecting(true);
    try {
      if (!sefazCpf.trim()) {
        setNotasError('CPF é obrigatório');
        return;
      }
      if (!sefazSenha) {
        setNotasError('Senha é obrigatória');
        return;
      }

      const response = await fetch('/api/sefaz/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: sefazCpf, senha: sefazSenha, month: sefazMonth, year: sefazYear }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = [data.error, formatErrorPart(data.details), data.suggestion].filter(Boolean).join(' - ');
        setNotasError(msg || 'Erro ao conectar no Notas MT');
        setSefazConnected(false);
        return;
      }

      setSefazConnected(true);
      setSefazLastValidatedAt(new Date().toISOString());
      setSefazSenha('');
    } catch (error) {
      console.error('Error connecting Notas MT:', error);
      setNotasError('Erro ao conectar no Notas MT');
      setSefazConnected(false);
    } finally {
      setSefazConnecting(false);
    }
  };

  const fetchNotasFiscais = async () => {
    setImportingNotas(true);
    setNotasError('');
    try {
      if (!sefazCpf.trim()) {
        setNotasError('CPF é obrigatório');
        return;
      }
      if (!sefazConnected && !sefazSenha) {
        setNotasError('Senha é obrigatória');
        return;
      }

      const requestBody: Record<string, unknown> = { cpf: sefazCpf, month: sefazMonth, year: sefazYear };
      if (!sefazConnected) requestBody.senha = sefazSenha;

      const response = await fetch('/api/sefaz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        const extracted: NotaFiscal[] = data?.data || [];
        setNotas(extracted);
        const nextSelected: Record<string, boolean> = {};
        extracted.forEach((nota) => {
          nextSelected[buildNotaKey(nota)] = false;
        });
        setSelectedNotas(nextSelected);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const msg = [errorData.error, formatErrorPart(errorData.details), errorData.suggestion].filter(Boolean).join(' - ');
        setNotasError(msg || 'Erro ao importar notas fiscais');
      }
    } catch (error) {
      console.error('Error importing notas fiscais:', error);
      setNotasError('Erro ao importar notas fiscais');
    } finally {
      setImportingNotas(false);
    }
  };

  const toggleSelectNota = (nota: NotaFiscal) => {
    const key = buildNotaKey(nota);
    setSelectedNotas((current) => ({ ...current, [key]: !current[key] }));
  };

  const selectAllNotas = (value: boolean) => {
    setSelectedNotas((current) => {
      const next: Record<string, boolean> = {};
      Object.keys(current).forEach((k) => {
        next[k] = value;
      });
      return next;
    });
  };

  const saveSelectedNotas = async () => {
    const selected = notas.filter((nota) => selectedNotas[buildNotaKey(nota)]);
    if (selected.length === 0) {
      setNotasError('Selecione pelo menos uma nota para adicionar aos lançamentos');
      return;
    }

    setSavingNotas(true);
    setNotasError('');
    try {
      const response = await fetch('/api/sefaz/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: selected }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = [errorData.error, errorData.details].filter(Boolean).join(' - ');
        setNotasError(msg || 'Erro ao salvar notas como lançamentos');
        return;
      }

      setNotas([]);
      setSelectedNotas({});
      await loadTransactions();
    } catch (error) {
      console.error('Error saving notas:', error);
      setNotasError('Erro ao salvar notas como lançamentos');
    } finally {
      setSavingNotas(false);
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
      .filter((t) => {
        if (dateFilter === 'all') return true;

        const transactionDate = toDateInputValue(t.date);
        if (!transactionDate) return false;

        if (dateFilter === 'year') {
          return selectedYear ? transactionDate.startsWith(selectedYear) : true;
        }

        if (dateFilter === 'month') {
          return selectedMonth ? transactionDate.startsWith(selectedMonth) : true;
        }

        if (dateFilter === 'day') {
          return selectedDay ? transactionDate === selectedDay : true;
        }

        const matchesStart = periodStart ? transactionDate >= periodStart : true;
        const matchesEnd = periodEnd ? transactionDate <= periodEnd : true;
        return matchesStart && matchesEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, searchTerm, dateFilter, selectedYear, selectedMonth, selectedDay, periodStart, periodEnd]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, dateFilter, selectedYear, selectedMonth, selectedDay, periodStart, periodEnd, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * itemsPerPage;
  const pageEndIndex = Math.min(pageStartIndex + itemsPerPage, filteredTransactions.length);
  const paginatedTransactions = filteredTransactions.slice(pageStartIndex, pageEndIndex);

  const filteredTotals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

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
    const grouped = filteredTransactions.reduce((acc, t) => {
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
  }, [filteredTransactions]);

  const reportPeriodLabel = useMemo(() => {
    if (dateFilter === 'year') return selectedYear ? `Ano ${selectedYear}` : 'Todos os anos';
    if (dateFilter === 'month') return selectedMonth ? `Mês ${selectedMonth}` : 'Todos os meses';
    if (dateFilter === 'day') return selectedDay ? `Dia ${selectedDay}` : 'Todos os dias';
    if (dateFilter === 'period') {
      if (periodStart && periodEnd) return `${periodStart} até ${periodEnd}`;
      if (periodStart) return `A partir de ${periodStart}`;
      if (periodEnd) return `Até ${periodEnd}`;
    }
    return 'Todas as datas';
  }, [dateFilter, selectedYear, selectedMonth, selectedDay, periodStart, periodEnd]);

  const reportFileSuffix = useMemo(() => {
    const today = toDateInputValue(new Date().toISOString());
    return `relatorio-lancamentos-${today}`;
  }, []);

  const exportReportExcel = () => {
    const rows = filteredTransactions.map((transaction) => `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(toDateInputValue(transaction.date))}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(transaction.kind === 'income' ? 'Receita' : 'Despesa')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(transaction.description)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(transaction.category)}</Data></Cell>
        <Cell><Data ss:Type="Number">${transaction.amount}</Data></Cell>
      </Row>
    `).join('');

    const categoryRows = categoryTotals.map((item) => `
      <Row>
        <Cell><Data ss:Type="String">${escapeXml(item.category)}</Data></Cell>
        <Cell><Data ss:Type="Number">${item.count}</Data></Cell>
        <Cell><Data ss:Type="Number">${item.total}</Data></Cell>
        <Cell><Data ss:Type="Number">${item.avg}</Data></Cell>
      </Row>
    `).join('');

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Relatorio">
    <Table>
      <Row><Cell><Data ss:Type="String">Relatório de Lançamentos</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Período</Data></Cell><Cell><Data ss:Type="String">${escapeXml(reportPeriodLabel)}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Tipo</Data></Cell><Cell><Data ss:Type="String">${escapeXml(filter === 'all' ? 'Todos' : filter === 'income' ? 'Receitas' : 'Despesas')}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Busca</Data></Cell><Cell><Data ss:Type="String">${escapeXml(searchTerm || 'Sem busca')}</Data></Cell></Row>
      <Row></Row>
      <Row><Cell><Data ss:Type="String">Resumo</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Receitas</Data></Cell><Cell><Data ss:Type="Number">${filteredTotals.income}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Despesas</Data></Cell><Cell><Data ss:Type="Number">${filteredTotals.expense}</Data></Cell></Row>
      <Row><Cell><Data ss:Type="String">Saldo</Data></Cell><Cell><Data ss:Type="Number">${filteredTotals.balance}</Data></Cell></Row>
      <Row></Row>
      <Row>
        <Cell><Data ss:Type="String">Data</Data></Cell>
        <Cell><Data ss:Type="String">Tipo</Data></Cell>
        <Cell><Data ss:Type="String">Descrição</Data></Cell>
        <Cell><Data ss:Type="String">Categoria</Data></Cell>
        <Cell><Data ss:Type="String">Valor</Data></Cell>
      </Row>
      ${rows}
      <Row></Row>
      <Row><Cell><Data ss:Type="String">Resumo por Categoria</Data></Cell></Row>
      <Row>
        <Cell><Data ss:Type="String">Categoria</Data></Cell>
        <Cell><Data ss:Type="String">Lançamentos</Data></Cell>
        <Cell><Data ss:Type="String">Total</Data></Cell>
        <Cell><Data ss:Type="String">Média</Data></Cell>
      </Row>
      ${categoryRows}
    </Table>
  </Worksheet>
</Workbook>`;

    downloadBlob(workbook, 'application/vnd.ms-excel;charset=utf-8', `${reportFileSuffix}.xls`);
  };

  const exportReportPdf = () => {
    const lines = [
      'Relatorio de Lancamentos',
      `Periodo: ${reportPeriodLabel}`,
      `Tipo: ${filter === 'all' ? 'Todos' : filter === 'income' ? 'Receitas' : 'Despesas'}`,
      `Busca: ${searchTerm || 'Sem busca'}`,
      '',
      `Receitas: ${currency.format(filteredTotals.income)}`,
      `Despesas: ${currency.format(filteredTotals.expense)}`,
      `Saldo: ${currency.format(filteredTotals.balance)}`,
      '',
      'Lancamentos',
      ...filteredTransactions.map((transaction) => {
        const type = transaction.kind === 'income' ? 'Receita' : 'Despesa';
        const amount = `${transaction.kind === 'income' ? '+' : '-'}${currency.format(transaction.amount)}`;
        return `${toDateInputValue(transaction.date)} | ${type} | ${transaction.description} | ${transaction.category} | ${amount}`;
      }),
      '',
      'Resumo por Categoria',
      ...categoryTotals.map((item) => `${item.category} | ${item.count} lanc. | Total ${currency.format(item.total)} | Media ${currency.format(item.avg)}`)
    ];

    const pageLines = 42;
    const pages: string[][] = [];
    for (let index = 0; index < lines.length; index += pageLines) {
      pages.push(lines.slice(index, index + pageLines));
    }
    if (pages.length === 0) pages.push(['Relatorio de Lancamentos', 'Nenhum lancamento encontrado.']);

    const objects: string[] = [];
    const addObject = (content: string) => {
      objects.push(content);
      return objects.length;
    };

    const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');
    const pagesId = addObject('');
    const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const pageIds: number[] = [];

    pages.forEach((page) => {
      const stream = [
        'BT',
        '/F1 10 Tf',
        '50 790 Td',
        '14 TL',
        ...page.map((line) => `(${escapePdfText(line)}) Tj T*`),
        'ET'
      ].join('\n');
      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    });

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    downloadBlob(pdf, 'application/pdf', `${reportFileSuffix}.pdf`);
  };

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
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              onClick={() => router.push('/app')}
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
          <div className="flex justify-end mb-6" style={{ paddingTop: '6px' }}>
            <button
              type="button"
              className="mb-btn"
              title="Configurar WhatsApp"
              onClick={openWhatsappModal}
              style={{
                background: 'linear-gradient(120deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.5))',
                borderColor: 'rgba(34, 197, 94, 0.8)',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
                padding: '10px 16px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
            </button>
          </div>
          <p className="mb-kicker">Histórico Financeiro</p>
          <h1 className="mb-title">Lançamentos</h1>
          <p className="mb-subtitle">Todos os seus lançamentos financeiros em um só lugar</p>
          <div className="mb-hero-art" aria-hidden="true" style={{ opacity: 0.24 }}>
            <svg viewBox="0 0 240 120" focusable="false">
              <path d="M36 104h168" />
              <path d="M58 96V24h86l28 28v44" />
              <path d="M144 24v30h28" />
              <path d="M74 46h44M74 62h64M74 78h48" />
              <path d="M132 94l18-20 18 10 26-34" />
              <path d="M132 64v30h64" />
              <circle cx="70" cy="95" r="14" />
              <path d="M70 86v18M63 91h10a5 5 0 0 1 0 10H62" />
              <circle cx="198" cy="36" r="12" />
              <path d="M198 28v16M191 36h14" />
            </svg>
          </div>
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
              <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
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
                <button
                  type="button"
                  className="mb-btn"
                  onClick={exportReportPdf}
                  style={{
                    background: 'linear-gradient(120deg, rgba(239, 68, 68, 0.55), rgba(147, 51, 234, 0.45))',
                    borderColor: 'rgba(248, 113, 113, 0.75)'
                  }}
                >
                  Exportar PDF
                </button>
                <button
                  type="button"
                  className="mb-btn"
                  onClick={exportReportExcel}
                  style={{
                    background: 'linear-gradient(120deg, rgba(34, 197, 94, 0.55), rgba(59, 130, 246, 0.45))',
                    borderColor: 'rgba(74, 222, 128, 0.75)'
                  }}
                >
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>

          <div className="mb-row-2" style={{ marginTop: '12px' }}>
            <div className="mb-field">
              <span style={{ color: '#c4b5fd' }}>Data</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="mb-input"
                style={{
                  borderColor: 'rgba(147, 51, 234, 0.4)',
                  background: 'rgba(17, 24, 39, 0.95)',
                  color: '#e9edff'
                }}
              >
                <option value="all">Todas as datas</option>
                <option value="year">Ano</option>
                <option value="month">Mês</option>
                <option value="day">Dia</option>
                <option value="period">Período</option>
              </select>
            </div>

            {dateFilter === 'year' && (
              <div className="mb-field">
                <span style={{ color: '#c4b5fd' }}>Ano</span>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(147, 51, 234, 0.4)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
            )}

            {dateFilter === 'month' && (
              <div className="mb-field">
                <span style={{ color: '#c4b5fd' }}>Mês</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(147, 51, 234, 0.4)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
            )}

            {dateFilter === 'day' && (
              <div className="mb-field">
                <span style={{ color: '#c4b5fd' }}>Dia</span>
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(147, 51, 234, 0.4)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
            )}

            {dateFilter === 'period' && (
              <div className="mb-row-2">
                <div className="mb-field">
                  <span style={{ color: '#c4b5fd' }}>Início</span>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="mb-input"
                    style={{
                      borderColor: 'rgba(147, 51, 234, 0.4)',
                      background: 'rgba(17, 24, 39, 0.95)',
                      color: '#e9edff'
                    }}
                  />
                </div>
                <div className="mb-field">
                  <span style={{ color: '#c4b5fd' }}>Fim</span>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="mb-input"
                    style={{
                      borderColor: 'rgba(147, 51, 234, 0.4)',
                      background: 'rgba(17, 24, 39, 0.95)',
                      color: '#e9edff'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {showSefaz && (
          <div className="mb-card" style={{
            background: 'radial-gradient(circle at 92% 12%, rgba(34, 197, 94, 0.2), transparent 38%), linear-gradient(140deg, rgba(5, 46, 22, 0.85), rgba(17, 24, 39, 0.95))',
            borderColor: 'rgba(34, 197, 94, 0.5)',
            marginTop: '12px'
          }}>
            <div className="mb-section-header">
              <h3 style={{ color: '#86efac' }}>Notas Fiscais (Notas MT)</h3>
            </div>

            <div style={{ color: '#bbf7d0', fontSize: '0.82rem', marginTop: '-4px' }}>
              {sefazConnected ? 'Conectado' : 'Não conectado'}
              {sefazLastValidatedAt ? ` · validado em ${shortDate.format(new Date(sefazLastValidatedAt))}` : ''}
            </div>

            <div className="mb-row-2" style={{ alignItems: 'end' }}>
              <div className="mb-field">
                <span style={{ color: '#bbf7d0' }}>CPF</span>
                <input
                  type="text"
                  placeholder="apenas números"
                  value={sefazCpf}
                  onChange={(e) => setSefazCpf(e.target.value)}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(34, 197, 94, 0.35)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
              <div className="mb-field">
                <span style={{ color: '#bbf7d0' }}>Senha</span>
                <input
                  type="password"
                  value={sefazSenha}
                  onChange={(e) => setSefazSenha(e.target.value)}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(34, 197, 94, 0.35)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
            </div>

            <div className="mb-row-2" style={{ marginTop: '10px', alignItems: 'end' }}>
              <div className="mb-field">
                <span style={{ color: '#bbf7d0' }}>Mês</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={sefazMonth}
                  onChange={(e) => setSefazMonth(parseInt(e.target.value || '1', 10))}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(34, 197, 94, 0.35)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
              <div className="mb-field">
                <span style={{ color: '#bbf7d0' }}>Ano</span>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={sefazYear}
                  onChange={(e) => setSefazYear(parseInt(e.target.value || String(new Date().getFullYear()), 10))}
                  className="mb-input"
                  style={{
                    borderColor: 'rgba(34, 197, 94, 0.35)',
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#e9edff'
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2" style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="mb-btn"
                onClick={connectNotasMt}
                disabled={sefazConnecting}
                style={{
                  background: sefazConnecting
                    ? 'linear-gradient(120deg, rgba(100, 100, 100, 0.6), rgba(80, 80, 80, 0.5))'
                    : 'linear-gradient(120deg, rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.5))',
                  borderColor: sefazConnecting ? 'rgba(100, 100, 100, 0.8)' : 'rgba(147, 51, 234, 0.9)',
                  opacity: sefazConnecting ? 0.75 : 1
                }}
              >
                Conectar
              </button>
              <button
                type="button"
                className="mb-btn"
                onClick={fetchNotasFiscais}
                disabled={importingNotas}
                style={{
                  background: importingNotas
                    ? 'linear-gradient(120deg, rgba(100, 100, 100, 0.6), rgba(80, 80, 80, 0.5))'
                    : 'linear-gradient(120deg, rgba(34, 197, 94, 0.6), rgba(16, 185, 129, 0.5))',
                  borderColor: importingNotas ? 'rgba(100, 100, 100, 0.8)' : 'rgba(34, 197, 94, 0.8)',
                  opacity: importingNotas ? 0.75 : 1
                }}
              >
                Buscar notas
              </button>
              <button
                type="button"
                className="mb-btn"
                onClick={() => selectAllNotas(true)}
                disabled={notas.length === 0 || savingNotas}
                style={{
                  background: 'linear-gradient(120deg, rgba(52, 129, 255, 0.3), rgba(15, 198, 217, 0.2))',
                  borderColor: 'rgba(107, 219, 255, 0.5)'
                }}
              >
                Selecionar todas
              </button>
              <button
                type="button"
                className="mb-btn"
                onClick={() => selectAllNotas(false)}
                disabled={notas.length === 0 || savingNotas}
                style={{
                  background: 'linear-gradient(120deg, rgba(52, 129, 255, 0.3), rgba(15, 198, 217, 0.2))',
                  borderColor: 'rgba(107, 219, 255, 0.5)'
                }}
              >
                Limpar seleção
              </button>
              <button
                type="button"
                className="mb-btn"
                onClick={saveSelectedNotas}
                disabled={notas.length === 0 || savingNotas}
                style={{
                  background: savingNotas
                    ? 'linear-gradient(120deg, rgba(100, 100, 100, 0.6), rgba(80, 80, 80, 0.5))'
                    : 'linear-gradient(120deg, rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.5))',
                  borderColor: savingNotas ? 'rgba(100, 100, 100, 0.8)' : 'rgba(147, 51, 234, 0.9)',
                  opacity: savingNotas ? 0.75 : 1
                }}
              >
                Adicionar aos lançamentos
              </button>
            </div>

            {notasError && (
              <div style={{ marginTop: '10px', color: '#fca5a5', fontSize: '0.85rem' }}>
                {notasError}
              </div>
            )}

            {notas.length > 0 && (
              <div className="mb-list" style={{ marginTop: '12px' }}>
                {notas.map((nota) => {
                  const key = buildNotaKey(nota);
                  const checked = !!selectedNotas[key];
                  return (
                    <div key={key} className="mb-expense-item" style={{
                      background: 'radial-gradient(circle at 88% 12%, rgba(34, 197, 94, 0.08), transparent 40%), rgba(15, 23, 42, 0.88)',
                      borderColor: 'rgba(34, 197, 94, 0.3)'
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectNota(nota)}
                          style={{ marginTop: '4px' }}
                        />
                        <div>
                          <p style={{ color: '#e2e8f0' }}>
                            {(nota.empresa || nota.cnpj || 'Nota Fiscal')}{nota.numero ? ` · NF ${nota.numero}` : ''}
                          </p>
                          <div className="mb-expense-meta">
                            <span className="mb-badge" style={{
                              color: '#86efac',
                              background: 'rgba(34, 197, 94, 0.15)',
                              borderColor: 'rgba(34, 197, 94, 0.4)'
                            }}>
                              {nota.valor || '—'}
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                              {nota.data || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
                paginatedTransactions.map((transaction) => (
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
                        onClick={() => openEditTransaction(transaction)}
                        className="mb-remove"
                        style={{ color: '#93c5fd' }}
                        title="Editar"
                      >
                        ✎
                      </button>
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
            {filteredTransactions.length > 0 && (
              <div
                className="mb-expense-item"
                style={{
                  marginTop: '12px',
                  background: 'rgba(15, 23, 42, 0.72)',
                  borderColor: 'rgba(59, 130, 246, 0.28)',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  Mostrando {pageStartIndex + 1}-{pageEndIndex} de {filteredTransactions.length}
                </div>
                <div className="mb-expense-meta" style={{ marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <select
                    value={itemsPerPage}
                    onChange={(event) => setItemsPerPage(Number(event.target.value))}
                    className="mb-input"
                    style={{
                      width: 'auto',
                      minWidth: '120px',
                      borderColor: 'rgba(59, 130, 246, 0.35)',
                      background: 'rgba(17, 24, 39, 0.95)',
                      color: '#e9edff'
                    }}
                  >
                    <option value={5}>5 por página</option>
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                  </select>
                  <button
                    type="button"
                    className="mb-btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                    style={{ opacity: safeCurrentPage === 1 ? 0.5 : 1 }}
                  >
                    Anterior
                  </button>
                  <span style={{ color: '#bfdbfe', fontSize: '0.78rem' }}>
                    Página {safeCurrentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="mb-btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                    style={{ opacity: safeCurrentPage === totalPages ? 0.5 : 1 }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
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

      {showWhatsappModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
          onClick={() => setShowWhatsappModal(false)}
        >
          <div
            className="mb-card"
            style={{ width: '100%', maxWidth: '560px' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-section-header">
              <h3 style={{ color: '#86efac' }}>Configurar WhatsApp</h3>
              <button className="mb-btn" onClick={() => setShowWhatsappModal(false)}>Fechar</button>
            </div>

            <div className="mb-field" style={{ marginTop: '8px' }}>
              <span style={{ color: '#bbf7d0' }}>Telefone (com DDI)</span>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="mb-input"
                placeholder="Ex: 5565999999999"
                style={{
                  borderColor: 'rgba(34, 197, 94, 0.35)',
                  background: 'rgba(17, 24, 39, 0.95)',
                  color: '#e9edff'
                }}
              />
            </div>

            <button
              type="button"
              className="mb-btn"
              onClick={addWhatsappMapping}
              disabled={whatsappSaving}
              style={{ marginTop: '10px' }}
            >
              {whatsappSaving ? 'Salvando...' : 'Adicionar número'}
            </button>

            {whatsappError && (
              <div style={{ marginTop: '10px', color: '#fca5a5', fontSize: '0.85rem' }}>
                {whatsappError}
              </div>
            )}

            <div className="mb-list" style={{ marginTop: '12px' }}>
              {whatsappLoading && <div className="mb-empty">Carregando números...</div>}
              {!whatsappLoading && whatsappMappings.length === 0 && (
                <div className="mb-empty" style={{ color: '#94a3b8' }}>Nenhum número cadastrado.</div>
              )}
              {!whatsappLoading && whatsappMappings.map((item) => (
                <div
                  key={item.id}
                  className="mb-expense-item"
                  style={{
                    background: 'radial-gradient(circle at 88% 12%, rgba(34, 197, 94, 0.08), transparent 40%), rgba(15, 23, 42, 0.88)',
                    borderColor: 'rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <div>
                    <p style={{ color: '#e2e8f0' }}>{item.phone}</p>
                  </div>
                  <button
                    className="mb-remove"
                    style={{ color: '#f87171' }}
                    onClick={() => removeWhatsappMapping(item.id)}
                    title="Remover"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTransaction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '16px'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="mb-card"
            style={{ width: '100%', maxWidth: '560px' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-section-header">
              <h3 style={{ color: '#93c5fd' }}>Editar lançamento</h3>
              <button className="mb-btn" onClick={() => setShowEditModal(false)}>Fechar</button>
            </div>

            <div className="mb-field" style={{ marginTop: '8px' }}>
              <span style={{ color: '#bfdbfe' }}>Descrição</span>
              <input
                type="text"
                value={editingTransaction.description}
                onChange={(e) => setEditingTransaction((current) => current ? { ...current, description: e.target.value } : current)}
                className="mb-input"
              />
            </div>

            <div className="mb-field" style={{ marginTop: '8px' }}>
              <span style={{ color: '#bfdbfe' }}>Categoria</span>
              <input
                type="text"
                value={editingTransaction.category}
                onChange={(e) => setEditingTransaction((current) => current ? { ...current, category: e.target.value } : current)}
                className="mb-input"
              />
            </div>

            <div className="mb-row-2" style={{ marginTop: '8px' }}>
              <div className="mb-field">
                <span style={{ color: '#bfdbfe' }}>Valor</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction((current) => current ? { ...current, amount: Number(e.target.value || 0) } : current)}
                  className="mb-input"
                />
              </div>
              <div className="mb-field">
                <span style={{ color: '#bfdbfe' }}>Tipo</span>
                <select
                  value={editingTransaction.kind}
                  onChange={(e) =>
                    setEditingTransaction((current) =>
                      current
                        ? { ...current, kind: e.target.value as 'income' | 'expense' }
                        : current
                    )
                  }
                  className="mb-input"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
            </div>

            <div className="mb-field" style={{ marginTop: '8px' }}>
              <span style={{ color: '#bfdbfe' }}>Data</span>
              <input
                type="date"
                value={editingTransaction.date}
                onChange={(e) => setEditingTransaction((current) => current ? { ...current, date: e.target.value } : current)}
                className="mb-input"
              />
            </div>

            {editError && (
              <div style={{ marginTop: '10px', color: '#fca5a5', fontSize: '0.85rem' }}>
                {editError}
              </div>
            )}

            <div className="flex gap-2" style={{ marginTop: '12px' }}>
              <button className="mb-btn" onClick={() => setShowEditModal(false)}>
                Cancelar
              </button>
              <button className="mb-btn" onClick={saveEditedTransaction} disabled={editSaving}>
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
