const sceneButtons = document.querySelectorAll("[data-scene]");
const sceneCopy = document.getElementById("scene-copy");
const sceneQuestion = document.getElementById("scene-question");
const scenePoints = document.getElementById("scene-points");
const sceneSummary = document.getElementById("scene-summary");

const scenes = {
  grid: {
    mode: "grid",
    copy:
      "Base Layer introduce que es un modelo, como lee patrones, que hace un prompt y por que la evaluacion importa tanto como la generacion.",
    question:
      '"Que cambia para un disenador cuando una maquina ya puede generar texto, imagen, variantes y criterio provisional?"',
    points: [
      "modelos // inputs y outputs",
      "prompts // estructura y contexto",
      "criterio // validar antes de confiar",
    ],
    summary:
      "Empezamos en fundamentos, pasamos por herramientas y cerramos en escenarios futuros para objetos, procesos y sistemas.",
  },
  amber: {
    mode: "amber",
    copy:
      "Studio Flow baja la conversacion a taller: ideacion, referencias, visualizacion, nomenclatura, presentaciones y loops rapidos de prueba.",
    question:
      '"Como puede una IA asistir un proceso sin reemplazar la mirada proyectual ni el criterio del autor?"',
    points: [
      "brief // intencion y limites",
      "workflow // iteracion y sintesis",
      "output // calidad util para proyecto",
    ],
    summary:
      "La clase conecta herramientas con decisiones reales de estudio para que IA aparezca como instrumento y no como ruido futurista.",
  },
  violet: {
    mode: "violet",
    copy:
      "Future Signal abre la parte especulativa: impacto en profesiones, cambios en cadenas de valor, etica, autoria y nuevas competencias.",
    question:
      '"Que tipo de profesional emerge cuando la generacion automatica deja de ser novedad y pasa a ser infraestructura?"',
    points: [
      "riesgo // sesgos y dependencia",
      "futuro // nuevas incumbencias",
      "posicion // criterio y responsabilidad",
    ],
    summary:
      "El cierre no vende magia: discute poder, limites y oportunidades reales para diseno industrial, docencia y trabajo colaborativo.",
  },
};

function setScene(key) {
  const scene = scenes[key];
  if (!scene) {
    return;
  }

  document.body.dataset.mode = scene.mode;

  if (sceneCopy) {
    sceneCopy.textContent = scene.copy;
  }

  if (sceneQuestion) {
    sceneQuestion.textContent = scene.question;
  }

  if (scenePoints) {
    scenePoints.innerHTML = scene.points.map((point) => `<li>${point}</li>`).join("");
  }

  if (sceneSummary) {
    sceneSummary.textContent = scene.summary;
  }

  sceneButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.scene === key);
  });
}

sceneButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setScene(button.dataset.scene);
  });
});

if (sceneButtons.length) {
  setScene("grid");
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const sequences = Array.from(document.querySelectorAll("[data-sequence]")).map((section) => {
  const screens = Array.from(section.querySelectorAll(".screen-panel"));
  const meter = section.querySelector(".sequence-meter i");
  return { section, screens, meter, current: 0, target: 0 };
});

const videoSections = Array.from(document.querySelectorAll("[data-video-section]")).map((section) => {
  const video = section.querySelector(".scrub-video");
  const stage = section.querySelector(".video-stage");
  const progress = section.querySelector(".scrub-progress i");
  const src = video?.dataset.videoSrc?.trim();

  if (video && src) {
    video.src = src;
    video.addEventListener("loadedmetadata", () => {
      stage?.classList.add("has-video");
    });
  }

  return { section, video, progress, current: 0, target: 0 };
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function sectionProgress(section) {
  const rect = section.getBoundingClientRect();
  const total = Math.max(section.offsetHeight - window.innerHeight, 1);
  return clamp(-rect.top / total, 0, 1);
}

function lerp(current, target, factor) {
  return current + (target - current) * factor;
}

function heldOffset(offset) {
  const abs = Math.abs(offset);
  const holdZone = 0.2;

  if (abs <= holdZone) {
    return 0;
  }

  const nearRange = 1.1;
  const beyond = Math.max(abs - nearRange, 0);
  const near = smoothstep(holdZone, nearRange, abs);
  return Math.sign(offset) * (near + beyond * 0.75);
}

function updateSequences() {
  let moving = false;

  sequences.forEach((entry) => {
    const { section, screens, meter } = entry;
    if (!screens.length) {
      return;
    }

    entry.target = sectionProgress(section);
    const delta = Math.abs(entry.target - entry.current);
    const factor = clamp(0.14 + delta * 0.28, 0.14, 0.28);
    entry.current = lerp(entry.current, entry.target, factor);

    if (Math.abs(entry.target - entry.current) > 0.0015) {
      moving = true;
    }

    const progress = entry.current;
    const rawIndex = progress * (screens.length - 1);
    const activeIndex = Math.round(rawIndex);

    screens.forEach((screen, index) => {
      const offset = index - rawIndex;
      const visualOffset = heldOffset(offset);
      const absOffset = Math.min(Math.abs(visualOffset), 3);
      const compact = screen.classList.contains("screen-compact");
      const spread = compact ? window.innerWidth * 0.24 : window.innerWidth * 0.2;
      const x = visualOffset * spread * (1 + Math.max(absOffset - 1, 0) * 0.34);
      const z = -absOffset * (compact ? 260 : 340);
      const scale = 1 - absOffset * (compact ? 0.07 : 0.08);
      const rotateY = visualOffset * (compact ? -12 : -10);
      const rotateX = absOffset * 1.6;
      const opacity = Math.max(0.08, 1 - absOffset * 0.34);
      const blur = Math.max(absOffset - 0.8, 0) * 1.1;

      screen.style.setProperty("--x", `${x.toFixed(2)}px`);
      screen.style.setProperty("--z", `${z.toFixed(2)}px`);
      screen.style.setProperty("--scale", scale.toFixed(4));
      screen.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
      screen.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
      screen.style.setProperty("--opacity", opacity.toFixed(4));
      screen.style.setProperty("--blur", `${blur.toFixed(2)}px`);
      screen.style.zIndex = String(500 - Math.round(absOffset * 100));
      screen.style.pointerEvents = index === activeIndex ? "auto" : "none";
      screen.classList.toggle("is-active", index === activeIndex);
    });

    if (meter) {
      meter.style.width = `${progress * 100}%`;
    }
  });

  return moving;
}

function updateVideos() {
  let moving = false;

  videoSections.forEach((entry) => {
    const { section, video, progress } = entry;
    entry.target = sectionProgress(section);
    const delta = Math.abs(entry.target - entry.current);
    const factor = clamp(0.16 + delta * 0.24, 0.16, 0.3);
    entry.current = lerp(entry.current, entry.target, factor);

    if (Math.abs(entry.target - entry.current) > 0.0015) {
      moving = true;
    }

    const amount = entry.current;

    if (progress) {
      progress.style.width = `${amount * 100}%`;
    }

    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const targetTime = video.duration * amount;
    if (Math.abs(video.currentTime - targetTime) > 0.05) {
      video.currentTime = targetTime;
    }
  });

  return moving;
}

let ticking = false;

function requestUpdate() {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    const sequencesMoving = updateSequences();
    const videosMoving = updateVideos();
    ticking = false;

    if (sequencesMoving || videosMoving) {
      requestUpdate();
    }
  });
}

window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);
window.addEventListener("load", requestUpdate);
requestUpdate();
