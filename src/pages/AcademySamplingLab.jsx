import Footer from "../components/Footer";
import ConceptVectorLab from "../components/ConceptVectorLab";
import DiffusionLab from "../components/DiffusionLab";
import SiteHeader from "../components/SiteHeader";
import TokenSamplingLab from "../components/TokenSamplingLab";
import VectorSpaceLab from "../components/VectorSpaceLab";
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
            <h2>Sampling, espacios vectoriales, parametros y diffusion</h2>
            <p className="section-copy">
              Esta pestana ahora junta cuatro demos locales: una para ver como cambia la
              distribucion de tokens en texto, otra para entender por que la alta
              dimensionalidad vuelve casi ortogonales a los conceptos, una tercera para
              explicar como crece la precision semantica con mas parametros y una ultima
              para visualizar como un modelo de difusion limpia ruido y sigue un prompt
              de imagen paso a paso.
            </p>
          </div>

          <div className="lab-visualizer-stack">
            <div data-reveal>
              <TokenSamplingLab />
            </div>
            <div data-reveal>
              <VectorSpaceLab />
            </div>
            <div data-reveal>
              <ConceptVectorLab />
            </div>
            <div data-reveal>
              <DiffusionLab />
            </div>
          </div>
        </section>
      </main>

      <Footer>FUNDAMENTOS BASICOS DE IA // sampling + space + vector + diffusion lab</Footer>
    </>
  );
}
