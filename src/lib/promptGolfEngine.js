import { MODELS, SAMPLE_LEADERBOARD, TRACKS } from "../data/promptGolfData";

const CROWD_BANK = {
  "code-grid": {
    valid: [
      "crew // limpio. cerra el hoyo antes de regalar un prompt.",
      "spectator // buen contrato. la salida ya esta lista para prod.",
    ],
    partial: [
      "crew // vas bien, pero todavia falta rigidez de formato.",
      "spectator // la idea esta, ahora fuerza la estructura exacta.",
    ],
    invalid: [
      "crew // demasiado ruido. pedi menos y controla el formato.",
      "spectator // si no nombras las claves, el modelo se dispersa.",
    ],
  },
  "studio-pulse": {
    valid: [
      "crew // eso ya tiene direccion. guarda el score.",
      "spectator // se siente usable, no sobreexplicado. cerralo.",
    ],
    partial: [
      "crew // el concepto aparece, pero todavia falta sistema.",
      "spectator // afina el encuadre y pedi una salida mas util.",
    ],
    invalid: [
      "crew // quedo demasiado abstracto. pedi entregables concretos.",
      "spectator // si no separas componentes, el track te penaliza.",
    ],
  },
  "structure-loop": {
    valid: [
      "crew // programa, flujo y materia en linea. buen tiro.",
      "spectator // solucion compacta y clara. guarda la ronda.",
    ],
    partial: [
      "crew // aparecen las zonas, falta separar mejor los movimientos.",
      "spectator // casi. necesitas headings mas firmes.",
    ],
    invalid: [
      "crew // mucho concepto, poca planta. baja a tierra la consigna.",
      "spectator // nombra el esquema espacial o la cancha no lo compra.",
    ],
  },
  "legal-echo": {
    valid: [
      "crew // preciso y defendible. no sobrejuegues el hoyo.",
      "spectator // bajo riesgo, buena redaccion. cerra score.",
    ],
    partial: [
      "crew // hay criterio, falta delimitar mejor la estructura.",
      "spectator // aun no se distingue bien analisis de redaccion.",
    ],
    invalid: [
      "crew // demasiado decorativo. este track pide filo contractual.",
      "spectator // si mezclas nota y clausula, el juez no lo valida.",
    ],
  },
  "market-run": {
    valid: [
      "crew // buen foco comercial. ya esta para subir al ranking.",
      "spectator // segmento y metrica alineados. cierralo ahora.",
    ],
    partial: [
      "crew // bien orientado, pero falta ordenar la oferta.",
      "spectator // todavia no queda nitida la medicion del lanzamiento.",
    ],
    invalid: [
      "crew // suena a brainstorming. este hoyo pide precision comercial.",
      "spectator // sin headings claros, la estrategia se diluye.",
    ],
  },
  "thesis-void": {
    valid: [
      "crew // idea, tension y cierre. buen golpe conceptual.",
      "spectator // defendible y sobrio. congela el score.",
    ],
    partial: [
      "crew // ya hay tesis, ahora hace chocar mejor la objecion.",
      "spectator // le falta filo al conflicto central.",
    ],
    invalid: [
      "crew // suena amplio. este circuito castiga la vaguedad.",
      "spectator // formula una estructura minima o se pierde la idea.",
    ],
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomFromList(items, seed = 0) {
  if (!items?.length) {
    return "";
  }

  return items[seed % items.length];
}

export function normalizeText(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHeadingPattern(heading) {
  return new RegExp(
    `(^|\\n)\\s*(?:#+\\s*)?${escapeRegExp(normalizeText(heading))}\\s*:?(?=\\n|$)`,
    "m"
  );
}

function findTermHits(prompt, terms = []) {
  const normalizedPrompt = normalizeText(prompt);

  return terms.filter((term) => normalizedPrompt.includes(normalizeText(term)));
}

function calculateEconomy(prompt) {
  const length = prompt.trim().length;

  if (!length) {
    return 0;
  }

  if (length < 44) {
    return 38;
  }

  if (length <= 240) {
    return 96;
  }

  if (length <= 360) {
    return 82;
  }

  if (length <= 520) {
    return 64;
  }

  return 42;
}

export function getTrackById(trackId) {
  return TRACKS.find((track) => track.id === trackId) ?? TRACKS[0];
}

export function getHoleById(holeId) {
  return TRACKS.flatMap((track) => track.holes)
    .find((hole) => hole.id === holeId);
}

export function getModelById(modelId) {
  return MODELS.find((model) => model.id === modelId) ?? MODELS[0];
}

export function buildPromptSeed(hole) {
  if (!hole) {
    return "";
  }

  const instruction = hole.type === "json"
    ? "Devolve solo un JSON valido y sin texto extra usando exactamente las claves pedidas."
    : `Responde usando exactamente la estructura pedida para ${hole.title.toLowerCase()}.`;

  return `${instruction}\nRestricciones: ${hole.constraints.join("; ")}.`;
}

export function getScoreLabel(scoreVsPar) {
  if (scoreVsPar <= -3) {
    return "albatross";
  }

  if (scoreVsPar === -2) {
    return "eagle";
  }

  if (scoreVsPar === -1) {
    return "birdie";
  }

  if (scoreVsPar === 0) {
    return "par";
  }

  if (scoreVsPar === 1) {
    return "bogey";
  }

  if (scoreVsPar === 2) {
    return "double bogey";
  }

  return "over par";
}

export function formatScoreVsPar(scoreVsPar) {
  if (scoreVsPar === 0) {
    return "E";
  }

  return scoreVsPar > 0 ? `+${scoreVsPar}` : `${scoreVsPar}`;
}

function buildTelemetry(prompt, hole, modelId) {
  const requiredHits = findTermHits(prompt, hole.requiredPromptTerms);
  const structureHits = findTermHits(prompt, hole.structurePromptTerms);
  const requiredRatio = hole.requiredPromptTerms.length
    ? requiredHits.length / hole.requiredPromptTerms.length
    : 1;
  const structureRatio = hole.structurePromptTerms.length
    ? structureHits.length / hole.structurePromptTerms.length
    : 1;
  const modelFit = hole.preferredModels?.includes(modelId) ? 100 : 58;
  const economy = calculateEconomy(prompt);
  const explicitStructure = /(^|\n).{0,30}(:|-|\d|\*)/m.test(prompt) ? 88 : 62;

  const promptScore = Math.round(
    requiredRatio * 46 +
      structureRatio * 22 +
      (modelFit / 100) * 12 +
      (economy / 100) * 12 +
      (explicitStructure / 100) * 8
  );

  let qualityBand = "invalid";

  if (promptScore >= 80 && requiredRatio >= 0.7) {
    qualityBand = "valid";
  } else if (promptScore >= 56 && requiredRatio >= 0.34) {
    qualityBand = "partial";
  }

  return {
    promptScore,
    qualityBand,
    requiredHits,
    structureHits,
    objectiveSignal: Math.round(requiredRatio * 100),
    structureControl: Math.round(structureRatio * 100),
    economy,
    modelFit,
  };
}

function formatJsonOutput(payload) {
  return JSON.stringify(payload, null, 2);
}

function formatSectionsOutput(sections) {
  return sections
    .map((section) => {
      if (Array.isArray(section.bullets)) {
        return `${section.heading}\n${section.bullets.map((bullet) => `- ${bullet}`).join("\n")}`;
      }

      return `${section.heading}\n${section.body}`;
    })
    .join("\n\n");
}

function buildPartialSectionsOutput(hole) {
  const sections = hole.sections.slice(0, Math.max(1, hole.sections.length - 1));

  return formatSectionsOutput(
    sections.map((section) => {
      if (!Array.isArray(section.bullets)) {
        return section;
      }

      return {
        ...section,
        bullets: section.bullets.slice(0, Math.max(1, section.minItems - 1)),
      };
    })
  );
}

function buildInvalidSectionOutput(hole) {
  return [
    `Una salida posible para ${hole.title.toLowerCase()} seria responder con una sintesis general.`,
    "La idea principal es cubrir la consigna de manera flexible y despues ajustar detalles.",
    "Sin una estructura estricta, el resultado queda usable solo como borrador.",
  ].join(" ");
}

function generateOutput(hole, telemetry, prompt) {
  if (hole.type === "json") {
    if (telemetry.qualityBand === "valid") {
      return formatJsonOutput(hole.successOutput);
    }

    if (telemetry.qualityBand === "partial") {
      const normalizedPrompt = normalizeText(prompt);

      if (normalizedPrompt.includes("solo") || normalizedPrompt.includes("sin texto")) {
        return formatJsonOutput(hole.partialOutput);
      }

      return `Claro. Te dejo una version cercana al formato pedido:\n${formatJsonOutput(
        hole.partialOutput
      )}`;
    }

    return hole.failOutput;
  }

  if (telemetry.qualityBand === "valid") {
    return formatSectionsOutput(hole.sections);
  }

  if (telemetry.qualityBand === "partial") {
    return buildPartialSectionsOutput(hole);
  }

  return buildInvalidSectionOutput(hole);
}

function evaluateJsonOutput(hole, output) {
  const trimmed = output.trim();
  const requiredKeys = ["bug", "fix", "risk", "test"];

  try {
    const parsed = JSON.parse(trimmed);
    const missingKeys = requiredKeys.filter((key) => !(key in parsed));

    if (!missingKeys.length) {
      return {
        status: "valid",
        completion: 100,
        details: ["JSON valido", "Todas las claves obligatorias estan presentes"],
        label: "objetivo validado",
        message: "judge // salida lista. El contrato del hoyo quedo resuelto.",
      };
    }

    return {
      status: "partial",
      completion: Math.round(((requiredKeys.length - missingKeys.length) / requiredKeys.length) * 100),
      details: [`Faltan claves: ${missingKeys.join(", ")}`],
      label: "valida parcial",
      message: `judge // falta rigidez. Todavia no aparecen: ${missingKeys.join(", ")}.`,
    };
  } catch (error) {
    const match = trimmed.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const presentKeys = requiredKeys.filter((key) => key in parsed);

        return {
          status: "partial",
          completion: Math.round((presentKeys.length / requiredKeys.length) * 100),
          details: ["Hay JSON util pero viene envuelto en texto extra"],
          label: "salida contaminada",
          message: "judge // casi. El JSON aparece, pero viene mezclado con prosa extra.",
        };
      } catch (nestedError) {
        return {
          status: "invalid",
          completion: 24,
          details: ["El objeto no parsea como JSON util"],
          label: "fuera de contrato",
          message: "judge // fuera de linea. El payload no se puede parsear.",
        };
      }
    }

    return {
      status: "invalid",
      completion: 8,
      details: ["No hay un objeto JSON reconocible"],
      label: "sin estructura",
      message: "judge // no hay estructura valida. Fuerza formato y claves exactas.",
    };
  }
}

function getSectionMatches(output, headings) {
  const normalizedOutput = normalizeText(output);

  return headings
    .map((heading) => {
      const match = buildHeadingPattern(heading).exec(normalizedOutput);

      if (!match) {
        return null;
      }

      return {
        heading,
        index: match.index,
        end: match.index + match[0].length,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.index - right.index);
}

function getSectionBlock(output, heading, headings) {
  const normalizedOutput = normalizeText(output);
  const matches = getSectionMatches(output, headings);
  const currentIndex = matches.findIndex((match) => normalizeText(match.heading) === normalizeText(heading));

  if (currentIndex === -1) {
    return "";
  }

  const current = matches[currentIndex];
  const next = matches[currentIndex + 1];

  return normalizedOutput.slice(current.end, next ? next.index : normalizedOutput.length).trim();
}

function evaluateSectionOutput(hole, output) {
  const headings = hole.sections.map((section) => section.heading);
  const matches = getSectionMatches(output, headings);
  const foundHeadings = matches.map((match) => normalizeText(match.heading));
  const missingHeadings = headings.filter(
    (heading) => !foundHeadings.includes(normalizeText(heading))
  );
  const details = [];
  let completion = headings.length ? ((headings.length - missingHeadings.length) / headings.length) * 100 : 100;

  for (const section of hole.sections) {
    if (!Array.isArray(section.bullets)) {
      continue;
    }

    const block = getSectionBlock(output, section.heading, headings);
    const bulletCount = block
      .split("\n")
      .filter((line) => line.trim().startsWith("- "))
      .length;

    if (bulletCount < section.minItems) {
      details.push(`La seccion ${section.heading} pide ${section.minItems} bullets`);
      completion -= 18;
    }
  }

  if (!missingHeadings.length && !details.length) {
    return {
      status: "valid",
      completion: 100,
      details: ["Todas las secciones requeridas estan presentes"],
      label: "objetivo validado",
      message: "judge // estructura limpia. El hoyo ya se puede cerrar.",
    };
  }

  if (completion >= 42) {
    if (missingHeadings.length) {
      details.unshift(`Faltan headings: ${missingHeadings.join(", ")}`);
    }

    return {
      status: "partial",
      completion: clamp(Math.round(completion), 18, 92),
      details,
      label: "valida parcial",
      message: missingHeadings.length
        ? `judge // casi. Todavia faltan: ${missingHeadings.join(", ")}.`
        : "judge // la estructura aparece, pero aun no cumple todo el contrato.",
    };
  }

  return {
    status: "invalid",
    completion: clamp(Math.round(completion), 6, 36),
    details: missingHeadings.length ? [`No aparecen las secciones clave: ${missingHeadings.join(", ")}`] : details,
    label: "sin estructura",
    message: "judge // salida floja. Pide headings exactos y una respuesta mas util.",
  };
}

function evaluateOutput(hole, output) {
  if (hole.type === "json") {
    return evaluateJsonOutput(hole, output);
  }

  return evaluateSectionOutput(hole, output);
}

export function simulatePromptTurn({ hole, modelId, prompt, promptCount }) {
  const telemetry = buildTelemetry(prompt, hole, modelId);
  const output = generateOutput(hole, telemetry, prompt);
  const evaluation = evaluateOutput(hole, output);

  return {
    prompt,
    promptCount,
    telemetry,
    output,
    evaluation,
  };
}

export function getCrowdMessage(trackId, status, promptCount) {
  const trackBank = CROWD_BANK[trackId] ?? CROWD_BANK["code-grid"];
  const bucket = trackBank[status] ?? trackBank.invalid;

  return randomFromList(bucket, promptCount);
}

export function buildLeaderboardEntries(holeId, savedRuns = []) {
  return [...savedRuns, ...SAMPLE_LEADERBOARD]
    .filter((entry) => entry.holeId === holeId)
    .sort((left, right) => {
      if (left.scoreVsPar !== right.scoreVsPar) {
        return left.scoreVsPar - right.scoreVsPar;
      }

      if (left.promptsUsed !== right.promptsUsed) {
        return left.promptsUsed - right.promptsUsed;
      }

      return (left.handle ?? "").localeCompare(right.handle ?? "");
    })
    .slice(0, 6);
}

export function buildRoundSummary(track, hole, model, promptsUsed) {
  const scoreVsPar = promptsUsed - hole.par;

  return {
    handleLine: `${track.name} // hole ${hole.number}`,
    modelLine: `${model.name} // ${model.label}`,
    scoreVsPar,
    scoreLabel: getScoreLabel(scoreVsPar),
    scoreDisplay: formatScoreVsPar(scoreVsPar),
  };
}
