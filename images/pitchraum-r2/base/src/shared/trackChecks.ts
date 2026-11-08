import type { PitchTrack, TrackRightsFile } from '../components/pitch-demo/types';

/**
 * Prüft verständlich, welche Angaben bei einem Track noch fehlen.
 * Freiwillige Felder (ISRC, Werknummer) zählen ausdrücklich nicht als fehlend.
 * Reine Hilfsfunktion ohne Datenzugriff — wird von App und Website genutzt.
 */
export function getTrackMissingReasons(
  track: PitchTrack,
  rightsFile?: TrackRightsFile
): string[] {
  const missing: string[] = [];
  if (!track.description.trim()) {
    missing.push('Kurzbeschreibung zum Track fehlt noch.');
  }
  if (!rightsFile || rightsFile.splits.length === 0) {
    missing.push('Es ist noch keine beteiligte Person bei den Anteilen eingetragen.');
  } else {
    const sum = rightsFile.splits.reduce((acc, item) => acc + item.sharePercent, 0);
    if (sum !== 100) {
      missing.push(`Die Summe der Anteile beträgt ${sum} % (sollte 100 % ergeben).`);
    }
  }
  if (!rightsFile || rightsFile.contracts.length === 0) {
    missing.push('Es ist noch keine Unterlage (z. B. Vereinbarung oder Protokoll) hinterlegt.');
  }
  return missing;
}

export function getSplitSum(rightsFile?: TrackRightsFile): number {
  if (!rightsFile) return 0;
  return rightsFile.splits.reduce((acc, item) => acc + item.sharePercent, 0);
}
