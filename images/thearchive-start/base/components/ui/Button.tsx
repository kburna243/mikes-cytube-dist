interface ButtonProps {
  variant?: "primary" | "secondary" | "stamp" | "text";
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

/**
 * DESIGN.md: "This design system eschews shadows and blurs." Zustände sind
 * deshalb Farbwechsel, keine Höhenwechsel — der frühere Stempel-Schatten hat
 * genau die Materialität zerstört, die das Archiv-Design ausmacht.
 */
export function Button({
  variant = "primary",
  children,
  className = "",
  href,
  onClick,
  disabled = false,
  type = "button",
}: ButtonProps) {
  const base =
    "font-label-caps px-lg py-sm transition-colors duration-300 inline-block text-center disabled:opacity-40 disabled:pointer-events-none";

  const styles: Record<string, string> = {
    primary: `${base} bg-primary text-on-primary hover:bg-secondary`,
    secondary: `${base} border border-primary text-primary hover:bg-primary hover:text-on-primary`,
    // Der Akzent-Ruf: Burgundy-Fläche, invertiert beim Hover statt angehoben.
    stamp: `${base} bg-secondary text-on-secondary hover:bg-primary`,
    text: `${base} px-0 text-secondary underline underline-offset-4 decoration-1 hover:text-primary`,
  };

  if (href) {
    return (
      <a href={href} className={`${styles[variant]} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
