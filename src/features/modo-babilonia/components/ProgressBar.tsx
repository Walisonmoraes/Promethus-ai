import { clamp } from "../utils";

type ProgressBarProps = {
  value: number;
  tone?: "purple" | "green" | "yellow" | "red";
  showValue?: boolean;
};

const toneMap = {
  purple: "linear-gradient(120deg, rgba(124,92,255,0.95), rgba(57,208,255,0.85))",
  green: "linear-gradient(120deg, rgba(16,185,129,0.95), rgba(110,231,183,0.85))",
  yellow: "linear-gradient(120deg, rgba(245,158,11,0.95), rgba(253,224,71,0.85))",
  red: "linear-gradient(120deg, rgba(244,63,94,0.95), rgba(251,113,133,0.85))",
};

export function ProgressBar({ value, tone = "purple", showValue = true }: ProgressBarProps) {
  const normalized = clamp(value);

  return (
    <div className="mb-progress-wrap">
      <div className="mb-progress-track">
        <div
          className="mb-progress-bar"
          style={{ width: `${normalized}%`, background: toneMap[tone] }}
        />
      </div>
      {showValue ? <p className="mb-progress-value">{Math.round(normalized)}%</p> : null}
    </div>
  );
}
