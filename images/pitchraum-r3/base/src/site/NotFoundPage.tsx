import { Link, useDocumentTitle } from '../router';
import { PRODUCT_NAME } from './constants';

export function NotFoundPage() {
  useDocumentTitle(`Nicht gefunden — ${PRODUCT_NAME}`);
  return (
    <div className="notfound">
      <div className="shell">
        <p className="eyebrow">Fehler 404 · keine Einstellung</p>
        <h1 className="display">
          Diese Szene
          <br />
          wurde nicht
          <br />
          <span className="accent-text">gedreht.</span>
        </h1>
        <p className="lede">
          Die Adresse führt ins Leere. Vielleicht ein Tippfehler, vielleicht ein Schnitt zu viel.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.75rem' }}>
          <Link to="/" className="btn btn--accent">Zur Startseite</Link>
          <Link to="/demo" className="btn">Demo öffnen</Link>
        </div>
        <p className="notfound__timecode mono" aria-hidden="true">00:00:00:00 / kein Bild</p>
      </div>
    </div>
  );
}
