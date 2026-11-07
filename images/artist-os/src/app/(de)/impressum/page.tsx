import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/lib/data";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Impressum",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        {LEGAL.name}
        <br />
        {LEGAL.artistName}
        <br />
        {LEGAL.street}
        <br />
        {LEGAL.zip} {LEGAL.city}
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: {LEGAL.email}
        {LEGAL.phone && !LEGAL.phone.startsWith("[Telefon") && (
          <>
            <br />
            Telefon: {LEGAL.phone}
          </>
        )}
      </p>

      {LEGAL.vatId && (
        <>
          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {LEGAL.vatId}</p>
        </>
      )}

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>
        {LEGAL.name}, Anschrift wie oben.
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

      <h2>Haftung für Links</h2>
      <p>
        Diese Seite verlinkt auf externe Angebote wie Instagram, YouTube oder Spotify. Für deren Inhalte sind ausschließlich die
        jeweiligen Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir entsprechende Links umgehend.
      </p>

      <h2>Bildnachweise</h2>
      <p>Fotos und Logo: {LEGAL.artistName}. Verwendung nur mit Erlaubnis; Pressefotos gibt es im Pressekit.</p>

      <p className="text-fg-muted">
        Hinweise zum Umgang mit deinen Daten stehen in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
    </LegalPage>
  );
}
