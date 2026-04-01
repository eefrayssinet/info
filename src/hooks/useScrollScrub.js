import { useEffect } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function useScrollScrub(selector = "[data-scrub-video]") {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(selector));

    if (!sections.length) {
      return undefined;
    }

    const entries = sections.map((section) => {
      const video = section.querySelector("video");
      const progress = section.querySelector("[data-scrub-progress]");
      const src = video?.dataset.src?.trim();

      if (video && src) {
        video.src = src;
      }

      return { section, video, progress };
    });

    let frameId = 0;
    let ticking = false;

    function sectionProgress(section) {
      const rect = section.getBoundingClientRect();
      const total = Math.max(section.offsetHeight - window.innerHeight, 1);
      return clamp(-rect.top / total, 0, 1);
    }

    function update() {
      ticking = false;

      entries.forEach(({ section, video, progress }) => {
        const amount = sectionProgress(section);

        if (progress) {
          progress.style.width = `${amount * 100}%`;
        }

        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
          return;
        }

        const target = video.duration * amount;
        if (Math.abs(video.currentTime - target) > 0.033) {
          video.currentTime = target;
        }
      });
    }

    function requestUpdate() {
      if (ticking) {
        return;
      }

      ticking = true;
      frameId = window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    requestUpdate();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("load", requestUpdate);
      window.cancelAnimationFrame(frameId);
    };
  }, [selector]);
}
