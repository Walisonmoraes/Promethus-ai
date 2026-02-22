import { BabiloniaStage } from "../types";

const STAGE_HELP: Record<number, string> = {
  1: "Defina quanto entra e quanto voce separa para voce.",
  2: "Anote gastos e separe necessidade de desejo.",
  3: "Veja seu dinheiro crescer com juros compostos.",
  4: "Monte sua reserva para imprevistos.",
  5: "Planeje a entrada da casa sem apertos.",
  6: "Projete patrimonio para viver bem no futuro.",
  7: "Crie plano de evolucao para aumentar renda.",
};

export function StageList({ stages }: { stages: BabiloniaStage[] }) {
  return (
    <div className="mb-section">
      <div className="mb-stage-header">
        <h3>As 7 Etapas</h3>
        <p>Roteiro simples: faca uma etapa por vez.</p>
      </div>

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
              <div>
                <strong className="mb-stage-title">
                  {stage.id}. {stage.title}
                </strong>
                <p className="mb-stage-help">{STAGE_HELP[stage.id]}</p>
              </div>
              <span className={statusClass}>{stage.status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
