import type { PitchApi } from '../api/pitchApi';
import { PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { useDocumentTitle } from '../router';

const STEPS = [
  {
    no: '01',
    title: 'Auswählen',
    line: 'Nicht dein ganzer Katalog. Eine Entscheidung.',
    text: 'Du wählst die Stücke, die zu einer Produktion passen. Dazu eine kurze Nachricht: für wen, für welches Projekt, warum diese Musik.',
  },
  {
    no: '02',
    title: 'Schicken',
    line: 'Ein Link. Kein Konto auf der anderen Seite.',
    text: 'Die Empfängerin öffnet den Link und hört. Jeder Track zeigt nur die Angaben, die aufs Infoblatt gehören. Interne Notizen und Unterlagen bleiben bei dir.',
  },
  {
    no: '03',
    title: 'Sehen, was passiert',
    line: 'Geöffnet. Angehört. Angefragt.',
    text: 'Drei Zustände, die etwas bedeuten. Keine Öffnungszahlen ohne Kontext. Sobald jemand anfragt, landet die Anfrage in deiner Liste — nicht in einem zweiten Postfach.',
  },
  {
    no: '04',
    title: 'Ordnen',
    line: 'Eine Akte pro Track.',
    text: 'Anteile, Unterlagen, Notizen. Was fehlt, steht da. Was Eigenangabe ist, bleibt als Eigenangabe markiert. Auch nach dem Abschluss.',
  },
];

export function HowItWorksPage({ api }: { api: PitchApi }) {
  useDocumentTitle(`Ablauf — ${PRODUCT_NAME}`);
  return (
    <div className="page">
      <header className="page-head shell">
        <p className="eyebrow">Ablauf · vier Schnitte</p>
        <h1 className="display page-head__title">
          Musik ist
          <br />
          die zweite
          <br />
          <span className="accent-text">Kamera.</span>
        </h1>
        <div className="page-head__side">
          <p className="lede">
            Du komponierst für ein Bild. {PRODUCT_NAME} sorgt dafür, dass die richtige Person es
            hört — und dass du weißt, was danach passiert.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <DemoTryButton api={api} />
            <ContactTalkLink />
          </div>
        </div>
      </header>

      <section className="steps shell" aria-label="Der Ablauf in vier Schritten">
        {STEPS.map((step) => (
          <article className="step-row" key={step.no}>
            <span className="step-row__no mono">{step.no}</span>
            <h2 className="step-row__title display">{step.title}</h2>
            <div className="step-row__body">
              <p className="step-row__line">{step.line}</p>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="section nonfeatures" aria-labelledby="nicht-heading">
        <div className="shell nonfeatures__grid">
          <div>
            <p className="eyebrow">Was es nicht tut</p>
            <h2 id="nicht-heading" className="display nonfeatures__title">
              Keine
              <br />
              Wunder-
              <br />
              <span className="outline-word">maschine.</span>
            </h2>
          </div>
          <ul className="nonfeatures__list">
            <li>
              <strong>Keine Distribution.</strong> Wir liefern nicht an Streamingdienste aus.
            </li>
            <li>
              <strong>Keine Tantiemen.</strong> Wir rechnen nichts ab und zahlen nichts aus.
            </li>
            <li>
              <strong>Kein Marktplatz.</strong> Niemand stöbert hier zufällig in deiner Musik.
            </li>
            <li>
              <strong>Keine Rechtsprüfung.</strong> Anteile und Angaben bleiben Eigenangaben,
              ungeprüft.
            </li>
            <li>
              <strong>Keine Rechtsberatung.</strong> Für Verträge brauchst du Menschen, die das
              dürfen.
            </li>
          </ul>
        </div>
      </section>

      <section className="section craft" aria-labelledby="craft-heading">
        <div className="shell craft__grid">
          <div>
            <p className="eyebrow">Gemacht für den ersten Blick</p>
            <h2 id="craft-heading" className="display craft__title">
              Groß,
              <br />
              weil Musik
              <br />
              groß ist.
            </h2>
          </div>
          <div className="craft__text">
            <p>
              Kinoschwarz, warmes Weiß und eine Akzentfarbe, die vom Track kommt. Kein
              Markenblau, das gegen die Musik arbeitet. Drei lokale Schriften, ein Shader, ein
              Analyser — alles im Browser, nichts von außen nachgeladen.
            </p>
            <p>
              Szenen laufen in Echtzeit und pausieren, wenn sie nicht sichtbar sind. Bewegung
              lässt sich abschalten. Auf schwächeren Geräten senkt die Szene selbst ihre
              Auflösung, statt zu ruckeln.
            </p>
            <p className="mono craft__technical">
              WebGL2 · Web Audio API · CSS Scroll-driven Animations · View Transitions · React ·
              Express · keine Analyse-Tools · keine externen CDNs
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
