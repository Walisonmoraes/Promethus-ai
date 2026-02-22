import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useBabilonia } from "../../BabiloniaContext";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { getCompoundInterestSeries } from "../../utils";
import { SectionCard } from "../SectionCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Step3MoneyWorking() {
  const { state, updateField } = useBabilonia();

  const series = useMemo(
    () => getCompoundInterestSeries(state.investedAmount, state.annualRate, state.investmentMonths),
    [state.investedAmount, state.annualRate, state.investmentMonths]
  );

  const finalValue = series[series.length - 1]?.total ?? 0;

  return (
    <SectionCard title="3. Dinheiro Trabalhando" description="Simule juros compostos para visualizar crescimento patrimonial.">
      <div className="mb-row-3">
        <label className="mb-field">
          <span>Valor investido</span>
          <input
            type="number"
            className="mb-input"
            value={state.investedAmount || ""}
            onChange={(e) => updateField("investedAmount", Number(e.target.value) || 0)}
          />
        </label>
        <label className="mb-field">
          <span>Taxa anual (%)</span>
          <input
            type="number"
            className="mb-input"
            value={state.annualRate || ""}
            onChange={(e) => updateField("annualRate", Number(e.target.value) || 0)}
          />
        </label>
        <label className="mb-field">
          <span>Tempo (meses)</span>
          <input
            type="number"
            className="mb-input"
            value={state.investmentMonths || ""}
            onChange={(e) => updateField("investmentMonths", Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <div className="mb-note mb-note--green">
        <p className="mb-note-title">Projecao final: {currency.format(finalValue)}</p>
      </div>

      <ChartContainer config={{ total: { label: "Total", color: "#7c5cff" } }} className="mb-chart-wrap">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <LineChart data={series} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <XAxis dataKey="period" stroke="rgba(148,163,184,0.8)" fontSize={11} />
            <YAxis stroke="rgba(148,163,184,0.8)" fontSize={11} width={64} />
            <Tooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </SectionCard>
  );
}
