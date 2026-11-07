import type { Metadata } from "next";
import { LEGAL } from "@/lib/data";
import LegalPage from "@/components/site/LegalPage";
import ConsentSettingsLink from "@/components/site/ConsentSettingsLink";

export const metadata: Metadata = {
  title: "Datenschutz",
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz" updated={LEGAL.updated}>
      <h2>1. Verantwortlich</h2>
      <p>
        {LEGAL.name}, {LEGAL.street}, {LEGAL.zip} {LEGAL.city}
        <br />
        E-Mail: {LEGAL.email}
      </p>

      <h2>2. Kurz gesagt</h2>
      <p>
        Diese Seite kommt ohne Tracking, ohne Analyse-Tools und ohne Werbe-Cookies aus. Schriften, Bilder und Musik liegen auf
        unserem eigenen Server, es werden beim Aufruf keine Inhalte von Google, Meta oder anderen Drittanbietern nachgeladen.
        Daten speichern wir nur, wenn du uns aktiv etwas schickst: eine Booking-Anfrage, eine Newsletter-Anmeldung oder eine Bestellung.
      </p>

      <h2>3. Hosting und Server-Logs</h2>
      <p>
        Die Seite läuft auf einem eigenen Server: {LEGAL.hosting}. Beim Aufruf verarbeitet der Webserver technisch notwendige
        Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser-Kennung), um die Seite auszuliefern und vor Missbrauch zu
        schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die Logs werden nach spätestens [Anzahl] Tagen gelöscht.
      </p>
      <p>
        Die Verbindung ins Internet läuft über den Dienst Tailscale Funnel der Tailscale Inc., Toronto (Kanada). Dabei wird der
        verschlüsselte Datenverkehr inklusive deiner IP-Adresse über Server von Tailscale weitergeleitet. Die Inhalte bleiben
        Ende-zu-Ende verschlüsselt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Für Kanada liegt ein Angemessenheitsbeschluss
        der EU-Kommission vor; soweit Server in den USA beteiligt sind, stützt sich die Übermittlung auf [EU-US Data Privacy
        Framework / Standardvertragsklauseln, bitte prüfen].
      </p>

      <h2>4. Booking-Anfragen</h2>
      <p>
        Wenn du das Booking-Formular nutzt, speichern wir Veranstalter, E-Mail, Wunschdatum, Ort, Event-Typ, Budget,
        Technik-Angaben und deine Nachricht, um die Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO). Die Daten löschen wir,
        wenn die Anfrage erledigt ist und keine Aufbewahrungspflicht besteht.
      </p>

      <h2>5. Newsletter (Crate Club)</h2>
      <p>
        Für den Newsletter speichern wir deine E-Mail-Adresse und den Zeitpunkt der Anmeldung, auf Grundlage deiner Einwilligung
        (Art. 6 Abs. 1 lit. a DSGVO). Du kannst dich jederzeit abmelden, eine kurze Mail an {LEGAL.email} reicht.
      </p>

      <h2>6. Bestellungen im Shop</h2>
      <p>
        Bei einer Bestellung verarbeiten wir die Angaben, die für Abwicklung und Versand nötig sind (Art. 6 Abs. 1 lit. b DSGVO),
        und bewahren sie so lange auf, wie es Handels- und Steuerrecht verlangen.
      </p>

      <h2>7. Kontakt per E-Mail</h2>
      <p>Wenn du uns schreibst, nutzen wir deine Angaben nur, um zu antworten (Art. 6 Abs. 1 lit. b bzw. f DSGVO).</p>

      <h2>8. Cookies und lokaler Speicher</h2>
      <p>Wir setzen keine Tracking-Cookies. Im lokalen Speicher deines Browsers merken wir uns nur:</p>
      <ul>
        <li>deine Auswahl im Cookie-Hinweis,</li>
        <li>ob du den Analog-Look (Körnung, Scanlines) eingeschaltet hast.</li>
      </ul>
      <p>
        Das ist technisch notwendig bzw. von dir ausdrücklich gewünscht (§ 25 Abs. 2 TDDDG). Externe Medien wie eingebettete
        Videos oder Player werden nur geladen, wenn du sie im Cookie-Hinweis erlaubst. <ConsentSettingsLink />
      </p>

      <h2>9. YouTube-Player</h2>
      <p>
        Auf der Musik-Seite kann eine YouTube-Playlist eingebettet werden. Der Player der Google Ireland Limited (Gordon House,
        Barrow Street, Dublin 4, Irland) lädt erst, wenn du auf „Player laden“ klickst oder externe Medien im Cookie-Hinweis
        erlaubst (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Wir nutzen dafür den erweiterten Datenschutzmodus
        (youtube-nocookie.com). Sobald der Player lädt, erhält Google unter anderem deine IP-Adresse; dabei können Daten in die
        USA übertragen werden (EU-US Data Privacy Framework). Die Einwilligung kannst du über die Cookie-Einstellungen
        jederzeit widerrufen.
      </p>

      <h2>10. Links zu sozialen Netzwerken</h2>
      <p>
        Instagram, TikTok, YouTube, SoundCloud, Spotify und Resident Advisor sind nur verlinkt, nicht eingebunden. Erst wenn du
        einen Link anklickst, verlässt du diese Seite und es gelten die Datenschutzhinweise des jeweiligen Anbieters.
      </p>

      <h2>11. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch
        sowie das Recht, eine Einwilligung jederzeit zu widerrufen. Schreib dafür an {LEGAL.email}.
      </p>
      <p>
        Beschweren kannst du dich bei einer Datenschutz-Aufsichtsbehörde, zum Beispiel bei der Berliner Beauftragten für Datenschutz
        und Informationsfreiheit, Alt-Moabit 59-61, 10555 Berlin.
      </p>
    </LegalPage>
  );
}
