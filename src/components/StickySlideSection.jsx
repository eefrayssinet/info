export default function StickySlideSection({
  eyebrow,
  title,
  description,
  slideTag,
  slideTitle,
  slideText,
  metaLabel,
  metaTitle,
  metaText,
  toneClass = "",
  align = "right",
  compact = false,
}) {
  return (
    <section className="sticky-slide-section">
      <div className="sticky-slide-shell">
        <div className={`sticky-slide-copy ${align === "left" ? "is-left" : ""}`} data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-copy">{description}</p>
        </div>

        <div className="sticky-slide-stage">
          <article
            className={`sticky-screen ${compact ? "is-compact" : ""} ${toneClass}`}
            data-reveal
          >
            <div className="sticky-screen-media">
              <div className="placeholder-core">
                <span>{slideTag}</span>
                <strong>{slideTitle}</strong>
                {slideText ? <p>{slideText}</p> : null}
              </div>
            </div>

            <div className="sticky-screen-meta">
              <p className="panel-label">{metaLabel}</p>
              <h3>{metaTitle}</h3>
              <p>{metaText}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
