import { Link } from "react-router-dom";

export default function SiteHeader({ brand, brandTo, links, ctaLabel, ctaTo }) {
  return (
    <header className="site-header">
      <Link className="brand" to={brandTo}>
        <span className="brand-core" />
        <span>{brand}</span>
      </Link>

      <nav className="site-nav" aria-label="Principal">
        {links.map((link) => (
          <Link key={link.label} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>

      <Link className="ghost-button" to={ctaTo}>
        {ctaLabel}
      </Link>
    </header>
  );
}
