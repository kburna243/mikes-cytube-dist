import Link from "next/link";
import { ArchiveGallery } from "@/components/landing/ArchiveGallery";


const BASE_PATH = process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" ? "" : process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const appPath = (path: string) => `${BASE_PATH}${path}`;

const studies = [
  { number: "01", title: "Kleidung", detail: "Schnitt · Label · Epoche", image: appPath("/images/item-streetwear.svg") },
  { number: "02", title: "Vinyl", detail: "Pressung · Matrix · Zustand", image: appPath("/images/item-vinyl.svg") },
  { number: "03", title: "Objekte", detail: "Serie · Variante · Verpackung", image: appPath("/images/item-toys.svg") },
];

export default function HomePage() {
  return (
    <>
      <header className="landing-nav">
        <Link href="/" className="landing-brand"><img src={appPath("/brand/archive-mark.svg")} alt="" />THE ARCHIVE<span>COLLECTOR&apos;S REGISTER</span></Link>
        <nav aria-label="Main navigation">
          <a href="#collection">Die Sammlung</a><a href="#method">Das Prinzip</a><a href="#access">Zugang</a>
        </nav>
        <Link href="/login" className="landing-nav-cta">Zum Archiv <span aria-hidden="true">↗</span></Link>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker"><span /> Ein lebendiges Archiv für Dinge, die bleiben</p>
            <h1>Jedes Stück<br />trägt eine <em>Signatur.</em></h1>
            <p className="landing-lede">Ein Zuhause für besondere Fundstücke. Halte fest, was jedes Stück ausmacht, bewahre seine Geschichte und entdecke deine Sammlung immer wieder neu.</p>
            <div className="landing-actions">
              <Link href="/dashboard" className="landing-button landing-button-dark">Sammlung öffnen <span aria-hidden="true">↗</span></Link>
              <Link href="/login" className="landing-text-link">Zum Sammlerzugang</Link>
            </div>
            <p className="landing-footnote">Ein persönliches Archiv für Sammlerinnen, Sammler und Bewahrer.</p>
          </div>
          <div className="landing-art">
            <div className="landing-art-caption"><span>DAS SAMMLERARCHIV</span><span>TAFEL 001—004</span></div>
            <ArchiveGallery />
            <div className="landing-art-index"><span>OBJEKTE MIT GESCHICHTE</span><span>01 / 04</span></div>
          </div>
          <a className="landing-scroll" href="#collection"><span>DAS ARCHIV ENTDECKEN</span><span aria-hidden="true">↓</span></a>
        </section>

        <section id="collection" className="landing-collection">
          <div className="landing-section-heading">
            <p className="landing-kicker"><span /> Die Sammlung als Ganzes</p>
            <h2>Nicht nur, was du besitzt.<br /><em>Was du darüber weißt.</em></h2>
            <p>Notizen, Entdeckungen und kleine Details kommen zusammen. So erhält jedes Fundstück seinen eigenen Platz in einer Sammlung, zu der du gern zurückkehrst.</p>
          </div>
          <div className="landing-theme-grid">
            {studies.map((study) => (
              <article className="landing-theme-card" key={study.number}>
                <div className="landing-theme-image"><img src={study.image} alt="" /></div>
                <div className="landing-theme-meta"><span>{study.number} / SAMMLUNGSSTUDIE</span><span aria-hidden="true">↗</span></div>
                <h3>{study.title}</h3><p>{study.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="method" className="landing-method">
          <div className="landing-method-title"><p className="landing-kicker"><span /> Für das sorgfältige Bewahren</p><h2>Vom ersten Blick<br />zum <em>bleibenden Eintrag.</em></h2></div>
          <div className="landing-method-steps">
            <article><span>01</span><div><h3>Das Wesentliche erkennen</h3><p>Halte ein Fundstück und seine besonderen Merkmale an einem Ort fest.</p></div></article>
            <article><span>02</span><div><h3>Den Eintrag ergänzen</h3><p>Ergänze Beobachtungen, Zustandsnotizen und die Geschichte des Fundes.</p></div></article>
            <article><span>03</span><div><h3>Die Sammlung im Blick behalten</h3><p>Durchsuche und erweitere dein persönliches Archiv in deinem Tempo.</p></div></article>
          </div>
        </section>

        <section id="access" className="landing-access">
          <div><p className="landing-kicker"><span /> Dein Archiv, deine Adresse</p><h2>Dein Archiv.<br /><em>Deine Adresse.</em></h2><p>Melde dich unter der Adresse deines Archivs an. The Archive lässt sich auch auf einem eigenen Server betreiben.</p></div>
          <div className="landing-access-options">
            <article><span className="landing-access-number">01</span><h3>Gehosteter Zugang</h3><p>Nutze die Webadresse, die dir deine Archiv-Administration mitgeteilt hat. Ein betreuter Cloud-Zugang ist in Vorbereitung; bestehende Installationen erreichst du über deinen Sammlerzugang.</p><Link href="/login">Zum Sammlerzugang <span aria-hidden="true">↗</span></Link></article>
            <article><span className="landing-access-number">02</span><h3>Selbst gehostet</h3><p>Frontend und API lassen sich mit der Docker-Compose-Konfiguration dieses Projekts auf dem eigenen Server betreiben.</p><a href="#self-hosting">Installationshinweise <span aria-hidden="true">↗</span></a></article>
          </div>
        </section>
        <section id="self-hosting" className="landing-self-hosting"><span>EIGENER SERVER</span><p>Der Projektbetrieb nutzt ein Next.js-Frontend und eine separate FastAPI. Die vorhandene Docker-Compose-Konfiguration beschreibt den Serveraufbau; die API-Adresse wird bei der Installation eingerichtet.</p></section>
        <section className="landing-close"><p>Für die Dinge, die bleiben.</p><Link href="/dashboard" className="landing-button landing-button-paper">Zum Archiv <span aria-hidden="true">↗</span></Link></section>
      </main>
      <footer className="landing-footer"><span>© THE ARCHIVE</span><span>Ein persönliches Register für Dinge mit Geschichte.</span><Link href="/login">Sammlerzugang</Link></footer>
    </>
  );
}