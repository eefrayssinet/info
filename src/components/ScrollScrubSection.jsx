export default function ScrollScrubSection({
  eyebrow,
  title,
  description,
  bullets,
  videoHint,
  chipLeft,
  chipRight,
  alternate = false,
}) {
  return (
    <section className={`scrub-section${alternate ? " is-alt" : ""}`} data-scrub-video>
      <div className="scrub-shell">
        <div className="scrub-copy" data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-copy">{description}</p>
          <ul className="micro-list">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>

        <div className="scrub-stage" data-reveal>
          <video className="scrub-video" muted playsInline preload="metadata" data-src="" />
          <div className="scrub-grid" />
          <div className="scrub-flare" />

          <div className="scrub-placeholder">
            <p className="eyebrow">{videoHint.tag}</p>
            <h3>{videoHint.title}</h3>
            <p>{videoHint.description}</p>
            <p className="video-path">{videoHint.path}</p>
          </div>

          <article className="scrub-chip scrub-chip-left">
            <p className="panel-label">{chipLeft.label}</p>
            <p>{chipLeft.text}</p>
          </article>

          <article className="scrub-chip scrub-chip-right">
            <p className="panel-label">{chipRight.label}</p>
            <p>{chipRight.text}</p>
          </article>

          <div className="scrub-progress-bar">
            <i data-scrub-progress />
          </div>
        </div>
      </div>
    </section>
  );
}
