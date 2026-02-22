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

  const tone = color === "green" ? "green" : color === "yellow" ? "yellow" : "red";

  return (
    <SectionCard title="4. Protecao Financeira" description="Monte uma reserva de emergencia equivalente a 6 meses da sua renda.">
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
