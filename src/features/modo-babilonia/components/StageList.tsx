import { BabiloniaStage } from "../types";

export function StageList({ stages }: { stages: BabiloniaStage[] }) {
  return (
    <div className="mb-section">
      <h3>As 7 Etapas</h3>
      <ul className="mb-list">
        {stages.map((stage) => {
          const statusClass =
            stage.status === "Concluido"
              ? "mb-status mb-status--done"
              : stage.status === "Em Progresso"
              ? "mb-status mb-status--progress"
              : "mb-status mb-status--blocked";

          return (
            <li key={stage.id} className="mb-stage-item">
              <span>{stage.id}. {stage.title}</span>
              <span className={statusClass}>{stage.status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
