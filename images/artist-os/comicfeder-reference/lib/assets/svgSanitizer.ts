/**
 * Serverseitige SVG-Bereinigung:
 * - Entfernt alle <script>-Elemente, <foreignObject>, <iframe>, <object>, <embed>
 * - Entfernt alle on*-Event-Attribute (onclick, onload, onerror, onmouseover, ...)
 * - Entfernt alle externen href / xlink:href Attribute (erlaubt sind nur lokale Anker wie #id)
 * - Entfernt externe url(...) Referenzen und javascript:-Ausdrücke in style-Attributen
 */
export function sanitizeSvg(input: string | Buffer): string {
  let svg = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);

  // UTF-8 BOM entfernen
  if (svg.charCodeAt(0) === 0xfeff) {
    svg = svg.slice(1);
  }

  // 1. Gefährliche Tags samt Inhalt entfernen (<script>, <foreignObject>, <iframe>, <object>, <embed>)
  const dangerousTags = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'applet', 'meta', 'link'];
  for (const tag of dangerousTags) {
    const pairedRegex = new RegExp(`<\\s*${tag}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${tag}\\s*>`, 'gi');
    const selfClosingRegex = new RegExp(`<\\s*${tag}\\b[^>]*\\/?>`, 'gi');
    svg = svg.replace(pairedRegex, '');
    svg = svg.replace(selfClosingRegex, '');
  }

  // 2. Alle on*-Event-Handler-Attribute entfernen (mit doppelten, einfachen oder ohne Anführungszeichen)
  svg = svg.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 3. Externe href und xlink:href Attribute entfernen (nur lokale Fragment-Referenzen #... bleiben erlaubt)
  svg = svg.replace(
    /\s+(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (_fullMatch, dq, sq, uq) => {
      const val = (dq ?? sq ?? uq ?? '').trim();
      if (val.startsWith('#') && !val.toLowerCase().includes('javascript:')) {
        return ` href="${val}"`;
      }
      return '';
    }
  );

  // 4. Externe URLs oder javascript: in style-Attributen oder <style>-Blöcken entfernen
  svg = svg.replace(/url\(\s*['"]?\s*(?:https?:|ftp:|data:|\/\/|javascript:)[^)]*\)/gi, 'none');
  svg = svg.replace(/javascript\s*:/gi, '');

  if (!/<svg[\s>]/i.test(svg)) {
    throw new Error('Ungültige SVG-Datei: Kein <svg>-Wurzelelement vorhanden.');
  }

  return svg.trim();
}
