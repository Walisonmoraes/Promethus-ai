import { useMemo } from "react";
import { useBabilonia } from "../../BabiloniaContext";
import { getEntryTimeEstimate } from "../../utils";
import { ProgressBar } from "../ProgressBar";
import { SectionCard } from "../SectionCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Step5Housing() {
  const { state, updateField } = useBabilonia();

  const monthlyContribution = state.currentSavings || state.monthlyIncome * 0.1;
  const monthsToEntry = useMemo(
    () => getEntryTimeEstimate(state.downPaymentTarget, state.currentSavings, monthlyContribution),
    [state.currentSavings, state.downPaymentTarget, monthlyContribution]
  );

  const progress =
    state.downPaymentTarget > 0 ? (state.currentSavings / state.downPaymentTarget) * 100 : 0;
  const sealIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 11 12 5l8 6M6 10v9h12v-9M10 19v-5h4v5" />
    </svg>
  );

  return (
    <SectionCard
      title="5. Moradia Inteligente"
      description="Planeje entrada e prazo para compra do imovel com previsao de tempo."
      seal={{ icon: sealIcon, label: "Moradia" }}
    >
      <div className="mb-row-3">
        <label className="mb-field">
          <span>Valor do imovel</span>
          <input
            type="number"
            className="mb-input"
            value={state.propertyValue || ""}
            onChange={(e) => updateField("propertyValue", Number(e.target.value) || 0)}
          />
        </label>
        <label className="mb-field">
          <span>Entrada desejada</span>
          <input
            type="number"
            className="mb-input"
            value={state.downPaymentTarget || ""}
            onChange={(e) => updateField("downPaymentTarget", Number(e.target.value) || 0)}
          />
        </label>
        <label className="mb-field">
          <span>Prazo alvo (meses)</span>
          <input
            type="number"
            className="mb-input"
            value={state.housingDeadlineMonths || ""}
            onChange={(e) => updateField("housingDeadlineMonths", Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mb-note">
        <p className="mb-note-title">Entrada acumulada: {currency.format(state.currentSavings)}</p>
        <p className="mb-note-text">
          Tempo estimado para entrada: {Number.isFinite(monthsToEntry) ? `${monthsToEntry} meses` : "Defina poupanca mensal > 0"}
        </p>
      </div>

      <ProgressBar value={progress} tone={progress >= 100 ? "green" : "purple"} />
    </SectionCard>
  );
}
