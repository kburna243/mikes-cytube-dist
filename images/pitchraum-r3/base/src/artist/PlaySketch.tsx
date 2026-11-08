import { useAudio, sketchForTrack } from '../audio/AudioProvider';
import type { ShowcaseTrack } from './types';

/**
 * Einheitlicher Klangskizzen-Knopf für Künstlerseiten.
 * Form und Farbe kommen von der jeweiligen Gestalt; die Klangerzeugung ist echt.
 */
export function PlaySketch({
  track,
  className,
  label,
  style,
}: {
  track: Pick<ShowcaseTrack, 'id' | 'title' | 'bpm' | 'mood'> & { musicalKey?: string };
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  const { meta, playing, enabled, toggle } = useAudio();
  const active = enabled && playing && meta.id === track.id;
  const sketch = sketchForTrack({
    id: track.id,
    title: track.title,
    bpm: track.bpm,
    mood: track.mood,
    musicalKey: track.musicalKey,
  });
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => void toggle(sketch)}
      aria-pressed={active}
      aria-label={`${track.title}: Klangskizze ${active ? 'anhalten' : 'abspielen'}, im Browser erzeugt`}
    >
      <span aria-hidden="true">{active ? '❙❙' : '▶'}</span>
      {label ?? (active ? 'Anhalten' : 'Klangskizze')}
    </button>
  );
}
