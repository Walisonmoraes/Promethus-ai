import { useMemo } from "react";
import { useBabilonia } from "../../BabiloniaContext";
import { getIncomeGrowthPlan } from "../../utils";
import { SectionCard } from "../SectionCard";

export function Step7IncomeGrowth() {
  const { state, updateField } = useBabilonia();

  const plan = useMemo(
    () => getIncomeGrowthPlan(state.skills, state.monthlyIncome, state.futureIncomeGoal),
    [state.futureIncomeGoal, state.monthlyIncome, state.skills]
  );
  const sealIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 17l5-5 4 4 7-7M16 9h4v4" />
    </svg>
  );

  return (
    <SectionCard
      title="7. Aumento de Renda"
      description="Defina habilidades e meta de renda para criar um plano evolutivo simples."
      seal={{ icon: sealIcon, label: "Expansao" }}
    >
      <div className="mb-row-2">
        <label className="mb-field">
          <span>Habilidades atuais (separe por virgula)</span>
          <input
            type="text"
            className="mb-input"
            value={state.skills}
            onChange={(e) => updateField("skills", e.target.value)}
            placeholder="Ex: vendas, design, excel"
          />
        </label>
        <label className="mb-field">
          <span>Meta de renda mensal futura</span>
          <input
            type="number"
            className="mb-input"
            value={state.futureIncomeGoal || ""}
            onChange={(e) => updateField("futureIncomeGoal", Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mb-note">
        <p className="mb-note-title">Plano sugerido (mockado)</p>
        <ul className="mb-list">
          {plan.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
