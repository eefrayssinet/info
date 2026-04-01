import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { HeroStage } from "../components/HeroStage";
import SiteHeader from "../components/SiteHeader";
import { useBodyMode } from "../hooks/useBodyMode";
import { useRevealObserver } from "../hooks/useRevealObserver";

const trackCards = [
  {
    tag: "Track // 01",
    title: "Code Grid",
    copy: "Programacion, debugging, schemas, APIs y sistemas que premian prompts cortos, precisos y verificables.",
  },
  {
    tag: "Track // 02",
    title: "Studio Pulse",
    copy: "Diseno de interfaces, identidad, copy visual y criterio estetico traducido a instrucciones utiles.",
  },
  {
    tag: "Track // 03",
    title: "Structure Loop",
    copy: "Arquitectura, programa, circulacion y decisiones espaciales en hoyos donde el contexto pesa tanto como la forma.",
  },
  {
    tag: "Track // 04",
    title: "Legal Echo",
    copy: "Clausulas, riesgo, compliance y lectura de contratos en rondas donde una palabra de mas puede costar el hoyo.",
  },
  {
    tag: "Track // 05",
    title: "Market Run",
    copy: "Negocios, pricing, estrategia y decisiones de crecimiento para quienes sepan sintetizar sin perder foco.",
  },
  {
    tag: "Track // 06",
    title: "Thesis Void",
    copy: "Filosofia, logica, argumentacion y ensayo conceptual en canchas donde se gana por claridad, tension y rigor.",
  },
];

export default function PromptGolfLanding() {
  useBodyMode("grid", "page-prompt-golf");
  useRevealObserver();

  return (
    <>
      <SiteHeader
        brand="PROMPT GOLF"
        brandTo="/"
        ctaLabel="Jugar MVP"
        ctaTo="/play"
        links={[
          { label: "Canchas", to: "/#tracks" },
          { label: "Mecanica", to: "/#mechanics" },
          { label: "Comunidad", to: "/#community" },
          { label: "Jugar", to: "/play" },
          { label: "Clase", to: "/fundamentos-ia" },
        ]}
      />

      <main id="top">
        <section className="hero">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">ARCADE STRATEGY // MULTI MODEL // TRON TEASER</p>
            <h1>Prompt Golf</h1>
            <p className="lead">
              Un juego arcade-estrategico donde cada hoyo es un desafio para una IA. Elegis una
              cancha tematica, seleccionas el modelo y ganas cuando logras el objetivo con la
              menor cantidad de prompts posible.
            </p>

            <div className="hero-actions">
              <Link className="primary-button" to="/play">
                Entrar al MVP
              </Link>
              <a className="secondary-button" href="#tracks">
                Explorar canchas
              </a>
            </div>

            <div className="hero-stats" aria-label="Datos destacados">
              <article className="stat-card">
                <span className="stat-value">PAR</span>
                <span className="stat-label">menos prompts, mejor score</span>
              </article>
              <article className="stat-card">
                <span className="stat-value">06</span>
                <span className="stat-label">canchas iniciales del circuito</span>
              </article>
              <article className="stat-card">
                <span className="stat-value">LIVE</span>
                <span className="stat-label">chat y comunidad durante la partida</span>
              </article>
            </div>
          </div>

          <HeroStage />
        </section>

        <section className="section" id="tracks">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Select screen</p>
            <h2>Tres canchas destacadas del arcade</h2>
            <p className="section-copy">
              Como en un salon de los 90, no entras a una sola experiencia: elegis el sector donde
              queres jugar. Cada cancha cambia el tipo de desafio, el lenguaje esperado y la
              estrategia de prompting.
            </p>
          </div>

          <div className="direction-grid">
            {trackCards.slice(0, 3).map((card) => (
              <article key={card.title} className="direction-card is-active" data-reveal>
                <span className="direction-index">{card.tag}</span>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="mechanics">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Regla central</p>
            <h2>El golf esta en la economia del prompt</h2>
          </div>

          <div className="loop-grid">
            {[
              [
                "01",
                "Elegi modelo y hoyo",
                "Antes de arrancar seleccionas una cancha tematica, el modelo que queres poner a prueba y el objetivo exacto del desafio.",
              ],
              [
                "02",
                "Resolve con el menor numero",
                "Cada prompt cuenta como un golpe. Si cerras la tarea con menos intentos, quedas mas cerca del par y trepas en el leaderboard.",
              ],
              [
                "03",
                "Avanza hoyo por hoyo",
                "La complejidad sube a medida que avanza el circuito: validaciones mas duras, objetivos mas finos y menos espacio para ruido.",
              ],
            ].map(([index, title, copy]) => (
              <article key={index} className="loop-card" data-reveal>
                <span className="loop-index">{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="community">
          <div className="lab-layout">
            <article className="panel console-panel" data-reveal>
              <div className="panel-bar">
                <span>Partida + chat lateral</span>
                <span>room // code-grid-08</span>
              </div>
              <div className="console-line">
                <span className="console-prefix">&gt;</span>
                <span className="console-input">
                  corrige este bug sin romper el contrato publico y devolve solo el cambio esencial
                </span>
              </div>
              <div className="console-log">
                <p>crew // proba con menos contexto y un output mas rigido</p>
                <p>judge // respuesta valida parcial</p>
                <p>spectator // te queda un prompt para empatar el par</p>
                <p>system // leaderboard sincronizado</p>
              </div>
            </article>

            <div className="telemetry-stack">
              <article className="panel telemetry-panel" data-reveal>
                <div className="panel-bar">
                  <span>Prompt score</span>
                  <span>live</span>
                </div>
                {[["objetivo validado", 86], ["economia de prompts", 71], ["claridad del output", 92]].map(
                  ([label, width]) => (
                    <div className="meter" key={label}>
                      <span>{label}</span>
                      <div>
                        <i style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                )}
              </article>

              <article className="panel telemetry-panel" data-reveal>
                <div className="panel-bar">
                  <span>Arcade social</span>
                  <span>salas abiertas</span>
                </div>
                <ul className="micro-list telemetry-list">
                  <li>code-grid // 142 online</li>
                  <li>studio-pulse // 89 online</li>
                  <li>market-run // 54 online</li>
                </ul>
                <p className="map-copy">
                  Mientras jugas tenes chat lateral, crews por disciplina, espectadores, salas
                  de estrategia y comunidad persistente para practicar entre torneos.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Circuito inicial</p>
            <h2>Seis canchas, seis lenguajes mentales</h2>
          </div>

          <div className="arena-grid arena-grid-large">
            {trackCards.map((card) => (
              <article className="arena-card" data-reveal key={card.title}>
                <p className="panel-label">{card.tag}</p>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section cta-section">
          <article className="cta-panel" data-reveal>
            <p className="eyebrow">No existe todavia. Ya tiene ranking.</p>
            <h2>Reserva tu handle para entrar primero al arcade.</h2>
            <p className="section-copy">
              Mientras terminamos de bajar el concepto, ya hay otro portal abierto: la clase
              sobre IA para diseno industrial que vive en el mismo universo.
            </p>

            <div className="hero-actions">
              <Link className="primary-button" to="/play">
                Jugar ahora
              </Link>
              <Link className="secondary-button" to="/fundamentos-ia">
                Entrar a la clase
              </Link>
            </div>
          </article>
        </section>
      </main>

      <Footer>PROMPT GOLF // menos prompts, mejor score</Footer>
    </>
  );
}
