import { useMemo } from "react";
import { useBabilonia } from "../../BabiloniaContext";
import { getEmergencyReserveColor, getEmergencyReserveMonths } from "../../utils";
import { ProgressBar } from "../ProgressBar";
import { SectionCard } from "../SectionCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Step4Protection() {
  const { state, updateField } = useBabilonia();

  const target = useMemo(() => state.monthlyIncome * 6, [state.monthlyIncome]);
  const monthsCovered = useMemo(
    () => getEmergencyReserveMonths(state.emergencyReserve, state.monthlyIncome),
    [state.emergencyReserve, state.monthlyIncome]
  );
  const color = getEmergencyReserveColor(monthsCovered);
  const sealIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3 6 5.5v6.5c0 4 2.5 6.8 6 8 3.5-1.2 6-4 6-8V5.5z" />
    </svg>
  );

  const tone = color === "green" ? "green" : color === "yellow" ? "yellow" : "red";

  return (
    <SectionCard
      title="4. Protecao Financeira"
      description="Monte uma reserva de emergencia equivalente a 6 meses da sua renda."
      seal={{ icon: sealIcon, label: "Escudo" }}
    >
      <label className="mb-field">
        <span>Reserva atual</span>
        <input
          type="number"
          className="mb-input"
          value={state.emergencyReserve || ""}
          onChange={(e) => updateField("emergencyReserve", Number(e.target.value) || 0)}
        />
      </label>

      <div className="mb-note">
        <p className="mb-note-title">Meta de reserva: {currency.format(target)}</p>
        <p className="mb-note-text">Cobertura atual: {monthsCovered.toFixed(1)} meses</p>
      </div>

      <ProgressBar value={target > 0 ? (state.emergencyReserve / target) * 100 : 0} tone={tone} />
    </SectionCard>
  );
}
