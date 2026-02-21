import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

type ChartContainerProps = {
  config?: ChartConfig;
  className?: string;
  children: React.ReactNode;
};

export function ChartContainer({ config = {}, className, children }: ChartContainerProps) {
  const style = Object.entries(config).reduce((acc, [key, value]) => {
    if (value?.color) {
      acc[`--color-${key}` as keyof React.CSSProperties] = value.color;
    }
    return acc;
  }, {} as React.CSSProperties);

  return (
    <div className={cn("chart-container", className)} style={style}>
      {children}
    </div>
  );
}

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
};

type ChartTooltipContentProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
  className?: string;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const labelMap: Record<string, string> = {
  value: "Gastos",
  total: "Total",
  Entradas: "Entradas",
  Saidas: "Saidas",
  Gastos: "Gastos",
  progresso: "Progresso",
};

const iconMap: Record<string, string> = {
  Gastos: "▼",
  Saidas: "▼",
  Entradas: "▲",
  Total: "◆",
  Progresso: "◎",
  value: "▼",
  total: "◆",
  progresso: "◎",
};

export function ChartTooltipContent({
  active,
  label,
  payload,
  className,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={cn("chart-tooltip", className)}>
      {label ? <div className="chart-tooltip-label">{label}</div> : null}
      <div className="chart-tooltip-rows">
        {payload.map((item, index) => {
          const rawName = item.name ?? "Valor";
          const cleanName = rawName.replace(/\d+$/, "");
          const displayName = labelMap[cleanName] ?? cleanName;
          const icon = iconMap[displayName] ?? iconMap[cleanName] ?? "•";
          const numericValue =
            typeof item.value === "number" ? item.value : Number(item.value);
          const isPercent =
            cleanName.toLowerCase().includes("progresso") ||
            cleanName.toLowerCase().includes("percent");
          const valueText =
            Number.isFinite(numericValue) && !Number.isNaN(numericValue)
              ? isPercent
                ? `${Math.round(numericValue)}%`
                : currency.format(numericValue)
              : String(item.value ?? "");

          return (
            <div key={`${rawName}-${index}`} className="chart-tooltip-row">
              <div className="chart-tooltip-meta">
                <span
                  className="chart-tooltip-dot"
                  style={{ background: item.color ?? "rgba(124,92,255,0.9)" }}
                />
                <span className="chart-tooltip-icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="chart-tooltip-name">{displayName}</span>
              </div>
              <span className="chart-tooltip-value">{valueText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
