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

const STAGE_THEME: Record<number, { label: string; icon: JSX.Element }> = {
  1: {
    label: "Fundacao",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 4v16M6 10h12M8 14h8" />
      </svg>
    ),
  },
  2: {
    label: "Controle",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 5h12M6 12h8M6 19h6M19 16v3M16 19h3" />
      </svg>
    ),
  },
  3: {
    label: "Crescimento",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 18h16M6 16l4-4 3 3 5-6" />
      </svg>
    ),
  },
  4: {
    label: "Escudo",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3 6 5.5v6.5c0 4 2.5 6.8 6 8 3.5-1.2 6-4 6-8V5.5z" />
      </svg>
    ),
  },
  5: {
    label: "Moradia",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 11 12 5l8 6M6 10v9h12v-9M10 19v-5h4v5" />
      </svg>
    ),
  },
  6: {
    label: "Futuro",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 12a9 9 0 1 0 9-9M12 7v5l3 2" />
      </svg>
    ),
  },
  7: {
    label: "Expansao",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 17l5-5 4 4 7-7M16 9h4v4" />
      </svg>
    ),
  },
};

export function StageList({ stages }: { stages: BabiloniaStage[] }) {
  const completed = stages.filter((stage) => stage.status === "Concluido").length;
  const progress = Math.round((completed / Math.max(stages.length, 1)) * 100);

  return (
    <div className="mb-section">
      <div className="mb-stage-header">
        <div>
          <h3>As 7 Etapas</h3>
          <p>Roteiro pratico: conclua uma etapa por vez para liberar a seguinte.</p>
        </div>
        <span className="mb-stage-summary">{completed}/7 concluidas</span>
      </div>
      <div className="mb-stage-total-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ul className="mb-list">
        {stages.map((stage) => {
          const statusClass =
            stage.status === "Concluido"
              ? "mb-status mb-status--done"
              : stage.status === "Em Progresso"
              ? "mb-status mb-status--progress"
              : "mb-status mb-status--blocked";
          const itemClass =
            stage.status === "Concluido"
              ? "mb-stage-item is-done"
              : stage.status === "Em Progresso"
              ? "mb-stage-item is-active"
              : "mb-stage-item";
          const stagePercent =
            stage.status === "Concluido" ? 100 : stage.status === "Em Progresso" ? 62 : 8;
          const stageTheme = STAGE_THEME[stage.id];

          return (
            <li key={stage.id} className={itemClass}>
              <div className="mb-stage-main">
                <span className="mb-stage-icon" aria-hidden="true">
                  {stageTheme.icon}
                </span>
                <div>
                  <strong className="mb-stage-title">
                    {stage.id}. {stage.title}
                  </strong>
                  <p className="mb-stage-help">{STAGE_HELP[stage.id]}</p>
                  <div className="mb-stage-inline-meta">
                    <span>{stageTheme.label}</span>
                    <div className="mb-stage-inline-progress" aria-hidden="true">
                      <i style={{ width: `${stagePercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <span className={statusClass}>{stage.status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
