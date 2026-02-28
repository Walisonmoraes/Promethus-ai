"use client";

import { BabiloniaProvider, useBabilonia } from "@/features/modo-babilonia/BabiloniaContext";
import { ScoreCard } from "@/features/modo-babilonia/components/ScoreCard";
import { StageList } from "@/features/modo-babilonia/components/StageList";
import { Step1PayYourself } from "@/features/modo-babilonia/components/steps/Step1PayYourself";
import { Step2ExpenseControl } from "@/features/modo-babilonia/components/steps/Step2ExpenseControl";
import { Step3MoneyWorking } from "@/features/modo-babilonia/components/steps/Step3MoneyWorking";
import { Step4Protection } from "@/features/modo-babilonia/components/steps/Step4Protection";
import { Step5Housing } from "@/features/modo-babilonia/components/steps/Step5Housing";
import { Step6Future } from "@/features/modo-babilonia/components/steps/Step6Future";
import { Step7IncomeGrowth } from "@/features/modo-babilonia/components/steps/Step7IncomeGrowth";
import {
  getBabiloniaLevel,
  getBabiloniaScore,
  getEmergencyReserveMonths,
  getOverallProgress,
  getSavingsConsistency,
  getStages,
} from "@/features/modo-babilonia/utils";
import "@/features/modo-babilonia/modo-babilonia.css";

const STEP_ANCHORS = [
  "#mb-step-1-pague-se-primeiro",
  "#mb-step-2-controle-de-gastos",
  "#mb-step-3-dinheiro-trabalhando",
  "#mb-step-4-protecao-financeira",
  "#mb-step-5-moradia-inteligente",
  "#mb-step-6-futuro-financeiro",
  "#mb-step-7-aumento-de-renda",
];

function IconSeal() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h16M6 20V9l6-4 6 4v11M9 13h6M9 16h6" />
    </svg>
  );
}

function IconMissionTablet() {
  return (
    <svg className="shortcut-icon mb-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6.5" y="4" width="11" height="16" rx="2" />
      <path d="M9.2 9h5.6M9.2 13h5.6" />
    </svg>
  );
}

function IconXpIshtar() {
  return (
    <svg className="shortcut-icon mb-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m12 4.4 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8-3.5-3.4 4.8-.7z" />
    </svg>
  );
}

function IconConquestLaurel() {
  return (
    <svg className="shortcut-icon mb-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="9" r="3" />
      <path d="M12 12.2V16M10 18h4" />
      <path d="M8.2 14.5c-.8-.4-1.5-.9-2-1.6M15.8 14.5c.8-.4 1.5-.9 2-1.6" />
    </svg>
  );
}

function BabiloniaDashboard({ embedded = false }: { embedded?: boolean }) {
  const { state } = useBabilonia();

  const score = getBabiloniaScore(state);
  const level = getBabiloniaLevel(score);
  const overallProgress = getOverallProgress(state);
  const stages = getStages(state);

  const savedPercent = getSavingsConsistency(state.monthlyIncome, state.currentSavings);
  const reserveMonths = getEmergencyReserveMonths(state.emergencyReserve, state.monthlyIncome);
  const hasInvestments = state.investedAmount > 0;

  const completedStages = stages.filter((stage) => stage.status === "Concluido").length;
  const activeStages = stages.filter((stage) => stage.status === "Em Progresso").length;
  const unlockedBadges = [savedPercent >= 100, reserveMonths >= 3, hasInvestments].filter(Boolean).length;
  const xpToNext = Math.max(0, 100 - score);

  const nextStage = stages.find((stage) => stage.status !== "Concluido") ?? stages[stages.length - 1];
  const nextStageAnchor = STEP_ANCHORS[nextStage.id - 1] ?? STEP_ANCHORS[0];

  const expensesTotal = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const spendingRatio = state.monthlyIncome > 0 ? (expensesTotal / state.monthlyIncome) * 100 : 0;
  const spendingStatus =
    spendingRatio > 90
      ? "Alerta: gastos altos"
      : spendingRatio > 70
      ? "Atencao: ajuste necessario"
      : "Bom controle de gastos";
  const spendingClass =
    spendingRatio > 90
      ? "mb-health-pill danger"
      : spendingRatio > 70
      ? "mb-health-pill warning"
      : "mb-health-pill good";

  const nextActions = [
    savedPercent < 100 ? "Ajustar poupanca para chegar no minimo de 10% da renda." : "Poupanca no caminho certo.",
    reserveMonths < 3 ? "Priorizar reserva de emergencia nos proximos meses." : "Reserva evoluindo com boa cobertura.",
    !hasInvestments ? "Iniciar aportes simples para ativar os juros compostos." : "Investimentos ativos, manter constancia.",
  ];

  return (
    <main className={`mb-page ${embedded ? "mb-page-embedded" : ""}`}>
      <div className={`mb-shell ${embedded ? "mb-shell-embedded" : ""}`}>
        <header className="mb-hero">
          <div className="mb-kicker-row">
            <p className="mb-kicker">Modo Babilonia</p>
            <span className="mb-seal">
              <IconSeal />
              Selo de Arkad
            </span>
          </div>
          <h1 className="mb-title">Os 7 passos de Arkad</h1>
          <p className="mb-subtitle">
            Um passo a passo inspirado em &quot;O Homem Mais Rico da Babilonia&quot;: aplique cada principio no seu ritmo, com orientacao pratica.
          </p>
          <div className="mb-hero-art" aria-hidden="true">
            <svg viewBox="0 0 240 120" focusable="false">
              <path d="M20 108h200M42 108V92h156v16M58 92V76h124v16M74 76V60h92v16M92 60V44h56v16" />
              <path d="M26 108V34M214 108V34M18 34h16M206 34h16M12 28h28M200 28h28" />
              <circle cx="120" cy="24" r="10" />
            </svg>
          </div>
        </header>

        <section className="mb-game-strip" aria-label="Painel gamificado">
          <article className="mb-game-card">
            <p className="mb-label mb-label-icon">
              <IconMissionTablet />
              Missoes concluidas
            </p>
            <strong>{completedStages}/7</strong>
            <span>{activeStages} em progresso</span>
          </article>

          <article className="mb-game-card">
            <p className="mb-label mb-label-icon">
              <IconXpIshtar />
              XP Babilonia
            </p>
            <strong>{score}</strong>
            <span>Faltam {xpToNext} XP para o proximo nivel</span>
          </article>

          <article className="mb-game-card mb-game-card-badges">
            <p className="mb-label mb-label-icon">
              <IconConquestLaurel />
              Conquistas
            </p>
            <strong>{unlockedBadges}/3 desbloqueadas</strong>
            <div className="mb-badge-track">
              <span className={`mb-mini-badge ${savedPercent >= 100 ? "is-on" : ""}`}>Cofre</span>
              <span className={`mb-mini-badge ${reserveMonths >= 3 ? "is-on" : ""}`}>Reserva</span>
              <span className={`mb-mini-badge ${hasInvestments ? "is-on" : ""}`}>Juros</span>
            </div>
          </article>
        </section>

        <section className="mb-guide-grid" aria-label="Guia rapido para leigos">
          <article className="mb-guide-card mb-guide-card-primary">
            <p className="mb-label">O que fazer agora</p>
            <h3>Etapa {nextStage.id}: {nextStage.title}</h3>
            <p>
              Comece por aqui. Essa e a acao com maior impacto no seu momento atual.
            </p>
            <a className="mb-guide-btn" href={nextStageAnchor}>
              Ir para essa etapa
            </a>
          </article>

          <article className="mb-guide-card mb-guide-card-compass">
            <p className="mb-label">Bussola de Arkad</p>
            <h3>{spendingStatus}</h3>
            <ul className="mb-plain-list mb-compass-list">
              <li><strong>Poupanca:</strong> {savedPercent.toFixed(0)}% do recomendado de 10%.</li>
              <li><strong>Reserva:</strong> {reserveMonths.toFixed(1)} meses de cobertura.</li>
              <li><strong>Investimentos:</strong> {hasInvestments ? "ativos" : "ainda nao iniciados"}.</li>
            </ul>
            <div className={spendingClass}>{spendingRatio.toFixed(1)}% da renda comprometida com gastos</div>
          </article>

          <article className="mb-guide-card">
            <p className="mb-label">Atalhos rapidos</p>
            <div className="mb-quick-actions">
              <a href="#mb-step-1-pague-se-primeiro">Comecar poupanca</a>
              <a href="#mb-step-2-controle-de-gastos">Organizar gastos</a>
              <a href="#mb-step-4-protecao-financeira">Montar reserva</a>
            </div>
          </article>
        </section>

        <section className="mb-top-grid">
          <ScoreCard score={score} level={level} overallProgress={overallProgress} />

          <div className="mb-card">
            <h3>Composicao do Score</h3>
            <div className="mb-kpi-grid">
              <div className="mb-kpi">
                <p className="mb-label">% Poupado</p>
                <p className="mb-kpi-value">{savedPercent.toFixed(1)}%</p>
              </div>
              <div className="mb-kpi">
                <p className="mb-label">Reserva</p>
                <p className="mb-kpi-value">{reserveMonths.toFixed(1)} meses</p>
              </div>
              <div className="mb-kpi">
                <p className="mb-label">Investimentos ativos</p>
                <p className="mb-kpi-value">{hasInvestments ? "Sim" : "Nao"}</p>
              </div>
            </div>
          </div>
        </section>

        <StageList stages={stages} />

        <section className="mb-modules-grid">
          <Step1PayYourself />
          <Step2ExpenseControl />
          <Step3MoneyWorking />
          <Step4Protection />
          <Step5Housing />
          <Step6Future />
          <Step7IncomeGrowth />
          <section className="mb-section">
            <header>
              <h3>Radar de Execucao</h3>
              <p>Resumo imediato para manter ritmo e consistencia.</p>
            </header>
            <div className="mb-list">
              <div className="mb-note">
                <p className="mb-note-title">Prioridade da semana</p>
                <p className="mb-note-text">Etapa {nextStage.id}: {nextStage.title}</p>
              </div>
              <ul className="mb-plain-list">
                {nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
              <div className={spendingClass}>
                Meta visivel: reduzir gastos para abaixo de 70% da renda mensal.
              </div>
              <div className="mb-quick-actions">
                <a href={nextStageAnchor}>Continuar etapa atual</a>
                <a href="#mb-step-2-controle-de-gastos">Revisar gastos</a>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export function ModoBabiloniaView({ embedded = false }: { embedded?: boolean }) {
  return (
    <BabiloniaProvider>
      <BabiloniaDashboard embedded={embedded} />
    </BabiloniaProvider>
  );
}
