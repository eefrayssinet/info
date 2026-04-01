import Footer from "../components/Footer";
import PortalCard from "../components/PortalCard";
import SiteHeader from "../components/SiteHeader";
import { useBodyMode } from "../hooks/useBodyMode";
import { useRevealObserver } from "../hooks/useRevealObserver";

export default function AcademyResources() {
  useBodyMode("amber", "page-academy");
  useRevealObserver();

  return (
    <>
      <SiteHeader
        brand="IA // RESOURCES"
        brandTo="/fundamentos-ia/recursos"
        ctaLabel="Volver a clase"
        ctaTo="/fundamentos-ia"
        links={[
          { label: "Biblioteca", to: "/fundamentos-ia/recursos#library" },
          { label: "Streams", to: "/fundamentos-ia/recursos#streams" },
          { label: "Presentacion", to: "/fundamentos-ia" },
          { label: "Juego", to: "/" },
        ]}
      />

      <main>
        <section className="hero resources-hero">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">PDFS // VIDEOS // LINKS // GLOSARIO</p>
            <h1>Biblioteca de Recursos</h1>
            <p className="lead">
              Una segunda pagina para alojar el material complementario de la clase: papers, links
              curados, videos, casos, herramientas y notas de investigacion.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#library">
                Ir a la biblioteca
              </a>
              <a className="secondary-button" href="#streams">
                Ver streams
              </a>
            </div>
          </div>

          <article className="hero-stage" data-reveal>
            <div className="stage-topline">
              <span className="stage-kicker">Archivo vivo</span>
            </div>
            <p className="mode-note">
              Esta pagina esta pensada para crecer clase a clase. No hace falta tocar la
              estructura: solo ir agregando recursos en las categorias.
            </p>
            <div className="stage-grid" />
            <div className="stage-glow stage-glow-a" />
            <div className="stage-glow stage-glow-b" />
            <div className="stage-ring" />
            <div className="stage-ring-secondary" />
            <div className="stage-beam" />
            <div className="stage-ball" />
            <div className="stage-tee" />
            <div className="stage-arc" />
            <div className="stage-trace" />

            <article className="stage-card stage-card-left">
              <p className="panel-label">Rutas sugeridas</p>
              <p className="stage-code">
                public/media/papers/
                <br />
                public/media/videos/
                <br />
                public/media/links/
              </p>
            </article>

            <article className="stage-card stage-card-right">
              <p className="panel-label">Categorias</p>
              <ul className="micro-list">
                <li>papers</li>
                <li>casos</li>
                <li>tooling</li>
              </ul>
            </article>

            <article className="stage-card stage-card-bottom">
              <p className="panel-label">Uso</p>
              <p className="stage-summary">
                Sirve como biblioteca, bibliografia expandida y base viva para futuras clases o
                talleres.
              </p>
            </article>
          </article>
        </section>

        <section className="section" id="library">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Categorias</p>
            <h2>Organizado para crecer sin perder claridad</h2>
          </div>

          <div className="resource-grid">
            {[
              [
                "Papers",
                "Lecturas clave",
                "Espacio para papers introductorios, marcos teoricos y textos sobre IA aplicada al diseno.",
                ["paper-01.pdf", "paper-02.pdf", "paper-03.pdf"],
              ],
              [
                "Videos",
                "Charlas y demos",
                "Lugar para conferencias, walkthroughs, demostraciones y links curados para profundizar.",
                ["canal / entrevista / demo", "tool breakdown", "caso de estudio visual"],
              ],
              [
                "Casos",
                "Aplicaciones reales",
                "Proyectos, estudios, productos y procesos donde IA cambia ideacion, investigacion o comunicacion.",
                ["producto", "servicio", "sistema"],
              ],
              [
                "Glosario",
                "Lenguaje comun",
                "Terminos utiles para aula: modelo, token, embeddings, contexto, fine-tuning, evaluacion y mas.",
                ["modelo", "contexto", "alineacion"],
              ],
            ].map(([tag, title, copy, items]) => (
              <article className="resource-card" data-reveal key={title}>
                <span className="portal-tag">{tag}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <ul className="micro-list telemetry-list">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="streams">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Streams de lectura</p>
            <h2>Cuatro entradas para distintos perfiles de cursada</h2>
            <p className="section-copy">
              Tambien podes usar esta pagina como curaduria por interes: teoria, herramientas,
              casos o debate critico.
            </p>
          </div>

          <div className="concept-grid">
            {[
              ["01", "Base teorica", "Para arrancar desde cero y armar un vocabulario comun."],
              ["02", "Herramientas", "Para quienes quieran probar flujos y plataformas concretas."],
              ["03", "Casos y objetos", "Para conectar la teoria con produccion, forma y materialidad."],
            ].map(([index, title, copy]) => (
              <article className="concept-card" data-reveal key={title}>
                <span className="direction-index">{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="portal-grid">
            <PortalCard
              to="/fundamentos-ia"
              tag="Volver"
              title="Regresar a la presentacion"
              copy="Volve al recorrido principal de la clase y segui navegando la narrativa visual."
              linkLabel="Abrir presentacion"
            />
            <PortalCard
              game
              to="/"
              tag="Continuidad"
              title="Saltar al universo de Prompt Golf"
              copy="Desde la teoria de IA a la ficcion jugable, sin cortar el mismo clima visual."
              linkLabel="Entrar al juego"
            />
          </div>
        </section>
      </main>

      <Footer>BIBLIOTECA DE RECURSOS // fundamentos basicos de ia</Footer>
    </>
  );
}
