import { BabiloniaLevel } from "../types";
import { ProgressBar } from "./ProgressBar";

export function ScoreCard({
  score,
  level,
  overallProgress,
}: {
  score: number;
  level: BabiloniaLevel;
  overallProgress: number;
}) {
  return (
    <div className="mb-card">
      <p className="mb-label">Score Babilonia</p>
      <p className="mb-score">{score}</p>
      <p className="mb-level">Nivel: {level}</p>

      <div style={{ marginTop: 16 }}>
        <p className="mb-label">Progresso Geral</p>
        <ProgressBar value={overallProgress} tone="purple" />
      </div>
    </div>
  );
}
