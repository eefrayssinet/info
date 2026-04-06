import { useMemo, useState } from "react";
import "./ContextLab.css";

const CONTEXTS = [
  {
    id: "none",
    label: "Sin contexto",
    tokens: [
      { text: "Que", weight: 0.15, type: "user" },
      { text: "es", weight: 0.05, type: "user" },
      { text: "textura", weight: 0.8, type: "user" },
    ],
    prompt: '"Que es textura"',
    response:
      '"Textura" puede referirse a muchas cosas: la superficie de un material, una tecnica pictorica, la sensacion tactil de una tela o incluso la textura de un plato en gastronomia. Podrias darme mas contexto?',
    focus: '"textura" (ambiguo)',
    region: "generica (sin foco)",
    highlight: "none",
    tokCount: 3,
  },
  {
    id: "moda",
    label: "Contexto: moda",
    tokens: [
      { text: "[system]", weight: 0.12, type: "system" },
      { text: "Sos", weight: 0.05, type: "system" },
      { text: "experto", weight: 0.15, type: "system" },
      { text: "en", weight: 0.02, type: "system" },
      { text: "moda", weight: 0.35, type: "system" },
      { text: "y", weight: 0.01, type: "system" },
      { text: "diseno", weight: 0.22, type: "system" },
      { text: "textil", weight: 0.28, type: "system" },
      { text: "Que", weight: 0.1, type: "user" },
      { text: "es", weight: 0.03, type: "user" },
      { text: "textura", weight: 0.65, type: "user" },
    ],
    prompt: '[System: "Sos experto en moda y diseno textil"] -> "Que es textura"',
    response:
      "En diseno textil, la textura es la cualidad tactil y visual de una superficie. Se trabaja mediante ligamentos, acabados superficiales y la eleccion de fibra. La textura define como cae una prenda y como interactua con la luz.",
    focus: '"moda" + "textil" + "textura"',
    region: "moda / diseno textil",
    highlight: "moda",
    tokCount: 11,
  },
  {
    id: "code",
    label: "Contexto: codigo",
    tokens: [
      { text: "[system]", weight: 0.1, type: "system" },
      { text: "Sos", weight: 0.04, type: "system" },
      { text: "programador", weight: 0.3, type: "system" },
      { text: "senior", weight: 0.12, type: "system" },
      { text: "de", weight: 0.01, type: "system" },
      { text: "videojuegos", weight: 0.25, type: "system" },
      { text: "3D", weight: 0.2, type: "system" },
      { text: "Que", weight: 0.08, type: "user" },
      { text: "es", weight: 0.02, type: "user" },
      { text: "textura", weight: 0.7, type: "user" },
    ],
    prompt: '[System: "Sos programador senior de videojuegos 3D"] -> "Que es textura"',
    response:
      "Una textura en 3D es un bitmap que se mapea sobre la superficie de un mesh via coordenadas UV. Se carga como asset y se aplica en el shader pipeline para definir color, relieve y reflectividad.",
    focus: '"programador" + "3D" + "textura"',
    region: "codigo / graficos 3D",
    highlight: "code",
    tokCount: 10,
  },
  {
    id: "gastro",
    label: "Contexto: gastronomia",
    tokens: [
      { text: "[system]", weight: 0.1, type: "system" },
      { text: "Sos", weight: 0.04, type: "system" },
      { text: "chef", weight: 0.32, type: "system" },
      { text: "profesional", weight: 0.1, type: "system" },
      { text: "de", weight: 0.01, type: "system" },
      { text: "alta", weight: 0.18, type: "system" },
      { text: "cocina", weight: 0.3, type: "system" },
      { text: "Que", weight: 0.08, type: "user" },
      { text: "es", weight: 0.02, type: "user" },
      { text: "textura", weight: 0.68, type: "user" },
    ],
    prompt: '[System: "Sos chef profesional de alta cocina"] -> "Que es textura"',
    response:
      "En gastronomia, la textura es la percepcion sensorial de un alimento en boca: cremoso, crocante, gelatinoso o aireado. Es uno de los pilares de la experiencia gustativa junto con sabor, aroma y temperatura.",
    focus: '"chef" + "cocina" + "textura"',
    region: "gastronomia",
    highlight: "gastro",
    tokCount: 10,
  },
];

const ZONES = [
  {
    id: "moda",
    label: "Moda",
    color: [212, 83, 126],
    concepts: ["pasarela", "textura", "silueta"],
  },
  {
    id: "code",
    label: "Codigo",
    color: [55, 138, 221],
    concepts: ["funcion", "variable", "debug"],
  },
  {
    id: "gastro",
    label: "Gastronomia",
    color: [29, 158, 117],
    concepts: ["reduccion", "emulsion", "sazon"],
  },
  {
    id: "general",
    label: "General",
    color: [136, 135, 128],
    concepts: [],
  },
];

function TokenBar({ token, maxWeight }) {
  const percentage = Math.round((token.weight / maxWeight) * 100);
  const isSystem = token.type === "system";

  return (
    <div className="cxl-token-row">
      <span className={`cxl-token-pill ${isSystem ? "cxl-token-pill--system" : "cxl-token-pill--user"}`}>
        {token.text}
      </span>
      <div className="cxl-token-bar-bg">
        <div
          className={`cxl-token-bar-fill ${isSystem ? "cxl-token-bar-fill--system" : "cxl-token-bar-fill--user"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="cxl-token-pct">{Math.round(token.weight * 100)}%</span>
    </div>
  );
}

function SpaceZone({ zone, isActive, x }) {
  const [red, green, blue] = zone.color;
  const fillAlpha = isActive ? 0.18 : 0.06;
  const strokeAlpha = isActive ? 0.6 : 0.15;
  const strokeWidth = isActive ? 2 : 0.5;
  const dotRadius = isActive ? 6 : 4;
  const dotOpacity = isActive ? 0.9 : 0.3;
  const labelOpacity = isActive ? 1 : 0.4;
  const labelWeight = isActive ? 500 : 400;

  return (
    <g>
      <rect
        x={x}
        y={30}
        width={140}
        height={160}
        rx={12}
        style={{
          fill: `rgba(${red},${green},${blue},${fillAlpha})`,
          stroke: `rgba(${red},${green},${blue},${strokeAlpha})`,
          strokeWidth,
          transition: "all 0.4s ease",
        }}
      />
      <text
        x={x + 70}
        y={55}
        textAnchor="middle"
        style={{ fontSize: "12px", fontWeight: 500, fill: "var(--cxl-text-hint)" }}
      >
        {zone.label}
      </text>
      {zone.concepts.map((concept, index) => {
        const cx = x + 30 + (index % 2) * 50 + (index === 2 ? 20 : 0);
        const cy = 90 + index * 35;

        return (
          <g key={concept}>
            <circle
              cx={cx}
              cy={cy}
              r={dotRadius}
              style={{
                fill: `rgb(${red},${green},${blue})`,
                opacity: dotOpacity,
                transition: "all 0.4s ease",
              }}
            />
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              style={{
                fontSize: "11px",
                fill: "var(--cxl-text-hint)",
                opacity: labelOpacity,
                fontWeight: labelWeight,
                transition: "all 0.4s ease",
              }}
            >
              {concept}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default function ContextLab() {
  const [contextIndex, setContextIndex] = useState(0);
  const context = CONTEXTS[contextIndex];

  const maxWeight = useMemo(
    () => context.tokens.reduce((max, token) => Math.max(max, token.weight), 0),
    [context],
  );

  return (
    <div className="cxl-root">
      <div className="cxl-header">
        <h2 className="cxl-title">El contexto como mecanismo de steering</h2>
        <p className="cxl-subtitle">
          La misma pregunta, "que es textura", produce respuestas radicalmente
          distintas segun el contexto. Los parametros no cambian; cambia que region
          del espacio se activa via attention.
        </p>
      </div>

      <div className="cxl-selector">
        {CONTEXTS.map((item, index) => (
          <button
            key={item.id}
            className={`cxl-ctx-btn ${index === contextIndex ? "cxl-ctx-btn--active" : ""}`}
            type="button"
            onClick={() => setContextIndex(index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="cxl-section">
        <div className="cxl-label">Prompt del usuario</div>
        <div className="cxl-prompt-box">{context.prompt}</div>
      </div>

      <div className="cxl-section">
        <div className="cxl-label">
          Tokens en el contexto. El ancho representa su peso de attention para generar la respuesta.
        </div>
        <div className="cxl-token-list">
          {context.tokens.map((token, index) => (
            <TokenBar key={`${context.id}-${index}`} token={token} maxWeight={maxWeight} />
          ))}
        </div>
      </div>

      <div className="cxl-section">
        <div className="cxl-label">Respuesta mas probable</div>
        <div className="cxl-response-box">{context.response}</div>
      </div>

      <div className="cxl-metrics">
        <div className="cxl-metric-card">
          <div className="cxl-metric-label">Tokens en contexto</div>
          <div className="cxl-metric-value">{context.tokCount}</div>
        </div>
        <div className="cxl-metric-card">
          <div className="cxl-metric-label">Atencion concentrada en</div>
          <div className="cxl-metric-value cxl-metric-value--small">{context.focus}</div>
        </div>
        <div className="cxl-metric-card">
          <div className="cxl-metric-label">Region activada</div>
          <div className="cxl-metric-value cxl-metric-value--small">{context.region}</div>
        </div>
      </div>

      <div className="cxl-section">
        <svg className="cxl-space-svg" width="100%" viewBox="0 0 680 220" aria-hidden="true">
          {ZONES.map((zone, index) => (
            <SpaceZone
              key={zone.id}
              zone={zone}
              isActive={
                context.highlight === zone.id ||
                (context.highlight === "none" && zone.id === "general")
              }
              x={40 + index * 160}
            />
          ))}
          <text
            x={340}
            y={210}
            textAnchor="middle"
            style={{ fontSize: "12px", fill: "var(--cxl-text-hint)" }}
          >
            Espacio de parametros fijo. El contexto decide que region se ilumina.
          </text>
        </svg>
      </div>

      <div className="cxl-note">
        <strong>Que estas viendo?</strong> Los parametros del modelo son los mismos en
        todos los casos. Lo que cambia es el contexto: system prompt y mensaje del
        usuario. Attention computa pesos sobre esos tokens para decidir que informacion
        influye en la respuesta, y eso redirige el modelo hacia dominios distintos.
      </div>
    </div>
  );
}
