"use client";

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

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  actions?: {
    label: string;
    action: "save" | "save-goal" | "init-goal-deposit";
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
      label: "Orcamento do mes",
      text: "me ajude a montar um orcamento mensal",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M4 19h16" />
          <path d="M6 16v-4" />
          <path d="M10 16v-8" />
          <path d="M14 16v-6" />
          <path d="M18 16v-10" />
        </svg>
      ),
    },
    {
      label: "Meta com plano",
      text: "quero guardar 2000 em 6 meses",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2" />
        </svg>
      ),
    },
    {
      label: "Corte de gastos",
      text: "me mostre onde posso cortar gastos",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M21 8v8h-8" />
        </svg>
      ),
    },
    {
      label: "Ultimos lancamentos",
      text: "ultimos lancamentos",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <rect x="5" y="4" width="14" height="16" rx="3" />
          <path d="M8 9h8" />
          <path d="M8 13h8" />
        </svg>
      ),
    },
    {
      label: "Analise de metas",
      text: "me diga como esta o progresso das metas",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M4 12h6l2 3 3-6 5 9" />
        </svg>
      ),
    },
  ],
  [
    {
      label: "Resumo do mes",
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
      label: "Categorias inteligentes",
      text: "paguei 180 no mercado",
      chipId: "categorias",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M3 12l7-7h7l4 4v7l-7 7-11-11z" />
          <path d="M16 8h.01" />
        </svg>
      ),
    },
    {
      label: "Fluxo do mes",
      text: "me mostre o fluxo de entradas e saidas",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M4 7h16" />
          <path d="M4 12h10" />
          <path d="M4 17h16" />
        </svg>
      ),
    },
    {
      label: "Dica rapida",
      text: "me de uma dica rapida para economizar",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a7 7 0 0 0-4 12c1 1 1 2 1 2h6s0-1 1-2a7 7 0 0 0-4-12z" />
        </svg>
      ),
    },
    {
      label: "Plano de economia",
      text: "crie um plano simples para economizar 300 por mes",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M5 5h14v14H5z" />
          <path d="M8 9h8" />
          <path d="M8 13h6" />
        </svg>
      ),
    },
  ],
  [
    {
      label: "Planejar gastos fixos",
      text: "me ajude a organizar meus gastos fixos",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M4 5h16v14H4z" />
          <path d="M8 9h8" />
          <path d="M8 13h6" />
        </svg>
      ),
    },
    {
      label: "Meta de reserva",
      text: "quero montar reserva de emergencia",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 3v18" />
          <path d="M7 7h10" />
          <path d="M7 17h10" />
        </svg>
      ),
    },
    {
      label: "Gasto recorrente",
      text: "me ajude a identificar gastos recorrentes",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
      ),
    },
    {
      label: "Despesas por categoria",
      text: "quero ver minhas despesas por categoria",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M4 12h7V4" />
          <path d="M12 12h8" />
          <path d="M4 12v8h8" />
        </svg>
      ),
    },
    {
      label: "Dica para poupar",
      text: "me de uma dica pratica para poupar hoje",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 3v6" />
          <path d="M9 9h6" />
          <path d="M8 14h8" />
          <path d="M6 19h12" />
        </svg>
      ),
    },
  ],
  [
    {
      label: "Planejar viagem",
      text: "quero montar um plano para uma viagem",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M3 12h18" />
          <path d="M12 3v18" />
          <path d="M7 7l10 10" />
        </svg>
      ),
    },
    {
      label: "Renda extra",
      text: "me ajude com ideias de renda extra",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M12 2v20" />
          <path d="M7 7h10" />
          <path d="M7 17h10" />
        </svg>
      ),
    },
    {
      label: "Cartao e limites",
      text: "quero revisar meus limites do cartao",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      label: "Despesas essenciais",
      text: "me ajude a separar despesas essenciais",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <path d="M6 4h12v16H6z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
        </svg>
      ),
    },
    {
      label: "Rotina financeira",
      text: "crie uma rotina financeira semanal para mim",
      icon: (
        <svg viewBox="0 0 24 24" className="shortcut-icon" aria-hidden="true" fill="none" stroke="currentColor">
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M4 10h16" />
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

function renderFormatted(text: string) {
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingExpense, setPendingExpense] = useState<Expense | null>(null);
  const [pendingGoal, setPendingGoal] = useState<GoalDraft | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messageSeq = useRef(0);
  const [input, setInput] = useState("");
  const [activeChip, setActiveChip] = useState<ChipId | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardMax, setDashboardMax] = useState(false);
  const [dashboardMin, setDashboardMin] = useState(false);
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

  const contextSummary = useMemo(() => {
    const topCategory = categoryTotals[0]?.[0] ?? "Sem dados";
    const topCategoryValue = categoryTotals[0]?.[1] ?? 0;
    const activeGoals = goalItems
      .slice(0, 3)
      .map(
        (goal) =>
          `${goal.title} (${goal.category}) alvo ${currency.format(goal.target)} progresso ${
            goal.progress
          }%`
      )
      .join("; ");
    const recent = expenses.slice(0, 5).map((entry) => entry.description).join(", ");
    return [
      `Saldo atual ${currency.format(totals.balance)}`,
      `Gastos no mes ${currency.format(totals.spent)}`,
      `Entradas no mes ${currency.format(totals.income)}`,
      `Categoria dominante ${topCategory} ${currency.format(topCategoryValue)}`,
      activeGoals ? `Metas ativas: ${activeGoals}` : "Sem metas ativas",
      recent ? `Ultimos lancamentos: ${recent}` : "Sem lancamentos recentes",
    ].join(". ");
  }, [categoryTotals, currency, expenses, goalItems, totals.balance, totals.income, totals.spent]);

  const compass = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const currentWindow = expenses.filter((entry) => now - entry.createdAt <= sevenDays);
    const previousWindow = expenses.filter(
      (entry) => now - entry.createdAt > sevenDays && now - entry.createdAt <= sevenDays * 2
    );
    const sum = (items: Expense[]) =>
      items.reduce(
        (acc, item) =>
          acc +
          (item.kind === "income" ? item.amount : -item.amount),
        0
      );
    const currentNet = sum(currentWindow);
    const previousNet = sum(previousWindow);
    const delta = currentNet - previousNet;
    const direction = delta >= 0 ? "alta" : "baixa";
    const angle = Math.max(Math.min(delta * 2, 45), -45);
    const label =
      delta === 0
        ? "Estavel"
        : direction === "alta"
        ? "Rumo positivo"
        : "Rumo de atencao";
    const status = delta === 0 ? "neutral" : delta > 0 ? "up" : "down";
    return { angle, label, delta, currentNet, status };
  }, [expenses]);

  const categorySeries = useMemo(
    () =>
      (categoryTotals.length ? categoryTotals : [["Sem dados", 0]]).map(
        ([category, total]) => ({
          categoria: category,
          total,
        })
      ),
    [categoryTotals]
  );

  const metaTotals = useMemo(() => {
    return expenses
      .filter((expense) => expense.category === "Metas")
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const donutData = useMemo(() => {
    const values = categoryTotals.length ? categoryTotals : [["Sem dados", 1]];
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
    text: string,
    actions?: Message["actions"]
  ) {
    messageSeq.current += 1;
    const uniqueId = `${Date.now()}-${messageSeq.current}-${Math.random()}`;
    setMessages((current) => [
      ...current,
      {
        id: uniqueId,
        role,
        text,
        timestamp: shortDate.format(new Date()),
        actions,
      },
    ]);
    return uniqueId;
  }

  async function askAI(prompt: string) {
    setIsTyping(true);
    try {
      const contextualPrompt = `Contexto do usuario: ${contextSummary}. Pergunta: ${prompt}`;
      const response = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextualPrompt }),
      });
      if (!response.ok) {
        pushMessage("assistant", "Promethus AI esta indisponivel no momento.");
        return;
      }
      const data = await response.json();
      pushMessage("assistant", data.text || "Ainda nao consegui responder com clareza.");
    } catch {
      pushMessage("assistant", "Promethus AI esta indisponivel no momento.");
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
    if (!clean) return;
    pushMessage("user", clean);

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

          <div className="card section-anchor" id="section-relatorios">
            <h2>Exemplos rapidos</h2>
            <div className="quick-actions">
              {[
                "gastei 32 no Uber",
                "paguei 189 no mercado",
                "recebi 4200 de salario",
                "gastei 68 no cinema",
              ].map((text) => (
                <button
                  type="button"
                  key={text}
                  onClick={() => {
                    setInput(text);
                  }}
                >
                  {text}
                </button>
              ))}
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
              <p>Traga sua conversa e eu organizo cada passo com clareza.</p>
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
                {message.role === "assistant" ? renderFormatted(message.text) : message.text}
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
                            pushMessage("assistant", plan.text, plan.actions);
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
              <div className="message assistant typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            ) : null}
            {messages.length === 0 && !isTyping ? (
              <div className="chat-center">
                <div className="chat-shortcuts chat-shortcuts-center">
                  <div className="chat-shortcuts-title subtle">Como posso ajudar?</div>
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

          <div className="chat-footer">
            <form
              className="input-area"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend(input);
                setInput("");
              }}
            >
              <textarea
                placeholder="Ex: gastei 32 no Uber ontem"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (input.trim()) {
                      handleSend(input);
                      setInput("");
                    }
                  }
                }}
              />
              <button type="submit" disabled={!input.trim()}>
                Lançar
              </button>
            </form>
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
          </div>
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
        <div className="modal-overlay" onClick={() => setShowDashboard(false)}>
          <div
            className={`modal dashboard-modal ${dashboardMax ? "dashboard-max" : ""} ${
              dashboardMin ? "dashboard-min" : ""
            }`}
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
                  onClick={() => {
                    setDashboardMin((prev) => !prev);
                    if (dashboardMax) setDashboardMax(false);
                  }}
                >
                  —
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => {
                    setDashboardMax((prev) => !prev);
                    if (dashboardMin) setDashboardMin(false);
                  }}
                >
                  ⤢
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => setShowDashboard(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            {!dashboardMin ? (
            <div className="dashboard-body">
            {dashboardTab === "geral" ? (
            <>
            <div className="card dashboard-hero">
              <div>
                <p>Panorama rapido do seu mes financeiro.</p>
              </div>
              <div className="dashboard-kpis">
                <div>
                  <span>Saldo</span>
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
              </div>
            </div>
            <div className="card dashboard-card" data-relevance="high">
              <h3>Top categorias</h3>
              <div className="mini-bars">
                {(categoryTotals.length ? categoryTotals : [["Sem dados", 0]]).map(
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
              <h3>Rumo financeiro</h3>
              <div className="compass">
                <div className={`compass-ring compass-${compass.status}`}>
                  <div
                    className={`compass-arrow compass-${compass.status}`}
                    style={{ transform: `rotate(${compass.angle}deg)` }}
                  />
                </div>
                <div className="compass-meta">
                  <strong>{compass.label}</strong>
                  <span>Variacao 7 dias: {currency.format(compass.delta)}</span>
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
            ) : null}
          </div>
        </div>
      ) : null}

      {modal ? (
        <div
          className="modal-overlay"
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
                <iframe
                  src="/modo-babilonia"
                  title="Modo Babilonia"
                  className="babilonia-frame"
                />
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
