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

function BabiloniaDashboard() {
  const { state } = useBabilonia();

  const score = getBabiloniaScore(state);
  const level = getBabiloniaLevel(score);
  const overallProgress = getOverallProgress(state);
  const stages = getStages(state);

  const savedPercent = getSavingsConsistency(state.monthlyIncome, state.currentSavings);
  const reserveMonths = getEmergencyReserveMonths(state.emergencyReserve, state.monthlyIncome);
  const hasInvestments = state.investedAmount > 0;

  return (
    <main className="mb-page">
      <div className="mb-shell">
        <header className="mb-hero">
          <p className="mb-kicker">Modo Babilonia</p>
          <h1 className="mb-title">Sistema dos 7 Principios Financeiros</h1>
          <p className="mb-subtitle">
            Transforme teoria em execucao com metas, acompanhamento e gamificacao em um dashboard unico.
          </p>
        </header>

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
        </section>
      </div>
    </main>
  );
}

export default function ModoBabiloniaPage() {
  return (
    <BabiloniaProvider>
      <BabiloniaDashboard />
    </BabiloniaProvider>
  );
}
