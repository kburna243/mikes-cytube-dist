interface TechnicalLineProps {
  className?: string;
}

export function TechnicalLine({ className = "" }: TechnicalLineProps) {
  return <div className={`technical-line w-full ${className}`} />;
}
