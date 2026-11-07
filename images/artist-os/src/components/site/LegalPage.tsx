import type { ReactNode } from "react";

/** Reading layout for Impressum / Datenschutz: narrow measure, plain print hierarchy. */
export default function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[1400px] px-4 pb-10 pt-10 sm:px-8 md:pt-16">
      <h1 className="type-condensed text-[clamp(4rem,13vw,9rem)]">{title}</h1>
      {updated && <p className="mt-4 font-mono text-sm text-fg-muted">Stand: {updated}</p>}
      <div className="mt-10 max-w-[68ch] border-t-[3px] border-fg pt-8 text-lg leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-vinyl [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:font-bold [&_li]:mt-1 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </article>
  );
}
