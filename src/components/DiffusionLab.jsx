import { useCallback, useEffect, useRef, useState } from "react";
import "./DiffusionLab.css";

function drawCircle(x, y, centerX, centerY, radius, color, background) {
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

  if (distance <= radius) {
    const edge = Math.max(0, 1 - Math.abs(distance - radius) / 1.5);
    return color.map((channel, index) =>
      Math.round(channel * (1 - edge * 0.15) + background[index] * edge * 0.15),
    );
  }

  return background;
}

function drawSquare(x, y, centerX, centerY, halfSize, color, background) {
  if (Math.abs(x - centerX) <= halfSize && Math.abs(y - centerY) <= halfSize) {
    return color;
  }

  return background;
}

function drawTriangle(x, y, centerX, centerY, radius, color, background) {
  const top = centerY - radius;
  const bottom = centerY + radius * 0.8;
  const height = bottom - top;

  if (y < top || y > bottom) {
    return background;
  }

  const progress = (y - top) / height;
  const halfWidth = progress * radius * 0.9;
  return Math.abs(x - centerX) <= halfWidth ? color : background;
}

function drawStar(x, y, centerX, centerY, radius, color, background) {
  const dx = x - centerX;
  const dy = y - centerY;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);
  const points = 5;
  const innerRadius = radius * 0.4;
  const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
  const sector = (Math.PI * 2) / points;
  const halfSector = sector / 2;
  const sectorPosition = normalizedAngle % sector;
  const blend =
    sectorPosition < halfSector
      ? sectorPosition / halfSector
      : (sector - sectorPosition) / halfSector;
  const boundary = innerRadius + (radius - innerRadius) * blend;

  return distance <= boundary ? color : background;
}

function drawDiamond(x, y, centerX, centerY, radius, color, background) {
  const dx = Math.abs(x - centerX);
  const dy = Math.abs(y - centerY);
  return dx / radius + dy / (radius * 1.3) <= 1 ? color : background;
}

function drawHeart(x, y, centerX, centerY, radius, color, background) {
  const normalizedX = (x - centerX) / radius;
  const normalizedY = (y - centerY) / radius;
  const shiftedY = normalizedY - 0.2;
  const equation = normalizedX * normalizedX + shiftedY * shiftedY - 1;
  const value =
    equation * equation * equation -
    normalizedX * normalizedX * shiftedY * shiftedY * shiftedY;
  return value <= 0 ? color : background;
}

const PROMPTS = [
  {
    id: "red-circle",
    label: "Un circulo rojo",
    tokens: ["un", "circulo", "rojo"],
    tokenRoles: ["structure", "shape", "color"],
    color: [220, 55, 55],
    draw: (x, y, size) =>
      drawCircle(x, y, size / 2, size / 2, size * 0.32, [220, 55, 55], [245, 242, 235]),
  },
  {
    id: "blue-square",
    label: "Un cuadrado azul",
    tokens: ["un", "cuadrado", "azul"],
    tokenRoles: ["structure", "shape", "color"],
    color: [55, 95, 210],
    draw: (x, y, size) =>
      drawSquare(x, y, size / 2, size / 2, size * 0.28, [55, 95, 210], [245, 242, 235]),
  },
  {
    id: "green-triangle",
    label: "Un triangulo verde",
    tokens: ["un", "triangulo", "verde"],
    tokenRoles: ["structure", "shape", "color"],
    color: [45, 170, 75],
    draw: (x, y, size) =>
      drawTriangle(x, y, size / 2, size / 2, size * 0.34, [45, 170, 75], [245, 242, 235]),
  },
  {
    id: "yellow-star",
    label: "Una estrella amarilla",
    tokens: ["una", "estrella", "amarilla"],
    tokenRoles: ["structure", "shape", "color"],
    color: [230, 190, 30],
    draw: (x, y, size) =>
      drawStar(x, y, size / 2, size / 2, size * 0.35, [230, 190, 30], [245, 242, 235]),
  },
  {
    id: "pink-diamond",
    label: "Un diamante rosa",
    tokens: ["un", "diamante", "rosa"],
    tokenRoles: ["structure", "shape", "color"],
    color: [212, 83, 126],
    draw: (x, y, size) =>
      drawDiamond(x, y, size / 2, size / 2, size * 0.28, [212, 83, 126], [245, 242, 235]),
  },
  {
    id: "purple-heart",
    label: "Un corazon violeta",
    tokens: ["un", "corazon", "violeta"],
    tokenRoles: ["structure", "shape", "color"],
    color: [127, 119, 221],
    draw: (x, y, size) =>
      drawHeart(x, y, size / 2, size / 2, size * 0.32, [127, 119, 221], [245, 242, 235]),
  },
];

const TOTAL_STEPS = 24;
const CANVAS_SIZE = 48;
const DISPLAY_SIZE = 220;

function generateNoise(size) {
  const noise = [];

  for (let index = 0; index < size * size; index += 1) {
    noise.push([Math.random() * 255, Math.random() * 255, Math.random() * 255]);
  }

  return noise;
}

function getAttentionWeights(step, tokenRoles) {
  const progress = step / TOTAL_STEPS;

  return tokenRoles.map((role) => {
    if (role === "structure") {
      return 0.1 + progress * 0.1;
    }

    if (role === "shape") {
      if (progress < 0.3) {
        return 0.2 + progress * 2.0;
      }

      if (progress < 0.7) {
        return 0.8;
      }

      return 0.8 - (progress - 0.7) * 1.0;
    }

    if (role === "color") {
      if (progress < 0.2) {
        return 0.1;
      }

      if (progress < 0.6) {
        return 0.1 + (progress - 0.2) * 2.0;
      }

      return 0.9;
    }

    return 0.3;
  });
}

function getPhaseInfo(step) {
  const progress = step / TOTAL_STEPS;

  if (step === 0) {
    return {
      phase: "Ruido puro",
      desc: "x_T ~ N(0, I). No hay senal; el texto todavia no orienta la imagen.",
    };
  }

  if (progress <= 0.25) {
    return {
      phase: "Estructura global",
      desc: 'La U-Net detecta composicion. Cross-attention consulta "forma" para ubicar el objeto.',
    };
  }

  if (progress <= 0.55) {
    return {
      phase: "Forma + color",
      desc: "La forma define bordes; los tokens de color empiezan a inyectar informacion cromatica.",
    };
  }

  if (progress <= 0.8) {
    return {
      phase: "Refinamiento",
      desc: "La senal domina. Cross-attention refina consistencia y color en cada parche.",
    };
  }

  return {
    phase: "Limpieza final",
    desc: "Se elimina el ruido residual y la imagen converge al objetivo condicionado por el texto.",
  };
}

function renderImageData(noise, prompt, step, size) {
  const progress = step / TOTAL_STEPS;
  const signal = progress < 0.1 ? progress * 0.5 : Math.pow(progress, 0.7);
  const noiseWeight = 1 - signal;
  const data = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const pixelIndex = y * size + x;
      const target = prompt.draw(x, y, size);
      const sourceNoise = noise[pixelIndex];
      const dataIndex = pixelIndex * 4;

      data[dataIndex] = Math.round(sourceNoise[0] * noiseWeight + target[0] * signal);
      data[dataIndex + 1] = Math.round(sourceNoise[1] * noiseWeight + target[1] * signal);
      data[dataIndex + 2] = Math.round(sourceNoise[2] * noiseWeight + target[2] * signal);
      data[dataIndex + 3] = 255;
    }
  }

  return data;
}

function PixelCanvas({ noise, prompt, step, size, displaySize, label }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !noise.length) {
      return;
    }

    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    const imageData = new ImageData(renderImageData(noise, prompt, step, size), size, size);
    context.putImageData(imageData, 0, 0);
  }, [noise, prompt, size, step]);

  return (
    <div className="dl-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="dl-canvas"
        style={{ width: displaySize, height: displaySize }}
      />
      {label ? <div className="dl-canvas-label">{label}</div> : null}
    </div>
  );
}

function AttentionBar({ token, weight, role }) {
  const roleColors = {
    structure: { bar: "var(--dl-gray)", pill: "var(--dl-gray-bg)" },
    shape: { bar: "var(--dl-purple)", pill: "var(--dl-purple-bg)" },
    color: { bar: "var(--dl-coral)", pill: "var(--dl-coral-bg)" },
  };
  const colors = roleColors[role] || roleColors.structure;
  const percentage = Math.round(weight * 100);

  return (
    <div className="dl-attn-row">
      <span className="dl-attn-token">{token}</span>
      <span className="dl-attn-role-pill" style={{ background: colors.pill }}>
        {role === "shape" ? "forma" : role === "color" ? "color" : "articulo"}
      </span>
      <div className="dl-attn-bar-bg">
        <div
          className="dl-attn-bar-fill"
          style={{ width: `${percentage}%`, background: colors.bar }}
        />
      </div>
      <span className="dl-attn-pct">{percentage}%</span>
    </div>
  );
}

export default function DiffusionLab() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [noise, setNoise] = useState(() => generateNoise(CANVAS_SIZE));
  const [isAnimating, setIsAnimating] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const animationRef = useRef(null);

  const prompt = PROMPTS[promptIndex];
  const phase = getPhaseInfo(step);
  const attentionWeights = getAttentionWeights(step, prompt.tokenRoles);
  const noiseRemaining = Math.round((1 - step / TOTAL_STEPS) * 100);
  const signalToNoise = step === 0 ? 0 : step / (TOTAL_STEPS - step + 0.01);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }

    setIsAnimating(false);
  }, []);

  const resetNoise = useCallback(() => {
    setNoise(generateNoise(CANVAS_SIZE));
    setStep(0);
    stopAnimation();
  }, [stopAnimation]);

  const animate = useCallback(() => {
    stopAnimation();
    setStep(0);
    setIsAnimating(true);

    let currentStep = 0;

    function tick() {
      currentStep += 1;

      if (currentStep > TOTAL_STEPS) {
        setIsAnimating(false);
        animationRef.current = null;
        return;
      }

      setStep(currentStep);
      animationRef.current = setTimeout(tick, 180);
    }

    animationRef.current = setTimeout(tick, 350);
  }, [stopAnimation]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  function handleStepChange(event) {
    stopAnimation();
    setStep(Number.parseInt(event.target.value, 10));
  }

  function handlePromptChange(index) {
    setPromptIndex(index);
  }

  return (
    <div className="dl-root">
      <div className="dl-header">
        <h2 className="dl-title">Diffusion denoising lab</h2>
        <p className="dl-subtitle">
          Visualizacion del proceso de denoising en un modelo de difusion. El mismo
          ruido inicial converge a imagenes distintas segun el prompt; la direccion la
          define cross-attention.
        </p>
      </div>

      <div className="dl-section">
        <label className="dl-label">Prompt (cambia sin resetear el paso para ver el efecto)</label>
        <div className="dl-prompt-grid">
          {PROMPTS.map((currentPrompt, index) => (
            <button
              key={currentPrompt.id}
              className={`dl-prompt-btn ${index === promptIndex ? "dl-prompt-btn--active" : ""}`}
              type="button"
              onClick={() => handlePromptChange(index)}
            >
              <span
                className="dl-prompt-dot"
                style={{ background: `rgb(${currentPrompt.color.join(",")})` }}
              />
              {currentPrompt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dl-viz-area">
        <div className="dl-viz-left">
          <div className="dl-label">Cross-attention weights</div>
          <div className="dl-attn-list">
            {prompt.tokens.map((token, index) => (
              <AttentionBar
                key={token}
                token={token}
                weight={attentionWeights[index]}
                role={prompt.tokenRoles[index]}
              />
            ))}
          </div>
          <div className="dl-phase-card">
            <div className="dl-phase-name">{phase.phase}</div>
            <div className="dl-phase-desc">{phase.desc}</div>
          </div>
        </div>

        <div className="dl-viz-right">
          {!compareMode ? (
            <PixelCanvas
              noise={noise}
              prompt={prompt}
              step={step}
              size={CANVAS_SIZE}
              displaySize={DISPLAY_SIZE}
              label={`Paso ${step}/${TOTAL_STEPS}`}
            />
          ) : (
            <div className="dl-compare-grid">
              {PROMPTS.map((currentPrompt) => (
                <PixelCanvas
                  key={currentPrompt.id}
                  noise={noise}
                  prompt={currentPrompt}
                  step={step}
                  size={CANVAS_SIZE}
                  displaySize={100}
                  label={currentPrompt.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dl-section">
        <div className="dl-slider-row">
          <label className="dl-slider-label" htmlFor="dl-step">
            Timestep (t)
          </label>
          <input
            id="dl-step"
            type="range"
            min={0}
            max={TOTAL_STEPS}
            step={1}
            value={step}
            onChange={handleStepChange}
            className="dl-slider"
          />
          <span className="dl-slider-value">{step}</span>
        </div>
      </div>

      <div className="dl-controls">
        <button
          className="dl-btn dl-btn--primary"
          type="button"
          onClick={animate}
          disabled={isAnimating}
        >
          {isAnimating ? "Denoisando..." : "Animar denoising"}
        </button>
        <button className="dl-btn" type="button" onClick={resetNoise}>
          Nuevo ruido
        </button>
        <button
          className={`dl-btn ${compareMode ? "dl-btn--active" : ""}`}
          type="button"
          onClick={() => setCompareMode((current) => !current)}
        >
          {compareMode ? "Vista simple" : "Comparar todos"}
        </button>
      </div>

      <div className="dl-metrics">
        <div className="dl-metric-card">
          <div className="dl-metric-label">Ruido restante</div>
          <div className="dl-metric-value">{noiseRemaining}%</div>
        </div>
        <div className="dl-metric-card">
          <div className="dl-metric-label">Signal / noise</div>
          <div className="dl-metric-value">{signalToNoise > 50 ? "inf" : signalToNoise.toFixed(1)}</div>
        </div>
        <div className="dl-metric-card">
          <div className="dl-metric-label">Cross-attn</div>
          <div className="dl-metric-value">
            {step === 0 ? "Off" : step <= 6 ? "Parcial" : "Activo"}
          </div>
        </div>
        <div className="dl-metric-card">
          <div className="dl-metric-label">Fase</div>
          <div className="dl-metric-value dl-metric-value--small">{phase.phase}</div>
        </div>
      </div>

      <div className="dl-formula-card">
        <div className="dl-formula-title">En cada paso de denoising</div>
        <code className="dl-formula">
          x<sub>t-1</sub> = x<sub>t</sub> - eps<sub>theta</sub>(x<sub>t</sub>, t, c)
        </code>
        <div className="dl-formula-legend">
          <span>
            <strong>x<sub>t</sub></strong> = latente ruidoso
          </span>
          <span>
            <strong>eps<sub>theta</sub></strong> = ruido predicho por U-Net
          </span>
          <span>
            <strong>c</strong> = embedding del texto via cross-attention
          </span>
        </div>
      </div>

      <div className="dl-note">
        <strong>Que estas viendo?</strong> Cada pixel empieza como ruido gaussiano puro.
        En cada paso, la U-Net predice que ruido quitar, pero la direccion de esa
        prediccion la define <code>cross-attention</code> contra los tokens del prompt.
        Los tokens de forma dominan los pasos tempranos y los de color ganan peso en
        los pasos medios. El mismo ruido inicial produce imagenes distintas; la unica
        diferencia es el texto que condiciona la prediccion de ruido.
      </div>
    </div>
  );
}
