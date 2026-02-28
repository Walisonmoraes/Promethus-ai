"use client";

import styles from "./page.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ModoBabiloniaView } from "@/features/modo-babilonia/ModoBabiloniaView";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string | { type: 'audio'; audioUrl: string; duration: number; waveform: number[] };
  timestamp: string;
  actions?: {
    label: string;
    action:
      | "save"
      | "save-goal"
      | "init-goal-deposit"
      | "edit"
      | "edit-goal"
      | "cancel"
      | "cancel-goal";
    expenseId?: string;
    goalId?: string;
  }[];
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  kind: "expense" | "income";
  createdAt: number;
};

type AgendaItem = {
  id: string;
  title: string;
  due: string;
  amount: number;
};

type GoalItem = {
  id: string;
  title: string;
  category: string;
  target: number;
  progress: number;
};

type GoalDraft = {
  id: string;
  title: string;
  category: string;
  target: number;
  progress: number;
};

const GOAL_CATEGORIES = [
  "Reserva de emergencia",
  "Viagem",
  "Educacao",
  "Casa",
  "Carro",
  "Saude",
  "Investimento",
  "Outros",
];

type ModalType = "agenda" | "meta" | "historico" | "edit-agenda" | "edit-meta" | "edit-historico" | "modo-babilonia";

type ChipId = "resumo" | "categorias";

type NavId =
  | "visao"
  | "lancamentos"
  | "metas"
  | "cartoes"
  | "relatorios"
  | "categorias"
  | "modo-babilonia";

type NavItem = {
  id: NavId;
  label: string;
  detail: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
  ["Alimentacao", ["restaurante", "lanche", "ifood", "comida", "mercado", "padaria"]],
  ["Transporte", ["uber", "taxi", "onibus", "metro", "combustivel", "gasolina"]],
  ["Moradia", ["aluguel", "condominio", "luz", "energia", "agua", "internet"]],
  ["Saude", ["farmacia", "medico", "consulta", "academia"]],
  ["Lazer", ["cinema", "viagem", "show", "jogo", "bar", "cafe"]],
  ["Compras", ["roupa", "loja", "shopping", "eletronico", "presente"]],
  ["Metas", ["meta", "aporte"]],
  ["Receita", ["salario", "freela", "bonus", "pix", "recebi", "ganhei"]],
];

const CHAT_SHORTCUTS: Array<{
  label: string;
  text: string;
  icon: React.ReactNode;
  chipId?: ChipId;
}> = [
  {
    label: "Categorias inteligentes",
    text: "paguei 180 no mercado",
    chipId: "categorias",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="shortcut-icon"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
      >
        <path d="M3 12l7-7h7l4 4v7l-7 7-11-11z" />
        <path d="M16 8h.01" />
      </svg>
    ),
  },
  {
    label: "Criar meta",
    text: "quero guardar 500 por mes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="shortcut-icon"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2" />
      </svg>
    ),
  },
  {
    label: "Controle de gastos",
    text: "quero reduzir meus gastos",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="shortcut-icon"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
      >
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M21 8v8h-8" />
      </svg>
    ),
  },
  {
    label: "Ultimos lancamentos",
    text: "ultimos lancamentos",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="shortcut-icon"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
      >
        <rect x="5" y="4" width="14" height="16" rx="3" />
        <path d="M8 9h8" />
        <path d="M8 13h8" />
      </svg>
    ),
  },
  {
    label: "Dica rapida",
    text: "me de uma dica para economizar",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="shortcut-icon"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
      >
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a7 7 0 0 0-4 12c1 1 1 2 1 2h6s0-1 1-2a7 7 0 0 0-4-12z" />
      </svg>
    ),
  },
];

const CHAT_SHORTCUT_POOL: Array<Array<typeof CHAT_SHORTCUTS[number]>> = [
  [
    {
      label: "Começar simples",
      text: "gastei 50 no almoço hoje",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Receita salário",
      text: "recebi 3500 de salario",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Ver resumo",
      text: "resumo do mes",
      chipId: "resumo",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M4 19h16" />
          <path d="M6 17V9" />
          <path d="M12 17V5" />
          <path d="M18 17v-7" />
        </svg>
      ),
    },
    {
      label: "Criar meta",
      text: "quero guardar 500 por mes",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2" />
        </svg>
      ),
    },
    {
      label: "Economizar",
      text: "me de uma dica para economizar",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a7 7 0 0 0-4 12c1 1 1 2 1 2h6s0-1 1-2a7 7 0 0 0-4-12z" />
        </svg>
      ),
    },
  ],
  [
    {
      label: "Despesa mercado",
      text: "paguei 200 no mercado",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Conta luz",
      text: "paguei 150 de conta de luz",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Transporte",
      text: "gastei 80 no uber",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Receita extra",
      text: "recebi 500 de freela",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Planejar mes",
      text: "me ajude a planejar as despesas do mes",
      chipId: "categorias",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M3 12l7-7h7l4 4v7l-7 7-11-11z" />
          <path d="M16 8h.01" />
        </svg>
      ),
    },
  ],
  [
    {
      label: "Meta viagem",
      text: "quero guardar 2000 para viajar",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2" />
        </svg>
      ),
    },
    {
      label: "Reserva emergência",
      text: "quero criar reserva de emergencia",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 3v18" />
          <path d="M7 7h10" />
          <path d="M7 17h10" />
        </svg>
      ),
    },
    {
      label: "Cortar gastos",
      text: "me mostre onde posso economizar",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M21 8v8h-8" />
        </svg>
      ),
    },
    {
      label: "Investimento",
      text: "quero começar a investir",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H17" />
        </svg>
      ),
    },
    {
      label: "Cartão crédito",
      text: "quero analisar minha fatura do cartao",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
  ],
];

const NAV_ITEMS: NavItem[] = [
  { id: "visao", label: "Visao geral", detail: "Status da sua semana" },
  { id: "lancamentos", label: "Lancamentos", detail: "Tudo que entrou e saiu" },
  { id: "metas", label: "Metas", detail: "Acompanhe limites" },
  { id: "cartoes", label: "Cartoes", detail: "Faturas e limites" },
  { id: "relatorios", label: "Relatorios", detail: "Insights e tendencias" },
  { id: "categorias", label: "Categorias", detail: "Edite classificacoes" },
];

const START_MESSAGES_TEXTS: string[] = [];

const QUICK_EXAMPLES_SETS: string[][] = [
  [
    "gastei 32 no Uber ontem a noite",
    "paguei 189 no mercado no debito",
    "recebi 4200 de salario hoje",
    "gastei 68 no cinema com lanche",
    "recebi 350 de freela por PIX",
  ],
  [
    "paguei 240 de energia eletrica",
    "gastei 97 na farmacia",
    "recebi 180 de cashback do cartao",
    "paguei 129 de internet fibra",
    "recebi 950 de bonus do trabalho",
  ],
  [
    "gastei 45 no almoco do trabalho",
    "paguei 320 de combustivel",
    "recebi 250 de venda de produto",
    "gastei 79 em streaming e apps",
    "recebi 120 de reembolso",
  ],
  [
    "paguei 150 de academia mensal",
    "gastei 220 em compras de casa",
    "recebi 3000 de adiantamento",
    "paguei 540 da parcela do cartao",
    "recebi 430 de renda extra",
  ],
  [
    "gastei 114 no ifood no fim de semana",
    "paguei 82 de transporte publico",
    "recebi 270 de juros de investimento",
    "gastei 140 em roupas",
    "recebi 1500 de cliente PJ",
  ],
];

function getGoalCategory(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("viagem") || lower.includes("viajar")) return "Viagem";
  if (lower.includes("reserva") || lower.includes("emergencia")) return "Reserva de emergencia";
  if (lower.includes("curso") || lower.includes("faculdade") || lower.includes("educacao"))
    return "Educacao";
  if (lower.includes("casa") || lower.includes("imovel") || lower.includes("apartamento"))
    return "Casa";
  if (lower.includes("carro") || lower.includes("veiculo")) return "Carro";
  if (lower.includes("saude") || lower.includes("medico") || lower.includes("consulta"))
    return "Saude";
  if (lower.includes("investir") || lower.includes("investimento")) return "Investimento";
  return "Outros";
}

function getCategoryColor(category: string) {
  const key = category.toLowerCase();
  if (key.includes("viagem")) return "rgba(124, 92, 255, 0.9)";
  if (key.includes("reserva")) return "rgba(57, 208, 255, 0.9)";
  if (key.includes("educacao")) return "rgba(255, 199, 102, 0.95)";
  if (key.includes("casa")) return "rgba(255, 106, 213, 0.9)";
  if (key.includes("carro")) return "rgba(111, 255, 214, 0.9)";
  if (key.includes("saude")) return "rgba(140, 255, 120, 0.9)";
  if (key.includes("investimento")) return "rgba(196, 255, 120, 0.9)";
  return "rgba(210, 210, 255, 0.85)";
}

function parseExpense(input: string): Expense | null {
  const lower = input.toLowerCase();
  const amountMatch = lower.match(/(\d+[\.,]?\d*)/);
  if (!amountMatch) return null;

  const rawAmount = amountMatch[1].replace(".", "").replace(",", ".");
  const amount = Number.parseFloat(rawAmount);
  if (Number.isNaN(amount)) return null;

  const category = CATEGORY_KEYWORDS.find(([, keywords]) =>
    keywords.some((word) => lower.includes(word))
  )?.[0];

  const isIncome = category === "Receita";
  const descriptionMatch = lower.match(/(?:no|na|em|para)\s+(.+)/);
  const description = descriptionMatch ? descriptionMatch[1] : "Lancamento rapido";

  return {
    id: `${Date.now()}-${Math.random()}`,
    amount,
    category: category ?? "Outros",
    description: description.trim(),
    date: shortDate.format(new Date()),
    kind: isIncome ? "income" : "expense",
    createdAt: Date.now(),
  };
}

function buildAssistantReply(expense: Expense): string {
  const typeLabel = expense.kind === "income" ? "Receita" : "Despesa";
  const endings = [
    "Seguimos com mais clareza.",
    "Passo registrado, seguimos firmes.",
    "Mais um passo para o controle.",
    "Boa decisao em manter visibilidade.",
  ];
  const extra = endings[Math.floor(Math.random() * endings.length)];
  return `${typeLabel} lancada: ${currency.format(expense.amount)} em ${expense.category}. ${extra}`;
}

function buildImpactNote(
  expense: Expense,
  totals: {
    income: number;
    spent: number;
    balance: number;
  },
  goals: GoalItem[]
) {
  const delta = expense.kind === "income" ? expense.amount : -expense.amount;
  const nextBalance = totals.balance + delta;
  const balanceLine = `Saldo apos o lancamento: ${currency.format(nextBalance)}.`;

  if (goals.length === 0) {
    return `${balanceLine} Sem metas ativas no momento.`;
  }

  const focus = goals[0];
  const saved = Math.round((focus.progress / 100) * focus.target);
  const remaining = Math.max(focus.target - saved, 0);
  const goalLine = `Meta em foco: ${focus.title} com ${focus.progress}% concluida. Faltam ${currency.format(
    remaining
  )}.`;
  return `${balanceLine} ${goalLine}`;
}

function buildGoalPlan(goal: GoalItem) {
  const months = 6;
  const monthly = Math.ceil(goal.target / months);
  const text = [
    `## Plano automatico para ${goal.title}`,
    `Meta total ${currency.format(goal.target)} em ${months} meses.`,
    "",
    `1. Separe ${currency.format(monthly)} por mes como prioridade fixa.`,
    "2. Direcione ganhos extras para acelerar a meta.",
    "3. Revise gastos variaveis toda semana e realoque o excedente.",
    "",
    "[DICA] Comece com um valor simples e aumente se sobrar.",
    "[PASSO] Quer que eu registre um aporte inicial agora?",
  ].join("\n");
  return {
    text,
    actions: [{ label: "Proximo passo", action: "init-goal-deposit" as const, goalId: goal.id }],
  };
}

function detectLeaks(expenses: Expense[]) {
  const now = Date.now();
  const windowDays = 30 * 24 * 60 * 60 * 1000;
  const recent = expenses.filter((entry) => now - entry.createdAt <= windowDays);
  const byCategory = new Map<string, { count: number; total: number }>();
  recent
    .filter((entry) => entry.kind === "expense")
    .forEach((entry) => {
      const current = byCategory.get(entry.category) ?? { count: 0, total: 0 };
      byCategory.set(entry.category, {
        count: current.count + 1,
        total: current.total + entry.amount,
      });
    });

  const suspects = Array.from(byCategory.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      avg: data.count ? data.total / data.count : 0,
    }))
    .filter((item) => item.count >= 4 && item.avg <= 60)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return suspects;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`b-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`t-${index}`}>{part}</span>;
  });
}

function renderFormatted(text: string | { type: 'audio'; audioUrl: string; duration: number; waveform: number[] }) {
  if (typeof text !== 'string') {
    return null;
  }
  
  const lines = text.split("\n");
  const blocks: Array<
    | { type: "p"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "h2"; text: string }
    | { type: "callout"; tone: "dica" | "risco" | "passo"; text: string }
    | { type: "quote"; text: string }
    | { type: "checklist"; items: Array<{ text: string; checked: boolean }> }
    | { type: "table"; header: string[]; rows: string[][] }
  > = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentChecklist: Array<{ text: string; checked: boolean }> | null = null;
  let tableBuffer: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length) {
      blocks.push({ type: "p", text: currentParagraph.join(" ") });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  const flushChecklist = () => {
    if (currentChecklist) {
      blocks.push({ type: "checklist", items: currentChecklist });
      currentChecklist = null;
    }
  };

  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      const header = tableBuffer[0]
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      const rows = tableBuffer.slice(1).map((line) =>
        line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
      );
      blocks.push({ type: "table", header, rows });
    }
    tableBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const h2Match = line.match(/^##\s+(.*)/);
    const calloutMatch = line.match(/^\[(DICA|RISCO|PASSO)\]\s+(.*)/i);
    const quoteMatch = line.match(/^>\s+(.*)/);
    const checklistMatch = line.match(/^- \[( |x|X)\]\s+(.*)/);
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    const ulMatch = line.match(/^[-•]\s+(.*)/);
    const tableMatch = line.includes("|");

    if (h2Match) {
      flushParagraph();
      flushList();
      flushChecklist();
      flushTable();
      blocks.push({ type: "h2", text: h2Match[1] });
      continue;
    }

    if (calloutMatch) {
      flushParagraph();
      flushList();
      flushChecklist();
      flushTable();
      const tone =
        calloutMatch[1].toLowerCase() === "risco"
          ? "risco"
          : calloutMatch[1].toLowerCase() === "passo"
          ? "passo"
          : "dica";
      blocks.push({ type: "callout", tone, text: calloutMatch[2] });
      continue;
    }

    if (quoteMatch) {
      flushParagraph();
      flushList();
      flushChecklist();
      flushTable();
      blocks.push({ type: "quote", text: quoteMatch[1] });
      continue;
    }

    if (checklistMatch) {
      flushParagraph();
      flushList();
      flushTable();
      if (!currentChecklist) currentChecklist = [];
      currentChecklist.push({
        text: checklistMatch[2],
        checked: checklistMatch[1].toLowerCase() === "x",
      });
      continue;
    }

    if (tableMatch) {
      flushParagraph();
      flushList();
      flushChecklist();
      tableBuffer.push(line);
      continue;
    }

    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        flushChecklist();
        flushTable();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        flushChecklist();
        flushTable();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    flushList();
    flushChecklist();
    flushTable();
    currentParagraph.push(line);
  }

  flushParagraph();
  flushList();
  flushChecklist();
  flushTable();

  return (
    <div className="message-content">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return <p key={`p-${index}`}>{renderInline(block.text)}</p>;
        }
        if (block.type === "h2") {
          return <h4 key={`h-${index}`}>{renderInline(block.text)}</h4>;
        }
        if (block.type === "callout") {
          return (
            <div key={`c-${index}`} className={`callout callout-${block.tone}`}>
              <strong>{block.tone === "dica" ? "Dica" : block.tone === "risco" ? "Risco" : "Proximo passo"}</strong>
              <span>{renderInline(block.text)}</span>
            </div>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={`q-${index}`} className="message-quote">
              {renderInline(block.text)}
            </blockquote>
          );
        }
        if (block.type === "checklist") {
          return (
            <ul key={`cl-${index}`} className="message-checklist">
              {block.items.map((item, itemIndex) => (
                <li key={`cl-${index}-${itemIndex}`}>
                  <span className={`check ${item.checked ? "checked" : ""}`}>
                    {item.checked ? "✓" : ""}
                  </span>
                  {renderInline(item.text)}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          return (
            <div key={`tb-${index}`} className="message-table">
              <div className="message-table-row header">
                {block.header.map((cell, cellIndex) => (
                  <span key={`th-${index}-${cellIndex}`}>{renderInline(cell)}</span>
                ))}
              </div>
              {block.rows.map((row, rowIndex) => (
                <div key={`tr-${index}-${rowIndex}`} className="message-table-row">
                  {row.map((cell, cellIndex) => (
                    <span key={`td-${index}-${rowIndex}-${cellIndex}`}>
                      {renderInline(cell)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={`ul-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`ul-${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={`ol-${index}`}>
            {block.items.map((item, itemIndex) => (
              <li key={`ol-${index}-${itemIndex}`}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

export default function Home() {  const [messages, setMessages] = useState<Message[]>([]);
  const [hasRotatedIntro, setHasRotatedIntro] = useState(false);
  const [shortcutSet, setShortcutSet] = useState(() => CHAT_SHORTCUT_POOL[0]);
  const [quickExamples, setQuickExamples] = useState<string[]>(() => QUICK_EXAMPLES_SETS[0]);
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      amount: 240,
      category: "Moradia",
      description: "paguei 240 de energia eletrica",
      date: shortDate.format(new Date()),
      kind: "expense",
      createdAt: Date.now() - 86400000,
    },
    {
      id: "2", 
      amount: 97,
      category: "Saude",
      description: "gastei 97 na farmacia",
      date: shortDate.format(new Date()),
      kind: "expense",
      createdAt: Date.now() - 172800000,
    },
    {
      id: "3",
      amount: 180,
      category: "Receita", 
      description: "recebi 180 de cashback do cartao",
      date: shortDate.format(new Date()),
      kind: "income",
      createdAt: Date.now() - 259200000,
    },
    {
      id: "4",
      amount: 129,
      category: "Moradia",
      description: "paguei 129 de internet fibra",
      date: shortDate.format(new Date()),
      kind: "expense", 
      createdAt: Date.now() - 345600000,
    },
    {
      id: "5",
      amount: 950,
      category: "Receita",
      description: "recebi 950 de bonus do trabalho",
      date: shortDate.format(new Date()),
      kind: "income",
      createdAt: Date.now() - 432000000,
    },
  ]);
  const [pendingExpense, setPendingExpense] = useState<Expense | null>(null);
  const [pendingGoal, setPendingGoal] = useState<GoalDraft | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messageSeq = useRef(0);
  const [input, setInput] = useState("");
  const [activeChip, setActiveChip] = useState<ChipId | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [audioData, setAudioData] = useState<number[]>(new Array(18).fill(8));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startAudioCapture = async () => {
    try {
      // Limpar contexto anterior se existir
      if (audioContextRef.current) {
        const context = audioContextRef.current;
        if (context.state !== 'closed') {
          try {
            await context.close();
          } catch (e) {
            // Ignora erro ao fechar
          }
        }
        audioContextRef.current = null;
      }
      
      if (analyserRef.current) {
        analyserRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 32;
      
      const updateAudioData = () => {
        if (analyserRef.current && isRecording && audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const normalizedData = Array.from(dataArray).map(value => {
              const normalized = (value / 255) * 24 + 4; // 4px a 28px
              return Math.max(4, Math.min(28, normalized));
            });
            setAudioData(normalizedData.slice(0, 18));
            animationRef.current = requestAnimationFrame(updateAudioData);
          } catch (e) {
            // Para animação se houver erro
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
              animationRef.current = null;
            }
          }
        }
      };
      
      updateAudioData();
    } catch (error) {
      console.error('Erro ao capturar áudio:', error);
    }
  };

  const stopAudioCapture = () => {
    try {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioContextRef.current) {
        const context = audioContextRef.current;
        if (context.state !== 'closed') {
          context.close().catch(() => {
            // Ignora erro de close, só limpa a referência
          });
        }
        audioContextRef.current = null;
      }
      setAudioData(new Array(18).fill(8));
    } catch (error) {
      // Ignora qualquer erro na limpeza
      console.log('Cleanup completed');
    }
  };

  useEffect(() => {
    if (isRecording) {
      startAudioCapture();
    } else {
      stopAudioCapture();
    }
    return () => stopAudioCapture();
  }, [isRecording]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardMax, setDashboardMax] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"geral" | "metas">("geral");
  const [showResumo, setShowResumo] = useState(false);
  const [showMonthClose, setShowMonthClose] = useState(false);
  const [activeNav, setActiveNav] = useState<NavId>("visao");
  const [goalMode, setGoalMode] = useState(false);
  const [chatMax, setChatMax] = useState(false);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: "ag-1", title: "Cartao Nubank", due: "Vence em 6 dias", amount: 1240 },
    { id: "ag-2", title: "Aluguel", due: "Vence em 10 dias", amount: 1800 },
    { id: "ag-3", title: "Internet", due: "Vence em 12 dias", amount: 110 },
  ]);
  const [goalItems, setGoalItems] = useState<GoalItem[]>([
    { id: "g-1", title: "Viagem", category: "Viagem", target: 6000, progress: 42 },
    { id: "g-2", title: "Reserva de emergencia", category: "Reserva de emergencia", target: 12000, progress: 38 },
    { id: "g-3", title: "Casa", category: "Outros", target: 25000, progress: 22 },
  ]);
  const [newAgenda, setNewAgenda] = useState({ title: "", due: "", amount: "" });
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "",
    target: "",
    progress: "",
  });
  const [newHistory, setNewHistory] = useState({
    description: "",
    category: "",
    amount: "",
    kind: "expense" as "expense" | "income",
  });
  const [modal, setModal] = useState<null | { type: ModalType; id?: string }>(null);
  const [babiloniaMax, setBabiloniaMax] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hasRotatedIntro || START_MESSAGES_TEXTS.length === 0) return;
    const text =
      START_MESSAGES_TEXTS[
        Math.floor(Math.random() * START_MESSAGES_TEXTS.length)
      ];
    setMessages((current) =>
      current.map((message) =>
        message.id === "intro" ? { ...message, text } : message
      )
    );
    setHasRotatedIntro(true);
  }, [hasRotatedIntro]);

  useEffect(() => {
    setShortcutSet(
      CHAT_SHORTCUT_POOL[Math.floor(Math.random() * CHAT_SHORTCUT_POOL.length)]
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "prometheus-quick-examples-rotation";
    const current = Number(window.localStorage.getItem(key) ?? "0");
    const next = Number.isFinite(current) ? current + 1 : 1;
    window.localStorage.setItem(key, String(next));
    const setIndex = next % QUICK_EXAMPLES_SETS.length;
    setQuickExamples(QUICK_EXAMPLES_SETS[setIndex]);
  }, []);

  const monthCloseKey = useMemo(() => {
    const now = new Date();
    return `month-close-${now.getFullYear()}-${now.getMonth() + 1}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = window.localStorage.getItem(monthCloseKey);
    if (!hasSeen) {
      setShowMonthClose(true);
    }
  }, [monthCloseKey]);

  useEffect(() => {
    const node = chatWindowRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const totals = useMemo(() => {
    const income = expenses
      .filter((expense) => expense.kind === "income")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const spent = expenses
      .filter((expense) => expense.kind === "expense")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.filter((expense) => expense.kind === "expense").length;
    const incomeCount = expenses.filter((expense) => expense.kind === "income").length;
    return {
      income,
      spent,
      balance: income - spent,
      expenseCount,
      incomeCount,
    };
  }, [expenses]);

  const avgExpense = totals.expenseCount ? totals.spent / totals.expenseCount : 0;
  const totalCount = totals.expenseCount + totals.incomeCount;
  const avgGoal =
    goalItems.length > 0
      ? Math.round(goalItems.reduce((sum, item) => sum + item.progress, 0) / goalItems.length)
      : 0;
  const goalsTargetTotal = goalItems.reduce((sum, item) => sum + item.target, 0);
  const goalsRisk = goalItems.filter((item) => item.progress < 40);
  const goalsHealthy = goalItems.filter((item) => item.progress >= 70);
  const goalProgressSeries = goalItems.map((item) => ({
    label: item.title,
    progresso: item.progress,
  }));
  const goalCategorySeries = useMemo(() => {
    const map = new Map<string, number>();
    goalItems.forEach((item) => {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([categoria, total]) => ({
      categoria,
      total,
    }));
  }, [goalItems]);
  const goalProgressByCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    goalItems.forEach((item) => {
      const current = map.get(item.category) ?? { total: 0, count: 0 };
      map.set(item.category, {
        total: current.total + item.progress,
        count: current.count + 1,
      });
    });
    return Array.from(map.entries()).map(([categoria, data]) => ({
      categoria,
      progresso: data.count ? Math.round(data.total / data.count) : 0,
    }));
  }, [goalItems]);

  const leakSummary = useMemo(() => detectLeaks(expenses), [expenses]);

  const dailySeries = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        key: dayLabel.format(date),
        value: 0,
      };
    });
    const map = new Map(days.map((item) => [item.key, 0]));
    expenses
      .filter((expense) => expense.kind === "expense")
      .forEach((expense) => {
        const date = new Date(expense.createdAt ?? Date.now());
        const key = dayLabel.format(date);
        if (map.has(key)) {
          map.set(key, (map.get(key) ?? 0) + expense.amount);
        }
      });
    const maxValue = Math.max(...Array.from(map.values()), 1);
    return days.map((item) => ({
      label: item.key,
      value: map.get(item.key) ?? 0,
      height: (map.get(item.key) ?? 0) / maxValue,
    }));
  }, [expenses]);

  const behaviorInsights = useMemo(() => {
    if (dailySeries.length === 0) {
      return { peakLabel: "Sem dados", peakValue: 0, suggestion: "Lance despesas para ver seus picos." };
    }
    const peak = dailySeries.reduce(
      (best, item) => (item.value > best.value ? item : best),
      dailySeries[0]
    );
    const suggestion =
      peak.value > 0
        ? `Pico em ${peak.label}. Tente ajustar gastos nesse dia e definir um teto semanal.`
        : "Sem picos relevantes na semana.";
    return { peakLabel: peak.label, peakValue: peak.value, suggestion };
  }, [dailySeries]);

  const dailyChartConfig = {
    value: { label: "Gastos", color: "rgba(124,92,255,0.9)" },
  };
  const weeklyLineConfig = {
    Gastos: { label: "Gastos", color: "rgba(124,92,255,0.9)" },
  };
  const categoryBarConfig = {
    total: { label: "Total", color: "rgba(57,208,255,0.9)" },
  };
  const flowConfig = {
    Entradas: { label: "Entradas", color: "rgba(57,208,255,0.9)" },
    Saidas: { label: "Saidas", color: "rgba(255,106,213,0.9)" },
  };



  const weeklyFlow = useMemo(() => {
    const months = Array.from({ length: 4 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (3 - index));
      const label = date.toLocaleString("pt-BR", { month: "short" });
      return {
        label: label.replace(".", ""),
        year: date.getFullYear(),
        month: date.getMonth(),
        income: 0,
        expense: 0,
      };
    });
    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt ?? Date.now());
      const item = months.find(
        (m) => m.month === date.getMonth() && m.year === date.getFullYear()
      );
      if (!item) return;
      if (expense.kind === "income") {
        item.income += expense.amount;
      } else {
        item.expense += expense.amount;
      }
    });
    return months.map((item) => ({
      label: item.label,
      income: item.income,
      expense: item.expense,
    }));
  }, [expenses]);

  const flowSeries = useMemo(
    () =>
      weeklyFlow.map((item) => ({
        label: item.label,
        Entradas: item.income,
        Saidas: item.expense,
      })),
    [weeklyFlow]
  );

  const weeklyLineSeries = useMemo(
    () =>
      dailySeries.map((point) => ({
        label: point.label,
        Gastos: Number(point.value.toFixed(2)),
      })),
    [dailySeries]
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((expense) => {
      const next = (map.get(expense.category) ?? 0) + expense.amount;
      map.set(expense.category, next);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [expenses]);

  const safeCategoryTotals: Array<[string, number]> = categoryTotals.length
    ? categoryTotals
    : [["Sem dados", 0]];

  const contextSummary = useMemo(() => {
    const topCategory = categoryTotals[0]?.[0] ?? "Sem dados";
    const topCategoryValue = categoryTotals[0]?.[1] ?? 0;
    const activeGoal = goalItems[0];
    const recent = expenses.slice(0, 3).map((entry) => entry.description).join(", ");
    return [
      `Saldo ${currency.format(totals.balance)}`,
      `Gastos ${currency.format(totals.spent)}`,
      `Entradas ${currency.format(totals.income)}`,
      `Top: ${topCategory}`,
      activeGoal ? `Meta: ${activeGoal.title} ${activeGoal.progress}%` : "",
      recent ? `Recentes: ${recent}` : "",
    ].filter(Boolean).join(". ");
  }, [categoryTotals, currency, expenses, goalItems, totals]);

  const compass = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const currentWindow = expenses.filter((entry) => now - entry.createdAt <= sevenDays);
    const previousWindow = expenses.filter(
      (entry) => now - entry.createdAt > sevenDays && now - entry.createdAt <= sevenDays * 2
    );
    const sumNet = (items: Expense[]) =>
      items.reduce(
        (acc, item) =>
          acc +
          (item.kind === "income" ? item.amount : -item.amount),
        0
      );
    const sumByKind = (items: Expense[], kind: Expense["kind"]) =>
      items.filter((item) => item.kind === kind).reduce((acc, item) => acc + item.amount, 0);

    const currentNet = sumNet(currentWindow);
    const previousNet = sumNet(previousWindow);
    const currentIncome = sumByKind(currentWindow, "income");
    const currentExpense = sumByKind(currentWindow, "expense");
    const delta = currentNet - previousNet;
    const deltaBase = Math.max(Math.abs(previousNet), 1);
    const deltaPct = (delta / deltaBase) * 100;
    const angle = Math.max(Math.min(deltaPct * 0.8, 55), -55);
    const status = deltaPct > 5 ? "up" : deltaPct < -5 ? "down" : "neutral";
    const direction = status === "up" ? "alta" : status === "down" ? "baixa" : "estavel";
    const label =
      status === "up"
        ? "Acelerando"
        : status === "down"
        ? "Rumo de atencao"
        : "Estavel";

    const spendingPressure =
      currentIncome > 0 ? Math.min(100, (currentExpense / currentIncome) * 100) : 100;
    const confidence = Math.max(
      18,
      Math.min(96, currentWindow.length * 9 + Math.min(Math.abs(deltaPct), 38))
    );
    const healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          52 +
            (status === "up" ? 18 : status === "down" ? -16 : 0) +
            (spendingPressure < 70 ? 12 : spendingPressure > 95 ? -12 : 0)
        )
      )
    );

    const recommendation =
      status === "up"
        ? "Momento bom para direcionar excedente para metas e reserva."
        : status === "down"
        ? "Revise gastos variaveis e proteja o caixa dos proximos 7 dias."
        : "Mantenha o ritmo e acompanhe despesas variaveis com mais frequencia.";

    const dayMs = 24 * 60 * 60 * 1000;
    const spark = Array.from({ length: 8 }).map((_, idx) => {
      const dayStart = now - (7 - idx) * dayMs;
      const dayEnd = dayStart + dayMs;
      const value = expenses
        .filter((item) => item.createdAt >= dayStart && item.createdAt < dayEnd)
        .reduce((acc, item) => acc + (item.kind === "income" ? item.amount : -item.amount), 0);
      return value;
    });
    const maxAbs = Math.max(...spark.map((value) => Math.abs(value)), 1);
    const sparkline = spark.map((value) => ({
      value,
      pct: 50 + (value / maxAbs) * 45,
    }));

    return {
      angle,
      label,
      delta,
      deltaPct,
      currentNet,
      previousNet,
      currentIncome,
      currentExpense,
      status,
      direction,
      confidence,
      healthScore,
      recommendation,
      sparkline,
    };
  }, [expenses]);

  const categorySeries = useMemo(
    () =>
      safeCategoryTotals.map(
        ([category, total]) => ({
          categoria: category,
          total,
        })
      ),
    [safeCategoryTotals]
  );

  const metaTotals = useMemo(() => {
    return expenses
      .filter((expense) => expense.category === "Metas")
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const donutData = useMemo(() => {
    const values: Array<[string, number]> = categoryTotals.length
      ? categoryTotals
      : [["Sem dados", 1]];
    const total = values.reduce((sum, [, value]) => sum + value, 0) || 1;
    let acc = 0;
    return values.map(([label, value], index) => {
      const fraction = value / total;
      const startAngle = acc * 2 * Math.PI;
      acc += fraction;
      const endAngle = acc * 2 * Math.PI;
      const large = endAngle - startAngle > Math.PI ? 1 : 0;
      const r = 44;
      const cx = 50;
      const cy = 50;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      const palette = [
        "#7c5cff",
        "#39d0ff",
        "#ff6ad5",
        "#f4b6ff",
        "#6de5d5",
      ];
      return { label, value, path, color: palette[index % palette.length] };
    });
  }, [categoryTotals]);

  const monthClose = useMemo(() => {
    const topCategory = categoryTotals[0]?.[0] ?? "Sem dados";
    const topValue = categoryTotals[0]?.[1] ?? 0;
    let score = 50;
    if (totals.balance >= 0) score += 12;
    else score -= 12;
    if (totals.income > 0) score += 8;
    if (totals.spent > totals.income && totals.income > 0) score -= 8;
    score += Math.min(20, Math.round(avgGoal / 5));
    score -= Math.min(15, leakSummary.length * 4);
    score = Math.max(0, Math.min(100, Math.round(score)));
    const status =
      score >= 75 ? "excelente" : score >= 55 ? "bom" : score >= 35 ? "atencao" : "critico";

    const nextSteps: string[] = [];
    if (totals.balance < 0) {
      nextSteps.push("Rever gastos variaveis para voltar ao saldo positivo.");
    } else {
      nextSteps.push("Manter saldo positivo e separar um aporte fixo por semana.");
    }
    if (leakSummary.length > 0) {
      nextSteps.push(
        `Cortar pequenos gastos em ${leakSummary[0].category} para reduzir vazamentos.`
      );
    }
    if (goalItems.length > 0 && avgGoal < 60) {
      nextSteps.push("Definir um aporte semanal para a meta principal.");
    }
    if (totals.income === 0) {
      nextSteps.push("Registrar entradas para medir o fluxo real do mes.");
    }
    if (nextSteps.length === 0) {
      nextSteps.push("Siga no ritmo atual e revise o mes na proxima semana.");
    }

    const warning =
      totals.spent > totals.income && totals.income > 0
        ? "Gastos acima das entradas neste mes."
        : "Gastos sob controle no periodo.";

    return {
      score,
      status,
      topCategory,
      topValue,
      warning,
      nextSteps,
    };
  }, [avgGoal, categoryTotals, goalItems.length, leakSummary, totals.balance, totals.income, totals.spent]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    const months = [
      "Janeiro",
      "Fevereiro",
      "Marco",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  function pushMessage(
    role: Message["role"],
    text: string | { type: 'audio'; audioUrl: string; duration: number; waveform: number[] },
    id?: string,
    actions?: Message["actions"]
  ) {
    const uniqueId = id || `${Date.now()}-${messageSeq.current}-${Math.random()}`;
    if (!id) {
      messageSeq.current += 1;
    }
    setMessages((current) => {
      const existing = current.find(msg => msg.id === uniqueId);
      if (existing) {
        return current.map((msg) =>
          msg.id === uniqueId ? { ...msg, text, timestamp: shortDate.format(new Date()) } : msg
        );
      }
      return [
        ...current,
        {
          id: uniqueId,
          role,
          text,
          timestamp: shortDate.format(new Date()),
          actions,
        },
      ];
    });
    return uniqueId;
  }

  function handleFileAttach(files: FileList | null) {
    if (!files) return;
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    setAttachedFiles(prev => [...prev, ...validFiles]);
  }

  function removeFile(index: number) {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }

  function clearAttachments() {
    setAttachedFiles([]);
  }

  function updateMessage(id: string, text: string) {
    setMessages((current) =>
      current.map((msg) =>
        msg.id === id ? { ...msg, text, timestamp: shortDate.format(new Date()) } : msg
      )
    );
  }

  async function askAI(prompt: string) {
    setIsTyping(true);
    const messageId = Date.now().toString();
    pushMessage("assistant", "", messageId);
    
    try {
      const contextualPrompt = `Contexto: ${contextSummary}. Pergunta: ${prompt}`;
      const response = await fetch("/api/ollama/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextualPrompt }),
      });
      
      if (!response.ok) {
        updateMessage(messageId, "Promethus AI esta indisponivel no momento.");
        return;
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      
      if (!reader) {
        updateMessage(messageId, "Erro na resposta.");
        return;
      }
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          updateMessage(messageId, accumulatedText);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      updateMessage(messageId, "Promethus AI esta indisponivel no momento.");
    } finally {
      setIsTyping(false);
    }
  }

  async function classifyCategory(text: string) {
    try {
      const response = await fetch("/api/ollama/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return (data?.category as string) || null;
    } catch {
      return null;
    }
  }

  async function handleSend(text: string) {
    const clean = text.trim();
    if (!clean && attachedFiles.length === 0) return;
    
    // Clear input and attachments immediately after sending
    setInput("");
    clearAttachments();
    
    // Add file info to message if files are attached
    let messageText = clean;
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(file => 
        `${file.type.startsWith('image/') ? '🖼️' : '📄'} ${file.name}`
      ).join(', ');
      messageText = clean ? `${clean}\n\nArquivos anexados: ${fileNames}` : `Analisando arquivos: ${fileNames}`;
    }
    
    pushMessage("user", messageText);

    const lower = clean.toLowerCase();
    const goalAmountMatch = lower.match(/(?:meta|aporte|adicionar|aplicar)\\s*(\\d+[\\.,]?\\d*)/);
    if (goalAmountMatch && (lower.includes("meta") || lower.includes("aporte") || lower.includes("aplicar"))) {
      const value = Number.parseFloat(goalAmountMatch[1].replace(".", "").replace(",", "."));
      if (Number.isNaN(value)) {
        pushMessage("assistant", "Nao identifiquei o valor do aporte.");
        return;
      }
      const nameMatch = clean.match(/meta\\s+(.+)/i);
      const goalName = nameMatch ? nameMatch[1] : "";
      const targetGoal = goalName
        ? goalItems.find((goal) => goal.title.toLowerCase().includes(goalName.toLowerCase()))
        : goalItems[0];
      if (!targetGoal) {
        pushMessage("assistant", "Nao encontrei uma meta para aplicar esse valor.");
        return;
      }
      setGoalItems((current) =>
        current.map((goal) => {
          if (goal.id !== targetGoal.id) return goal;
          const saved = (goal.progress / 100) * goal.target + value;
          const nextProgress = Math.min(Math.round((saved / goal.target) * 100), 100);
          return { ...goal, progress: nextProgress };
        })
      );
      const goalExpense: Expense = {
        id: `${Date.now()}-${Math.random()}`,
        amount: value,
        category: "Metas",
        description: `Aporte meta: ${targetGoal.title}`,
        date: shortDate.format(new Date()),
        kind: "expense",
        createdAt: Date.now(),
      };
      setExpenses((current) => [goalExpense, ...current]);
      pushMessage(
        "assistant",
        `Aporte de ${currency.format(value)} aplicado na meta ${targetGoal.title}. Progresso atualizado e registrado como gasto.`
      );
      return;
    }
    if (lower.includes("desfazer ultimo") || lower.includes("desfazer último")) {
      setExpenses((current) => {
        if (current.length === 0) {
          pushMessage("assistant", "Ainda nao ha lancamentos para desfazer.");
          return current;
        }
        const [removed, ...rest] = current;
        pushMessage(
          "assistant",
          `Desfeito: ${removed.description}. Valor ${currency.format(removed.amount)}.`
        );
        return rest;
      });
      return;
    }

    const fixMatch = lower.match(/corrigir valor\\s*(\\d+[\\.,]?\\d*)/);
    if (fixMatch) {
      const newValue = Number.parseFloat(fixMatch[1].replace(".", "").replace(",", "."));
      if (Number.isNaN(newValue)) {
        pushMessage("assistant", "Nao identifiquei o valor para correcao.");
        return;
      }
      setExpenses((current) => {
        if (current.length === 0) {
          pushMessage("assistant", "Ainda nao ha lancamentos para corrigir.");
          return current;
        }
        const [latest, ...rest] = current;
        const updated = { ...latest, amount: newValue };
        pushMessage(
          "assistant",
          `Corrigido: ${updated.description}. Novo valor ${currency.format(updated.amount)}.`
        );
        return [updated, ...rest];
      });
      return;
    }

    if (clean.toLowerCase().includes("resumo")) {
      pushMessage(
        "assistant",
        `Resumo do momento: ${currency.format(totals.spent)} de gastos, ${currency.format(
          totals.income
        )} de entradas, saldo ${currency.format(totals.balance)}.`
      );
      return;
    }

    if (
      lower.includes("ultimos lancamentos") ||
      lower.includes("últimos lançamentos") ||
      lower.includes("ultimos lançamentos")
    ) {
      if (expenses.length === 0) {
        pushMessage("assistant", "Ainda nao ha lancamentos registrados.");
        return;
      }
      const lines = expenses.slice(0, 5).map(
        (entry, index) =>
          `${index + 1}. ${entry.description} · ${currency.format(entry.amount)}`
      );
      pushMessage("assistant", `Ultimos lancamentos:\n${lines.join("\n")}`);
      return;
    }

    if (lower.includes("gastos invisiveis") || lower.includes("gastos invisíveis")) {
      const leaks = detectLeaks(expenses);
      if (leaks.length === 0) {
        pushMessage(
          "assistant",
          "Nao encontrei vazamentos claros no ultimo mes. Se quiser, me diga categorias que deseja revisar."
        );
        return;
      }
      const lines = leaks
        .map(
          (item, index) =>
            `${index + 1}. ${item.category} · ${item.count} lancamentos · media ${currency.format(
              item.avg
            )} · total ${currency.format(item.total)}`
        )
        .join("\n");
      pushMessage(
        "assistant",
        [
          "## Gastos invisiveis detectados",
          lines,
          "",
          "[DICA] Teste cortar 20% por 30 dias nessas categorias e compare o resultado.",
          "[PASSO] Quer que eu crie metas de corte automaticas para essas categorias?",
        ].join("\n")
      );
      return;
    }

    const scenarioMatch = lower.match(/(reduzir|economizar)\\s*(\\d+[\\.,]?\\d*)/);
    if (scenarioMatch && (lower.includes("mes") || lower.includes("mês"))) {
      const value = Number.parseFloat(scenarioMatch[2].replace(".", "").replace(",", "."));
      if (Number.isNaN(value)) {
        pushMessage("assistant", "Nao identifiquei o valor para o cenario.");
        return;
      }
      const six = value * 6;
      const twelve = value * 12;
      pushMessage(
        "assistant",
        `Cenario: reduzir ${currency.format(value)} por mes.\nEm 6 meses: ${currency.format(
          six
        )}.\nEm 12 meses: ${currency.format(twelve)}.`
      );
      return;
    }

    const isScenarioQuestion =
      lower.includes("e se eu reduzir") ||
      lower.includes("e se reduzir") ||
      lower.includes("e se economizar") ||
      lower.includes("reduzir por mes") ||
      lower.includes("reduzir por mês") ||
      lower.includes("economizar por mes") ||
      lower.includes("economizar por mês");
    if (isScenarioQuestion) {
      pushMessage(
        "assistant",
        "Quer que eu simule? Diga um valor, por exemplo: reduzir 200 por mes."
      );
      return;
    }

    const goalKeywords = [
      "guardar",
      "investir",
      "meta",
      "objetivo",
      "pagar",
      "divida",
      "dívida",
    ];
    const wantsGoal = goalKeywords.some((word) => clean.toLowerCase().includes(word));
    if (wantsGoal) {
      setGoalMode(true);
      const matchGoal = clean.match(/(\d+[\.,]?\d*)/);
      if (matchGoal) {
        const value = Number.parseFloat(matchGoal[1].replace(".", "").replace(",", "."));
        const titleMatch = clean.match(/(?:guardar|economizar|meta|objetivo|pagar)\s+(.*)/i);
        const title = titleMatch ? titleMatch[1] : "Meta pessoal";
        const draft: GoalDraft = {
          id: `${Date.now()}-${Math.random()}`,
          title,
          category: getGoalCategory(clean),
          target: value,
          progress: 0,
        };
        setPendingGoal(draft);
        pushMessage(
          "assistant",
          "Detectei um objetivo financeiro. Quer que eu registre essa meta agora?"
        );
        pushMessage(
          "assistant",
          `Meta sugerida: ${title} na categoria ${draft.category}, valor ${currency.format(value)}.`,
          undefined,
          [{ label: "Lançar", action: "save-goal", goalId: draft.id }]
        );
      } else {
        pushMessage(
          "assistant",
          "Entendi sua meta. Para registrar, me diga um valor. Exemplo: quero guardar 300 por mes."
        );
      }
      return;
    } else if (goalMode) {
      setGoalMode(false);
    }

    const parsed = parseExpense(clean);
    if (!parsed && attachedFiles.length === 0) {
      askAI(clean);
      return;
    }

    // Handle file uploads
    if (attachedFiles.length > 0) {
      setIsTyping(true);
      try {
        const formData = new FormData();
        attachedFiles.forEach(file => formData.append('files', file));
        if (clean) formData.append('prompt', clean);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          pushMessage("assistant", "Não consegui processar os arquivos. Tente novamente.");
          return;
        }

        const data = await response.json();
        pushMessage("assistant", data.text || "Arquivos processados com sucesso!");
      } catch (error) {
        pushMessage("assistant", "Erro ao processar arquivos. Tente novamente.");
      } finally {
        setIsTyping(false);
        clearAttachments();
      }
      return;
    }

    if (!parsed) {
      askAI(clean);
      return;
    }

    const aiCategory = await classifyCategory(clean);
    const finalCategory = aiCategory || parsed.category;
    const finalKind = finalCategory === "Receita" ? "income" : parsed.kind;
    const finalExpense = { ...parsed, category: finalCategory, kind: finalKind };

    if (aiCategory && aiCategory !== parsed.category) {
      pushMessage("assistant", `Categoria sugerida pela IA: ${aiCategory}.`);
    }

    setExpenses((current) => [finalExpense, ...current]);
    pushMessage("assistant", buildAssistantReply(finalExpense));
    pushMessage("assistant", buildImpactNote(finalExpense, totals, goalItems));
    setPendingExpense(null);
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create an audio element to get duration
        const audio = new Audio(audioUrl);
        audio.onloadedmetadata = () => {
          // Here you can process the audio, send to API, etc.
          console.log('Audio recorded:', audio.duration, 'seconds');
          
          // Generate static waveform data for the message
          const waveformBars = Array.from({ length: 18 }, () => Math.random() * 20 + 8);
          
          // Add audio message with waveform
          pushMessage("user", {
            type: 'audio',
            audioUrl: audioUrl,
            duration: Math.round(audio.duration),
            waveform: waveformBars
          });
          
          pushMessage("assistant", "Áudio recebido! Funcionalidade de transcrição será implementada em breve.");
        };

        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      pushMessage("assistant", "Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const recentExpenses = expenses.slice(0, 5);

  function handleNavClick(id: NavId) {
    setActiveNav(id);
    if (id === "modo-babilonia") {
      setBabiloniaMax(false);
      setModal({ type: "modo-babilonia" });
      return;
    }

    if (typeof window === "undefined") return;
    const target = document.getElementById(`section-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark brand-image" aria-hidden="true">
            <img src="/logo.png" alt="Promethus AI logo" />
          </div>
          <div>
            <h1>Promethus AI</h1>
            <p>Seu copiloto para lancamentos financeiros com o poder da IA.</p>
          </div>
        </div>
        <div className="chips">
          <button
            type="button"
            className={`chip ${showDashboard ? "chip-active" : ""}`}
            onClick={() => {
              setShowDashboard(true);
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`chip ${activeChip === "resumo" ? "chip-active" : ""}`}
            onClick={() => {
              setActiveChip("resumo");
              setShowDashboard(false);
              setShowResumo(true);
            }}
          >
            Resumo do mes
          </button>
        </div>
      </header>

      <div className="content">
        <section className="layout">
        <aside className="summary">
          <button
            type="button"
            className={`card babilonia-menu-card ${activeNav === "modo-babilonia" ? "babilonia-menu-card-active" : ""}`}
            onClick={() => handleNavClick("modo-babilonia")}
          >
            <small>Modulo estrategico</small>
            <strong className="babilonia-title-row">
              <span className="babilonia-title-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  focusable="false"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="18"
                  height="18"
                >
                  <path d="M4 18h16" />
                  <path d="M7 18V12" />
                  <path d="M12 18V9" />
                  <path d="M17 18V6" />
                  <path d="M6.5 9.8 10.5 7l3 2.2L18 5.6" />
                </svg>
              </span>
              <span className="babilonia-title-text">Modo Babilonia</span>
            </strong>
            <span className="babilonia-subtext">7 principios financeiros</span>
          </button>

          <div className="card menu-card">
            <h2>Menu rapido</h2>
            <div className="nav-list">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${activeNav === item.id ? "nav-active" : ""}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card section-anchor" id="section-visao">
            <h2>Resumo do mes</h2>
            <div className="metric">
              <span>Gastos do mes</span>
              <strong>{currency.format(totals.spent)}</strong>
              <span>Entradas</span>
              <strong>{currency.format(totals.income)}</strong>
              <span>Saldo</span>
              <strong>{currency.format(totals.balance)}</strong>
            </div>
          </div>

          <div className="card section-anchor" id="section-cartoes">
            <div className="card-header">
              <h2>Agenda financeira</h2>
              <button
                type="button"
                className="icon-btn icon-add"
                onClick={() => setModal({ type: "agenda" })}
              >
                +
              </button>
            </div>
            <div className="list">
              {agendaItems.map((item) => (
                <div key={item.id} className="list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <div>{item.due}</div>
                  </div>
                  <div className="item-actions">
                    <span>{currency.format(item.amount)}</span>
                    <div className="mini-actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        onClick={() => setModal({ type: "edit-agenda", id: item.id })}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm icon-remove"
                        onClick={() =>
                          setAgendaItems((current) =>
                            current.filter((entry) => entry.id !== item.id)
                          )
                        }
                      >
                        −
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card section-anchor" id="section-categorias">
            <h2>Top categorias</h2>
            <div className="list">
              {categoryTotals.length === 0 ? (
                <p className="empty-state">Sem categorias ainda. Lance sua primeira despesa.</p>
              ) : (
                categoryTotals.map(([category, total]) => (
                  <div key={category} className="list-item">
                    <strong>{category}</strong>
                    <span>{currency.format(total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card section-anchor" id="section-metas">
            <div className="card-header">
              <h2>Metas do mes</h2>
              <button
                type="button"
                className="icon-btn icon-add"
                onClick={() => setModal({ type: "meta" })}
              >
                +
              </button>
            </div>
            <div className="list">
              {goalItems.map((item) => (
                <div key={item.id} className="list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <div>{item.category} · Meta {currency.format(item.target)}</div>
                  </div>
                  <div className="item-actions">
                    <span>{item.progress}%</span>
                    <div className="mini-actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        onClick={() => setModal({ type: "edit-meta", id: item.id })}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm icon-remove"
                        onClick={() =>
                          setGoalItems((current) =>
                            current.filter((entry) => entry.id !== item.id)
                          )
                        }
                      >
                        −
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card section-anchor quick-examples-card" id="section-relatorios">
            <div className="quick-examples-head">
              <h2>Exemplos rapidos</h2>
              <p>Toque para preencher o chat com receitas e despesas reais do dia a dia.</p>
            </div>
            <div className="quick-examples-list">
              {quickExamples.map((text) => {
                const isIncome = /recebi|entrou|ganhei|bonus|reembolso|cashback|juros/i.test(text);
                return (
                  <button
                    type="button"
                    key={text}
                    className={`quick-example-btn ${isIncome ? "is-income" : "is-expense"}`}
                    onClick={() => {
                      setInput(text);
                    }}
                  >
                    <span className="quick-example-type">{isIncome ? "Receita" : "Despesa"}</span>
                    <span className="quick-example-text">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card section-anchor" id="section-lancamentos">
            <div className="card-header">
              <h2>Historico de lancamentos</h2>
              <button
                type="button"
                className="icon-btn icon-add"
                onClick={() => setModal({ type: "historico" })}
              >
                +
              </button>
            </div>
            <div className="list">
              {recentExpenses.length === 0 ? (
                <p className="empty-state">Nenhum lancamento recente.</p>
              ) : (
                recentExpenses.map((expense) => (
                  <div key={expense.id} className="list-item">
                    <div>
                      <strong>{expense.description}</strong>
                      <div>{expense.category}</div>
                    </div>
                    <div className="item-actions">
                      <div>{currency.format(expense.amount)}</div>
                      <div className="mini-actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => setModal({ type: "edit-historico", id: expense.id })}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm icon-remove"
                          onClick={() =>
                            setExpenses((current) =>
                              current.filter((entry) => entry.id !== expense.id)
                            )
                          }
                        >
                          −
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className={`card chat ${chatMax ? "chat-max" : ""}`}>
          <div className="chat-header">
            <div className="chat-header-text">
              <h2>Chat financeiro</h2>
              <p>Olá! Sou seu assistente financeiro. Como posso ajudar você hoje?</p>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="icon-btn icon-btn-sm chat-header-btn"
                title="Novo chat"
                aria-label="Novo chat"
                data-tooltip="Novo chat"
                onClick={() => {
                setMessages([]);
                setActiveChip(null);
                setShortcutSet(
                  CHAT_SHORTCUT_POOL[
                    Math.floor(Math.random() * CHAT_SHORTCUT_POOL.length)
                  ]
                );
              }}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="shortcut-icon">
                  <path d="M7 4h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9l-4 4v-4H7a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
                  <path d="M12 9v6" />
                  <path d="M9 12h6" />
                </svg>
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm chat-header-btn"
                title="Maximizar"
                aria-label="Maximizar"
                data-tooltip="Maximizar"
                onClick={() => setChatMax((prev) => !prev)}
              >
                ⤢
              </button>
            </div>
          </div>

          <div className="chat-window" ref={chatWindowRef}>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                {message.role === "assistant" ? (
                  renderFormatted(message.text)
                ) : typeof message.text === 'string' ? (
                  message.text
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', margin: '4px 0' }}>
                    <audio controls style={{ width: '140px', height: '32px' }}>
                      <source src={message.text.audioUrl} type="audio/webm" />
                    </audio>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
                      {message.text.waveform.map((height, i) => (
                        <div
                          key={i}
                          style={{
                            width: '2px',
                            height: `${height}px`,
                            background: 'rgba(239, 68, 68, 0.7)',
                            borderRadius: '1px',
                            margin: '0 1px'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', color: '#666', opacity: 0.7 }}>
                      {message.text.duration}s
                    </span>
                  </div>
                )}
                {message.actions ? (
                  <div className="message-actions">
                    {message.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          if (action.action === "save") {
                            if (!pendingExpense || pendingExpense.id !== action.expenseId) return;
                            setExpenses((current) => [pendingExpense, ...current]);
                            pushMessage("assistant", buildAssistantReply(pendingExpense));
                          }
                          if (action.action === "save-goal") {
                            if (!pendingGoal || pendingGoal.id !== action.goalId) return;
                            setGoalItems((current) => [pendingGoal, ...current]);
                            pushMessage(
                              "assistant",
                              `Meta registrada: ${pendingGoal.title} na categoria ${pendingGoal.category} de ${currency.format(
                                pendingGoal.target
                              )}.`
                            );
                            const plan = buildGoalPlan(pendingGoal);
                            pushMessage("assistant", plan.text, undefined, plan.actions);
                          }
                          if (action.action === "init-goal-deposit") {
                            const target = goalItems.find((goal) => goal.id === action.goalId);
                            if (target) {
                              setInput(`adicione 100 na meta ${target.title}`);
                            } else {
                              setInput("adicione 100 na meta");
                            }
                          }
                          if (action.action === "edit") {
                            return;
                          }
                          if (action.action === "edit-goal") {
                            return;
                          }
                          if (action.action === "cancel") {
                            return;
                          }
                          if (action.action === "cancel-goal") {
                            return;
                          }
                          if (action.action === "save") {
                            setPendingExpense(null);
                          }
                          if (action.action === "save-goal") {
                            setPendingGoal(null);
                          }
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <small>{message.timestamp}</small>
              </div>
            ))}
            {isTyping ? (
              <div className="message assistant typing" style={{ display: 'none' }}>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            ) : null}
            {messages.length === 0 && !isTyping ? (
              <div className="chat-center" style={{ display: 'block', padding: '20px' }}>
                <div className="chat-shortcuts chat-shortcuts-center">
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                    Escolha uma opção abaixo ou digite sua despesa/receita
                  </p>
                  <div className="chat-shortcuts-grid icons-only">
                    {shortcutSet.map((shortcut) => (
                      <button
                        key={shortcut.label}
                        type="button"
                        className="chat-shortcut icon-only"
                        onClick={() => {
                          setInput(shortcut.text);
                          setActiveChip(shortcut.chipId ?? null);
                          setShowDashboard(false);
                        }}
                      >
                        <span className="chat-shortcut-icon" aria-hidden="true">
                          {shortcut.icon}
                        </span>
                        <span className="chat-shortcut-label">{shortcut.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Chat Input */}
          <div className="chat-input-container" style={{
            padding: '16px',
            background: 'transparent',
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            position: 'relative',
            zIndex: '100'
          }}>
            <div className="input-wrapper" style={{
              display: 'grid',
              gridTemplateAreas: '"leading textarea trailing"',
              gridTemplateColumns: 'auto 1fr auto',
              alignItems: 'center',
              gap: '12px',
              padding: attachedFiles.length > 0 ? '16px' : '8px 16px',
              background: 'linear-gradient(135deg, #1f2937 0%, #2a1f3f 50%, #1f2937 100%)',
              borderRadius: '28px',
              border: 'none',
              minHeight: attachedFiles.length > 0 ? '120px' : '44px',
              width: '100%',
              maxWidth: '750px',
              margin: '0 auto',
              position: 'relative',
              transition: 'none'
            }}>
              <button
                type="button"
                className="attach-button"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(59, 130, 246, 0.15) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                  color: 'rgba(59, 130, 246, 0.6)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '12px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textShadow: 'none',
                  filter: 'brightness(1)',
                  boxShadow: 'none'
                }}
                onClick={() => {
                  // Remover menu existente se houver
                  const existingMenu = document.querySelector('.attach-menu');
                  if (existingMenu) {
                    existingMenu.remove();
                    return;
                  }
                  
                  // Criar menu de opções
                  const menu = document.createElement('div');
                  menu.className = 'attach-menu';
                  menu.style.cssText = `
                    position: absolute;
                    bottom: 50px;
                    left: 0;
                    transform: translateX(0) scale(0.8);
                    background: #1f2937;
                    border: 1px solid #3b82f6;
                    border-radius: 12px;
                    padding: 8px;
                    z-index: 1000;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.05), inset 0 0 10px rgba(59, 130, 246, 0.05), inset 0 0 5px rgba(168, 85, 247, 0.02);
                    min-width: 120px;
                    opacity: 0;
                    transition: all 0.2s ease;
                    transform-origin: bottom left;
                  `;
                  
                  menu.innerHTML = `
                    <button onclick="document.getElementById('imageInput').click(); this.parentElement.remove();" style="
                      display: block;
                      width: 100%;
                      padding: 8px 12px;
                      background: none;
                      border: none;
                      color: #3b82f6;
                      text-align: left;
                      cursor: pointer;
                      border-radius: 6px;
                      font-size: 14px;
                      text-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
                      filter: brightness(1.1);
                      transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background='none'">📷 Imagem</button>
                    <button onclick="document.getElementById('pdfInput').click(); this.parentElement.remove();" style="
                      display: block;
                      width: 100%;
                      padding: 8px 12px;
                      background: none;
                      border: none;
                      color: #3b82f6;
                      text-align: left;
                      cursor: pointer;
                      border-radius: 6px;
                      font-size: 14px;
                      margin-top: 4px;
                      text-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
                      filter: brightness(1.1);
                      transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background='none'">📄 PDF</button>
                  `;
                  
                  // Adicionar ao DOM
                  const inputWrapper = document.querySelector('.input-wrapper');
                  if (inputWrapper) {
                    inputWrapper.appendChild(menu);
                    
                    // Animar entrada
                    setTimeout(() => {
                      menu.style.opacity = '1';
                      menu.style.transform = 'translateX(0) scale(1)';
                    }, 10);
                  }
                  
                  // Adicionar hover effects
                  menu.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('mouseenter', () => {
                      btn.style.background = '#3a3a3a';
                    });
                    btn.addEventListener('mouseleave', () => {
                      btn.style.background = 'none';
                    });
                  });
                  
                  // Fechar ao clicar fora
                  setTimeout(() => {
                    document.addEventListener('click', function closeMenu(e) {
                      if (!menu.contains(e.target as Node) && !(e.target as Element).closest('.attach-button')) {
                        menu.style.opacity = '0';
                        menu.style.transform = 'translateX(0) scale(0.8)';
                        setTimeout(() => menu.remove(), 200);
                        document.removeEventListener('click', closeMenu);
                      }
                    });
                  }, 100);
                }}
                title="Anexar arquivo"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textShadow: '0 0 5px rgba(59, 130, 246, 0.3)',
                  filter: 'brightness(1.1)'
                }}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder={attachedFiles.length > 0 ? "" : "Pergunte algo ou lance uma despesa"}
                rows={1}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  height: 'auto',
                  minHeight: '28px',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  padding: attachedFiles.length > 0 ? '60px 8px 4px 8px' : '4px 8px',
                  borderRadius: '4px',
                  resize: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  overflow: 'hidden'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              
              {attachedFiles.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  right: '16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 5
                }}>
                  {attachedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'linear-gradient(135deg, #1f2937 0%, #2a1f3f 50%, #1f2937 100%)',
                      border: '1px solid #3b82f6',
                      borderRadius: '28px',
                      padding: attachedFiles.length > 0 ? '16px' : '8px 16px',
                      minHeight: attachedFiles.length > 0 ? '120px' : '44px',
                      position: 'relative',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.2), 0 0 20px rgba(168, 85, 247, 0.05), inset 0 0 10px rgba(59, 130, 246, 0.05), inset 0 0 5px rgba(168, 85, 247, 0.02)',
                      transition: 'all 0.2s ease'
                    }}>
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>📄</span>
                      )}
                      <span style={{
                        color: '#f3f4f6',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0
                      }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => {
                          setAttachedFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '0',
                          borderRadius: '50%',
                          fontSize: '14px',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="right-icons" style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <button
                  type="button"
                  className="attach-button"
                  title="Gravar áudio"
                  onClick={() => {
                    if (!isRecording) {
                      startRecording();
                    } else {
                      stopRecording();
                    }
                  }}
                  style={{
                    background: isRecording ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.1))' : 'transparent',
                    border: isRecording ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                    color: isRecording ? '#f0f0f0' : '#bdbdbd',
                    fontSize: isRecording ? '18px' : '16px',
                    cursor: 'pointer',
                    padding: isRecording ? '6px' : '4px',
                    borderRadius: isRecording ? '12px' : '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isRecording ? '40px' : '32px',
                    height: isRecording ? '40px' : '32px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    animation: 'none',
                    boxShadow: 'none'
                  }}
                >
                  {isRecording && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '-270%',
                      transform: 'translate(-50%, -50%)',
                      width: '180px',
                      height: '32px',
                      background: 'rgba(239, 68, 68, 0.04)',
                      borderRadius: '16px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      zIndex: 10
                    }}>
                      {audioData.map((height, i) => {
                        const intensity = height / 28;
                        return (
                          <div
                            key={`waveform-${i}`}
                            style={{
                              width: '3px',
                              height: `${height}px`,
                              background: intensity > 0.6 ? 'rgba(239, 68, 68, 0.4)' : intensity > 0.3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                              borderRadius: '2px',
                              transition: 'height 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.2s ease',
                              animation: 'none',
                              transform: 'scaleY(1)',
                              transformOrigin: 'bottom',
                              margin: '0 1px'
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                </button>
                
                <button
                  type="button"
                  className={`send-btn ${(input.trim() || attachedFiles.length > 0) ? 'active' : ''}`}
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() && attachedFiles.length === 0}
                  title="Enviar mensagem"
                  style={{
                    background: (input.trim() || attachedFiles.length > 0) ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(147, 51, 234, 0.5) 50%, rgba(168, 85, 247, 0.5) 100%)' : 'transparent',
                    color: (input.trim() || attachedFiles.length > 0) ? '#fff' : '#9ca3af',
                    border: (input.trim() || attachedFiles.length > 0) ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #374151',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    pointerEvents: (input.trim() || attachedFiles.length > 0) ? 'auto' : 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: (input.trim() || attachedFiles.length > 0) ? '0 0 15px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.15), inset 0 0 10px rgba(168, 85, 247, 0.15)' : 'none',
                    textShadow: (input.trim() || attachedFiles.length > 0) ? '0 0 8px rgba(255, 255, 255, 0.4)' : 'none'
                  }}
                >
                  <i className="fa-solid fa-arrow-up"></i>
                </button>
              </div>
              
              <input
                type="file"
                id="imageInput"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAttachedFiles(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
              <input
                type="file"
                id="pdfInput"
                accept="application/pdf"
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAttachedFiles(prev => [...prev, ...files]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {activeChip === "categorias" ? (
              <div className="list">
                {categoryTotals.length === 0 ? (
                  <p className="empty-state">Sem categorias ainda. Lance sua primeira despesa.</p>
                ) : (
                  categoryTotals.map(([category, total]) => (
                    <div key={category} className="list-item">
                      <div>
                        <strong>{category}</strong>
                        <div>Categoria automatica</div>
                      </div>
                      <div>{currency.format(total)}</div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
        </section>
        </section>
      </div>

      {showMonthClose ? (
        <div
          className="modal-overlay"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(monthCloseKey, "seen");
            }
            setShowMonthClose(false);
          }}
        >
          <div
            className="modal month-close-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="month-close-header">
              <div>
                <h3>Fechamento do mes</h3>
                <span className="muted">Ritual de fechamento · {monthLabel}</span>
              </div>
              <div className={`score-badge score-${monthClose.status}`}>
                {monthClose.score}
              </div>
            </div>
            <div className="score-bar">
              <span style={{ width: `${monthClose.score}%` }} />
            </div>
            <div className="month-close-grid">
              <div>
                <span>Saldo do mes</span>
                <strong>{currency.format(totals.balance)}</strong>
              </div>
              <div>
                <span>Entradas</span>
                <strong>{currency.format(totals.income)}</strong>
              </div>
              <div>
                <span>Gastos</span>
                <strong>{currency.format(totals.spent)}</strong>
              </div>
              <div>
                <span>Categoria dominante</span>
                <strong>{monthClose.topCategory}</strong>
                <small>{currency.format(monthClose.topValue)}</small>
              </div>
            </div>
            <div className="callout callout-dica">
              <strong>Resumo</strong>
              <span>{monthClose.warning}</span>
            </div>
            <div className="month-close-steps">
              <h4>Proximos passos</h4>
              <ul>
                {monthClose.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(monthCloseKey, "seen");
                  }
                  setShowMonthClose(false);
                }}
              >
                Ver depois
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(monthCloseKey, "seen");
                  }
                  setShowMonthClose(false);
                  setShowDashboard(true);
                }}
              >
                Abrir dashboard
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showResumo ? (
        <div className="modal-overlay" onClick={() => setShowResumo(false)}>
          <div className="modal resumo-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Resumo do mes</h3>
            <div className="list">
              <div className="list-item">
                <div>
                  <strong>Saldo do mes</strong>
                  <div>Entradas - gastos</div>
                </div>
                <div>{currency.format(totals.balance)}</div>
              </div>
              <div className="list-item">
                <div>
                  <strong>Gastos do mes</strong>
                  <div>Total de despesas</div>
                </div>
                <div>{currency.format(totals.spent)}</div>
              </div>
              <div className="list-item">
                <div>
                  <strong>Entradas do mes</strong>
                  <div>Receitas confirmadas</div>
                </div>
                <div>{currency.format(totals.income)}</div>
              </div>
              <div className="list-item">
                <div>
                  <strong>Top categoria</strong>
                  <div>{categoryTotals[0]?.[0] ?? "Sem dados ainda"}</div>
                </div>
                <div>
                  {categoryTotals[0]
                    ? currency.format(categoryTotals[0][1])
                    : currency.format(0)}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowResumo(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDashboard ? (
        <div className="modal-overlay dashboard-overlay" onClick={() => setShowDashboard(false)}>
          <div
            className={`modal dashboard-modal ${dashboardMax ? "dashboard-max" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-titlebar">
              <div className="modal-title">
                <strong>Dashboard</strong>
                <div className="modal-tabs">
                  <button
                    type="button"
                    className={`chip ${dashboardTab === "geral" ? "chip-active" : ""}`}
                    onClick={() => setDashboardTab("geral")}
                  >
                    Geral
                  </button>
                  <button
                    type="button"
                    className={`chip ${dashboardTab === "metas" ? "chip-active" : ""}`}
                    onClick={() => setDashboardTab("metas")}
                  >
                    Metas
                  </button>
                </div>
              </div>
              <div className="modal-controls">
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  title={dashboardMax ? "Restaurar" : "Maximizar"}
                  aria-label={dashboardMax ? "Restaurar" : "Maximizar"}
                  onClick={() => {
                    setDashboardMax((prev) => !prev);
                  }}
                >
                  {dashboardMax ? "⤡" : "⤢"}
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm icon-remove"
                  onClick={() => setShowDashboard(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="dashboard-body">
            {dashboardTab === "geral" ? (
            <>
            <div className="card dashboard-hero dashboard-hero-compass">
              <h3>Rumo financeiro</h3>
              <div className="compass">
                <div className="compass-main">
                  <div className={`compass-ring compass-${compass.status}`}>
                    <div
                      className={`compass-arrow compass-${compass.status}`}
                      style={{ transform: `rotate(${compass.angle}deg)` }}
                    />
                    <span className="compass-score">{compass.healthScore}</span>
                  </div>
                  <div className="compass-sparkline" aria-hidden="true">
                    {compass.sparkline.map((point, idx) => (
                      <span key={`${point.value}-${idx}`} style={{ height: `${point.pct}%` }} />
                    ))}
                  </div>
                </div>
                <div className="compass-meta">
                  <strong className="compass-title">{compass.label}</strong>
                  <span className="compass-subtitle">
                    Variacao 7 dias: {currency.format(compass.delta)} ({compass.deltaPct >= 0 ? "+" : ""}
                    {compass.deltaPct.toFixed(1)}%)
                  </span>
                  <div className="compass-chips">
                    <span className={`compass-chip compass-chip-${compass.status}`}>
                      {compass.direction.charAt(0).toUpperCase() + compass.direction.slice(1)}
                    </span>
                    <span className="compass-chip compass-chip-muted">Confianca {Math.round(compass.confidence)}%</span>
                  </div>
                  <div className="compass-kpis">
                    <div>
                      <small>Saldo atual</small>
                      <strong className="compass-kpi-value">{currency.format(compass.currentNet)}</strong>
                    </div>
                    <div>
                      <small>Saldo anterior</small>
                      <strong className="compass-kpi-value">{currency.format(compass.previousNet)}</strong>
                    </div>
                  </div>
                  <p className="compass-tip">{compass.recommendation}</p>
                </div>
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="high">
              <h3>Top categorias</h3>
              <div className="mini-bars">
                {safeCategoryTotals.map(
                  ([category, total]) => (
                    <div key={category} className="mini-bar">
                      <span>{category}</span>
                      <div>
                        <em
                          style={{
                            width: `${totals.spent ? (total / totals.spent) * 100 : 6}%`,
                          }}
                        />
                        <small>{currency.format(total)}</small>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="high">
              <h3>Metricas chave</h3>
              <div className="metric-grid">
                <div>
                  <span>Lancamentos</span>
                  <strong>{totalCount}</strong>
                </div>
                <div>
                  <span>Ticket medio</span>
                  <strong>{currency.format(avgExpense)}</strong>
                </div>
                <div>
                  <span>Aportes em metas</span>
                  <strong>{currency.format(metaTotals)}</strong>
                </div>
                <div>
                  <span>Metas em dia</span>
                  <strong>{avgGoal}%</strong>
                </div>
                <div>
                  <span>Receitas</span>
                  <strong>{totals.incomeCount}</strong>
                </div>
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="med">
              <h3>Gastos invisiveis</h3>
              <div className="list">
                {leakSummary.length === 0 ? (
                  <p className="empty-state">Sem vazamentos relevantes no ultimo mes.</p>
                ) : (
                  leakSummary.map((item) => (
                    <div key={item.category} className="list-item">
                      <div>
                        <strong>{item.category}</strong>
                        <div>{item.count} lancamentos · media {currency.format(item.avg)}</div>
                      </div>
                      <div>{currency.format(item.total)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="med">
              <h3>Metas recentes</h3>
              <div className="list">
                {goalItems.length === 0 ? (
                  <p className="empty-state">Sem metas definidas ainda.</p>
                ) : (
                  goalItems.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="list-item">
                      <div>
                        <strong>{goal.title}</strong>
                        <div>{goal.category} · Meta {currency.format(goal.target)}</div>
                      </div>
                      <div className="goal-value">
                        <span>{goal.progress}%</span>
                        <small>{goal.progress >= 100 ? "Concluida" : "Em andamento"}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="high">
              <h3>Gastos da semana</h3>
              <ChartContainer className="chart-box" config={dailyChartConfig}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailySeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(124,92,255,0.08)" }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-value)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card" data-relevance="high">
              <h3>Mapa de comportamento</h3>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dailySeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <Tooltip cursor={{ stroke: "rgba(124,92,255,0.4)" }} content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="rgba(57,208,255,0.9)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="callout callout-passo">
                <strong>Pico detectado</strong>
                <span>
                  {behaviorInsights.peakLabel} · {currency.format(behaviorInsights.peakValue)}.{" "}
                  {behaviorInsights.suggestion}
                </span>
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="med">
              <h3>Evolucao semanal</h3>
              <ChartContainer className="chart-box" config={weeklyLineConfig}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weeklyLineSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <Tooltip cursor={{ stroke: "rgba(124,92,255,0.4)" }} content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="Gastos"
                      stroke="var(--color-Gastos)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card" data-relevance="med">
              <h3>Distribuicao por categoria</h3>
              <ChartContainer className="chart-box" config={categoryBarConfig}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={categorySeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="categoria" tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <Tooltip cursor={{ fill: "rgba(124,92,255,0.08)" }} content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="total"
                      fill="var(--color-total)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card" data-relevance="med">
              <h3>Donut de categorias</h3>
              <div className="donut">
                <svg viewBox="0 0 100 100" role="img" aria-label="Donut de categorias">
                  {donutData.map((slice) => (
                    <path key={slice.label} d={slice.path} fill={slice.color} />
                  ))}
                  <circle cx="50" cy="50" r="28" fill="#141428" />
                </svg>
                <div className="donut-legend">
                  {donutData.map((slice) => (
                    <div key={slice.label}>
                      <span style={{ background: slice.color }} />
                      <small>
                        {slice.label} · {currency.format(slice.value)}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="med">
              <h3>Fluxo mensal</h3>
              <ChartContainer className="chart-box" config={flowConfig}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={flowSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <Tooltip cursor={{ stroke: "rgba(124,92,255,0.4)" }} content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="Entradas"
                      stroke="var(--color-Entradas)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      isAnimationActive
                      animationDuration={700}
                    />
                    <Line
                      type="monotone"
                      dataKey="Saidas"
                      stroke="var(--color-Saidas)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      isAnimationActive
                      animationDuration={700}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card">
              <h3>Fluxo do mes</h3>
              <div className="flow-bars">
                <div>
                  <span>Entradas</span>
                  <div className="flow-bar">
                    <em
                      style={{
                        width: `${totals.income || totals.spent ? (totals.income / (totals.income + totals.spent)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <small>{currency.format(totals.income)}</small>
                </div>
                <div>
                  <span>Gastos</span>
                  <div className="flow-bar flow-bar-expense">
                    <em
                      style={{
                        width: `${totals.income || totals.spent ? (totals.spent / (totals.income + totals.spent)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <small>{currency.format(totals.spent)}</small>
                </div>
              </div>
            </div>
            <div className="card dashboard-card">
              <h3>Proximas contas</h3>
              <div className="list">
                {agendaItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="list-item">
                    <div>
                      <strong>{item.title}</strong>
                      <div>{item.due}</div>
                    </div>
                    <span>{currency.format(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            </>
            ) : null}
            {dashboardTab === "metas" ? (
            <>
            <div className="card dashboard-hero">
              <div>
                <p>Panorama das suas metas e do ritmo de progresso.</p>
              </div>
              <div className="dashboard-kpis">
                <div>
                  <span>Metas ativas</span>
                  <strong>{goalItems.length}</strong>
                </div>
                <div>
                  <span>Media de progresso</span>
                  <strong>{avgGoal}%</strong>
                </div>
                <div>
                  <span>Valor total</span>
                  <strong>{currency.format(goalsTargetTotal)}</strong>
                </div>
              </div>
            </div>
            <div className="card dashboard-card">
              <h3>Metas</h3>
              <div className="list">
                {goalItems.length === 0 ? (
                  <p className="empty-state">Sem metas definidas ainda.</p>
                ) : (
                  goalItems.map((goal) => (
                    <div key={goal.id} className="list-item goal-item">
                      <div>
                        <strong>{goal.title}</strong>
                        <div className="goal-meta">
                          <span className={`goal-chip goal-${goal.category.replace(/\\s+/g, "-").toLowerCase()}`}>
                            {goal.category}
                          </span>
                          <span>Meta {currency.format(goal.target)}</span>
                          {goal.progress >= 100 ? (
                            <span className="goal-badge">Concluida</span>
                          ) : null}
                        </div>
                        <div className="goal-progress">
                          <em
                            className={`goal-bar goal-${goal.category
                              .replace(/\\s+/g, "-")
                              .toLowerCase()}`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="goal-value">
                        <span>{goal.progress}%</span>
                        <small>{goal.progress >= 100 ? "Concluida" : "Em andamento"}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="card dashboard-card">
              <h3>Resumo das metas</h3>
              <div className="metric-grid">
                <div>
                  <span>Em risco</span>
                  <strong>{goalsRisk.length}</strong>
                </div>
                <div>
                  <span>Em ritmo forte</span>
                  <strong>{goalsHealthy.length}</strong>
                </div>
                <div>
                  <span>Precisa de foco</span>
                  <strong>{goalsRisk.length}</strong>
                </div>
                <div>
                  <span>Progresso medio</span>
                  <strong>{avgGoal}%</strong>
                </div>
              </div>
            </div>
            <div className="card dashboard-card">
              <h3>Progresso por meta</h3>
              <ChartContainer className="chart-box" config={{ progresso: { label: "Progresso", color: "rgba(124,92,255,0.9)" } }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={goalProgressSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#b7b7c7", fontSize: 11 }} />
                    <Tooltip cursor={{ stroke: "rgba(124,92,255,0.4)" }} content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="progresso"
                      stroke="var(--color-progresso)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card">
              <h3>Metas por categoria</h3>
              <ChartContainer
                className="chart-box"
                config={Object.fromEntries(
                  goalCategorySeries.map((item) => [
                    item.categoria,
                    { label: item.categoria, color: getCategoryColor(item.categoria) },
                  ])
                )}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={goalCategorySeries}
                      dataKey="total"
                      nameKey="categoria"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {goalCategorySeries.map((item) => (
                        <Cell key={item.categoria} fill={getCategoryColor(item.categoria)} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card">
              <h3>Progresso medio por categoria</h3>
              <ChartContainer
                className="chart-box"
                config={Object.fromEntries(
                  goalProgressByCategory.map((item) => [
                    item.categoria,
                    { label: item.categoria, color: getCategoryColor(item.categoria) },
                  ])
                )}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart
                    data={goalProgressByCategory}
                    innerRadius="35%"
                    outerRadius="90%"
                  >
                    <Tooltip content={<ChartTooltipContent />} />
                    <RadialBar dataKey="progresso" cornerRadius={8}>
                      {goalProgressByCategory.map((item) => (
                        <Cell
                          key={item.categoria}
                          fill={getCategoryColor(item.categoria)}
                        />
                      ))}
                    </RadialBar>
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="card dashboard-card">
              <h3>Status das metas</h3>
              <div className="metric-grid">
                <div>
                  <span>Em ritmo forte</span>
                  <strong>{goalsHealthy.length}</strong>
                </div>
                <div>
                  <span>Precisam de foco</span>
                  <strong>{goalsRisk.length}</strong>
                </div>
              </div>
            </div>
            </>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowDashboard(false)}>
                Fechar
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      {modal ? (
        <div
          className={`modal-overlay ${modal.type === "modo-babilonia" ? "babilonia-overlay" : ""}`}
          onClick={() => {
            setModal(null);
            setBabiloniaMax(false);
          }}
        >
          <div
            className={
              modal.type === "modo-babilonia"
                ? `modal babilonia-modal ${babiloniaMax ? "babilonia-maximized" : ""}`
                : "modal"
            }
            onClick={(event) => event.stopPropagation()}
          >
            {modal.type === "modo-babilonia" ? (
              <>
                <div className="modal-titlebar">
                  <div className="modal-title">
                    <h3>Modo Babilonia</h3>
                    <small>7 principios em formato pratico</small>
                  </div>
                  <div className="modal-controls">
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm"
                      title={babiloniaMax ? "Restaurar" : "Maximizar"}
                      aria-label={babiloniaMax ? "Restaurar" : "Maximizar"}
                      onClick={() => setBabiloniaMax((prev) => !prev)}
                    >
                      {babiloniaMax ? "⤡" : "⤢"}
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-sm icon-remove"
                      title="Fechar"
                      aria-label="Fechar"
                      onClick={() => {
                        setModal(null);
                        setBabiloniaMax(false);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="babilonia-inline-scroll">
                  <ModoBabiloniaView embedded />
                </div>
              </>
            ) : null}

            {modal.type === "agenda" ? (
              <>
                <h3>Nova agenda</h3>
                <input
                  className="input-mini"
                  value={newAgenda.title}
                  onChange={(event) =>
                    setNewAgenda((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Titulo"
                />
                <input
                  className="input-mini"
                  value={newAgenda.due}
                  onChange={(event) =>
                    setNewAgenda((prev) => ({ ...prev, due: event.target.value }))
                  }
                  placeholder="Vencimento"
                />
                <input
                  className="input-mini"
                  value={newAgenda.amount}
                  onChange={(event) =>
                    setNewAgenda((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="Valor"
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setModal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (!newAgenda.title || !newAgenda.amount) return;
                      setAgendaItems((current) => [
                        ...current,
                        {
                          id: `${Date.now()}-${Math.random()}-ag`,
                          title: newAgenda.title,
                          due: newAgenda.due || "Sem data",
                          amount: Number(newAgenda.amount || 0),
                        },
                      ]);
                      setNewAgenda({ title: "", due: "", amount: "" });
                      setModal(null);
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            ) : null}

            {modal.type === "edit-agenda" ? (
              (() => {
                const item = agendaItems.find((entry) => entry.id === modal.id);
                if (!item) return null;
                return (
                  <>
                    <h3>Editar agenda</h3>
                    <input
                      className="input-mini"
                      value={item.title}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAgendaItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, title: value } : entry
                          )
                        );
                      }}
                    />
                    <input
                      className="input-mini"
                      value={item.due}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAgendaItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, due: value } : entry
                          )
                        );
                      }}
                    />
                    <input
                      className="input-mini"
                      value={item.amount}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setAgendaItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, amount: value } : entry
                          )
                        );
                      }}
                    />
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setModal(null)}
                      >
                        Fechar
                      </button>
                    </div>
                  </>
                );
              })()
            ) : null}

            {modal.type === "meta" ? (
              <>
                <h3>Nova meta</h3>
                <input
                  className="input-mini"
                  value={newGoal.title}
                  onChange={(event) =>
                    setNewGoal((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Meta"
                />
                <select
                  className="input-mini"
                  value={newGoal.category}
                  onChange={(event) =>
                    setNewGoal((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  <option value="">Categoria</option>
                  {GOAL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  className="input-mini"
                  value={newGoal.target}
                  onChange={(event) =>
                    setNewGoal((prev) => ({ ...prev, target: event.target.value }))
                  }
                  placeholder="Valor alvo"
                />
                <input
                  className="input-mini"
                  value={newGoal.progress}
                  onChange={(event) =>
                    setNewGoal((prev) => ({ ...prev, progress: event.target.value }))
                  }
                  placeholder="%"
                />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setModal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (!newGoal.title || !newGoal.target) return;
                      setGoalItems((current) => [
                        ...current,
                        {
                          id: `${Date.now()}-${Math.random()}-g`,
                          title: newGoal.title,
                          category: newGoal.category || "Outros",
                          target: Number(newGoal.target || 0),
                          progress: Number(newGoal.progress || 0),
                        },
                      ]);
                      setNewGoal({ title: "", category: "", target: "", progress: "" });
                      setModal(null);
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            ) : null}

            {modal.type === "edit-meta" ? (
              (() => {
                const item = goalItems.find((entry) => entry.id === modal.id);
                if (!item) return null;
                return (
                  <>
                    <h3>Editar meta</h3>
                    <input
                      className="input-mini"
                      value={item.title}
                      onChange={(event) => {
                        const value = event.target.value;
                        setGoalItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, title: value } : entry
                          )
                        );
                      }}
                    />
                    <select
                      className="input-mini"
                      value={item.category}
                      onChange={(event) => {
                        const value = event.target.value;
                        setGoalItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, category: value } : entry
                          )
                        );
                      }}
                    >
                      {GOAL_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input-mini"
                      value={item.target}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setGoalItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, target: value } : entry
                          )
                        );
                      }}
                    />
                    <input
                      className="input-mini"
                      value={item.progress}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setGoalItems((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, progress: value } : entry
                          )
                        );
                      }}
                    />
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setModal(null)}
                      >
                        Fechar
                      </button>
                    </div>
                  </>
                );
              })()
            ) : null}

            {modal.type === "historico" ? (
              <>
                <h3>Novo lancamento</h3>
                <input
                  className="input-mini"
                  value={newHistory.description}
                  onChange={(event) =>
                    setNewHistory((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Descricao"
                />
                <input
                  className="input-mini"
                  value={newHistory.category}
                  onChange={(event) =>
                    setNewHistory((prev) => ({ ...prev, category: event.target.value }))
                  }
                  placeholder="Categoria"
                />
                <input
                  className="input-mini"
                  value={newHistory.amount}
                  onChange={(event) =>
                    setNewHistory((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="Valor"
                />
                <select
                  className="input-mini"
                  value={newHistory.kind}
                  onChange={(event) =>
                    setNewHistory((prev) => ({
                      ...prev,
                      kind: event.target.value as "expense" | "income",
                    }))
                  }
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setModal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (!newHistory.description || !newHistory.amount) return;
                      setExpenses((current) => [
                        {
                          id: `${Date.now()}-${Math.random()}-h`,
                          amount: Number(newHistory.amount || 0),
                          category: newHistory.category || "Outros",
                          description: newHistory.description,
                          date: shortDate.format(new Date()),
                          kind: newHistory.kind,
                          createdAt: Date.now(),
                        },
                        ...current,
                      ]);
                      setNewHistory({ description: "", category: "", amount: "", kind: "expense" });
                      setModal(null);
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </>
            ) : null}

            {modal.type === "edit-historico" ? (
              (() => {
                const item = expenses.find((entry) => entry.id === modal.id);
                if (!item) return null;
                return (
                  <>
                    <h3>Editar lancamento</h3>
                    <input
                      className="input-mini"
                      value={item.description}
                      onChange={(event) => {
                        const value = event.target.value;
                        setExpenses((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, description: value } : entry
                          )
                        );
                      }}
                    />
                    <input
                      className="input-mini"
                      value={item.category}
                      onChange={(event) => {
                        const value = event.target.value;
                        setExpenses((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, category: value } : entry
                          )
                        );
                      }}
                    />
                    <input
                      className="input-mini"
                      value={item.amount}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setExpenses((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, amount: value } : entry
                          )
                        );
                      }}
                    />
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setModal(null)}
                      >
                        Fechar
                      </button>
                    </div>
                  </>
                );
              })()
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
