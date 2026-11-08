import { usePath } from './router';
import { httpPitchApi } from './api/httpPitchApi';
import { SiteLayout } from './site/SiteLayout';
import { HomePage } from './site/HomePage';
import { HowItWorksPage } from './site/HowItWorksPage';
import { PricingPage } from './site/PricingPage';
import { FaqPage } from './site/FaqPage';
import { LegalPage } from './site/LegalPage';
import { NotFoundPage } from './site/NotFoundPage';
import { ArtistPublicPage } from './artist/ArtistPublicPage';
import { DemoApp } from './app-shell/DemoApp';
import { RecipientLinkPage } from './l/RecipientLinkPage';

const api = httpPitchApi;

export default function App() {
  const path = usePath();

  // Verdrahtete App (Komponisten-Sicht)
  if (path === '/demo' || path.startsWith('/demo')) {
    return <DemoApp api={api} />;
  }

  // Öffentlicher Empfängerlink — funktioniert ohne Cookie in jedem Browser
  if (path.startsWith('/l/')) {
    const token = decodeURIComponent(path.slice(3).replace(/\/+$/, ''));
    return <RecipientLinkPage api={api} token={token} />;
  }

  // Öffentliche Künstlerseiten (fiktive Beispiele)
  if (path.startsWith('/k/')) {
    const slug = decodeURIComponent(path.slice(3).replace(/\/+$/, ''));
    return <ArtistPublicPage slug={slug} />;
  }

  // Öffentliche Website
  let page: React.ReactNode;
  switch (path) {
    case '/':
      page = <HomePage api={api} />;
      break;
    case '/so-funktioniert-es':
      page = <HowItWorksPage api={api} />;
      break;
    case '/preise':
      page = <PricingPage api={api} />;
      break;
    case '/fragen':
      page = <FaqPage api={api} />;
      break;
    case '/impressum':
      page = <LegalPage kind="impressum" />;
      break;
    case '/datenschutz':
      page = <LegalPage kind="datenschutz" />;
      break;
    default:
      page = <NotFoundPage />;
  }

  return <SiteLayout api={api}>{page}</SiteLayout>;
}
