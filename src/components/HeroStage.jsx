import { useState } from "react";

const defaultModes = {
  grid: {
    title: "Code Grid",
    note:
      "Code Grid pone a prueba debugging, refactors y automatizaciones. El premio esta en llegar a una salida valida con precision fria y casi sin tiros de mas.",
    prompt:
      '"Refactoriza este endpoint para devolver un JSON estable y sin pasos de mas."',
    stats: ["prompts usados // 02", "par del hoyo // 04", "chat lateral // abierto"],
    summary:
      "Cumpli el objetivo, valida la salida y cerra el hoyo con menos prompts que el resto de la sala.",
  },
  amber: {
    title: "Studio Pulse",
    note:
      "Studio Pulse trabaja branding, UX y direccion visual. Gana quien encuentra una idea fuerte con instrucciones limpias y pocas iteraciones.",
    prompt:
      '"Propone un hero mobile first con una idea central y tres reglas de sistema visual."',
    stats: ["iteraciones // 03", "par del hoyo // 05", "feedback // live"],
    summary:
      "Cada decision visual cuenta como un golpe: cuanto antes llegue claridad, mejor score.",
  },
  violet: {
    title: "Legal Echo",
    note:
      "Legal Echo lleva el juego a contratos, compliance y lectura de riesgo. La cancha castiga la ambiguedad y recompensa la claridad quirurgica.",
    prompt:
      '"Reescribe esta clausula para bajar riesgo legal sin perder intencion comercial."',
    stats: ["riesgo // medio", "par del hoyo // 03", "veredicto // pendiente"],
    summary:
      "Las mejores rondas son las que cierran el sentido en pocos movimientos.",
  },
};

export function HeroStage({
  kicker = "Cancha destacada",
  panelLabel = "Desafio activo",
  scoreLabel = "Scoreboard",
  summaryLabel = "Condicion de victoria",
  modes = defaultModes,
}) {
  const [activeMode, setActiveMode] = useState("grid");
  const current = modes[activeMode];

  return (
    <div className="hero-stage" data-reveal>
      <div className="stage-topline">
        <span className="stage-kicker">{kicker}</span>
        <div className="mode-switch" aria-label="Seleccionar modo">
          {Object.entries(modes).map(([key, mode]) => (
            <button
              key={key}
              className={`mode-chip${key === activeMode ? " is-active" : ""}`}
              onClick={() => setActiveMode(key)}
              type="button"
            >
              {mode.title}
            </button>
          ))}
        </div>
      </div>

      <p className="mode-note">{current.note}</p>

      <div className="stage-grid" />
      <div className="stage-glow stage-glow-a" />
      <div className="stage-glow stage-glow-b" />
      <div className="stage-ring" />
      <div className="stage-ring-secondary" />
      <div className="stage-beam" />
      <div className="stage-ball" />
      <div className="stage-tee" />
      <div className="stage-arc" />
      <div className="stage-trace" />

      <article className="stage-card stage-card-left">
        <p className="panel-label">{panelLabel}</p>
        <p className="stage-code">{current.prompt}</p>
      </article>

      <article className="stage-card stage-card-right">
        <p className="panel-label">{scoreLabel}</p>
        <ul className="micro-list">
          {current.stats.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="stage-card stage-card-bottom">
        <p className="panel-label">{summaryLabel}</p>
        <p className="stage-summary">{current.summary}</p>
      </article>
    </div>
  );
}
