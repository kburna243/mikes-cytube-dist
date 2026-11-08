import { useMemo } from 'react';

/**
 * Selbst erzeugte, abstrakte Coverflächen als SVG.
 * Verwenden ausschließlich die Markenvariablen — keine festen Farben,
 * keine Stockfotos. Die Form leitet sich bestimmt aus der Track-ID ab.
 */

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

type Generator = 'kreise' | 'streifen' | 'bogen' | 'rasterpunkte' | 'wellen' | 'keil';

const GENERATORS: Generator[] = ['kreise', 'streifen', 'bogen', 'rasterpunkte', 'wellen', 'keil'];

const P = 'var(--brand-primary)';
const S = 'var(--brand-secondary)';
const A = 'var(--brand-accent)';
const B = 'var(--brand-background)';

interface CoverArtProps {
  seed: string;
  className?: string;
  /** Optional: sichtbarer Titel für assistive Technik (sonst dekorativ) */
  title?: string;
}

export function CoverArt({ seed, className, title }: CoverArtProps) {
  const { generator, variant } = useMemo(() => {
    const hash = hashString(seed);
    return {
      generator: GENERATORS[hash % GENERATORS.length],
      variant: Math.floor(hash / GENERATORS.length) % 3,
    };
  }, [seed]);

  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', width: '100%', height: '100%', background: S }}
    >
      <rect x="0" y="0" width="400" height="400" fill={S} />
      {generator === 'kreise' && (
        <>
          <circle cx={variant === 0 ? 120 : 200} cy={variant === 2 ? 280 : 140} r={variant === 1 ? 150 : 110} fill={P} opacity="0.9" />
          <circle cx={variant === 0 ? 290 : 110} cy={variant === 1 ? 90 : 270} r={variant === 2 ? 130 : 70} fill={A} opacity="0.85" />
          <circle cx="330" cy={variant === 2 ? 90 : 330} r="46" fill={B} opacity="0.9" />
        </>
      )}
      {generator === 'streifen' && (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <rect
              key={i}
              x={i * 62 - 20}
              y={0}
              width={i % 2 === 0 ? 34 : 18}
              height={400}
              fill={i % 3 === 0 ? P : i % 3 === 1 ? A : B}
              opacity={i % 3 === 2 ? 0.55 : 0.9}
              transform={variant === 2 ? `rotate(12 200 200)` : undefined}
            />
          ))}
        </>
      )}
      {generator === 'bogen' && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <circle
              key={i}
              cx={variant === 1 ? 60 : 340}
              cy={variant === 2 ? 60 : 340}
              r={60 + i * 52}
              fill="none"
              stroke={i % 2 === 0 ? P : A}
              strokeWidth={variant === 0 ? 26 : 14}
              opacity={0.85 - i * 0.1}
            />
          ))}
        </>
      )}
      {generator === 'rasterpunkte' && (
        <>
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={30 + col * 49}
                cy={30 + row * 49}
                r={(row + col + variant) % 4 === 0 ? 14 : 6}
                fill={(row * 8 + col + variant) % 5 === 0 ? A : (row + col) % 2 === 0 ? P : B}
                opacity={(row + col) % 2 === 0 ? 0.95 : 0.5}
              />
            ))
          )}
        </>
      )}
      {generator === 'wellen' && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <path
              key={i}
              d={`M -20 ${60 + i * 60} C 100 ${(60 + i * 60) - 40 - variant * 10}, 300 ${(60 + i * 60) + 40}, 420 ${(60 + i * 60) - 20}`}
              fill="none"
              stroke={i % 3 === 0 ? A : P}
              strokeWidth={i % 3 === 0 ? 10 : 18}
              opacity={0.35 + (i % 3) * 0.25}
            />
          ))}
        </>
      )}
      {generator === 'keil' && (
        <>
          <polygon points={variant === 0 ? '0,400 200,40 400,400' : '0,0 400,0 200,360'} fill={P} opacity="0.9" />
          <polygon points={variant === 1 ? '0,400 140,120 400,400' : '60,400 260,60 400,400'} fill={A} opacity="0.8" />
          <rect x={variant === 2 ? 250 : 40} y={variant === 2 ? 250 : 40} width="70" height="70" fill={B} opacity="0.9" />
        </>
      )}
    </svg>
  );
}
