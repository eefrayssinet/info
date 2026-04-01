import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { MODELS, TRACKS } from "../data/promptGolfData";
import { useBodyMode } from "../hooks/useBodyMode";
import { useRevealObserver } from "../hooks/useRevealObserver";
import {
  buildLeaderboardEntries,
  buildPromptSeed,
  buildRoundSummary,
  formatScoreVsPar,
  getCrowdMessage,
  getModelById,
  getScoreLabel,
  simulatePromptTurn,
} from "../lib/promptGolfEngine";

const HANDLE_STORAGE_KEY = "prompt-golf-handle";
const RUNS_STORAGE_KEY = "prompt-golf-runs";

function buildBootMessages(track, hole, model) {
  return [
    {
      id: `${hole.id}-boot-system`,
      role: "system",
      speaker: "system",
      content: `track // ${track.name} // hole ${hole.number} // par ${hole.par}`,
    },
    {
      id: `${hole.id}-boot-crowd`,
      role: "crowd",
      speaker: "crew",
      content: track.crowdLine,
    },
    {
      id: `${hole.id}-boot-judge`,
      role: "judge",
      speaker: "judge",
      content: `Modelo activo ${model.name}. Objetivo: ${hole.objective}`,
    },
  ];
}

function buildDefaultHandle() {
  return "NEON-PLAYER";
}

function loadSavedRuns() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RUNS_STORAGE_KEY);

    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export default function PromptGolfArcade() {
  const [handle, setHandle] = useState(() => {
    if (typeof window === "undefined") {
      return buildDefaultHandle();
    }

    return window.localStorage.getItem(HANDLE_STORAGE_KEY) || buildDefaultHandle();
  });
  const [savedRuns, setSavedRuns] = useState(loadSavedRuns);
  const [activeTrackId, setActiveTrackId] = useState(TRACKS[0].id);
  const [activeHoleId, setActiveHoleId] = useState(TRACKS[0].holes[0].id);
  const [activeModelId, setActiveModelId] = useState(MODELS[0].id);
  const [roundState, setRoundState] = useState("idle");
  const [promptDraft, setPromptDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [turns, setTurns] = useState([]);
  const [lastTurn, setLastTurn] = useState(null);
  const [result, setResult] = useState(null);
  const feedRef = useRef(null);

  const activeTrack = TRACKS.find((track) => track.id === activeTrackId) ?? TRACKS[0];
  const activeHole = activeTrack.holes.find((hole) => hole.id === activeHoleId) ?? activeTrack.holes[0];
  const activeModel = getModelById(activeModelId);
  const resolvedHandle = handle.trim() || buildDefaultHandle();
  const leaderboard = buildLeaderboardEntries(activeHole.id, savedRuns);
  const completedHoleIds = savedRuns.map((run) => run.holeId);
  const trackCompletedCount = activeTrack.holes.filter((hole) => completedHoleIds.includes(hole.id)).length;

  useBodyMode(activeTrack.mode, "page-prompt-golf-arcade");
  useRevealObserver();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(HANDLE_STORAGE_KEY, handle);
  }, [handle]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(savedRuns));
  }, [savedRuns]);

  useEffect(() => {
    setPromptDraft(buildPromptSeed(activeHole));
    setMessages(buildBootMessages(activeTrack, activeHole, activeModel));
    setTurns([]);
    setLastTurn(null);
    setResult(null);
    setRoundState("idle");
  }, [activeTrackId, activeHoleId, activeModelId]);

  useEffect(() => {
    if (!feedRef.current) {
      return;
    }

    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  function selectTrack(trackId) {
    const nextTrack = TRACKS.find((track) => track.id === trackId) ?? TRACKS[0];

    setActiveTrackId(nextTrack.id);
    setActiveHoleId(nextTrack.holes[0].id);
  }

  function resetRound() {
    setPromptDraft(buildPromptSeed(activeHole));
    setMessages(buildBootMessages(activeTrack, activeHole, activeModel));
    setTurns([]);
    setLastTurn(null);
    setResult(null);
    setRoundState("idle");
  }

  function handleSendPrompt(event) {
    event.preventDefault();

    if (roundState === "complete") {
      return;
    }

    const prompt = promptDraft.trim();

    if (!prompt) {
      return;
    }

    const nextPromptCount = turns.length + 1;
    const turn = simulatePromptTurn({
      hole: activeHole,
      modelId: activeModelId,
      prompt,
      promptCount: nextPromptCount,
    });
    const crowdMessage = getCrowdMessage(activeTrack.id, turn.evaluation.status, nextPromptCount);

    setTurns((current) => [...current, turn]);
    setLastTurn(turn);
    setMessages((current) => [
      ...current,
      {
        id: `${activeHole.id}-user-${nextPromptCount}`,
        role: "user",
        speaker: resolvedHandle,
        content: prompt,
      },
      {
        id: `${activeHole.id}-assistant-${nextPromptCount}`,
        role: "assistant",
        speaker: activeModel.name,
        content: turn.output,
      },
      {
        id: `${activeHole.id}-judge-${nextPromptCount}`,
        role: "judge",
        speaker: "judge",
        content: turn.evaluation.message,
      },
      {
        id: `${activeHole.id}-crew-${nextPromptCount}`,
        role: "crowd",
        speaker: "crew",
        content: crowdMessage,
      },
    ]);
    setPromptDraft("");
    setRoundState(turn.evaluation.status === "valid" ? "ready" : "live");
  }

  function lockScore() {
    if (!lastTurn || lastTurn.evaluation.status !== "valid" || roundState === "complete") {
      return;
    }

    const promptsUsed = turns.length;
    const scoreVsPar = promptsUsed - activeHole.par;
    const summary = buildRoundSummary(activeTrack, activeHole, activeModel, promptsUsed);
    const runEntry = {
      handle: resolvedHandle,
      trackId: activeTrack.id,
      holeId: activeHole.id,
      holeTitle: activeHole.title,
      modelId: activeModel.id,
      promptsUsed,
      scoreVsPar,
      createdAt: new Date().toISOString(),
    };

    setSavedRuns((current) => [runEntry, ...current].slice(0, 80));
    setResult({
      ...summary,
      promptsUsed,
      holeTitle: activeHole.title,
      holeId: activeHole.id,
    });
    setRoundState("complete");
    setMessages((current) => [
      ...current,
      {
        id: `${activeHole.id}-result`,
        role: "system",
        speaker: "system",
        content: `score locked // ${formatScoreVsPar(scoreVsPar)} // ${getScoreLabel(scoreVsPar)}`,
      },
    ]);
  }

  return (
    <>
      <SiteHeader
        brand="PROMPT GOLF // PLAY"
        brandTo="/play"
        ctaLabel="Volver al teaser"
        ctaTo="/"
        links={[
          { label: "Setup", to: "/play#setup" },
          { label: "Cabina", to: "/play#run" },
          { label: "Ranking", to: "/play#ranking" },
          { label: "Clase", to: "/fundamentos-ia" },
        ]}
      />

      <main className="arcade-page" id="top">
        <section className="arcade-hero" data-reveal>
          <div className="arcade-hero-copy">
            <p className="eyebrow">Arcade build // local prototype // Tron cabinet</p>
            <h1>Insert prompt. Save par.</h1>
            <p className="lead">
              Este es el primer MVP jugable de Prompt Golf. Elegis cancha, hoyo y modelo;
              tiras prompts desde la consola y el juez valida si realmente resolviste la
              consigna con economia.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#run">
                Entrar a la cabina
              </a>
              <Link className="secondary-button" to="/">
                Ver landing
              </Link>
            </div>
          </div>

          <article className="arcade-attract panel">
            <div className="panel-bar">
              <span>broadcast // attract mode</span>
              <span>build 0.1</span>
            </div>
            <div className="attract-grid">
              <div className="attract-line">
                <span className="attract-label">Tracks</span>
                <strong>06</strong>
              </div>
              <div className="attract-line">
                <span className="attract-label">Holes</span>
                <strong>12</strong>
              </div>
              <div className="attract-line">
                <span className="attract-label">Models</span>
                <strong>03</strong>
              </div>
              <div className="attract-line">
                <span className="attract-label">Goal</span>
                <strong>MIN PROMPTS</strong>
              </div>
            </div>
            <p className="attract-copy">
              Cada output se valida localmente contra un contrato del hoyo. La ronda no gana
              por verso: gana por estructura, claridad y control.
            </p>
          </article>
        </section>

        <section className="arcade-shell" id="setup">
          <aside className="arcade-sidebar">
            <article className="panel sidebar-panel" data-reveal>
              <div className="panel-bar">
                <span>pilot handle</span>
                <span>local save</span>
              </div>
              <label className="field-label" htmlFor="player-handle">
                Handle
              </label>
              <input
                id="player-handle"
                className="arcade-input"
                maxLength={18}
                value={handle}
                onBlur={() => {
                  if (!handle.trim()) {
                    setHandle(buildDefaultHandle());
                  }
                }}
                onChange={(event) => setHandle(event.target.value.toUpperCase())}
              />
              <p className="helper-copy">
                Este alias se usa para el ranking local del navegador mientras armamos backend.
              </p>
            </article>

            <article className="panel sidebar-panel" data-reveal>
              <div className="panel-bar">
                <span>track select</span>
                <span>
                  {trackCompletedCount}/{activeTrack.holes.length} clear
                </span>
              </div>
              <div className="selector-grid">
                {TRACKS.map((track) => (
                  <button
                    key={track.id}
                    className={`selector-chip ${track.id === activeTrack.id ? "is-active" : ""}`}
                    type="button"
                    onClick={() => selectTrack(track.id)}
                  >
                    <span>{track.name}</span>
                    <small>{track.summary}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel sidebar-panel" data-reveal>
              <div className="panel-bar">
                <span>model bay</span>
                <span>{activeModel.label}</span>
              </div>
              <div className="selector-grid selector-grid-compact">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    className={`selector-chip selector-chip-model ${
                      model.id === activeModel.id ? "is-active" : ""
                    }`}
                    type="button"
                    onClick={() => setActiveModelId(model.id)}
                  >
                    <span>{model.name}</span>
                    <small>{model.description}</small>
                  </button>
                ))}
              </div>
            </article>
          </aside>

          <div className="arcade-stage">
            <article className="panel briefing-panel" data-reveal>
              <div className="panel-bar">
                <span>briefing // {activeTrack.name}</span>
                <span>
                  hole {activeHole.number} // par {activeHole.par}
                </span>
              </div>

              <div className="briefing-topline">
                <div>
                  <p className="eyebrow">Selected hole</p>
                  <h2>{activeHole.title}</h2>
                </div>
                <div className="briefing-scoreblock">
                  <span className="score-big">{activeHole.par}</span>
                  <span className="score-meta">{activeHole.difficulty}</span>
                </div>
              </div>

              <p className="section-copy">{activeHole.intro}</p>

              <div className="hole-grid-select">
                {activeTrack.holes.map((hole) => (
                  <button
                    key={hole.id}
                    className={`hole-button ${hole.id === activeHole.id ? "is-active" : ""} ${
                      completedHoleIds.includes(hole.id) ? "is-cleared" : ""
                    }`}
                    type="button"
                    onClick={() => setActiveHoleId(hole.id)}
                  >
                    <span>Hole {hole.number}</span>
                    <strong>{hole.title}</strong>
                    <small>PAR {hole.par}</small>
                  </button>
                ))}
              </div>

              <div className="briefing-grid">
                <article className="brief-card">
                  <p className="panel-label">Objetivo</p>
                  <p>{activeHole.objective}</p>
                </article>
                <article className="brief-card">
                  <p className="panel-label">Restricciones</p>
                  <ul className="brief-list">
                    {activeHole.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </article>
                <article className="brief-card">
                  <p className="panel-label">Judge</p>
                  <ul className="brief-list">
                    {activeHole.judgeCriteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </article>

            <section className="run-grid" id="run">
              <article className="panel run-panel" data-reveal>
                <div className="panel-bar">
                  <span>console // round state</span>
                  <span>{roundState}</span>
                </div>

                <div className="result-banner-row">
                  <div className={`result-banner result-banner-${roundState}`}>
                    <span className="result-banner-title">
                      {roundState === "idle" && "Cabina lista para arrancar"}
                      {roundState === "live" && "Segui iterando. El hoyo sigue abierto"}
                      {roundState === "ready" && "Objetivo cumplido. Podes guardar score"}
                      {roundState === "complete" && "Ronda guardada en el ranking local"}
                    </span>
                    <small>
                      {turns.length} prompt{turns.length === 1 ? "" : "s"} usados // PAR {activeHole.par}
                    </small>
                  </div>

                  <div className="round-actions">
                    <button className="secondary-button" type="button" onClick={resetRound}>
                      Reset round
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={lockScore}
                      disabled={roundState !== "ready"}
                    >
                      Lock score
                    </button>
                  </div>
                </div>

                <div className="message-feed" ref={feedRef}>
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`message-bubble message-${message.role}`}
                    >
                      <div className="message-head">
                        <span>{message.speaker}</span>
                        <small>{message.role}</small>
                      </div>
                      <div
                        className={`message-body ${
                          message.role === "assistant" ? "is-assistant-output" : ""
                        }`}
                      >
                        {message.content}
                      </div>
                    </article>
                  ))}
                </div>

                <form className="prompt-form" onSubmit={handleSendPrompt}>
                  <label className="field-label" htmlFor="prompt-draft">
                    Prompt shot
                  </label>
                  <textarea
                    id="prompt-draft"
                    className="arcade-textarea"
                    rows={6}
                    value={promptDraft}
                    onChange={(event) => setPromptDraft(event.target.value)}
                    placeholder="Escribi el prompt que le vas a tirar al modelo..."
                  />
                  <div className="prompt-form-footer">
                    <small>
                      Cada envio cuenta como un golpe. Si ya validaste el objetivo, cerrar ahora
                      siempre te conviene.
                    </small>
                    <button className="primary-button" type="submit">
                      Send prompt
                    </button>
                  </div>
                </form>
              </article>

              <div className="hud-stack">
                <article className="panel hud-panel" data-reveal>
                  <div className="panel-bar">
                    <span>telemetry</span>
                    <span>
                      {lastTurn ? `${lastTurn.telemetry.promptScore}/100` : "standby"}
                    </span>
                  </div>

                  <div className="hud-meters">
                    {[
                      [
                        "objetivo",
                        lastTurn ? lastTurn.telemetry.objectiveSignal : 0,
                      ],
                      [
                        "estructura",
                        lastTurn ? lastTurn.telemetry.structureControl : 0,
                      ],
                      [
                        "economia",
                        lastTurn ? lastTurn.telemetry.economy : 0,
                      ],
                      [
                        "model fit",
                        lastTurn ? lastTurn.telemetry.modelFit : activeHole.preferredModels.includes(activeModel.id)
                          ? 100
                          : 58,
                      ],
                    ].map(([label, value]) => (
                      <div className="meter" key={label}>
                        <span>{label}</span>
                        <div>
                          <i style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hint-cluster">
                    {activeHole.promptTips.map((tip) => (
                      <span className="hint-chip" key={tip}>
                        {tip}
                      </span>
                    ))}
                  </div>
                </article>

                <article className="panel hud-panel" data-reveal>
                  <div className="panel-bar">
                    <span>judge panel</span>
                    <span>{lastTurn ? lastTurn.evaluation.label : "waiting"}</span>
                  </div>

                  {lastTurn ? (
                    <>
                      <div className="judge-scoreline">
                        <strong>{lastTurn.evaluation.completion}%</strong>
                        <span>completion</span>
                      </div>
                      <ul className="brief-list">
                        {lastTurn.evaluation.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="map-copy">
                      El juez revisa formato, headings, claves y estructura. La ronda empieza
                      cuando mandas el primer prompt.
                    </p>
                  )}
                </article>

                <article className="panel hud-panel" id="ranking" data-reveal>
                  <div className="panel-bar">
                    <span>leaderboard // {activeHole.title}</span>
                    <span>top 6</span>
                  </div>

                  <div className="leaderboard-list">
                    {leaderboard.map((entry, index) => (
                      <div className="leaderboard-row" key={`${entry.handle}-${entry.holeId}-${index}`}>
                        <span className="leaderboard-rank">{index + 1}</span>
                        <strong>{entry.handle}</strong>
                        <span>{entry.promptsUsed} prompts</span>
                        <span className="leaderboard-score">
                          {formatScoreVsPar(entry.scoreVsPar)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel hud-panel" data-reveal>
                  <div className="panel-bar">
                    <span>result capture</span>
                    <span>{result ? result.scoreLabel : "pending"}</span>
                  </div>

                  {result ? (
                    <div className="result-card">
                      <p className="eyebrow">{result.handleLine}</p>
                      <h3>{result.holeTitle}</h3>
                      <div className="result-callout">
                        <strong>{result.scoreDisplay}</strong>
                        <span>{result.scoreLabel}</span>
                      </div>
                      <p className="map-copy">
                        {result.promptsUsed} prompts con {result.modelLine}. Ya quedo guardado en
                        el ranking local del navegador.
                      </p>
                    </div>
                  ) : (
                    <p className="map-copy">
                      Cuando el juez marque validacion completa, bloquea tu score antes de regalar
                      prompts de mas.
                    </p>
                  )}
                </article>
              </div>
            </section>
          </div>
        </section>
      </main>

      <Footer>PROMPT GOLF // local arcade prototype // next step backend + multiplayer</Footer>
    </>
  );
}
