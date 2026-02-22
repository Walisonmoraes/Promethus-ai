import { useMemo } from "react";
import { useBabilonia } from "../../BabiloniaContext";
import { getFuturePatrimonyTarget } from "../../utils";
import { SectionCard } from "../SectionCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Step6Future() {
  const { state, updateField } = useBabilonia();

  const requiredPatrimony = useMemo(
    () => getFuturePatrimonyTarget(state.desiredFutureIncome),
    [state.desiredFutureIncome]
  );

  const yearsToGoal = Math.max(0, state.targetAge - state.currentAge);

  return (
    <SectionCard title="6. Futuro Financeiro" description="Projete o patrimonio necessario para sustentar a renda futura desejada.">
      <div className="mb-row-3">
        <label className="mb-field">
          <span>Idade atual</span>
          <input
            type="number"
            className="mb-input"
            value={state.currentAge || ""}
            onChange={(e) => updateField("currentAge", Number(e.target.value) || 0)}
          />
        </label>
        <label className="mb-field">
          <span>Idade alvo</span>
          <input
            type="number"
            className="mb-input"
            value={state.targetAge || ""}
            onChange={(e) => updateField("targetAge", Number(e.target.value) || 0)}
          />
        </label>
        <label className="mb-field">
          <span>Renda mensal futura desejada</span>
          <input
            type="number"
            className="mb-input"
            value={state.desiredFutureIncome || ""}
            onChange={(e) => updateField("desiredFutureIncome", Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mb-note mb-note--cyan">
        <p className="mb-note-title">Prazo ate o alvo: {yearsToGoal} anos</p>
        <p className="mb-note-text">Patrimonio aproximado necessario: {currency.format(requiredPatrimony)}</p>
      </div>
    </SectionCard>
  );
}
