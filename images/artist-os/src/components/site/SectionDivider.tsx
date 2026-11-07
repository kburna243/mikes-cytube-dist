import LogoMark from "@/components/site/LogoMark";

/** Print rule between sections with the logo skyline standing on it. Props kept for call-site compatibility. */
export default function SectionDivider({
  flip = false,
}: {
  kind?: "skyline" | "tonearm";
  label?: string;
  flip?: boolean;
}) {
  return (
    <div className="mx-auto my-14 flex max-w-[1400px] items-end px-4 sm:px-8" aria-hidden>
      <div className="h-[2px] flex-1 bg-fg" />
      <LogoMark kind="skyline" decorative className={`h-12 w-auto shrink-0 text-fg ${flip ? "-scale-x-100" : ""}`} />
      <div className="h-[2px] flex-1 bg-fg" />
    </div>
  );
}
