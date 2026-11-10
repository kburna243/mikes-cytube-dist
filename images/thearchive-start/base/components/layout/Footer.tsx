import Link from "next/link";

const links = [
  { href: "/community", label: "Manifesto" },
  { href: "/settings", label: "Terms of Preservation" },
  { href: "/collection", label: "Provenance Protocol" },
];

export function Footer() {
  return (
    <footer className="mt-xl w-full border-t border-outline-variant bg-background">
      <div className="mx-auto w-full max-w-[1440px] px-margin py-lg">
        <div className="grid grid-cols-1 gap-lg md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-label-caps tracking-widest text-primary">
              THE ARCHIVE
            </p>
            <p className="font-data-mono mt-xs uppercase text-on-surface-variant">
              &copy; 2024 The Collector&apos;s Archive — a permanent collection.
            </p>
          </div>

          <blockquote className="font-body-md italic text-on-surface-variant md:col-span-4">
            &ldquo;Every stitch is a witness to history. The Archive is not a
            marketplace; it is the record.&rdquo;
          </blockquote>

          <nav className="flex flex-col gap-xs md:col-span-3 md:items-end">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="font-data-mono text-on-surface-variant underline decoration-1 underline-offset-4 transition-colors hover:text-secondary"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:curator@the-archive.app"
              className="font-data-mono font-bold text-primary underline decoration-1 underline-offset-4 transition-colors hover:text-secondary"
            >
              Contact Curator
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
