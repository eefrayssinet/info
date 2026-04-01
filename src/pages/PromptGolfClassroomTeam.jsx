import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { useBodyMode } from "../hooks/useBodyMode";
import { useSingleClassroomSession } from "../hooks/useClassroomBackend";
import { useRevealObserver } from "../hooks/useRevealObserver";
import {
  buildSessionLeaderboard,
  formatTime,
  getRemainingTimeMs,
  getSessionSummary,
  lockTeamScore,
  submitTeamPrompt,
} from "../lib/classroomStore";
import { hasSupabaseConfig, lockRemoteScore, submitRemotePrompt } from "../lib/classroomSupabase";
import { buildPromptSeed } from "../lib/promptGolfEngine";

function buildMessages(team, sessionSummary, run) {
  const base = [
    {
      id: "boot-system",
      role: "system",
      speaker: "system",
      content: `${sessionSummary.track.name} // ${sessionSummary.hole.title} // par ${sessionSummary.hole.par}`,
    },
    {
      id: "boot-judge",
      role: "judge",
      speaker: "judge",
      content: sessionSummary.hole.objective,
    },
  ];

  if (!run?.turns?.length) {
    return base;
  }

  return [
    ...base,
    ...run.turns.flatMap((turn) => [
      {
        id: `${team.id}-user-${turn.promptCount}`,
        role: "user",
        speaker: team.name,
        content: turn.prompt,
      },
      {
        id: `${team.id}-assistant-${turn.promptCount}`,
        role: "assistant",
        speaker: sessionSummary.model.name,
        content: turn.output,
      },
      {
        id: `${team.id}-judge-${turn.promptCount}`,
        role: "judge",
        speaker: "judge",
        content: turn.evaluation.message,
      },
    ]),
  ];
}

export default function PromptGolfClassroomTeam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [promptDraft, setPromptDraft] = useState("");
  const feedRef = useRef(null);

  const sessionId = searchParams.get("session");
  const teamId = searchParams.get("team");
  const { mode, session } = useSingleClassroomSession(sessionId);
  const team = session?.teams.find((entry) => entry.id === teamId) ?? null;
  const sessionSummary = session ? getSessionSummary(session) : null;
  const currentHoleId = session?.holeIds?.[session.activeHoleIndex] ?? null;
  const currentRun = team && currentHoleId ? team.holeRuns?.[currentHoleId] ?? null : null;
  const leaderboard = session ? buildSessionLeaderboard(session) : [];
  const remainingMs = session ? getRemainingTimeMs(session) : 0;
  const messages = team && sessionSummary ? buildMessages(team, sessionSummary, currentRun) : [];
  const canSend =
    Boolean(team && session && session.phase === "live" && remainingMs > 0) &&
    !["locked", "timeout"].includes(currentRun?.status ?? "pending");
  const canLock =
    Boolean(team && session && session.phase === "live") &&
    currentRun?.turns?.at(-1)?.evaluation?.status === "valid" &&
    currentRun?.status !== "locked";

  useBodyMode(sessionSummary?.track.mode ?? "grid", "page-prompt-golf-classroom");
  useRevealObserver();

  useEffect(() => {
    if (sessionSummary?.hole) {
      setPromptDraft(buildPromptSeed(sessionSummary.hole));
    }
  }, [sessionSummary?.hole?.id, teamId]);

  useEffect(() => {
    if (!feedRef.current) {
      return;
    }

    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  async function handleSubmitPrompt(event) {
    event.preventDefault();

    if (!session || !team || !promptDraft.trim()) {
      return;
    }

    if (hasSupabaseConfig || mode === "supabase") {
      await submitRemotePrompt(session.id, team.id, promptDraft);
    } else {
      submitTeamPrompt(session.id, team.id, promptDraft);
    }

    setPromptDraft("");
  }

  function handleSelectTeam(nextTeamId) {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("team", nextTeamId);
    setSearchParams(nextParams);
  }

  return (
    <>
      <SiteHeader
        brand="PROMPT GOLF // TEAM STATION"
        brandTo={session ? `/classroom/team?session=${session.id}${team ? `&team=${team.id}` : ""}` : "/classroom/team"}
        ctaLabel="Teacher desk"
        ctaTo="/classroom"
        links={[
          { label: "Join", to: "/classroom/team" },
          { label: "Teacher", to: "/classroom" },
          { label: "Broadcast", to: session ? `/classroom/broadcast?session=${session.id}` : "/classroom/broadcast" },
          { label: "Arcade", to: "/play" },
        ]}
      />

      <main className="classroom-page">
        <section className="classroom-hero team-hero" data-reveal>
          <div className="classroom-hero-copy">
            <p className="eyebrow">Team station // four students // timed hole</p>
            <h1>Play the hole before the clock closes.</h1>
            <p className="lead">
              Esta cabina le da a cada equipo su consola, su reloj y su boton de lock score.
              Cuando el hoyo termina, el resultado se congela y sube al score wall.
            </p>
          </div>

          <article className="panel classroom-note-panel">
            <div className="panel-bar">
              <span>clock</span>
              <span>{session ? session.phase : "waiting"}</span>
            </div>
            <div className="timer-display timer-display-large">
              <strong>{formatTime(remainingMs)}</strong>
              <span>{sessionSummary ? sessionSummary.hole.title : "No session selected"}</span>
            </div>
          </article>
        </section>

        {session ? (
          <section className="classroom-grid">
            <aside className="classroom-sidebar">
              <article className="panel sidebar-panel" data-reveal>
                <div className="panel-bar">
                  <span>session</span>
                  <span>{session.id}</span>
                </div>
                <p className="map-copy">
                  {session.name} // {sessionSummary.track.name} // {sessionSummary.model.name}
                </p>
                <div className="selector-grid">
                  {session.teams.map((entry) => (
                    <button
                      key={entry.id}
                      className={`selector-chip ${team?.id === entry.id ? "is-active" : ""}`}
                      type="button"
                      onClick={() => handleSelectTeam(entry.id)}
                    >
                      <span>{entry.name}</span>
                      <small>{entry.members.filter(Boolean).join(" // ") || "4 students"}</small>
                    </button>
                  ))}
                </div>
              </article>

              {team ? (
                <article className="panel sidebar-panel" data-reveal>
                  <div className="panel-bar">
                    <span>roles</span>
                    <span>{team.name}</span>
                  </div>
                  <div className="role-grid">
                    {[
                      "Pilot",
                      "Navigator",
                      "Strategist",
                      "Timekeeper",
                    ].map((role, index) => (
                      <div className="role-card" key={role}>
                        <span>{role}</span>
                        <strong>{team.members[index] || `Student ${index + 1}`}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </aside>

            <div className="classroom-stage">
              {team ? (
                <section className="run-grid">
                  <article className="panel run-panel" data-reveal>
                    <div className="panel-bar">
                      <span>{team.name}</span>
                      <span>{currentRun?.status ?? "pending"}</span>
                    </div>

                    <div className="briefing-grid classroom-brief-grid">
                      <article className="brief-card">
                        <p className="panel-label">Objective</p>
                        <p>{sessionSummary.hole.objective}</p>
                      </article>
                      <article className="brief-card">
                        <p className="panel-label">Constraints</p>
                        <ul className="brief-list">
                          {sessionSummary.hole.constraints.map((constraint) => (
                            <li key={constraint}>{constraint}</li>
                          ))}
                        </ul>
                      </article>
                      <article className="brief-card">
                        <p className="panel-label">Judge</p>
                        <ul className="brief-list">
                          {sessionSummary.hole.judgeCriteria.map((criterion) => (
                            <li key={criterion}>{criterion}</li>
                          ))}
                        </ul>
                      </article>
                    </div>

                    <div className="result-banner-row">
                      <div className={`result-banner result-banner-${currentRun?.status ?? "idle"}`}>
                        <span className="result-banner-title">
                          {session.phase === "setup" && "Esperando que docente lance el hoyo"}
                          {session.phase === "live" && "Hoyo abierto. Cada envio cuenta como golpe"}
                          {session.phase === "review" && "Hoyo cerrado. Esperando siguiente ronda"}
                          {session.phase === "finished" && "Sesion terminada"}
                        </span>
                        <small>
                          {currentRun?.promptsUsed ?? 0} prompts // hole {session.activeHoleIndex + 1}/
                          {session.holeIds.length}
                        </small>
                      </div>

                      <div className="round-actions">
                        <button
                          className="primary-button"
                          type="button"
                          onClick={() =>
                            hasSupabaseConfig || mode === "supabase"
                              ? lockRemoteScore(session.id, team.id)
                              : lockTeamScore(session.id, team.id)
                          }
                          disabled={!canLock}
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

                    <form className="prompt-form" onSubmit={handleSubmitPrompt}>
                      <label className="field-label" htmlFor="team-prompt">
                        Team prompt
                      </label>
                      <textarea
                        id="team-prompt"
                        className="arcade-textarea"
                        rows={6}
                        value={promptDraft}
                        onChange={(event) => setPromptDraft(event.target.value)}
                        disabled={!canSend}
                        placeholder="Escriban el prompt del equipo..."
                      />
                      <div className="prompt-form-footer">
                        <small>
                          Cuando el ultimo output sea valido, pueden bloquear score antes de que
                          el reloj cierre el hoyo.
                        </small>
                        <button className="primary-button" type="submit" disabled={!canSend}>
                          Send prompt
                        </button>
                      </div>
                    </form>
                  </article>

                  <div className="hud-stack">
                    <article className="panel hud-panel" data-reveal>
                      <div className="panel-bar">
                        <span>live telemetry</span>
                        <span>{currentRun?.completion ?? 0}%</span>
                      </div>
                      <div className="hud-meters">
                        {[
                          ["completion", currentRun?.completion ?? 0],
                          ["economy", currentRun?.turns?.at(-1)?.telemetry?.economy ?? 0],
                          ["structure", currentRun?.turns?.at(-1)?.telemetry?.structureControl ?? 0],
                          ["objective", currentRun?.turns?.at(-1)?.telemetry?.objectiveSignal ?? 0],
                        ].map(([label, value]) => (
                          <div className="meter" key={label}>
                            <span>{label}</span>
                            <div>
                              <i style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="panel hud-panel" data-reveal>
                      <div className="panel-bar">
                        <span>team result</span>
                        <span>{currentRun?.scoreLabel ?? currentRun?.status ?? "pending"}</span>
                      </div>
                      <div className="judge-scoreline">
                        <strong>{currentRun?.scoreDisplay ?? "--"}</strong>
                        <span>{currentRun?.status ?? "pending"}</span>
                      </div>
                      <p className="map-copy">
                        {currentRun?.finishReason
                          ? `Cierre por ${currentRun.finishReason}.`
                          : "Todavia no hay score cerrado para este hoyo."}
                      </p>
                    </article>

                    <article className="panel hud-panel" data-reveal>
                      <div className="panel-bar">
                        <span>class ranking</span>
                        <span>live</span>
                      </div>
                      <div className="leaderboard-list">
                        {leaderboard.map((entry, index) => (
                          <div className="leaderboard-row" key={entry.id}>
                            <span className="leaderboard-rank">{index + 1}</span>
                            <strong>{entry.name}</strong>
                            <span>{entry.currentStatus}</span>
                            <span className="leaderboard-score">
                              {entry.revealed ? entry.totalScoreDisplay : "--"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </section>
              ) : (
                <article className="panel classroom-empty-panel" data-reveal>
                  <div className="panel-bar">
                    <span>join station</span>
                    <span>team required</span>
                  </div>
                  <h2>Elegi un equipo para entrar a la cabina.</h2>
                  <p className="section-copy">
                    Esta sesion ya existe. Solo falta seleccionar el team station correcto
                    desde la columna izquierda.
                  </p>
                </article>
              )}
            </div>
          </section>
        ) : (
          <section className="classroom-grid">
            <article className="panel classroom-empty-panel" data-reveal>
              <div className="panel-bar">
                <span>team station</span>
                <span>waiting</span>
              </div>
              <h2>No hay una sesion local disponible.</h2>
              <p className="section-copy">
                Primero crea una sesion desde la cabina docente. Despues esta ruta va a poder
                abrir equipos, reloj y score.
              </p>
              <div className="hero-actions">
                <Link className="primary-button" to="/classroom">
                  Ir al docente
                </Link>
              </div>
            </article>
          </section>
        )}
      </main>

      <Footer>PROMPT GOLF // team station // timed holes and shared score locking</Footer>
    </>
  );
}
