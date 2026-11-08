import { useMemo } from 'react';

/**
 * Coverflächen werden aus Track-Daten und Markenpaket erzeugt.
 * Drei Familien, sichtbar verwandt mit der Klangskizze:
 * Spektrogramm, Wellenfeld, Rauschstruktur.
 * Farben ausschließlich über --brand-*.
 */

interface CoverArtProps {
  seed: string;
  title?: string;
  bpm?: number;
  mood?: string;
  className?: string;
  /** Wird als aria-label verwendet, wenn gesetzt */
  label?: string;
}

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (Math.abs(state) % 10000) / 10000;
  };
}

type Family = 'spektrogramm' | 'wellenfeld' | 'rausch';

export function CoverArt({ seed, title, bpm = 100, mood = '', className, label }: CoverArtProps) {
  const art = useMemo(() => {
    const base = hash(`${seed}|${title || ''}|${bpm}|${mood}`);
    const random = rng(base);
    const family: Family =
      /angespannt|dunkel|bedroh/i.test(mood)
        ? 'rausch'
        : /ruhig|warm|offen/i.test(mood) || bpm < 90
          ? 'wellenfeld'
          : 'spektrogramm';
    const bars = Array.from({ length: 56 }, (_, index) => {
      const envelope = Math.exp(-Math.pow(index - 20, 2) / 240) + 0.25;
      const value = (0.18 + random() * 0.82) * envelope;
      return { index, value };
    });
    const waves = Array.from({ length: 22 }, (_, index) => {
      const phase = random() * Math.PI * 2;
      const amplitude = 8 + random() * 34;
      const frequency = 1 + Math.floor(random() * 3);
      return { index, phase, amplitude, frequency };
    });
    const specks = Array.from({ length: 140 }, () => ({
      x: random() * 400,
      y: random() * 400,
      w: 1 + random() * 5,
      h: 1 + random() * 2,
      opacity: 0.15 + random() * 0.65,
    }));
    return { family, bars, waves, specks, base };
  }, [seed, title, bpm, mood]);

  const accentRotation = art.base % 3;

  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <rect width="400" height="400" fill="var(--brand-secondary)" />
      <rect width="400" height="400" fill="var(--brand-background)" opacity="0.35" />

      {art.family === 'spektrogramm' && (
        <g>
          {art.bars.map(({ index, value }) => {
            const height = Math.max(3, value * 330);
            return (
              <rect
                key={index}
                x={10 + index * 6.8}
                y={380 - height}
                width={index % 7 === 0 ? 5 : 3}
                height={height}
                fill={
                  index % 9 === accentRotation
                    ? 'var(--brand-accent)'
                    : index % 4 === 0
                      ? 'var(--brand-primary)'
                      : 'var(--brand-text)'
                }
                opacity={index % 4 === 0 ? 0.92 : 0.42}
              />
            );
          })}
          <rect x="10" y="376" width="380" height="2" fill="var(--brand-accent)" opacity="0.8" />
        </g>
      )}

      {art.family === 'wellenfeld' && (
        <g>
          {art.waves.map(({ index, phase, amplitude, frequency }) => {
            const y = 26 + index * 17;
            let path = `M -10 ${y}`;
            for (let x = 0; x <= 420; x += 12) {
              const wave =
                Math.sin((x / 400) * Math.PI * 2 * frequency + phase) * amplitude +
                Math.sin((x / 400) * Math.PI * 2 * (frequency + 1) * 0.7 + phase / 2) * amplitude * 0.35;
              path += ` L ${x} ${(y + wave).toFixed(1)}`;
            }
            return (
              <path
                key={index}
                d={path}
                fill="none"
                stroke={index % 5 === 0 ? 'var(--brand-accent)' : 'var(--brand-primary)'}
                strokeWidth={index % 5 === 0 ? 2 : 1}
                opacity={index % 5 === 0 ? 0.95 : 0.42}
              />
            );
          })}
        </g>
      )}

      {art.family === 'rausch' && (
        <g>
          <rect x="0" y="0" width="400" height="400" fill="var(--brand-secondary)" />
          {art.specks.map((speck, index) => (
            <rect
              key={index}
              x={speck.x}
              y={speck.y}
              width={speck.w}
              height={speck.h}
              fill={index % 11 === 0 ? 'var(--brand-accent)' : 'var(--brand-text)'}
              opacity={speck.opacity}
            />
          ))}
          {Array.from({ length: 9 }, (_, index) => (
            <rect
              key={`bar-${index}`}
              x={18 + index * 42}
              y={130 + (index % 3) * 55}
              width={2}
              height={120 + (index % 4) * 40}
              fill={index % 3 === 0 ? 'var(--brand-accent)' : 'var(--brand-primary)'}
              opacity="0.7"
            />
          ))}
          <rect x="0" y="250" width="400" height="1.5" fill="var(--brand-accent)" opacity="0.6" />
        </g>
      )}

      {/* gemeinsame Randmarken: verwandt mit einem Filmstreifen */}
      <rect x="0" y="0" width="400" height="1" fill="var(--brand-text)" opacity="0.22" />
      <rect x="0" y="399" width="400" height="1" fill="var(--brand-text)" opacity="0.22" />
      <rect x="0" y="0" width="6" height="400" fill="var(--brand-background)" opacity="0.6" />
      <rect x="394" y="0" width="6" height="400" fill="var(--brand-background)" opacity="0.6" />
    </svg>
  );
}
