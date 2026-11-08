import { useMemo, useRef, useEffect, useState } from 'react';
import type { PitchTrack } from '../../components/pitch-demo/types';
import type { MyPageSettings, BrandPackageValues } from '../../shared/brand';
import { CURATED_BRAND_PACKAGES, FONT_PAIRS, findMatchingCuratedPackage } from '../../shared/brand';
import type { ArtistLayoutId } from '../../shared/limits';
import { ARTIST_LAYOUT_IDS, ARTIST_LAYOUT_LABELS } from '../../shared/limits';
import { contrastRatio, describeContrastIssue, passesWcagAaText, suggestReadablePair } from '../../shared/contrast';
import type { ShowcaseTrack } from '../../artist/types';
import { ArtistSurface } from '../../artist/ArtistPage';
import type { FeelAnswers } from './suggestions';
import { answersComplete, suggestFromFeel } from './suggestions';

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const COLOR_FIELD_LABELS: { key: keyof BrandPackageValues; label: string }[] = [
  { key: '--brand-background', label: 'Hintergrund' },
  { key: '--brand-text', label: 'Text' },
  { key: '--brand-primary', label: 'Hauptfarbe' },
  { key: '--brand-secondary', label: 'Flächenfarbe' },
  { key: '--brand-accent', label: 'Akzentfarbe' },
];

interface MyPageWizardProps {
  tracks: PitchTrack[];
  composerName: string;
  initial: MyPageSettings | null;
  busy: boolean;
  onCancel: () => void;
  onSave: (settings: MyPageSettings) => Promise<void>;
}

function tracksToShowcase(tracks: PitchTrack[]): ShowcaseTrack[] {
  return tracks.map((t, index) => ({
    id: t.id,
    catalogNo: `WK-${String(index + 1).padStart(2, '0')}`,
    title: t.title,
    durationFormatted: t.durationFormatted,
    bpm: t.bpm,
    genre: t.genre,
    mood: t.mood,
    instrumentation: t.instrumentation,
    description: t.description,
    musicalKey: t.musicalKey,
  }));
}

type WizardStep = 1 | 2 | 3;

export function MyPageWizard({
  tracks,
  composerName,
  initial,
  busy,
  onCancel,
  onSave,
}: MyPageWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const [answers, setAnswers] = useState<FeelAnswers>({ energy: '', firstImpression: '', textAmount: '' });
  const [layoutId, setLayoutId] = useState<ArtistLayoutId>(initial?.layoutId || 'atelier');
  const [brand, setBrand] = useState<BrandPackageValues>(
    initial ? { ...initial.brand } : { ...CURATED_BRAND_PACKAGES[0].values }
  );
  const [artistName, setArtistName] = useState(initial?.artistName || composerName);
  const [tagline, setTagline] = useState(initial?.tagline || '');
  const [intro, setIntro] = useState(initial?.intro || '');
  const [featuredTrackId, setFeaturedTrackId] = useState<string | null>(
    initial?.featuredTrackId || tracks[0]?.id || null
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const [previewLayoutId, setPreviewLayoutId] = useState<ArtistLayoutId | null>(null);
  /** Der Vorschlag überschreibt die Auswahl nur einmal — danach bleibt alles frei änderbar. */
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const suggestion = useMemo(() => suggestFromFeel(answers), [answers]);

  useEffect(() => {
    if (suggestion && !suggestionApplied && !initial) {
      setLayoutId(suggestion.layoutId);
      setBrand({ ...suggestion.brandValues });
      setSuggestionApplied(true);
    }
  }, [suggestion, suggestionApplied, initial]);

  const textBgRatio = useMemo(
    () => contrastRatio(brand['--brand-text'], brand['--brand-background']),
    [brand]
  );
  const contrastOk = passesWcagAaText(brand['--brand-text'], brand['--brand-background']);
  const readableSuggestion = useMemo(
    () => suggestReadablePair(brand['--brand-background'], brand['--brand-text']),
    [brand]
  );

  function setColor(key: keyof BrandPackageValues, value: string) {
    setBrand((prev) => ({ ...prev, [key]: value }));
  }

  function applyPackage(pkgName: string) {
    const pkg = CURATED_BRAND_PACKAGES.find((p) => p.name === pkgName);
    if (!pkg) return;
    setBrand({ ...pkg.values });
  }

  function applyFontPair(pairId: string) {
    const pair = FONT_PAIRS.find((p) => p.id === pairId);
    if (!pair) return;
    setBrand((prev) => ({
      ...prev,
      '--font-family-display': pair.display,
      '--font-family-body': pair.body,
      '--font-family-mono': pair.mono,
    }));
  }

  const currentFontPairId = FONT_PAIRS.find(
    (p) =>
      p.display === brand['--font-family-display'] &&
      p.body === brand['--font-family-body'] &&
      p.mono === brand['--font-family-mono']
  )?.id;
  const currentPackageName = findMatchingCuratedPackage(brand);
  const showcaseTracks = useMemo(() => tracksToShowcase(tracks), [tracks]);
  const effectivePreviewLayout = previewLayoutId || layoutId;

  function handleNextFromStep1() {
    if (!answersComplete(answers)) {
      setStepError('Bitte beantworte alle drei Fragen, damit wir dir etwas vorschlagen können.');
      return;
    }
    setStepError(null);
    setStep(2);
  }

  async function handleSave() {
    setStepError(null);
    try {
      await onSave({
        artistName: artistName.trim() || composerName,
        tagline: tagline.trim(),
        intro: intro.trim(),
        layoutId,
        brand,
        featuredTrackId,
      });
    } catch (error) {
      setStepError(
        error instanceof Error ? error.message : 'Deine Seite konnte nicht gespeichert werden.'
      );
    }
  }

  const previewContent = {
    name: artistName.trim() || composerName,
    tagline: tagline.trim() || 'Musik für Film und Fernsehen — direkt von mir.',
    intro:
      intro.trim() ||
      `Hallo, ich bin ${artistName.trim() || composerName}. Ich schreibe und produziere Musik für Bilder — von leisen Flächen bis zu treibenden Motiven. Diese Seite zeigt einen Ausschnitt meiner Stücke.`,
    roleLine: 'Komposition & Produktion',
    tracks: showcaseTracks,
    featuredTrackId,
  };

  const questionGroups: {
    key: keyof FeelAnswers;
    legend: string;
    options: { value: string; label: string }[];
  }[] = [
    {
      key: 'energy',
      legend: '1. Wie klingt deine Musik eher?',
      options: [
        { value: 'ruhig', label: 'Ruhig und leise' },
        { value: 'geerdet', label: 'Geerdet und warm' },
        { value: 'kraeftig', label: 'Kräftig und treibend' },
      ],
    },
    {
      key: 'firstImpression',
      legend: '2. Was darf man zuerst sehen?',
      options: [
        { value: 'track_gross', label: 'Einen wichtigen Track, richtig groß' },
        { value: 'werkliste', label: 'Eine dichte, sortierbare Werkliste' },
        { value: 'text_ich', label: 'Einen ruhigen Absatz über mich' },
        { value: 'bildflaeche', label: 'Eine große Bildfläche wie im Kino' },
        { value: 'cover_wand', label: 'Eine Wand aus Coverflächen' },
      ],
    },
    {
      key: 'textAmount',
      legend: '3. Wie viel Text verträgt deine Seite?',
      options: [
        { value: 'wenig', label: 'So wenig wie möglich' },
        { value: 'mittel', label: 'Eine gesunde Mitte' },
        { value: 'viel', label: 'Gern mehr Worte' },
      ],
    },
  ];

  return (
    <section
      aria-labelledby="mypage-wizard-heading"
      className="mx-auto max-w-2xl rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <span className="text-sm font-bold text-stone-800">Schritt {step} von 3</span>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-2 text-sm font-semibold text-stone-600 underline hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        >
          Abbrechen
        </button>
      </div>

      {stepError && (
        <div
          role="alert"
          className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
        >
          {stepError}
        </div>
      )}

      {/* SCHRITT 1: Gefühl */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1
              id="mypage-wizard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-stone-950 focus:outline-none"
            >
              Wie soll sich deine Seite anfühlen?
            </h1>
            <p className="mt-1 text-base text-stone-700">
              Drei kurze Fragen — daraus schlagen wir dir eine Gestalt und ein Farb- und
              Schriftpaket vor. Beides bleibt jederzeit änderbar.
            </p>
          </div>

          {questionGroups.map((group) => (
            <fieldset key={group.key} className="space-y-2">
              <legend className="text-sm font-bold text-stone-900">{group.legend}</legend>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const optionId = `feel-${group.key}-${option.value}`;
                  const checked = answers[group.key] === option.value;
                  return (
                    <label
                      key={option.value}
                      htmlFor={optionId}
                      className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded border-2 px-3 py-2 text-sm font-semibold ${
                        checked
                          ? 'border-stone-950 bg-stone-100 text-stone-950'
                          : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        id={optionId}
                        type="radio"
                        name={`feel-${group.key}`}
                        value={option.value}
                        checked={checked}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [group.key]: option.value as FeelAnswers[typeof group.key],
                          }))
                        }
                        className="h-5 w-5 accent-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {suggestion && (
            <div className="rounded-lg border-2 border-emerald-800 bg-emerald-50 p-4 space-y-3">
              <p className="text-sm font-bold text-emerald-950">Unser Vorschlag für dich</p>
              <p className="text-sm text-emerald-950">{suggestion.reason}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="feel-layout-change" className="block text-xs font-bold text-emerald-950">
                    Gestalt ändern
                  </label>
                  <select
                    id="feel-layout-change"
                    value={layoutId}
                    onChange={(e) => setLayoutId(e.target.value as ArtistLayoutId)}
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-emerald-900 bg-white px-3 py-2 text-sm text-stone-950 focus:outline-none"
                  >
                    {ARTIST_LAYOUT_IDS.map((id) => (
                      <option key={id} value={id}>
                        {ARTIST_LAYOUT_LABELS[id]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="feel-package-change" className="block text-xs font-bold text-emerald-950">
                    Markenpaket ändern
                  </label>
                  <select
                    id="feel-package-change"
                    value={currentPackageName || suggestion.brandPackageName}
                    onChange={(e) => applyPackage(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-emerald-900 bg-white px-3 py-2 text-sm text-stone-950 focus:outline-none"
                  >
                    {CURATED_BRAND_PACKAGES.map((pkg) => (
                      <option key={pkg.name} value={pkg.name}>
                        {pkg.name} ({pkg.toneKeywords.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* SCHRITT 2: Farben und Schrift */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1
              id="mypage-wizard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-stone-950 focus:outline-none"
            >
              Farben und Schriften
            </h1>
            <p className="mt-1 text-base text-stone-700">
              Wähle ein fertiges Paket oder stelle eigene Farben ein. Wir achten mit dir darauf,
              dass dein Text gut lesbar bleibt.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-stone-900">Fertige Pakete</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CURATED_BRAND_PACKAGES.map((pkg) => {
                const selected = currentPackageName === pkg.name;
                return (
                  <button
                    key={pkg.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => applyPackage(pkg.name)}
                    className={`flex min-h-[56px] items-center gap-3 rounded border-2 p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
                      selected ? 'border-stone-950 bg-stone-100' : 'border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <span className="flex shrink-0 overflow-hidden rounded border border-stone-400">
                      {[pkg.values['--brand-background'], pkg.values['--brand-primary'], pkg.values['--brand-accent']].map(
                        (color) => (
                          <span key={color} className="block h-8 w-5" style={{ backgroundColor: color }} />
                        )
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-stone-950">{pkg.name}</span>
                      <span className="block text-xs text-stone-600">{pkg.toneKeywords.join(' · ')}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-stone-900">Eigene Farbwerte</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COLOR_FIELD_LABELS.map(({ key, label }) => {
                const value = brand[key];
                const valid = HEX_PATTERN.test(value);
                const inputId = `brand-${key}`;
                return (
                  <div key={key} className="rounded border border-stone-300 bg-stone-50 p-3">
                    <label htmlFor={inputId} className="block text-xs font-bold text-stone-800">
                      {label}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={`${label} wählen`}
                        value={valid ? value : '#888888'}
                        onChange={(e) => setColor(key, e.target.value.toUpperCase())}
                        className="h-11 w-11 shrink-0 cursor-pointer rounded border border-stone-400 bg-white"
                      />
                      <input
                        id={inputId}
                        type="text"
                        value={value}
                        onChange={(e) => setColor(key, e.target.value)}
                        placeholder="#1A2B3C"
                        aria-invalid={!valid}
                        className="w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 font-mono text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                      />
                    </div>
                    {!valid && (
                      <p role="alert" className="mt-1 text-xs font-semibold text-red-800">
                        Bitte als sechsstellige Farbe eingeben, z. B. #1A2B3C.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Verständliche Kontrast-Anzeige mit lesbarer Alternative */}
          {HEX_PATTERN.test(brand['--brand-text']) && HEX_PATTERN.test(brand['--brand-background']) && (
            contrastOk ? (
              <p role="status" className="rounded border border-emerald-700 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950">
                Dein Text ist auf diesem Hintergrund gut lesbar (Kontrast{' '}
                {(Math.round(textBgRatio * 10) / 10).toString().replace('.', ',')} : 1).
              </p>
            ) : (
              <div role="alert" className="rounded border-2 border-red-700 bg-red-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-red-900">{describeContrastIssue(textBgRatio)}</p>
                <button
                  type="button"
                  onClick={() =>
                    setBrand((prev) => ({
                      ...prev,
                      '--brand-text': readableSuggestion.textColor,
                      '--brand-background': readableSuggestion.backgroundColor,
                    }))
                  }
                  className="min-h-[48px] w-full rounded border-2 border-red-900 bg-white px-4 py-2 text-sm font-bold text-red-950 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900 sm:w-auto"
                >
                  Lesbare Alternative übernehmen ({readableSuggestion.textColor} auf{' '}
                  {readableSuggestion.backgroundColor})
                </button>
              </div>
            )
          )}

          <div>
            <label htmlFor="font-pair-select" className="block text-sm font-bold text-stone-900">
              Schriftpaar
            </label>
            <select
              id="font-pair-select"
              value={currentFontPairId || ''}
              onChange={(e) => applyFontPair(e.target.value)}
              className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
            >
              {!currentFontPairId && <option value="">Eigene Kombination (aus Paket)</option>}
              {FONT_PAIRS.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-600">
              Alle Schriften liegen lokal vor (OFL-Lizenz) — nichts wird von außen geladen.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Weiter zur Vorschau
            </button>
          </div>
        </div>
      )}

      {/* SCHRITT 3: Vorschau mit den eigenen Daten */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1
              id="mypage-wizard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-stone-950 focus:outline-none"
            >
              Vorschau mit deinen Daten
            </h1>
            <p className="mt-1 text-base text-stone-700">
              So sähe deine Seite mit den Tracks aus „Meine Musik“ aus. Du kannst unten die
              Gestalt wechseln und zwei Varianten direkt vergleichen.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor="mypage-artist-name" className="block text-sm font-bold text-stone-900">
                Name auf der Seite
              </label>
              <input
                id="mypage-artist-name"
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="mypage-tagline" className="block text-sm font-bold text-stone-900">
                Ein Satz über deine Musik (freiwillig)
              </label>
              <input
                id="mypage-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="z. B. Leise Systeme für laute Bilder"
                className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="mypage-intro" className="block text-sm font-bold text-stone-900">
                Kurze Vorstellung (freiwillig)
              </label>
              <textarea
                id="mypage-intro"
                rows={3}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="Wer du bist und wie du arbeitest, in zwei bis drei Sätzen …"
                className="mt-1 w-full rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="mypage-featured" className="block text-sm font-bold text-stone-900">
                Haupttrack (für Gestalten wie „Plakat“ und „Leinwand“)
              </label>
              <select
                id="mypage-featured"
                value={featuredTrackId || ''}
                onChange={(e) => setFeaturedTrackId(e.target.value || null)}
                className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gestalt-Vergleich: gleiche Inhalte, anderer Aufbau */}
          <div>
            <span className="block text-sm font-bold text-stone-900">Gestalt in der Vorschau</span>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Gestalt zum Vergleichen wählen">
              {ARTIST_LAYOUT_IDS.map((id) => {
                const activeChip = effectivePreviewLayout === id;
                const isChosen = id === layoutId;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={activeChip}
                    onClick={() => setPreviewLayoutId(id)}
                    className={`min-h-[44px] rounded-full border-2 px-4 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
                      activeChip
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-400 bg-white text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    {ARTIST_LAYOUT_LABELS[id]}
                    {isChosen && ' ✓'}
                  </button>
                );
              })}
            </div>
            {effectivePreviewLayout !== layoutId && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutId(effectivePreviewLayout);
                    setPreviewLayoutId(null);
                  }}
                  className="min-h-[44px] text-sm font-semibold text-stone-900 underline hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                >
                  Gestalt „{ARTIST_LAYOUT_LABELS[effectivePreviewLayout]}“ als meine Gestalt übernehmen
                </button>
              </div>
            )}
          </div>

          <div
            className="max-h-[26rem] overflow-y-auto rounded-lg border-2 border-stone-900"
            aria-label="Vorschau deiner Seite"
            tabIndex={0}
          >
            <ArtistSurface
              brandValues={brand}
              layoutId={effectivePreviewLayout}
              content={previewContent}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy || !contrastOk}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              {busy ? 'Wird gespeichert …' : 'Seite speichern'}
            </button>
          </div>
          {!contrastOk && (
            <p className="text-sm font-semibold text-red-800">
              Bitte wähle zuerst im Schritt „Farben und Schriften“ eine lesbare Kombination.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
