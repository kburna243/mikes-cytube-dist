import React from 'react';
import { Sliders, X, Check, Volume2, Type, Sun, Moon, Eye } from 'lucide-react';
import { AccessibilitySettings } from '../types/domain.js';
import { speechService } from '../services/speech.js';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdate: (patch: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const fontSizes = [
    { label: 'Normal (18px)', value: 18 },
    { label: 'Standard (20px)', value: 20 },
    { label: 'Groß (24px)', value: 24 },
    { label: 'Sehr groß (28px)', value: 28 },
    { label: 'Maximal (32px)', value: 32 },
  ];

  const themes = [
    {
      id: 'dark-high',
      name: 'Dunkel Hoher Kontrast',
      desc: 'Tiefschwarz mit weißer Schrift und warmen Gold-Akzenten (WCAG AAA)',
      bg: '#09090b',
      text: '#ffffff',
      border: '#fbbf24',
    },
    {
      id: 'yellow-black',
      name: 'Gelb auf Schwarz (DIN 1450)',
      desc: 'Spezifischer Standard für Sehbehinderung: Maximale Leuchtdichte & Blendfreiheit',
      bg: '#000000',
      text: '#ffeb3b',
      border: '#ffeb3b',
    },
    {
      id: 'paper',
      name: 'Buchseite / Pergament',
      desc: 'Sanfter, reflexionsarmer Sepia-Hintergrund für ermüdungsfreies Lesen',
      bg: '#fbf8ef',
      text: '#12100e',
      border: '#92400e',
    },
    {
      id: 'light-high',
      name: 'Hell Hoher Kontrast',
      desc: 'Reines Weiß mit tiefschwarzem Text und starkem Kontrast',
      bg: '#ffffff',
      text: '#000000',
      border: '#000000',
    },
  ];

  const speechRates = [
    { label: 'Gemächlich (0.85x)', value: 0.85 },
    { label: 'Normal (1.0x)', value: 1.0 },
    { label: 'Zügig (1.2x)', value: 1.2 },
    { label: 'Schnell (1.4x)', value: 1.4 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-color)] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 id="accessibility-settings-title" className="text-2xl font-bold text-[var(--text-primary)]">
                Barrierefreiheit & Lesbarkeit
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Entwickelt nach WCAG 2.2 AAA & Atkinson Hyperlegible
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
            aria-label="Einstellungen schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1: Kontrast-Palette */}
        <div className="space-y-3">
          <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Kontrast-Palette
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((th) => {
              const isSelected = settings.theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => onUpdate({ theme: th.id as any })}
                  className={`touch-target p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--accent)] shadow-lg'
                      : 'border-[var(--border-color)] hover:border-[var(--accent)]/50'
                  }`}
                  style={{ backgroundColor: th.bg, color: th.text }}
                >
                  <div className="flex items-center justify-between font-bold text-base mb-1">
                    <span>{th.name}</span>
                    {isSelected && <Check className="w-5 h-5 shrink-0" style={{ color: th.border }} />}
                  </div>
                  <div className="text-xs opacity-85 leading-normal">
                    {th.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Basisschriftgrad (A1: 18-32px) */}
        <div className="space-y-3">
          <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Schriftgröße ({settings.fontSizePx}px)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {fontSizes.map((f) => (
              <button
                key={f.value}
                onClick={() => onUpdate({ fontSizePx: f.value })}
                className={`touch-target p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  settings.fontSizePx === f.value
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Vorlese-Geschwindigkeit (TTS) */}
        <div className="space-y-3">
          <label className="block text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[var(--accent)]" />
            Vorlesegeschwindigkeit
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {speechRates.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  speechService.setRate(r.value);
                  onUpdate({ readingSpeed: r.value });
                }}
                className={`touch-target p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  settings.readingSpeed === r.value
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Personalisierung & Schreibziel (Anforderungen 5 & 14) */}
        <div className="pt-2 border-t border-[var(--border-color)] space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="display-name-input" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Persönliche Anrede (Dein Vorname)
            </label>
            <input
              id="display-name-input"
              type="text"
              value={settings.displayName || ''}
              onChange={(e) => onUpdate({ displayName: e.target.value })}
              placeholder="z.B. Marion"
              className="w-full p-3.5 rounded-xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] text-[var(--text-primary)] font-bold text-base focus:border-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="daily-goal-input" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Tagesziel in Wörtern (Standard: 200)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="daily-goal-input"
                type="number"
                min={50}
                max={5000}
                step={50}
                value={settings.dailyWordGoal || 200}
                onChange={(e) => onUpdate({ dailyWordGoal: parseInt(e.target.value) || 200 })}
                className="w-36 p-3.5 rounded-xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] text-[var(--text-primary)] font-bold text-base focus:border-[var(--accent)]"
              />
              <span className="text-sm text-[var(--text-muted)]">
                ≈ {((settings.dailyWordGoal || 200) / 250).toFixed(1)} Buchseiten pro Tag (250 Wörter = 1 Seite)
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Auto-Vorlesen, Bewegung & Expertenmodus */}
        <div className="pt-2 border-t border-[var(--border-color)] space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] cursor-pointer">
            <span className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
              Antworten des Co-Piloten automatisch vorlesen
            </span>
            <input
              type="checkbox"
              checked={settings.autoReadResponses}
              onChange={(e) => onUpdate({ autoReadResponses: e.target.checked })}
              className="w-6 h-6 rounded accent-[var(--accent)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] cursor-pointer">
            <span className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
              Reduzierte Bewegung (prefers-reduced-motion)
            </span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => onUpdate({ reducedMotion: e.target.checked })}
              className="w-6 h-6 rounded accent-[var(--accent)]"
            />
          </label>

          {/* Expertenmodus (Requirement 12: Standardmäßig aus, nur hier sichtbar) */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] cursor-pointer">
            <div>
              <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] block">
                Expertenmodus (technische Details anzeigen)
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Standardmäßig aus. Zeigt Modellnamen, Latenzen und Prompt-Details an.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.expertMode || false}
              onChange={(e) => onUpdate({ expertMode: e.target.checked })}
              className="w-6 h-6 rounded accent-[var(--accent)] shrink-0 ml-4"
            />
          </label>
        </div>

        {/* Lizenz- und Rechtsbelehrung (Requirement 2: OpenThesaurus LGPL) */}
        <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-bold text-[var(--text-secondary)]">Rechtliche Hinweise & Lizenzen:</p>
          <p>
            • <strong>OpenThesaurus</strong> (Deutscher Thesaurus): Verwendet Daten von OpenThesaurus.de, lizenziert unter der GNU Lesser General Public License (LGPL).
          </p>
          <p>
            • <strong>Schriftart</strong>: Atkinson Hyperlegible (Braille Institute) & JetBrains Mono (SIL Open Font License).
          </p>
        </div>

        {/* Footer Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="touch-target px-6 py-3 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base shadow"
          >
            Einstellungen anwenden
          </button>
        </div>
      </div>
    </div>
  );
};
