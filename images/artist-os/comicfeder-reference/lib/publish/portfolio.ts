import JSZip from 'jszip';
import type { PublishableImage } from './connectors.js';

export interface PortfolioWorkItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: PublishableImage;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Erzeugt ein statisches, komplett eigenständiges Portfolio-Paket (HTML5 + CSS + geschützte Bilder) als ZIP.
 * Keine CDNs, keine externen Schriften, sofort auf jedem Webspace hostbar.
 */
export async function buildStaticPortfolioZip(input: {
  portfolioTitle: string;
  creatorName: string;
  bioText?: string;
  copyrightNotice?: string;
  works: PortfolioWorkItem[];
}): Promise<{ zipBuffer: Buffer; htmlContent: string }> {
  const zip = new JSZip();
  const copyright =
    input.copyrightNotice || `© ${new Date().getFullYear()} ${input.creatorName} · Alle Rechte vorbehalten`;

  const cssContent = `:root {
  --bg: #111315;
  --surface: #1b1f24;
  --text: #f5f5f4;
  --muted: #a8a29e;
  --accent: #f59e0b;
  --border: #2e343d;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.65;
  padding: 2.5rem 1.25rem;
}
.container { max-width: 1120px; margin: 0 auto; }
header {
  border-bottom: 2px solid var(--border);
  padding-bottom: 2rem;
  margin-bottom: 2.5rem;
}
h1 { font-size: 2.25rem; margin-bottom: 0.5rem; color: var(--accent); }
.bio { color: var(--muted); max-width: 72ch; font-size: 1.1rem; }
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 2rem;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
}
.card img {
  width: 100%;
  height: auto;
  display: block;
  background: #0b0d0e;
}
.card-body { padding: 1.25rem; }
.card-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
.card-desc { color: var(--muted); font-size: 0.95rem; margin-bottom: 0.75rem; }
.tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
  background: #272c35;
  color: var(--accent);
}
footer {
  margin-top: 4rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--muted);
}
`;

  const cardsHtml: string[] = [];

  for (let i = 0; i < input.works.length; i++) {
    const work = input.works[i];
    const fileRelPath = `bilder/werk_${String(i + 1).padStart(2, '0')}.png`;
    zip.file(fileRelPath, work.image.buffer);

    const tagsHtml = (work.tags || [])
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join('');

    cardsHtml.push(`
      <article class="card">
        <img src="${fileRelPath}" alt="${escapeHtml(work.title)}" loading="lazy" />
        <div class="card-body">
          <h2 class="card-title">${escapeHtml(work.title)}</h2>
          <p class="card-desc">${escapeHtml(work.description || '')}</p>
          <div class="tags">${tagsHtml}</div>
        </div>
      </article>
    `);
  }

  const htmlContent = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noai, noimageai" />
  <meta name="tdm-reservation" content="1" />
  <title>${escapeHtml(input.portfolioTitle)} – ${escapeHtml(input.creatorName)}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(input.portfolioTitle)}</h1>
      <p class="bio">${escapeHtml(input.bioText || `Portfolio von ${input.creatorName}`)}</p>
    </header>
    <main class="gallery">
      ${cardsHtml.join('\n')}
    </main>
    <footer>
      <p>${escapeHtml(copyright)} · Data Mining: Prohibited (noai, noimageai)</p>
    </footer>
  </div>
</body>
</html>`;

  zip.file('index.html', htmlContent);
  zip.file('style.css', cssContent);
  zip.file(
    'portfolio.json',
    JSON.stringify(
      {
        title: input.portfolioTitle,
        creator: input.creatorName,
        copyright,
        dataMining: 'Prohibited',
        works: input.works.map((w, idx) => ({
          order: idx + 1,
          title: w.title,
          description: w.description,
          tags: w.tags,
          file: `bilder/werk_${String(idx + 1).padStart(2, '0')}.png`,
          pHash: w.image.pHash,
          sha256: w.image.sha256,
        })),
      },
      null,
      2
    )
  );

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { zipBuffer, htmlContent };
}
