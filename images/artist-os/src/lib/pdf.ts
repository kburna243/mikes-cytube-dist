/** Minimal single/multi-page text PDF writer (Helvetica). */

type Line = { text: string; size: number; bold?: boolean; gap?: number };

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/** Build a simple PDF document. y starts at top. */
export function buildPdf(title: string, pages: Line[][]): Buffer {
  const pageWidth = 595;
  const pageHeight = 842;

  const objects: string[] = [];
  const pageCount = pages.length;
  // object numbering: 1 catalog, 2 pages, then per page: pageObj, contentObj; 3+2n fonts
  const fontBoldObj = 3 + pageCount * 2;
  const fontRegObj = fontBoldObj + 1;

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";

  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`;

  pages.forEach((lines, i) => {
    const pageObjNum = 3 + i * 2;
    const contentObjNum = pageObjNum + 1;
    objects[pageObjNum - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Contents ${contentObjNum} 0 R /Resources << /Font << /FB ${fontBoldObj} 0 R /FR ${fontRegObj} 0 R >> >> >>`;

    let y = pageHeight - 64;
    const parts: string[] = [];
    for (const line of lines) {
      const size = line.size;
      const font = line.bold ? "FB" : "FR";
      parts.push(`BT /${font} ${size} Tf 56 ${y} Td (${esc(line.text)}) Tj ET`);
      // accent rule under the title line
      if (y > pageHeight - 80) {
        parts.push("0.9059 0.3608 0.051 RG 3 w 56 756 m 539 756 l S");
      }
      y -= line.gap ?? size + 10;
    }
    const stream = parts.join("\n");
    objects[contentObjNum - 1] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });

  objects[fontBoldObj - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  objects[fontRegObj - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  // assemble with xref
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    out += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info << /Title (${esc(title)}) /Producer (Noizy Neighbor PDF Press) >> >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(out, "binary");
}
