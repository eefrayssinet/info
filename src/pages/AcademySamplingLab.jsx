import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import TokenSamplingLab from "../components/TokenSamplingLab";
import { useBodyMode } from "../hooks/useBodyMode";
import { useRevealObserver } from "../hooks/useRevealObserver";

export default function AcademySamplingLab() {
  useBodyMode("amber", "page-academy");
  useRevealObserver();

  return (
    <>
      <SiteHeader
        brand="IA // LAB"
        brandTo="/fundamentos-ia/lab-sampling"
        ctaLabel="Volver a clase"
        ctaTo="/fundamentos-ia"
        links={[
          { label: "Mapa", to: "/fundamentos-ia#overview" },
          { label: "Presentacion", to: "/fundamentos-ia#deck" },
          { label: "Recursos", to: "/fundamentos-ia/recursos" },
          { label: "Lab", to: "/fundamentos-ia/lab-sampling" },
          { label: "Juego", to: "/" },
        ]}
      />

      <main>
        <section className="section">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Laboratorio interactivo</p>
            <h2>Sampling, contexto y distribuciones</h2>
            <p className="section-copy">
              Esta pestana suma una demo interactiva para mostrar como cambian las
              probabilidades de salida cuando alteras el prompt, la temperatura y el filtro
              top-p.
            </p>
          </div>

          <div data-reveal>
            <TokenSamplingLab />
          </div>
        </section>
      </main>

      <Footer>FUNDAMENTOS BASICOS DE IA // sampling lab</Footer>
    </>
  );
}
