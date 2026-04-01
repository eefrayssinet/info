import { Link } from "react-router-dom";

export default function PortalCard({ to, tag, title, copy, linkLabel, game }) {
  return (
    <Link className={`portal-card${game ? " portal-card-game" : ""}`} data-reveal to={to}>
      <span className="portal-tag">{tag}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
      <span className="portal-link">{linkLabel}</span>
    </Link>
  );
}
