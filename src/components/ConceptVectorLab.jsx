import { useCallback, useEffect, useRef, useState } from "react";
import "./ConceptVectorLab.css";

const CLUSTERS = [
  {
    name: "Alta costura",
    color: "#D4537E",
    glowBase: [212, 83, 126],
    items: ["desfile", "haute couture", "ropa conceptual", "pasarela", "atelier", "Balenciaga"],
    center: { x: -2.6, y: 2.4, z: -0.8 },
  },
  {
    name: "Textiles",
    color: "#7F77DD",
    glowBase: [127, 119, 221],
    items: ["seda", "organza", "tafeta", "encaje", "tul", "lino"],
    center: { x: -1.0, y: 1.2, z: 1.8 },
  },
  {
    name: "Confeccion",
    color: "#D85A30",
    glowBase: [216, 90, 48],
    items: ["patronaje", "drapeado", "molderia", "sastreria", "costura", "avio"],
    center: { x: 0.8, y: 2.8, z: 0.5 },
  },
  {
    name: "Mobiliario",
    color: "#1D9E75",
    glowBase: [29, 158, 117],
    items: ["silla", "mesa", "lampara", "estante", "sofa", "banco"],
    center: { x: 2.8, y: -1.8, z: -1.5 },
  },
  {
    name: "Gastronomia",
    color: "#378ADD",
    glowBase: [55, 138, 221],
    items: ["receta", "ingrediente", "coccion", "plato", "menu", "mise en place"],
    center: { x: -2.0, y: -2.5, z: -2.0 },
  },
  {
    name: "Tecnologia",
    color: "#888780",
    glowBase: [136, 135, 128],
    items: ["algoritmo", "servidor", "codigo", "base de datos", "API", "deploy"],
    center: { x: 2.0, y: -0.5, z: 2.8 },
  },
];

const VECTOR_TARGET = { x: -2.6, y: 2.4, z: -0.8 };
const VECTOR_WRONG = { x: 1.8, y: -1.2, z: 1.5 };

function seed(value) {
  return Math.sin(value * 127.1 + 311.7) * 0.5;
}

function buildPoints() {
  const points = [];

  CLUSTERS.forEach((cluster, clusterIndex) => {
    cluster.items.forEach((item, itemIndex) => {
      const baseSeed = clusterIndex * 73 + itemIndex * 31;

      points.push({
        label: item,
        color: cluster.color,
        jx: seed(baseSeed + 1) * 0.55,
        jy: seed(baseSeed + 2) * 0.55,
        jz: seed(baseSeed + 3) * 0.55,
        target: cluster.center,
        x: 0,
        y: 0,
        z: 0,
      });
    });
  });

  return points;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getVectorEnd(amount) {
  const ease = amount < 0.1 ? amount * 2 : Math.min(1, Math.pow(amount, 0.5));
  const wobble = amount < 0.3 ? Math.sin(amount * 20) * (1 - amount * 3) * 0.5 : 0;

  return {
    x: lerp(VECTOR_WRONG.x, VECTOR_TARGET.x, ease) + wobble * 0.8,
    y: lerp(VECTOR_WRONG.y, VECTOR_TARGET.y, ease) + wobble * 0.5,
    z: lerp(VECTOR_WRONG.z, VECTOR_TARGET.z, ease) - wobble * 0.3,
  };
}

function paramLabel(amount) {
  if (amount < 0.05) {
    return "1K";
  }

  if (amount < 0.15) {
    return "10K";
  }

  if (amount < 0.25) {
    return "100K";
  }

  if (amount < 0.4) {
    return "1M";
  }

  if (amount < 0.55) {
    return "10M";
  }

  if (amount < 0.7) {
    return "100M";
  }

  if (amount < 0.85) {
    return "1B";
  }

  if (amount < 0.95) {
    return "10B";
  }

  return "70B";
}

function getDescription(amount) {
  if (amount < 0.08) {
    return {
      title: "1K parametros",
      text: 'El vector no tiene direccion significativa. El espacio es tan chico que "vestido de alta costura" queda mezclado con "algoritmo" y "receta".',
    };
  }

  if (amount < 0.25) {
    return {
      title: "~100K parametros",
      text: 'El vector empieza a orientarse pero oscila entre regiones. Distingue vagamente que "vestido" tiene que ver con objetos materiales, aunque todavia mezcla dominios.',
    };
  }

  if (amount < 0.5) {
    return {
      title: "~10M parametros",
      text: "El vector ya apunta hacia la zona de moda y textiles. El modelo sabe que es ropa, no comida ni codigo, pero aun no separa bien material, tecnica y concepto.",
    };
  }

  if (amount < 0.75) {
    return {
      title: "~1B parametros",
      text: 'El vector se acerca al cluster de alta costura. El modelo ya distingue tecnica, material y concepto; "desfile" y "pasarela" aparecen como vecinos cercanos.',
    };
  }

  return {
    title: "~70B parametros",
    text: 'El vector apunta con precision al cluster de alta costura y mantiene distancia razonable con textiles, tecnologia y gastronomia. El espacio semantico ya esta mucho mejor resuelto.',
  };
}

function getAimInfo(amount) {
  if (amount < 0.08) {
    return { text: "aleatorio", className: "cvl-aim--gray" };
  }

  if (amount < 0.3) {
    return { text: "vago / impreciso", className: "cvl-aim--coral" };
  }

  if (amount < 0.6) {
    return { text: "zona textil/moda", className: "cvl-aim--purple" };
  }

  return { text: "alta costura", className: "cvl-aim--pink" };
}

const PRESETS = [
  { label: "1K", value: 0 },
  { label: "1M", value: 33 },
  { label: "1B", value: 66 },
  { label: "70B", value: 100 },
];

const LEGEND = [
  { label: "Alta costura", color: "#D4537E" },
  { label: "Textiles", color: "#7F77DD" },
  { label: "Confeccion", color: "#D85A30" },
  { label: "Mobiliario", color: "#1D9E75" },
  { label: "Gastronomia", color: "#378ADD" },
  { label: "Tecnologia", color: "#888780" },
];

export default function ConceptVectorLab() {
  const canvasRef = useRef(null);
  const pointsRef = useRef(buildPoints());
  const rotationRef = useRef({ y: 0.5, x: 0.25 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const autoRotateRef = useRef(true);
  const rafRef = useRef(null);
  const [paramAmount, setParamAmount] = useState(0);

  const vectorEnd = getVectorEnd(paramAmount);
  const vectorLength = Math.sqrt(vectorEnd.x ** 2 + vectorEnd.y ** 2 + vectorEnd.z ** 2);
  const targetLength = Math.sqrt(
    VECTOR_TARGET.x ** 2 + VECTOR_TARGET.y ** 2 + VECTOR_TARGET.z ** 2,
  );
  const cosine =
    (vectorEnd.x * VECTOR_TARGET.x +
      vectorEnd.y * VECTOR_TARGET.y +
      vectorEnd.z * VECTOR_TARGET.z) /
    (vectorLength * targetLength);

  const updatePositions = useCallback((amount) => {
    pointsRef.current.forEach((point) => {
      const jitterScale = 0.25 + amount * 0.4;
      point.x = point.target.x * amount + point.jx * jitterScale;
      point.y = point.target.y * amount + point.jy * jitterScale;
      point.z = point.target.z * amount + point.jz * jitterScale;
    });
  }, []);

  const project = useCallback((x, y, z, width, height) => {
    const rotation = rotationRef.current;
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);

    const rotatedX = x * cosY - z * sinY;
    const rotatedZ = x * sinY + z * cosY;
    const rotatedY = y * cosX - rotatedZ * sinX;
    const projectedZ = y * sinX + rotatedZ * cosX;
    const distance = 8;
    const scale = distance / (distance + projectedZ);

    return {
      sx: width / 2 + rotatedX * scale * (width / 8),
      sy: height / 2 - rotatedY * scale * (height / 8),
      depth: projectedZ,
      scale,
    };
  }, []);

  const drawArrowHead = useCallback((context, fromX, fromY, toX, toY, size, color) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    context.save();
    context.translate(toX, toY);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-size, -size * 0.45);
    context.lineTo(-size, size * 0.45);
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.restore();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext("2d");
    context.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    context.fillStyle = isDark ? "#111426" : "#fafaf8";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)";
    context.lineWidth = 0.5;

    for (let index = -4; index <= 4; index += 1) {
      const gridA = project(index, 0, -4, width, height);
      const gridB = project(index, 0, 4, width, height);
      context.beginPath();
      context.moveTo(gridA.sx, gridA.sy);
      context.lineTo(gridB.sx, gridB.sy);
      context.stroke();

      const gridC = project(-4, 0, index, width, height);
      const gridD = project(4, 0, index, width, height);
      context.beginPath();
      context.moveTo(gridC.sx, gridC.sy);
      context.lineTo(gridD.sx, gridD.sy);
      context.stroke();
    }

    const currentAmount = Number.parseFloat(canvas.dataset.paramAmount || "0");

    if (currentAmount > 0.1) {
      const alpha = Math.min((currentAmount - 0.1) * 1.2, 0.13);

      CLUSTERS.forEach((cluster) => {
        const clusterPoint = project(
          cluster.center.x * currentAmount,
          cluster.center.y * currentAmount,
          cluster.center.z * currentAmount,
          width,
          height,
        );
        const radius = (25 + currentAmount * 40) * clusterPoint.scale;
        const [red, green, blue] = cluster.glowBase;

        context.beginPath();
        context.arc(clusterPoint.sx, clusterPoint.sy, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        context.fill();
      });
    }

    const sortedPoints = pointsRef.current
      .map((point) => ({ ...point, ...project(point.x, point.y, point.z, width, height) }))
      .sort((left, right) => right.depth - left.depth);

    sortedPoints.forEach((point) => {
      const radius = Math.max(2.5, 5.5 * point.scale);
      const alpha = Math.max(0.35, Math.min(1, 0.4 + point.scale * 0.6));

      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(point.sx, point.sy, radius, 0, Math.PI * 2);
      context.fillStyle = point.color;
      context.fill();
      context.globalAlpha = 1;

      if (point.scale > 0.65) {
        const fontSize = Math.round(9 + (point.scale - 0.65) * 10);
        context.font = `500 ${fontSize}px system-ui, sans-serif`;
        context.fillStyle = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)";
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillText(point.label, point.sx + radius + 3, point.sy);
      }
    });

    const currentVector = getVectorEnd(currentAmount);
    const currentLength = Math.sqrt(
      currentVector.x ** 2 + currentVector.y ** 2 + currentVector.z ** 2,
    );
    const normalizedVector = {
      x: (currentVector.x / currentLength) * 3.5,
      y: (currentVector.y / currentLength) * 3.5,
      z: (currentVector.z / currentLength) * 3.5,
    };
    const origin = project(0, 0, 0, width, height);
    const endPoint = project(
      normalizedVector.x,
      normalizedVector.y,
      normalizedVector.z,
      width,
      height,
    );

    context.strokeStyle = "#D4537E";
    context.lineWidth = 2.5;
    context.globalAlpha = 0.9;
    context.beginPath();
    context.moveTo(origin.sx, origin.sy);
    context.lineTo(endPoint.sx, endPoint.sy);
    context.stroke();
    context.globalAlpha = 1;

    drawArrowHead(
      context,
      origin.sx,
      origin.sy,
      endPoint.sx,
      endPoint.sy,
      12,
      "#D4537E",
    );

    const labelPoint = project(
      normalizedVector.x * 1.12,
      normalizedVector.y * 1.12,
      normalizedVector.z * 1.12,
      width,
      height,
    );
    const labelSize = Math.round(11 + endPoint.scale * 3);

    context.font = `600 ${labelSize}px system-ui, sans-serif`;
    context.fillStyle = "#D4537E";
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.fillText("vestido de alta costura", labelPoint.sx, labelPoint.sy - 6);

    context.beginPath();
    context.arc(origin.sx, origin.sy, 4, 0, Math.PI * 2);
    context.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
    context.fill();
  }, [drawArrowHead, project]);

  useEffect(() => {
    function loop() {
      if (autoRotateRef.current) {
        rotationRef.current.y += 0.003;
        draw();
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.paramAmount = String(paramAmount);
    }

    updatePositions(paramAmount);
    draw();
  }, [draw, paramAmount, updatePositions]);

  const handlePointerDown = useCallback((x, y) => {
    dragRef.current = { active: true, lastX: x, lastY: y };
    autoRotateRef.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (x, y) => {
      const dragState = dragRef.current;

      if (!dragState.active) {
        return;
      }

      rotationRef.current.y += (x - dragState.lastX) * 0.007;
      rotationRef.current.x += (y - dragState.lastY) * 0.007;
      rotationRef.current.x = Math.max(-1.2, Math.min(1.2, rotationRef.current.x));
      dragState.lastX = x;
      dragState.lastY = y;
      draw();
    },
    [draw],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  updatePositions(paramAmount);

  const normalizedVector = {
    x: (vectorEnd.x / vectorLength) * 3.5,
    y: (vectorEnd.y / vectorLength) * 3.5,
    z: (vectorEnd.z / vectorLength) * 3.5,
  };

  let nearest = "-";
  let minDistance = Infinity;

  pointsRef.current.forEach((point) => {
    const dx = point.x - normalizedVector.x;
    const dy = point.y - normalizedVector.y;
    const dz = point.z - normalizedVector.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = point.label;
    }
  });

  const aimInfo = getAimInfo(paramAmount);
  const description = getDescription(paramAmount);

  function handleSliderChange(event) {
    setParamAmount(Number.parseInt(event.target.value, 10) / 100);
  }

  function handlePreset(value) {
    setParamAmount(value / 100);
  }

  return (
    <div className="cvl-root">
      <div className="cvl-header">
        <h2 className="cvl-title">Vector query en espacio de conceptos</h2>
        <p className="cvl-subtitle">
          Como la cantidad de parametros determina la capacidad del modelo para orientar
          un vector hacia la region semantica correcta.
        </p>
      </div>

      <div className="cvl-vector-badge">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <line
            x1="2"
            y1="16"
            x2="15"
            y2="3"
            stroke="#D4537E"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M11 2L16 2L16 7"
            fill="none"
            stroke="#D4537E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Vector query: "vestido de alta costura"</span>
      </div>

      <div className="cvl-section">
        <div className="cvl-slider-row">
          <label className="cvl-slider-label" htmlFor="cvl-params">
            Parametros
          </label>
          <input
            id="cvl-params"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(paramAmount * 100)}
            onChange={handleSliderChange}
            className="cvl-slider"
          />
          <span className="cvl-slider-value">{paramLabel(paramAmount)}</span>
        </div>
      </div>

      <div className="cvl-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={`cvl-preset-btn ${
              Math.round(paramAmount * 100) === preset.value ? "cvl-preset-btn--active" : ""
            }`}
            type="button"
            onClick={() => handlePreset(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="cvl-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="cvl-canvas"
          onMouseDown={(event) => {
            handlePointerDown(event.clientX, event.clientY);
            canvasRef.current.style.cursor = "grabbing";
          }}
          onMouseMove={(event) => handlePointerMove(event.clientX, event.clientY)}
          onMouseUp={() => {
            handlePointerUp();
            canvasRef.current.style.cursor = "grab";
          }}
          onMouseLeave={() => {
            handlePointerUp();

            if (canvasRef.current) {
              canvasRef.current.style.cursor = "grab";
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            handlePointerDown(touch.clientX, touch.clientY);
          }}
          onTouchMove={(event) => {
            const touch = event.touches[0];
            handlePointerMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handlePointerUp}
        />
      </div>

      <div className="cvl-legend">
        {LEGEND.map((item) => (
          <span key={item.label} className="cvl-legend-item">
            <span className="cvl-legend-dot" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
        <span className="cvl-legend-item">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <line
              x1="1"
              y1="13"
              x2="12"
              y2="2"
              stroke="#D4537E"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9 1L13 1L13 5"
              fill="none"
              stroke="#D4537E"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Vector query
        </span>
      </div>

      <div className="cvl-metrics">
        <div className="cvl-metric-card">
          <div className="cvl-metric-label">Apunta hacia</div>
          <div className={`cvl-metric-value cvl-metric-value--small ${aimInfo.className}`}>
            {aimInfo.text}
          </div>
        </div>
        <div className="cvl-metric-card">
          <div className="cvl-metric-label">Coseno con alta costura</div>
          <div className="cvl-metric-value">{cosine.toFixed(2)}</div>
        </div>
        <div className="cvl-metric-card">
          <div className="cvl-metric-label">Concepto mas cercano</div>
          <div className="cvl-metric-value cvl-metric-value--small">{nearest}</div>
        </div>
      </div>

      <div className="cvl-description">
        <strong>{description.title}</strong> - {description.text}
      </div>

      <div className="cvl-note">
        <strong>Que estas viendo?</strong> El vector rosa representa como el modelo ubica
        el concepto "vestido de alta costura" en su espacio interno. Con pocos
        parametros, el espacio no tiene suficientes dimensiones para separar los
        conceptos y el vector apunta a cualquier lado. A medida que los parametros
        aumentan, los clusters se separan y el vector se orienta con mayor precision
        hacia la region semantica correcta.
      </div>
    </div>
  );
}
