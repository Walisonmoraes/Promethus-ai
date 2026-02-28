import { useMemo } from "react";
import { useBabilonia } from "../../BabiloniaContext";
import {
  getMonthlySavingsProjection,
  getRecommendedSavings,
  getSavingsConsistency,
} from "../../utils";
import { ProgressBar } from "../ProgressBar";
import { SectionCard } from "../SectionCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Step1PayYourself() {
  const { state, updateField } = useBabilonia();

  const recommended = useMemo(() => getRecommendedSavings(state.monthlyIncome), [state.monthlyIncome]);
  const consistency = useMemo(
    () => getSavingsConsistency(state.monthlyIncome, state.currentSavings),
    [state.currentSavings, state.monthlyIncome]
  );
  const projection = useMemo(() => getMonthlySavingsProjection(recommended), [recommended]);
  const sealIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 4v16M6 10h12M8 14h8" />
    </svg>
  );

  return (
    <SectionCard
      title="1. Pague-se Primeiro"
      description="Reserve ao menos 10% da renda antes de qualquer outro gasto."
      seal={{ icon: sealIcon, label: "Poupanca" }}
    >
      <div className="mb-row-2">
        <label className="mb-field">
          <span>Renda mensal</span>
          <input
            type="number"
            className="mb-input"
            value={state.monthlyIncome || ""}
            onChange={(e) => updateField("monthlyIncome", Number(e.target.value) || 0)}
            placeholder="Ex: 5000"
          />
        </label>
        <label className="mb-field">
          <span>Quanto esta poupando no mes</span>
          <input
            type="number"
            className="mb-input"
            value={state.currentSavings || ""}
            onChange={(e) => updateField("currentSavings", Number(e.target.value) || 0)}
            placeholder="Ex: 500"
          />
        </label>
      </div>

      <div className="mb-note mb-note--violet">
        <p className="mb-note-title">10% recomendado: {currency.format(recommended)}</p>
        <p className="mb-note-text">
          Simulacao em 12 meses: {currency.format(projection[projection.length - 1]?.total || 0)}
        </p>
      </div>

      <div>
        <p className="mb-label">Consistencia de poupanca</p>
        <ProgressBar value={consistency} tone={consistency >= 100 ? "green" : "yellow"} />
      </div>
    </SectionCard>
  );
}
