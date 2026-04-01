import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import { MODELS, TRACKS } from "../data/promptGolfData";
import { useBodyMode } from "../hooks/useBodyMode";
import { useClassroomBackend } from "../hooks/useClassroomBackend";
import { useRevealObserver } from "../hooks/useRevealObserver";
import {
  addTeamToSession,
  advanceClassroomHole,
  buildSessionLeaderboard,
  closeLiveHole,
  createClassroomSession,
  deleteClassroomSession,
  formatTime,
  getActiveClassroomSession,
  getRemainingTimeMs,
  getSessionSummary,
  launchCurrentHole,
  removeTeamFromSession,
  setActiveClassroomSession,
} from "../lib/classroomStore";
import {
  addRemoteTeam,
  advanceRemoteHole,
  closeRemoteHole,
  createRemoteSession,
  hasSupabaseConfig,
  launchRemoteHole,
  removeRemoteTeam,
} from "../lib/classroomSupabase";

function createInitialSessionForm() {
  return {
    name: "Clase fundamentos IA",
    trackId: TRACKS[0].id,
    modelId: MODELS[0].id,
    holeCount: 2,
    timeLimitSeconds: 300,
    revealMode: "hole",
  };
}

function createInitialTeamMembers() {
  return ["", "", "", ""];
}

export default function PromptGolfClassroom() {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const { mode, sessions: sessionList, activeSession, loading } = useClassroomBackend(selectedSessionId);
  const [sessionForm, setSessionForm] = useState(createInitialSessionForm);
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState(createInitialTeamMembers);

  const sessionSummary = activeSession ? getSessionSummary(activeSession) : null;
  const leaderboard = activeSession ? buildSessionLeaderboard(activeSession) : [];
  const remainingMs = activeSession ? getRemainingTimeMs(activeSession) : 0;
  const backendMode = hasSupabaseConfig ? "supabase" : mode;

  useBodyMode(activeSession?.trackId ? sessionSummary.track.mode : "grid", "page-prompt-golf-classroom");
  useRevealObserver();

  useEffect(() => {
    if (!selectedSessionId && sessionList.length) {
      setSelectedSessionId(sessionList[0].id);
    }
  }, [selectedSessionId, sessionList]);

  async function handleCreateSession(event) {
    event.preventDefault();

    const nextSessionId = backendMode === "supabase"
      ? await createRemoteSession({
          ...sessionForm,
          holeCount: Number(sessionForm.holeCount),
          timeLimitSeconds: Number(sessionForm.timeLimitSeconds),
        })
      : createClassroomSession({
          ...sessionForm,
          holeCount: Number(sessionForm.holeCount),
          timeLimitSeconds: Number(sessionForm.timeLimitSeconds),
        });

    setSelectedSessionId(nextSessionId);
  }

  async function handleAddTeam(event) {
    event.preventDefault();

    if (!activeSession) {
      return;
    }

    if (backendMode === "supabase") {
      await addRemoteTeam(activeSession.id, {
        name: teamName,
        members: teamMembers,
      });
    } else {
      addTeamToSession(activeSession.id, {
        name: teamName,
        members: teamMembers,
      });
    }

    setTeamName("");
    setTeamMembers(createInitialTeamMembers());
  }

  return (
    <>
      <SiteHeader
        brand="PROMPT GOLF // CLASSROOM"
        brandTo="/classroom"
        ctaLabel="Ir al juego"
        ctaTo="/play"
        links={[
          { label: "Docente", to: "/classroom#teacher" },
          { label: "Equipos", to: "/classroom#teams" },
          { label: "Broadcast", to: "/classroom#broadcast" },
          { label: "Arcade", to: "/play" },
        ]}
      />

      <main className="classroom-page">
        <section className="classroom-hero" data-reveal>
          <div className="classroom-hero-copy">
            <p className="eyebrow">Modo aula // control docente // score wall</p>
            <h1>Session control for live class play.</h1>
            <p className="lead">
              Este modo organiza equipos de 4 estudiantes, lanza hoyos con reloj, bloquea
              resultados al cierre y alimenta una pantalla de score aparte para proyectar en
              clase.
            </p>
          </div>

          <article className="panel classroom-note-panel">
            <div className="panel-bar">
              <span>aula MVP</span>
              <span>local sync</span>
            </div>
            <p className="map-copy">
              Esta primera version funciona como prototipo local del aula y ya separa docente,
              cabina de equipo y broadcast. El siguiente salto natural es sincronizarlo entre
              multiples dispositivos con backend realtime.
            </p>
          </article>
        </section>

        <section className="classroom-grid" id="teacher">
          <aside className="classroom-sidebar">
            <article className="panel sidebar-panel" data-reveal>
              <div className="panel-bar">
                <span>session builder</span>
                <span>teacher setup</span>
              </div>

              <form className="teacher-form" onSubmit={handleCreateSession}>
                <label className="field-label" htmlFor="session-name">
                  Session name
                </label>
                <input
                  id="session-name"
                  className="arcade-input"
                  value={sessionForm.name}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, name: event.target.value }))
                  }
                />

                <label className="field-label" htmlFor="session-track">
                  Track
                </label>
                <select
                  id="session-track"
                  className="arcade-input classroom-select"
                  value={sessionForm.trackId}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, trackId: event.target.value }))
                  }
                >
                  {TRACKS.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>

                <div className="teacher-form-split">
                  <div>
                    <label className="field-label" htmlFor="session-model">
                      Model
                    </label>
                    <select
                      id="session-model"
                      className="arcade-input classroom-select"
                      value={sessionForm.modelId}
                      onChange={(event) =>
                        setSessionForm((current) => ({ ...current, modelId: event.target.value }))
                      }
                    >
                      {MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label" htmlFor="session-holes">
                      Holes
                    </label>
                    <select
                      id="session-holes"
                      className="arcade-input classroom-select"
                      value={sessionForm.holeCount}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          holeCount: Number(event.target.value),
                        }))
                      }
                    >
                      <option value={1}>1 hoyo</option>
                      <option value={2}>2 hoyos</option>
                    </select>
                  </div>
                </div>

                <div className="teacher-form-split">
                  <div>
                    <label className="field-label" htmlFor="session-timer">
                      Time per hole
                    </label>
                    <select
                      id="session-timer"
                      className="arcade-input classroom-select"
                      value={sessionForm.timeLimitSeconds}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          timeLimitSeconds: Number(event.target.value),
                        }))
                      }
                    >
                      <option value={180}>03:00</option>
                      <option value={240}>04:00</option>
                      <option value={300}>05:00</option>
                      <option value={420}>07:00</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label" htmlFor="session-reveal">
                      Reveal mode
                    </label>
                    <select
                      id="session-reveal"
                      className="arcade-input classroom-select"
                      value={sessionForm.revealMode}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          revealMode: event.target.value,
                        }))
                      }
                    >
                      <option value="hole">show after each hole</option>
                      <option value="live">show live</option>
                    </select>
                  </div>
                </div>

                <button className="primary-button classroom-button" type="submit">
                  Create session
                </button>
              </form>
            </article>

            <article className="panel sidebar-panel" data-reveal>
              <div className="panel-bar">
                <span>session bay</span>
                <span>
                  {loading ? "syncing" : `${sessionList.length} loaded`} // {backendMode}
                </span>
              </div>

              <div className="selector-grid">
                {sessionList.length ? (
                  sessionList.map((session) => (
                    <button
                      key={session.id}
                      className={`selector-chip ${
                        (activeSession?.id ?? selectedSessionId) === session.id ? "is-active" : ""
                      }`}
                      type="button"
                      onClick={() => {
                        if (backendMode !== "supabase") {
                          setActiveClassroomSession(session.id);
                        }

                        setSelectedSessionId(session.id);
                      }}
                    >
                      <span>{session.name}</span>
                      <small>{session.id} // {session.phase}</small>
                    </button>
                  ))
                ) : (
                  <p className="map-copy">
                    Todavia no hay sesiones creadas. Arranca una cabina docente desde el panel
                    de arriba.
                  </p>
                )}
              </div>
            </article>
          </aside>

          <div className="classroom-stage">
            {activeSession ? (
              <>
                <article className="panel classroom-control-panel" data-reveal>
                  <div className="panel-bar">
                    <span>active session // {activeSession.id}</span>
                    <span>{activeSession.phase}</span>
                  </div>

                  <div className="classroom-control-topline">
                    <div>
                      <p className="eyebrow">{activeSession.name}</p>
                      <h2>{sessionSummary.track.name}</h2>
                    </div>
                    <div className="timer-display">
                      <strong>{formatTime(remainingMs)}</strong>
                      <span>
                        hole {activeSession.activeHoleIndex + 1}/{activeSession.holeIds.length}
                      </span>
                    </div>
                  </div>

                  <div className="briefing-grid classroom-brief-grid">
                    <article className="brief-card">
                      <p className="panel-label">Current hole</p>
                      <p>{sessionSummary.hole.title}</p>
                      <small className="mini-copy">{sessionSummary.hole.objective}</small>
                    </article>
                    <article className="brief-card">
                      <p className="panel-label">Model</p>
                      <p>{sessionSummary.model.name}</p>
                      <small className="mini-copy">{sessionSummary.model.description}</small>
                    </article>
                    <article className="brief-card">
                      <p className="panel-label">Reveal</p>
                      <p>{activeSession.revealMode === "hole" ? "after hole" : "live score"}</p>
                      <small className="mini-copy">
                        {activeSession.timeLimitSeconds / 60} min por hoyo
                      </small>
                    </article>
                  </div>

                  <div className="teacher-action-row">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        backendMode === "supabase"
                          ? launchRemoteHole(activeSession.id)
                          : launchCurrentHole(activeSession.id)
                      }
                      disabled={activeSession.phase === "live" || activeSession.phase === "finished"}
                    >
                      Launch hole
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        backendMode === "supabase"
                          ? closeRemoteHole(activeSession.id)
                          : closeLiveHole(activeSession.id)
                      }
                      disabled={activeSession.phase !== "live"}
                    >
                      Close hole
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        backendMode === "supabase"
                          ? advanceRemoteHole(activeSession.id)
                          : advanceClassroomHole(activeSession.id)
                      }
                      disabled={activeSession.phase === "live" || activeSession.phase === "finished"}
                    >
                      Next hole
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        if (backendMode === "supabase") {
                          // delete on Supabase can come in the next iteration once ownership is stricter.
                          return;
                        }

                        deleteClassroomSession(activeSession.id);
                      }}
                      disabled={backendMode === "supabase"}
                    >
                      Delete session
                    </button>
                  </div>
                </article>

                <section className="classroom-lower-grid" id="teams">
                  <article className="panel classroom-team-panel" data-reveal>
                    <div className="panel-bar">
                      <span>team roster</span>
                      <span>{activeSession.teams.length} registered</span>
                    </div>

                    <form className="teacher-form" onSubmit={handleAddTeam}>
                      <label className="field-label" htmlFor="team-name">
                        Team name
                      </label>
                      <input
                        id="team-name"
                        className="arcade-input"
                        value={teamName}
                        onChange={(event) => setTeamName(event.target.value.toUpperCase())}
                      />

                      <div className="member-grid">
                        {teamMembers.map((member, index) => (
                          <div key={index}>
                            <label className="field-label" htmlFor={`member-${index}`}>
                              Student {index + 1}
                            </label>
                            <input
                              id={`member-${index}`}
                              className="arcade-input"
                              value={member}
                              onChange={(event) =>
                                setTeamMembers((current) =>
                                  current.map((entry, entryIndex) =>
                                    entryIndex === index ? event.target.value : entry
                                  )
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        className="primary-button classroom-button"
                        type="submit"
                        disabled={!activeSession}
                      >
                        Add team
                      </button>
                    </form>

                    <div className="team-roster">
                      {activeSession.teams.map((team) => (
                        <article className="team-card" key={team.id}>
                          <div className="team-card-head">
                            <strong>{team.name}</strong>
                            <button
                              className="ghost-button team-remove"
                              type="button"
                              onClick={() =>
                                backendMode === "supabase"
                                  ? removeRemoteTeam(activeSession.id, team.id)
                                  : removeTeamFromSession(activeSession.id, team.id)
                              }
                            >
                              remove
                            </button>
                          </div>
                          <p className="team-card-subtitle">{team.id}</p>
                          <ul className="brief-list">
                            {team.members.map((member, index) => (
                              <li key={`${team.id}-${index}`}>{member || `Student ${index + 1}`}</li>
                            ))}
                          </ul>
                          <div className="team-link-row">
                            <Link
                              className="secondary-button"
                              to={`/classroom/team?session=${activeSession.id}&team=${team.id}`}
                            >
                              Team station
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="panel classroom-broadcast-panel" id="broadcast" data-reveal>
                    <div className="panel-bar">
                      <span>broadcast routes</span>
                      <span>projector ready</span>
                    </div>

                    <div className="portal-grid">
                      <article className="portal-card portal-card-game">
                        <p className="portal-tag">team access</p>
                        <h3>Cabinas de equipo</h3>
                        <p>
                          Cada equipo entra a su station, ve el reloj del hoyo, chatea con el
                          modelo y bloquea score cuando esta conforme.
                        </p>
                        <Link
                          className="portal-link"
                          to={`/classroom/team?session=${activeSession.id}`}
                        >
                          Open join screen
                        </Link>
                      </article>

                      <article className="portal-card portal-card-game">
                        <p className="portal-tag">score wall</p>
                        <h3>Pantalla de resultados</h3>
                        <p>
                          Esta ruta esta pensada para proyector: timer, estado de equipos,
                          progreso del hoyo y ranking general.
                        </p>
                        <Link
                          className="portal-link"
                          to={`/classroom/broadcast?session=${activeSession.id}`}
                        >
                          Open broadcast
                        </Link>
                      </article>
                    </div>

                    <div className="leaderboard-list classroom-preview-list">
                      {leaderboard.map((team, index) => (
                        <div className="leaderboard-row" key={team.id}>
                          <span className="leaderboard-rank">{index + 1}</span>
                          <strong>{team.name}</strong>
                          <span>{team.validHoles} clear</span>
                          <span className="leaderboard-score">{team.totalScoreDisplay}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              </>
            ) : (
              <article className="panel classroom-empty-panel" data-reveal>
                <div className="panel-bar">
                  <span>teacher console</span>
                  <span>waiting</span>
                </div>
                <h2>No active session yet.</h2>
                <p className="section-copy">
                  Crea una sesion nueva desde el panel de la izquierda para habilitar equipos,
                  reloj por hoyo y pantalla de broadcast.
                </p>
              </article>
            )}
          </div>
        </section>
      </main>

      <Footer>PROMPT GOLF // classroom mode MVP // teacher control + team stations + broadcast wall</Footer>
    </>
  );
}
