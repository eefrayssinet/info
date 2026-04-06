import { useEffect, useRef, useState } from "react";
import "./TokenSamplingLab.css";

const BASE_TOKENS = [
  { word: "love", logit: 4.8 },
  { word: "patience", logit: 2.9 },
  { word: "time", logit: 2.5 },
  { word: "a", logit: 2.3 },
  { word: "sleep", logit: 1.8 },
  { word: "money", logit: 1.5 },
  { word: "silence", logit: 1.1 },
  { word: "courage", logit: 0.8 },
  { word: "faith", logit: 0.6 },
  { word: "coffee", logit: 0.3 },
  { word: "nothing", logit: 0.0 },
  { word: "chaos", logit: -0.4 },
  { word: "pizza", logit: -0.8 },
  { word: "darkness", logit: -1.2 },
  { word: "revolution", logit: -1.5 },
  { word: "surrender", logit: -1.9 },
  { word: "bandwidth", logit: -2.5 },
  { word: "yogurt", logit: -3.0 },
  { word: "fungus", logit: -3.8 },
  { word: "entropy", logit: -4.5 },
];

const CONTEXT_MODIFIERS = [
  {
    keywords: ["sueno", "dormir", "insomni", "cansad", "noche", "sleep", "tired"],
    boosts: {
      sleep: 5.5,
      silence: 3.2,
      time: 1.5,
      coffee: 2.8,
      nothing: 1.0,
      love: -2.0,
      money: -1.5,
    },
  },
  {
    keywords: ["surreal", "dali", "absurd", "loco", "dream", "weird"],
    boosts: {
      fungus: 4.0,
      entropy: 3.5,
      chaos: 4.2,
      nothing: 2.5,
      darkness: 2.0,
      love: -3.0,
      patience: -2.0,
      yogurt: 3.0,
    },
  },
  {
    keywords: ["dinero", "capital", "financ", "banco", "money", "invest", "economi"],
    boosts: {
      money: 5.0,
      patience: 2.5,
      time: 2.0,
      courage: 1.5,
      love: -2.5,
      sleep: -1.0,
      bandwidth: 2.0,
    },
  },
  {
    keywords: ["codigo", "program", "software", "debug", "code", "develop", "server"],
    boosts: {
      coffee: 5.0,
      patience: 3.5,
      time: 2.0,
      bandwidth: 4.0,
      sleep: 2.5,
      love: -3.0,
      faith: -2.0,
      entropy: 2.0,
    },
  },
  {
    keywords: ["guerra", "lucha", "pelea", "war", "fight", "battle", "conflict"],
    boosts: {
      courage: 5.0,
      revolution: 4.5,
      surrender: 3.0,
      faith: 2.5,
      darkness: 2.0,
      love: -1.5,
      pizza: -2.0,
    },
  },
  {
    keywords: ["solo", "soledad", "lonely", "alone", "triste", "sad"],
    boosts: {
      silence: 4.5,
      nothing: 3.5,
      darkness: 3.0,
      love: 1.0,
      courage: 1.5,
      coffee: -1.0,
      pizza: -1.5,
    },
  },
  {
    keywords: ["hambre", "comer", "cocina", "food", "hungry", "eat", "cook"],
    boosts: {
      pizza: 5.5,
      coffee: 3.0,
      yogurt: 4.0,
      patience: 1.5,
      love: -2.0,
      entropy: -2.0,
      bandwidth: -2.0,
    },
  },
  {
    keywords: ["diseno", "design", "arte", "creativ", "estetic"],
    boosts: {
      courage: 3.5,
      chaos: 2.5,
      silence: 2.0,
      patience: 2.0,
      love: -1.0,
      bandwidth: -2.0,
      fungus: -1.0,
    },
  },
];

function computeLogitsFromPrompt(prompt) {
  const lower = prompt.toLowerCase();
  const tokens = BASE_TOKENS.map((token) => ({ ...token }));

  for (const modifier of CONTEXT_MODIFIERS) {
    const matches = modifier.keywords.some((keyword) => lower.includes(keyword));

    if (!matches) {
      continue;
    }

    for (const token of tokens) {
      if (modifier.boosts[token.word] !== undefined) {
        token.logit += modifier.boosts[token.word];
      }
    }
  }

  tokens.sort((left, right) => right.logit - left.logit);
  return tokens;
}

function softmax(logits, temp) {
  const scaled = logits.map((logit) => logit / Math.max(temp, 0.01));
  const max = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - max));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

function applyTopP(probs, topP) {
  const indexed = probs.map((prob, index) => ({ prob, index })).sort((left, right) => right.prob - left.prob);
  let cumulative = 0;
  const mask = new Array(probs.length).fill(false);

  for (const item of indexed) {
    if (cumulative < topP) {
      mask[item.index] = true;
      cumulative += item.prob;
    } else {
      break;
    }
  }

  const filtered = probs.map((prob, index) => (mask[index] ? prob : 0));
  const sum = filtered.reduce((total, value) => total + value, 0);
  return filtered.map((value) => value / sum);
}

function sampleFrom(probs) {
  const random = Math.random();
  let cumulative = 0;

  for (let index = 0; index < probs.length; index += 1) {
    cumulative += probs[index];

    if (random < cumulative) {
      return index;
    }
  }

  return probs.length - 1;
}

function entropy(probs) {
  let value = 0;

  for (const prob of probs) {
    if (prob > 0) {
      value -= prob * Math.log2(prob);
    }
  }

  return value;
}

const PILL_COLORS = [
  { bg: "#EEEDFE", fg: "#3C3489" },
  { bg: "#E1F5EE", fg: "#085041" },
  { bg: "#FAECE7", fg: "#712B13" },
  { bg: "#FBEAF0", fg: "#72243E" },
  { bg: "#E6F1FB", fg: "#0C447C" },
  { bg: "#F1EFE8", fg: "#444441" },
  { bg: "#EAF3DE", fg: "#27500A" },
  { bg: "#FAEEDA", fg: "#633806" },
];

function pillColor(word) {
  const index = Math.abs(word.charCodeAt(0) * 7 + word.length * 13) % PILL_COLORS.length;
  return PILL_COLORS[index];
}

function BarChart({ labels, data, colors, maxVal }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    function drawChart() {
      const context = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      context.clearRect(0, 0, width, height);

      const padLeft = 52;
      const padRight = 12;
      const padTop = 8;
      const padBottom = 80;
      const chartWidth = width - padLeft - padRight;
      const chartHeight = height - padTop - padBottom;
      const yMax = maxVal || Math.max(...data, 0.01);
      const yTicks = 5;

      context.font = "11px system-ui, sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";

      for (let index = 0; index <= yTicks; index += 1) {
        const value = (yMax / yTicks) * index;
        const y = padTop + chartHeight - (chartHeight * (value / yMax));

        context.strokeStyle = "rgba(128,128,128,0.15)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(padLeft, y);
        context.lineTo(padLeft + chartWidth, y);
        context.stroke();

        context.fillStyle = "rgba(128,128,128,0.6)";
        context.fillText(`${(value * 100).toFixed(0)}%`, padLeft - 6, y);
      }

      const gap = 3;
      const barWidth = Math.max((chartWidth - gap * (data.length + 1)) / data.length, 2);

      for (let index = 0; index < data.length; index += 1) {
        const x = padLeft + gap + index * (barWidth + gap);
        const barHeight = (data[index] / yMax) * chartHeight;
        const y = padTop + chartHeight - barHeight;
        const radius = Math.min(3, barWidth / 2);

        context.fillStyle = colors[index];
        context.beginPath();
        context.moveTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.lineTo(x + barWidth - radius, y);
        context.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        context.lineTo(x + barWidth, padTop + chartHeight);
        context.lineTo(x, padTop + chartHeight);
        context.closePath();
        context.fill();

        context.save();
        context.translate(x + barWidth / 2, padTop + chartHeight + 8);
        context.rotate(Math.PI / 4);
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = "rgba(128,128,128,0.7)";
        context.font = "11px system-ui, sans-serif";
        context.fillText(labels[index], 0, 0);
        context.restore();
      }

      context.save();
      context.translate(14, padTop + chartHeight / 2);
      context.rotate(-Math.PI / 2);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "rgba(128,128,128,0.6)";
      context.font = "12px system-ui, sans-serif";
      context.fillText("Probabilidad", 0, 0);
      context.restore();
    }

    drawChart();
    window.addEventListener("resize", drawChart);

    return () => {
      window.removeEventListener("resize", drawChart);
    };
  }, [colors, data, labels, maxVal]);

  return <canvas ref={canvasRef} className="tsl-chart-canvas" />;
}

const PRESETS = [
  { label: "Greedy (t=0.1)", temp: 0.1, topP: 1.0 },
  { label: "Balanceado", temp: 0.7, topP: 0.9 },
  { label: "Creativo", temp: 1.2, topP: 0.95 },
  { label: "Caotico (t=1.8)", temp: 1.8, topP: 1.0 },
];

export default function TokenSamplingLab() {
  const [prompt, setPrompt] = useState("All you need is ___");
  const [temp, setTemp] = useState(1.0);
  const [topP, setTopP] = useState(1.0);
  const sampleCount = 50;

  const tokens = computeLogitsFromPrompt(prompt);
  const rawProbs = softmax(tokens.map((token) => token.logit), temp);
  const finalProbs = applyTopP(rawProbs, topP);
  const eligible = finalProbs.filter((prob) => prob > 0.0001).length;
  const ent = entropy(finalProbs);
  const topToken = tokens[0];
  const topProb = finalProbs[0];

  const samples = [];

  for (let index = 0; index < sampleCount; index += 1) {
    samples.push(sampleFrom(finalProbs));
  }

  const frequency = {};

  for (const index of samples) {
    const word = tokens[index].word;
    frequency[word] = (frequency[word] || 0) + 1;
  }

  const sortedFrequency = Object.entries(frequency).sort((left, right) => right[1] - left[1]);
  const barColors = finalProbs.map((prob) =>
    prob > 0.0001 ? "rgba(83, 74, 183, 0.85)" : "rgba(83, 74, 183, 0.12)",
  );
  const activeContexts = CONTEXT_MODIFIERS.filter((modifier) =>
    modifier.keywords.some((keyword) => prompt.toLowerCase().includes(keyword)),
  ).map((modifier) => modifier.keywords[0]);

  return (
    <div className="tsl-root">
      <div className="tsl-header">
        <h2 className="tsl-title">Laboratorio de sampling LLM</h2>
        <p className="tsl-subtitle">
          Explora como temperature, top-p y el contexto del prompt controlan la
          generacion de texto en un Large Language Model.
        </p>
      </div>

      <div className="tsl-section">
        <label className="tsl-label" htmlFor="tsl-prompt">
          Prompt (edita para ver como cambian los logits)
        </label>
        <input
          id="tsl-prompt"
          type="text"
          className="tsl-prompt-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Escribi un prompt..."
        />
        {activeContexts.length > 0 && (
          <div className="tsl-context-badge-row">
            <span className="tsl-context-label">Contextos detectados:</span>
            {activeContexts.map((context) => (
              <span key={context} className="tsl-context-badge">
                {context}
              </span>
            ))}
          </div>
        )}
        <p className="tsl-hint">
          Prueba incluir palabras como: <em>sueno</em>, <em>surreal</em>, <em>dinero</em>,{" "}
          <em>codigo</em>, <em>guerra</em>, <em>soledad</em>, <em>hambre</em>,{" "}
          <em>diseno</em>. Cada una reconfigura los logits como lo haria la attention
          en un modelo real.
        </p>
      </div>

      <div className="tsl-section">
        <div className="tsl-slider-row">
          <label className="tsl-slider-label" htmlFor="tsl-temp">
            Temperature (t)
          </label>
          <input
            id="tsl-temp"
            type="range"
            min={0.05}
            max={2.0}
            step={0.05}
            value={temp}
            onChange={(event) => setTemp(Number.parseFloat(event.target.value))}
            className="tsl-slider"
          />
          <span className="tsl-slider-value">{temp.toFixed(2)}</span>
        </div>
        <div className="tsl-slider-row">
          <label className="tsl-slider-label" htmlFor="tsl-top-p">
            Top-p (nucleus)
          </label>
          <input
            id="tsl-top-p"
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={topP}
            onChange={(event) => setTopP(Number.parseFloat(event.target.value))}
            className="tsl-slider"
          />
          <span className="tsl-slider-value">{topP.toFixed(2)}</span>
        </div>
      </div>

      <div className="tsl-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="tsl-preset-btn"
            type="button"
            onClick={() => {
              setTemp(preset.temp);
              setTopP(preset.topP);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="tsl-metrics">
        <div className="tsl-metric-card">
          <div className="tsl-metric-label">Entropia (bits)</div>
          <div className="tsl-metric-value">{ent.toFixed(2)}</div>
        </div>
        <div className="tsl-metric-card">
          <div className="tsl-metric-label">Tokens elegibles</div>
          <div className="tsl-metric-value">{eligible}</div>
          <div className="tsl-metric-sub">post top-p filter</div>
        </div>
        <div className="tsl-metric-card">
          <div className="tsl-metric-label">P({topToken.word})</div>
          <div className="tsl-metric-value">{(topProb * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="tsl-chart-container">
        <BarChart
          labels={tokens.map((token) => token.word)}
          data={finalProbs}
          colors={barColors}
          maxVal={Math.max(...finalProbs) * 1.15}
        />
      </div>

      <div className="tsl-section">
        <div className="tsl-label">
          {sampleCount} muestras para "{prompt}"
        </div>
        <div className="tsl-pills">
          {samples.map((index, sampleIndex) => {
            const word = tokens[index].word;
            const color = pillColor(word);

            return (
              <span
                key={`${word}-${sampleIndex}`}
                className="tsl-pill"
                style={{ backgroundColor: color.bg, color: color.fg }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <div className="tsl-section">
        <div className="tsl-label">Distribucion de muestras</div>
        <div className="tsl-freq-list">
          {sortedFrequency.map(([word, count]) => {
            const percentage = Math.round((count / sampleCount) * 100);

            return (
              <div key={word} className="tsl-freq-row">
                <span className="tsl-freq-word">{word}</span>
                <div className="tsl-freq-bar-bg">
                  <div
                    className="tsl-freq-bar-fill"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
                <span className="tsl-freq-count">
                  {count}/{sampleCount} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="tsl-note">
        <strong>Que estas viendo?</strong> Los logits son los valores crudos que el modelo
        asigna a cada token candidato. <code>softmax(logits / t)</code> los convierte en
        probabilidades. Temperature controla la entropia: valores bajos concentran la masa
        en el token mas probable, mientras que valores altos aplanan la distribucion. Top-p
        filtra la cola: solo los tokens cuya probabilidad acumulada supera p quedan
        elegibles. El contexto del prompt es lo que realmente mueve los logits antes del
        sampling.
      </div>
    </div>
  );
}
