import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, Download, Sliders, ZoomIn, ZoomOut, Feather, Compass } from 'lucide-react';
import { speechService, SpeechState } from '../services/speech.js';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { AccessibilitySettings } from '../types/domain.js';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  accessibility: AccessibilitySettings;
  onUpdateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onStartTour: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  accessibility,
  onUpdateAccessibility,
  onOpenSettings,
  onOpenExport,
  onStartTour,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const [speechState, setSpeechState] = useState<SpeechState>({
    isPlaying: false,
    isPaused: false,
    currentText: '',
    rate: 1.0,
  });

  useEffect(() => {
    return speechService.subscribe(setSpeechState);
  }, []);

  const toggleBigView = () => {
    // A11: Permanent single-click / keyboard toggle for quick high-magnification (Große Ansicht)
    const isBig = accessibility.fontSizePx >= 28;
    onUpdateAccessibility({
      fontSizePx: isBig ? 20 : 30,
      bigButtons: !isBig,
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-canvas)]/95 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left group focus-visible:ring-2 rounded-lg p-1"
            aria-label="Federführer Schreibzimmer-Übersicht"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold shadow-sm">
              <Feather className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Federführer
            </span>
          </button>
        </div>

        {/* Zone 2: Desktop Nav Links (Hidden on small mobile screens where BottomNav handles thumb navigation) */}
        <nav
          data-tour="nav-tabs"
          className="hidden md:flex items-center gap-6 text-base font-semibold"
          aria-label="Hauptnavigation"
        >
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === 'dashboard'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => onTabChange('editor')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === 'editor'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Manuskript
          </button>
          <button
            onClick={() => onTabChange('world')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === 'world'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Weltenbuch & Fakten
          </button>
          <button
            onClick={() => onTabChange('graph')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === 'graph'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Plot & Beziehungen
          </button>
          <button
            onClick={() => onTabChange('assistant')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === 'assistant'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Co-Pilot
          </button>
          <button
            onClick={() => onTabChange('research')}
            className={`whitespace-nowrap pb-1 border-b-2 transition-colors ${
              currentTab === 'research'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Recherche
          </button>
        </nav>

        {/* Zone 3: Accessibility Quick Toggles, Tour & Actions */}
        <div
          data-tour="a11y-controls"
          className="flex items-center gap-2 sm:gap-3 shrink-0"
        >
          {/* Active Audio / Vorlesen player controls if speech is running */}
          {speechState.isPlaying && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]"
              role="status"
              aria-live="polite"
              aria-label="Audiowiedergabe aktiv"
            >
              <button
                onClick={() => (speechState.isPaused ? speechService.resume() : speechService.pause())}
                className="p-1 rounded text-[var(--accent)] hover:opacity-80 touch-target flex items-center justify-center"
                aria-label={speechState.isPaused ? 'Vorlesen fortsetzen' : 'Vorlesen pausieren'}
              >
                {speechState.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={() => speechService.stop()}
                className="p-1 rounded text-[var(--danger)] hover:opacity-80 touch-target flex items-center justify-center"
                aria-label="Vorlesen stoppen"
              >
                <VolumeX className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-[var(--accent)] hidden sm:inline">
                {speechState.isPaused ? 'Pausiert' : 'Liest vor…'}
              </span>
            </div>
          )}

          {/* Tour starten Trigger-Button (Min 48x48px touch-target, Hoher Kontrast) */}
          <button
            onClick={onStartTour}
            data-tour="tour-btn"
            className="touch-target px-3 py-2 rounded-xl border border-[var(--accent)] bg-[var(--bg-surface)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] text-[var(--text-primary)] font-bold text-sm flex items-center gap-1.5 transition-colors shadow-sm"
            title="Interaktive Schritt-für-Schritt Tour starten"
            aria-label="Interaktive App-Tour starten"
          >
            <Compass className="w-5 h-5 text-[var(--accent)]" />
            <span className="hidden sm:inline whitespace-nowrap">Tour starten</span>
            <span className="sm:hidden font-bold text-xs">Tour</span>
          </button>

          {/* A11: Grosse Ansicht Schnellzugriff */}
          <button
            onClick={toggleBigView}
            data-tour="big-view-btn"
            className={`touch-target px-3 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              accessibility.fontSizePx >= 28
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--accent)]'
            }`}
            title="Schriftgröße vergrößern / umschalten (A11)"
            aria-pressed={accessibility.fontSizePx >= 28}
          >
            {accessibility.fontSizePx >= 28 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            <span className="hidden sm:inline whitespace-nowrap">Große Ansicht</span>
            <span className="sm:hidden font-mono text-xs">{accessibility.fontSizePx}px</span>
          </button>

          {/* Android PWA Install button */}
          {isInstallable && (
            <button
              onClick={install}
              className="touch-target px-3 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              aria-label="App auf Android Telefon installieren"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline whitespace-nowrap">Installieren</span>
            </button>
          )}

          {/* Barrierefreiheit & Ansicht Einstellungen */}
          <button
            onClick={onOpenSettings}
            data-tour="settings-btn"
            className="touch-target p-2.5 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors flex items-center justify-center"
            title="Barrierefreiheit, Kontrast und Vorlesen konfigurieren"
            aria-label="Barrierefreiheit-Einstellungen"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
