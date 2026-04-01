import PortalCard from "../components/PortalCard";
import ScrollScrubSection from "../components/ScrollScrubSection";
import SiteHeader from "../components/SiteHeader";
import StickySlideSection from "../components/StickySlideSection";
import Footer from "../components/Footer";
import { HeroStage } from "../components/HeroStage";
import { useBodyMode } from "../hooks/useBodyMode";
import { useRevealObserver } from "../hooks/useRevealObserver";
import { useScrollScrub } from "../hooks/useScrollScrub";

const academyModes = {
  grid: {
    title: "Base Layer",
    note:
      "Base Layer introduce que es un modelo, como lee patrones, que hace un prompt y por que la evaluacion importa tanto como la generacion.",
    prompt:
      '"Que cambia para un disenador cuando una maquina ya puede generar texto, imagen, variantes y criterio provisional?"',
    stats: [
      "modelos // inputs y outputs",
      "prompts // estructura y contexto",
      "criterio // validar antes de confiar",
    ],
    summary:
      "Empezamos en fundamentos, pasamos por herramientas y cerramos en escenarios futuros para objetos, procesos y sistemas.",
  },
  amber: {
    title: "Studio Flow",
    note:
      "Studio Flow baja la conversacion a taller: ideacion, referencias, visualizacion, nomenclatura, presentaciones y loops rapidos de prueba.",
    prompt:
      '"Como puede una IA asistir un proceso sin reemplazar la mirada proyectual ni el criterio del autor?"',
    stats: [
      "brief // intencion y limites",
      "workflow // iteracion y sintesis",
      "output // calidad util para proyecto",
    ],
    summary:
      "La clase conecta herramientas con decisiones reales de estudio para que IA aparezca como instrumento y no como ruido futurista.",
  },
  violet: {
    title: "Future Signal",
    note:
      "Future Signal abre la parte especulativa: impacto en profesiones, cambios en cadenas de valor, etica, autoria y nuevas competencias.",
    prompt:
      '"Que tipo de profesional emerge cuando la generacion automatica deja de ser novedad y pasa a ser infraestructura?"',
    stats: [
      "riesgo // sesgos y dependencia",
      "futuro // nuevas incumbencias",
      "posicion // criterio y responsabilidad",
    ],
    summary:
      "El cierre no vende magia: discute poder, limites y oportunidades reales para diseno industrial, docencia y trabajo colaborativo.",
  },
};

export default function AcademyLanding() {
  useBodyMode("grid", "page-academy");
  useRevealObserver();
  useScrollScrub();

  return (
    <>
      <SiteHeader
        brand="IA // INDUSTRIAL"
        brandTo="/fundamentos-ia"
        ctaLabel="Abrir biblioteca"
        ctaTo="/fundamentos-ia/recursos"
        links={[
          { label: "Mapa", to: "/fundamentos-ia#overview" },
          { label: "Presentacion", to: "/fundamentos-ia#deck" },
          { label: "Recursos", to: "/fundamentos-ia#resources-preview" },
          { label: "Juego", to: "/" },
        ]}
      />

      <main id="top">
        <section className="hero academy-hero">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">CLASE ABIERTA // BASE LAYER // FUTURO PRODUCTIVO</p>
            <h1>Fundamentos Basicos de IA</h1>
            <p className="lead">
              Una landing-presentacion para recorrer conceptos esenciales de IA desde la mirada
              del diseno industrial: modelos, prompts, criterio, materialidad, workflow y nuevas
              formas de prototipar.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#deck">
                Entrar a la presentacion
              </a>
              <a className="secondary-button" href="#resources-preview">
                Ver recursos
              </a>
            </div>

            <div className="hero-stats">
              <article className="stat-card">
                <span className="stat-value">01</span>
                <span className="stat-label">clase principal con ritmo de landing</span>
              </article>
              <article className="stat-card">
                <span className="stat-value">STICKY</span>
                <span className="stat-label">slides grandes y anclados al viewport</span>
              </article>
              <article className="stat-card">
                <span className="stat-value">LAB</span>
                <span className="stat-label">puente directo al universo del juego</span>
              </article>
            </div>
          </div>

          <HeroStage
            kicker="Lente activo"
            panelLabel="Pregunta guia"
            scoreLabel="Trayectoria"
            summaryLabel="Ritmo de clase"
            modes={academyModes}
          />
        </section>

        <section className="section" id="overview">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Mapa de clase</p>
            <h2>Una experiencia de aula pensada como escenario digital</h2>
            <p className="section-copy">
              La clase esta organizada para que teoria, casos, referencias y demostraciones
              compartan el mismo lenguaje visual. Cuando subas tus imagenes y videos, esta
              estructura ya queda lista para alojarlos.
            </p>
          </div>

          <div className="concept-grid">
            {[
              [
                "01",
                "Entender",
                "Que es IA generativa, como funciona a grandes rasgos y donde se ubica dentro de un proceso de diseno industrial.",
              ],
              [
                "02",
                "Aplicar",
                "Traducir necesidades de proyecto en instrucciones, criterios, referencias y sistemas de prueba concretos.",
              ],
              [
                "03",
                "Criticar",
                "Detectar limites, sesgos, alucinaciones, riesgos eticos y zonas donde el juicio humano sigue siendo central.",
              ],
            ].map(([index, title, copy]) => (
              <article className="concept-card" data-reveal key={index}>
                <span className="direction-index">{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <div id="deck">
          <StickySlideSection
            align="left"
            eyebrow="Deck principal"
            title="Pantallas grandes, fijas y mucho mas fluidas"
            description="Cada slide ocupa casi todo el viewport y queda anclado mientras lo recorres. La idea es priorizar lectura, presencia y suavidad real antes que una coreografia pesada."
            slideTag="Slide 01"
            slideTitle="Portada y premisa"
            slideText="Reemplaza este bloque por tu primera imagen o portada de clase."
            metaLabel="Apertura"
            metaTitle="Que es IA para un disenador industrial"
            metaText="Ideal para abrir la clase con una pregunta central y un clima visual fuerte."
            toneClass="tone-main"
          />

          <StickySlideSection
            eyebrow="Sistema"
            title="Modelos, contexto, prompts y criterio"
            description="Este segundo bloque esta pensado para esquemas, mapas conceptuales o comparativas. Mantiene la misma escala grande, pero con una entrada mas lateral."
            slideTag="Slide 02"
            slideTitle="Modelos y flujos"
            slideText="Espacio para esquemas, mapas conceptuales o un frame de proceso."
            metaLabel="Estructura"
            metaTitle="Input, contexto, salida, criterio"
            metaText="Puede alojar timelines, graficos simples o explicaciones de flujo."
            toneClass="tone-a"
          />

          <StickySlideSection
            align="left"
            eyebrow="Aplicacion"
            title="IA dentro del workflow de diseno"
            description="Un tercer momento para mostrar producto, materialidad, proceso o herramientas concretas dentro del estudio."
            slideTag="Slide 03"
            slideTitle="Diseno y materialidad"
            slideText="Reservado para imagenes de producto, sketches o procesos."
            metaLabel="Uso"
            metaTitle="Donde entra IA en el workflow"
            metaText="Ideacion, research, naming, narrativa, variantes y visualizacion rapida."
            toneClass="tone-b"
          />

          <StickySlideSection
            eyebrow="Capa critica"
            title="Riesgos, errores y limites"
            description="Aca la experiencia baja un cambio y se vuelve mas reflexiva. Es el tramo ideal para hablar de sesgos, alucinaciones y validacion."
            slideTag="Slide 04"
            slideTitle="Riesgos y limites"
            slideText="Perfecto para poner sesgos, errores, alucinaciones y discusiones eticas."
            metaLabel="Revision"
            metaTitle="Cuando no alcanza con generar"
            metaText="La capa critica de la clase: validar, comparar y justificar."
            toneClass="tone-c"
          />

          <StickySlideSection
            align="left"
            eyebrow="Cierre"
            title="Escenario futuro para objetos, sistemas y profesionales"
            description="Cierra con vision, industria, automatizacion y nuevas competencias. Puede ser mas manifiesto, mas especulativo o mas practico segun el material que subas."
            slideTag="Slide 05"
            slideTitle="Escenario futuro"
            slideText="Cierra con vision, industria, automatizacion y diseno de sistemas."
            metaLabel="Prospectiva"
            metaTitle="Que tipo de profesional emerge"
            metaText="Un final para conectar IA, criterio y cultura proyectual."
            toneClass="tone-d"
          />
        </div>

        <ScrollScrubSection
          eyebrow="Media inmersiva"
          title="El video vive en la escena y responde al scroll"
          description="Este bloque queda integrado al fondo, con una capa de grilla y progresion simple para que el video avance o retroceda con el scroll sin meter una escena pesada encima."
          bullets={[
            "ideal para procesos paso a paso",
            "sirve para demos de herramientas",
            "funciona bien con loops cortos y ritmicos",
          ]}
          videoHint={{
            tag: "Video slot 01",
            title: "Demostracion con scroll-scrub",
            description:
              "Cuando subas un video, esta zona lo va a reproducir hacia adelante o hacia atras segun el scroll.",
            path: "public/media/videos/video-01.mp4",
          }}
          chipLeft={{ label: "Control", text: "el scroll gobierna el tiempo del clip" }}
          chipRight={{ label: "Uso", text: "casos, demos, procesos, interfaces" }}
        />

        <StickySlideSection
          eyebrow="Modulo aplicado"
          title="Casos de estudio, objetos y procesos"
          description="Este bloque reemplaza la secuencia compleja anterior por un slide compacto pero todavia dominante. Sirve para un objeto, un before/after o un caso de estudio."
          slideTag="Case 01"
          slideTitle="Objeto"
          metaLabel="Producto"
          metaTitle="Variacion formal"
          metaText="Ideal para objeto, iteracion, materialidad o sistema."
          toneClass="tone-e"
          compact
        />

        <StickySlideSection
          align="left"
          eyebrow="Critica"
          title="Errores, limites y lectura de casos"
          description="Otro bloque mas para mostrar error, revision o debate critico sin perder escala visual."
          slideTag="Case 02"
          slideTitle="Proceso"
          metaLabel="Workflow"
          metaTitle="Toolchain y metodo"
          metaText="Sirve para explicar herramientas, etapas o decisiones de proceso."
          toneClass="tone-f"
          compact
        />

        <ScrollScrubSection
          alternate
          eyebrow="Segundo tempo"
          title="Mas espacio para demos, prototipos o procesos"
          description="La segunda pista audiovisual queda lista para un cierre especulativo, un before/after o una demo mas intensa."
          bullets={[
            "sirve para mostrar antes y despues",
            "permite cerrar con una pieza potente",
            "mantiene la narrativa sin salir del clima",
          ]}
          videoHint={{
            tag: "Video slot 02",
            title: "Segundo bloque audiovisual",
            description:
              "Esta segunda pista puede alojar un caso, una herramienta o una pieza mas especulativa para cerrar la clase con impacto.",
            path: "public/media/videos/video-02.mp4",
          }}
          chipLeft={{ label: "Tempo", text: "scroll lento para abrir, rapido para impactar" }}
          chipRight={{ label: "Narrativa", text: "perfecto para cierre, tesis o manifiesto" }}
        />

        <section className="section" id="resources-preview">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Biblioteca viva</p>
            <h2>Una pagina aparte para papers, videos y referencias</h2>
            <p className="section-copy">
              La presentacion vive aca, pero la investigacion necesita su propia nave. Por eso
              deje una biblioteca separada para organizar PDFs, links, canales, papers y material
              de consulta.
            </p>
          </div>

          <div className="portal-grid">
            <PortalCard
              to="/fundamentos-ia/recursos"
              tag="Recursos"
              title="Abrir la biblioteca de clase"
              copy="Papers, videos, bibliografia, casos y links utiles en una pagina pensada para crecer con la cursada."
              linkLabel="Entrar a recursos"
            />
            <PortalCard
              game
              to="/"
              tag="Continuidad"
              title="Seguir hacia Prompt Golf"
              copy="La clase puede desembocar directo en el universo del juego. No es un link suelto: es una puerta escenica al laboratorio arcade."
              linkLabel="Entrar al juego"
            />
          </div>
        </section>
      </main>

      <Footer>FUNDAMENTOS BASICOS DE IA // landing de clase para diseno industrial</Footer>
    </>
  );
}
