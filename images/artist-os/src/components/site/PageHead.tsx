import type { ReactNode } from "react";
import Reveal from "@/components/site/Reveal";

/** Shared sub-page opener: condensed title + short intro, optional duotone photo on the right. */
export default function PageHead({
  title,
  intro,
  photo,
  photoAlt = "",
  tone = "",
  children,
}: {
  title: ReactNode;
  intro: ReactNode;
  photo?: string;
  photoAlt?: string;
  tone?: "" | "is-sun" | "is-olive";
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto grid max-w-[1400px] items-end gap-10 px-4 pb-14 pt-10 sm:px-8 md:pt-16 lg:grid-cols-12">
      <div className={photo ? "lg:col-span-7" : "lg:col-span-10"}>
        <h1 className="anim-rise type-condensed text-[clamp(4rem,15vw,10.5rem)]">{title}</h1>
        <p className="anim-rise mt-6 max-w-[46ch] text-xl leading-snug sm:text-2xl" style={{ animationDelay: "120ms" }}>
          {intro}
        </p>
        {children && (
          <div className="anim-rise mt-8" style={{ animationDelay: "200ms" }}>
            {children}
          </div>
        )}
      </div>
      {photo && (
        <Reveal className="lg:col-span-5">
          <div className={`duotone duotone-reveal ${tone} aspect-[4/3] border-2 border-fg shadow-[8px_8px_0_var(--color-fg)] lg:aspect-[4/5]`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={photoAlt} className="h-full w-full object-cover" fetchPriority="high" />
          </div>
        </Reveal>
      )}
    </section>
  );
}
