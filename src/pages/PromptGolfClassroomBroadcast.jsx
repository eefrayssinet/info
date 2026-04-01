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
} from "../lib/classroomStore";

function getBroadcastStatusLabel(status) {
  if (status === "locked") {
    return "locked";
  }

  if (status === "timeout") {
    return "timeout";
  }

  if (status === "ready") {
    return "ready";
  }

  if (status === "live") {
    return "playing";
  }

  return "waiting";
}

export default function PromptGolfClassroomBroadcast() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const { session } = useSingleClassroomSession(sessionId);
  const sessionSummary = session ? getSessionSummary(session) : null;
  const leaderboard = session ? buildSessionLeaderboard(session) : [];
  const remainingMs = session ? getRemainingTimeMs(session) : 0;
  const revealScores = session ? session.revealMode === "live" || session.phase !== "live" : false;

  useBodyMode(sessionSummary?.track.mode ?? "grid", "page-prompt-golf-classroom");
  useRevealObserver();

  return (
    <>
      <SiteHeader
        brand="PROMPT GOLF // BROADCAST"
        brandTo={session ? `/classroom/broadcast?session=${session.id}` : "/classroom/broadcast"}
        ctaLabel="Teacher desk"
        ctaTo="/classroom"
        links={[
          { label: "Broadcast", to: session ? `/classroom/broadcast?session=${session.id}` : "/classroom/broadcast" },
          { label: "Teacher", to: "/classroom" },
          { label: "Team", to: session ? `/classroom/team?session=${session.id}` : "/classroom/team" },
          { label: "Arcade", to: "/play" },
        ]}
      />

      <main className="broadcast-page">
        {session ? (
          <>
            <section className="broadcast-hero" data-reveal>
              <div className="broadcast-title">
                <p className="eyebrow">Score wall // projector mode</p>
                <h1>{session.name}</h1>
                <p className="lead">
                  {sessionSummary.track.name} // {sessionSummary.hole.title} // {sessionSummary.model.name}
                </p>
              </div>

              <div className="broadcast-meta">
                <article className="panel broadcast-chip">
                  <span className="panel-label">Timer</span>
                  <strong>{formatTime(remainingMs)}</strong>
                </article>
                <article className="panel broadcast-chip">
                  <span className="panel-label">Hole</span>
                  <strong>
                    {session.activeHoleIndex + 1}/{session.holeIds.length}
                  </strong>
                </article>
                <article className="panel broadcast-chip">
                  <span className="panel-label">Phase</span>
                  <strong>{session.phase}</strong>
                </article>
                <article className="panel broadcast-chip">
                  <span className="panel-label">Reveal</span>
                  <strong>{session.revealMode === "live" ? "live" : "after hole"}</strong>
                </article>
              </div>
            </section>

            <section className="broadcast-grid">
              {leaderboard.map((team, index) => (
                <article className="panel broadcast-card" key={team.id} data-reveal>
                  <div className="broadcast-card-head">
                    <span className="broadcast-rank">#{index + 1}</span>
                    <span className={`broadcast-status status-${team.currentStatus}`}>
                      {getBroadcastStatusLabel(team.currentStatus)}
                    </span>
                  </div>

                  <h2>{team.name}</h2>
                  <p className="map-copy">{team.members.filter(Boolean).join(" // ") || "4 students"}</p>

                  <div className="broadcast-card-metrics">
                    <div>
                      <span className="panel-label">Current</span>
                      <strong>{revealScores && team.revealed ? team.currentScore : "--"}</strong>
                    </div>
                    <div>
                      <span className="panel-label">Total</span>
                      <strong>{revealScores && team.revealed ? team.totalScoreDisplay : "--"}</strong>
                    </div>
                    <div>
                      <span className="panel-label">Prompts</span>
                      <strong>{team.currentPrompts}</strong>
                    </div>
                    <div>
                      <span className="panel-label">Clear</span>
                      <strong>{team.validHoles}</strong>
                    </div>
                  </div>

                  <div className="broadcast-progress">
                    <span>completion</span>
                    <div>
                      <i style={{ width: `${team.currentCompletion}%` }} />
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="broadcast-lower" data-reveal>
              <article className="panel broadcast-table-panel">
                <div className="panel-bar">
                  <span>class ranking</span>
                  <span>{revealScores ? "visible" : "hidden until hole closes"}</span>
                </div>

                <div className="leaderboard-list">
                  {leaderboard.map((team, index) => (
                    <div className="leaderboard-row" key={`${team.id}-table`}>
                      <span className="leaderboard-rank">{index + 1}</span>
                      <strong>{team.name}</strong>
                      <span>
                        {team.completedHoles} / {session.holeIds.length} holes
                      </span>
                      <span className="leaderboard-score">
                        {revealScores && team.revealed ? team.totalScoreDisplay : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        ) : (
          <section className="classroom-grid">
            <article className="panel classroom-empty-panel" data-reveal>
              <div className="panel-bar">
                <span>broadcast</span>
                <span>waiting</span>
              </div>
              <h2>No session selected for the score wall.</h2>
              <p className="section-copy">
                Crea una sesion desde la cabina docente y despues vuelve a esta ruta con el
                `session` correcto para proyectar el ranking.
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

      <Footer>PROMPT GOLF // broadcast wall // classroom reveal and projector scoreboard</Footer>
    </>
  );
}
