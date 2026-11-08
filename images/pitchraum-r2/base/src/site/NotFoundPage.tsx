import { Link, useDocumentTitle } from '../router';
import { PRODUCT_NAME } from './constants';

export function NotFoundPage() {
  useDocumentTitle(`Seite nicht gefunden — ${PRODUCT_NAME}`);
  return (
    <div className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-xl rounded-xl border border-white/12 bg-[#12151E] p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-[#9AA3B2]">Fehler 404</p>
        <h1
          className="mt-2 text-2xl font-bold text-[#F2F4FA] sm:text-3xl"
          style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
        >
          Diese Seite gibt es nicht
        </h1>
        <p className="mt-3 text-base text-[#B8BFD0]">
          Vielleicht hat sich die Adresse geändert oder es gab einen Tippfehler.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-[48px] items-center rounded-md border border-[#7C8CFF] bg-[#7C8CFF] px-6 py-2.5 text-base font-bold text-[#0C0E14] hover:bg-[#98A4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
