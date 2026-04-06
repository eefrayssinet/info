import { useCallback, useEffect, useRef, useState } from "react";
import "./VectorSpaceLab.css";

function randomUnitVector(dimensions) {
  const vector = new Float32Array(dimensions);
  let norm = 0;

  for (let index = 0; index < dimensions; index += 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    vector[index] =
      Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
    norm += vector[index] * vector[index];
  }

  norm = Math.sqrt(norm);

  for (let index = 0; index < dimensions; index += 1) {
    vector[index] /= norm;
  }

  return vector;
}

function cosine(a, b) {
  let dot = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
  }

  return dot;
}

function computeSimilarities(dimensions) {
  const sampleCount = dimensions <= 16 ? 200 : dimensions <= 256 ? 150 : 100;
  const vectors = [];

  for (let index = 0; index < sampleCount; index += 1) {
    vectors.push(randomUnitVector(dimensions));
  }

  const similarities = [];

  for (let left = 0; left < sampleCount; left += 1) {
    for (let right = left + 1; right < sampleCount; right += 1) {
      similarities.push(cosine(vectors[left], vectors[right]));
    }
  }

  return similarities;
}

function histogram(similarities, bins = 40) {
  const min = -1;
  const max = 1;
  const step = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  const labels = [];

  for (let index = 0; index < bins; index += 1) {
    labels.push((min + (index + 0.5) * step).toFixed(2));
  }

  for (const similarity of similarities) {
    let binIndex = Math.floor((similarity - min) / step);

    if (binIndex >= bins) {
      binIndex = bins - 1;
    }

    if (binIndex < 0) {
      binIndex = 0;
    }

    counts[binIndex] += 1;
  }

  const total = similarities.length || 1;

  return {
    labels,
    data: counts.map((count) => Math.round((count / total) * 1000) / 10),
  };
}

function getCapacityText(dimensions) {
  if (dimensions <= 3) {
    return `${dimensions} direcciones ortogonales exactas. Pocas mas antes de interferencia. Insuficiente para un lenguaje rico.`;
  }

  if (dimensions <= 64) {
    return `Aprox. ${dimensions * 2}-${dimensions * 5} conceptos casi independientes con superposicion sparse.`;
  }

  if (dimensions <= 768) {
    return `Aprox. ${(dimensions * 5).toLocaleString()}-${(dimensions * 15).toLocaleString()} features. Rango tipico de modelos de embedding.`;
  }

  return `Aprox. ${(dimensions * 10).toLocaleString()}-${(dimensions * 50).toLocaleString()}+ features via superposicion. Escala de LLMs grandes.`;
}

function HistogramChart({ labels, data }) {
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

      const padLeft = 50;
      const padRight = 12;
      const padTop = 8;
      const padBottom = 50;
      const chartWidth = width - padLeft - padRight;
      const chartHeight = height - padTop - padBottom;
      const yMax = Math.max(...data, 1);
      const yTicks = 5;

      context.font = "11px system-ui, sans-serif";
      context.textAlign = "right";
      context.textBaseline = "middle";

      for (let index = 0; index <= yTicks; index += 1) {
        const value = (yMax / yTicks) * index;
        const y = padTop + chartHeight - (chartHeight * (value / yMax));

        context.strokeStyle = "rgba(128,128,128,0.12)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(padLeft, y);
        context.lineTo(padLeft + chartWidth, y);
        context.stroke();

        context.fillStyle = "rgba(128,128,128,0.55)";
        context.fillText(`${value.toFixed(1)}%`, padLeft - 6, y);
      }

      const gap = 1;
      const barWidth = Math.max((chartWidth - gap * (data.length + 1)) / data.length, 1);

      for (let index = 0; index < data.length; index += 1) {
        const x = padLeft + gap + index * (barWidth + gap);
        const barHeight = (data[index] / yMax) * chartHeight;
        const y = padTop + chartHeight - barHeight;
        const radius = Math.min(2, barWidth / 2);

        context.fillStyle = "rgba(83, 74, 183, 0.8)";
        context.beginPath();
        context.moveTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.lineTo(x + barWidth - radius, y);
        context.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        context.lineTo(x + barWidth, padTop + chartHeight);
        context.lineTo(x, padTop + chartHeight);
        context.closePath();
        context.fill();
      }

      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillStyle = "rgba(128,128,128,0.55)";
      context.font = "11px system-ui, sans-serif";

      const labelEvery = Math.max(1, Math.floor(data.length / 8));

      for (let index = 0; index < data.length; index += labelEvery) {
        const x = padLeft + gap + index * (barWidth + gap) + barWidth / 2;
        context.fillText(labels[index], x, padTop + chartHeight + 6);
      }

      context.save();
      context.translate(14, padTop + chartHeight / 2);
      context.rotate(-Math.PI / 2);
      context.textAlign = "center";
      context.fillStyle = "rgba(128,128,128,0.55)";
      context.font = "12px system-ui, sans-serif";
      context.fillText("% de pares", 0, 0);
      context.restore();

      context.textAlign = "center";
      context.fillStyle = "rgba(128,128,128,0.55)";
      context.font = "12px system-ui, sans-serif";
      context.fillText("Similitud coseno", padLeft + chartWidth / 2, height - 8);
    }

    drawChart();
    window.addEventListener("resize", drawChart);

    return () => {
      window.removeEventListener("resize", drawChart);
    };
  }, [data, labels]);

  return <canvas ref={canvasRef} className="vsl-chart-canvas" />;
}

const PRESETS = [
  { label: "2D", value: 2 },
  { label: "64D", value: 64 },
  { label: "768D", value: 768 },
  { label: "4096D", value: 4096 },
];

export default function VectorSpaceLab() {
  const [dimensions, setDimensions] = useState(2);
  const [result, setResult] = useState(null);
  const debounceRef = useRef(null);

  const compute = useCallback((currentDimensions) => {
    const similarities = computeSimilarities(currentDimensions);
    const chart = histogram(similarities);
    const mean =
      similarities.reduce((total, value) => total + value, 0) / similarities.length;
    const variance =
      similarities.reduce((total, value) => total + (value - mean) ** 2, 0) /
      similarities.length;
    const std = Math.sqrt(variance);
    const almostOrthogonal = similarities.filter((value) => Math.abs(value) < 0.1).length;
    const orthogonalPct = Math.round((almostOrthogonal / similarities.length) * 100);

    setResult({
      hist: chart,
      mean,
      std,
      orthogonalPct,
      capacity: getCapacityText(currentDimensions),
    });
  }, []);

  useEffect(() => {
    compute(dimensions);
  }, [compute, dimensions]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleSliderChange(event) {
    const nextDimensions = Number.parseInt(event.target.value, 10);
    setDimensions(nextDimensions);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => compute(nextDimensions), 80);
  }

  function handlePreset(value) {
    setDimensions(value);
    compute(value);
  }

  if (!result) {
    return null;
  }

  return (
    <div className="vsl-root">
      <div className="vsl-header">
        <h2 className="vsl-title">Vectores en alta dimensionalidad</h2>
        <p className="vsl-subtitle">
          En cada dimension se generan vectores unitarios aleatorios y se computan
          todas las similitudes coseno entre pares. Observa como la distribucion se
          concentra en 0 a medida que suben las dimensiones.
        </p>
      </div>

      <div className="vsl-section">
        <div className="vsl-slider-row">
          <label className="vsl-slider-label" htmlFor="vsl-dimensions">
            Dimensiones
          </label>
          <input
            id="vsl-dimensions"
            type="range"
            min={2}
            max={4096}
            step={1}
            value={dimensions}
            onChange={handleSliderChange}
            className="vsl-slider"
          />
          <span className="vsl-slider-value">{dimensions}</span>
        </div>
      </div>

      <div className="vsl-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            className={`vsl-preset-btn ${
              dimensions === preset.value ? "vsl-preset-btn--active" : ""
            }`}
            type="button"
            onClick={() => handlePreset(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="vsl-metrics">
        <div className="vsl-metric-card">
          <div className="vsl-metric-label">Media coseno</div>
          <div className="vsl-metric-value">{result.mean.toFixed(3)}</div>
        </div>
        <div className="vsl-metric-card">
          <div className="vsl-metric-label">Desv. estandar</div>
          <div className="vsl-metric-value">{result.std.toFixed(3)}</div>
        </div>
        <div className="vsl-metric-card">
          <div className="vsl-metric-label">Casi ortogonales</div>
          <div className="vsl-metric-value">{result.orthogonalPct}%</div>
          <div className="vsl-metric-sub">|cos| &lt; 0.1</div>
        </div>
      </div>

      <div className="vsl-chart-container">
        <HistogramChart labels={result.hist.labels} data={result.hist.data} />
      </div>

      <div className="vsl-capacity-card">
        <div className="vsl-capacity-label">Capacidad conceptual estimada</div>
        <div className="vsl-capacity-text">{result.capacity}</div>
      </div>

      <div className="vsl-note">
        <strong>Por que importa?</strong> En un LLM, cada concepto es una direccion en un
        espacio de alta dimensionalidad. Si dos direcciones son ortogonales, los conceptos
        interfieren mucho menos entre si. En 2D apenas caben unas pocas direcciones
        independientes; en 4096D, la concentracion de medida hace que casi todos los pares
        de vectores aleatorios sean casi ortogonales.
      </div>
    </div>
  );
}
