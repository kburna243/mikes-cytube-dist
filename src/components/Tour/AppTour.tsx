import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Volume2,
  VolumeX,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Sliders,
  Compass,
} from 'lucide-react';
import { speechService } from '../../services/speech.js';

export interface AppTourProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'editor' | 'world' | 'graph' | 'assistant' | 'research') => void;
  currentTab?: string;
  forceShow?: boolean;
}

interface StepDefinition {
  title: string;
  tab?: 'dashboard' | 'editor' | 'world' | 'graph' | 'assistant' | 'research';
  targetSelector?: string;
  text: string;
  bullets?: Array<{ label: string; desc: string }>;
  highlightNotice?: string;
}

export const AppTour: React.FC<AppTourProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  onNavigateTab,
  currentTab = 'editor',
  forceShow = false,
}) => {
  // Internal state for self-contained usage
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);

  // Check prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Determine whether the tour is open
  const isTourVisible = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // On initial mount: persist check in localStorage for 'tourCompleted'
  useEffect(() => {
    if (controlledIsOpen !== undefined) return;

    try {
      const isCompleted = localStorage.getItem('tourCompleted');
      if (forceShow || isCompleted !== 'true') {
        const timer = setTimeout(() => {
          setInternalIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [controlledIsOpen, forceShow]);

  const steps: StepDefinition[] = [
    // SCHRITT 1: Willkommen
    {
      title: 'Willkommen bei Federführer',
      tab: 'editor',
      text: 'Dies ist dein persönliches Schreib-Studio. Ich zeige dir jetzt alle Funktionen Schritt für Schritt. Du kannst diese Tour jederzeit mit der ESC-Taste oder dem »Tour beenden«-Button abbrechen.',
      bullets: [
        { label: 'Local-First', desc: 'Deine Texte und Figuren bleiben sicher auf deinem Gerät.' },
        { label: 'Barrierefrei', desc: 'Optimiert für Screenreader, Vergrößerung und hohen Kontrast (WCAG AAA).' },
        { label: 'Human-in-the-Loop', desc: 'Die KI schreibt niemals eigenmächtig in dein Buch.' },
      ],
    },
    // SCHRITT 2: Navigation (Header)
    {
      title: 'Navigation & Arbeitsbereiche',
      targetSelector: '[data-tour="nav-tabs"]',
      text: 'Hier wechselst du zwischen den 5 zentralen Bereichen des Studios. Jeder Bereich erfüllt eine spezialisierte Aufgabe:',
      bullets: [
        { label: '1. Manuskript', desc: 'Dein Fokus-Editor für das Schreiben und Überarbeiten der Kapitel.' },
        { label: '2. Weltenbuch & Fakten', desc: 'Datenbank für Figuren, Orte, Fraktionen und kanonische Fakten.' },
        { label: '3. Plot & Beziehungen', desc: 'Visuelles Beziehungsnetz, Handlungsstränge und Zeitleiste (mit barrierefreier Listen-Alternative).' },
        { label: '4. Co-Pilot', desc: 'KI-Assistenz mit Revisions-Warteschlange für Vorschläge.' },
        { label: '5. Recherche', desc: 'Notizen, Quellenauszüge und historische Recherche.' },
      ],
      highlightNotice: 'Oben im Header findest du alle Bereiche direkt erreichbar.',
    },
    // SCHRITT 3: Manuskript-Bereich
    {
      title: 'Manuskript-Bereich & Werkzeuge',
      tab: 'editor',
      targetSelector: '[data-tour="editor-toolbar"]',
      text: 'Das Herzstück deines Schreiballtags ist klar und ablenkungsfrei gestaltet:',
      bullets: [
        { label: 'Kapitel-Auswahl', desc: 'Wähle dein Kapitel per Klick. Du siehst sofort die Wortzahl und geschätzte Lesezeit.' },
        { label: 'Editor & Autosave', desc: 'Hier schreibst du deinen Text. Er wird automatisch gespeichert, sobald du tippst.' },
        { label: 'Vorlesen', desc: 'Liest dir das aktuelle Kapitel mit natürlicher deutscher Stimme vor.' },
        { label: 'Diktieren', desc: 'Sprich deinen Text einfach ein, statt auf der Tastatur zu tippen.' },
        { label: 'Kanon-Wächter', desc: 'Prüft automatisch auf Widersprüche (z. B. braune vs. graue Augen).' },
      ],
      highlightNotice: 'Kapitel-Dropdown und die 3 Schnellknöpfe (Vorlesen, Diktieren, Co-Pilot).',
    },
    // SCHRITT 4: Barrierefreiheit
    {
      title: 'Barrierefreiheit & Schnellzugriff',
      targetSelector: '[data-tour="a11y-controls"]',
      text: 'Barrierefreiheit ist bei Federführer das Fundament, kein nachträgliches Add-on:',
      bullets: [
        { label: 'Große Ansicht', desc: 'Ein Tastendruck vergrößert sofort alle Schriften und Schaltflächen auf Maximalgröße.' },
        { label: '4 Kontrast-Paletten', desc: 'Dunkel Hoher Kontrast, Gelb auf Schwarz (DIN 1450), Pergament/Buchseite und Hell.' },
        { label: 'Atkinson Hyperlegible', desc: 'Garantierte Lesbarkeit durch speziell geformte Buchstaben für Sehbehinderungen.' },
      ],
      highlightNotice: 'Oben rechts: »Große Ansicht« und das Einstellungs-Symbol.',
    },
    // SCHRITT 5: Co-Pilot (KI-Hilfe)
    {
      title: 'Co-Pilot: Deine KI-Partnerin',
      tab: 'assistant',
      targetSelector: '[data-tour="copilot-container"]',
      text: 'Der Co-Pilot ist deine persönliche Schreib-Assistenz. Sie schreibt NIEMALS direkt in deinen Text!',
      bullets: [
        { label: 'Human-in-the-Loop', desc: 'Jeder Gedanke wird als Vorschlag in die Review-Warteschlange gelegt.' },
        { label: 'Freigabe-Kontrolle', desc: 'Du klickst auf »Übernehmen« oder »Verwerfen«. Erst dein Klick macht etwas zum Kanon.' },
        { label: '3 Geführte Pfade', desc: '»Motiv suchen«, »Kanon auf Widersprüche prüfen« oder »Neuen Beat planen« gegen die leere Seite.' },
      ],
      highlightNotice: 'Die Review-Warteschlange und die 3 Schnellaktionen.',
    },
    // SCHRITT 6: Fertig
    {
      title: 'Du bist bereit!',
      tab: 'editor',
      text: 'Du hast jetzt den Überblick über alle Funktionen von Federführer. Du kannst nun direkt anfangen zu schreiben, Figuren anzulegen oder dir ein Kapitel vorlesen zu lassen.',
      bullets: [
        { label: 'Jederzeit wiederholbar', desc: 'Klicke einfach oben im Header auf »Tour starten«, wenn du die Einführung noch einmal sehen möchtest.' },
        { label: 'Tastatur-Tipp', desc: 'Mit Tab springst du zielsicher durch alle Elemente, mit Enter bestätigst du.' },
      ],
    },
  ];

  const step = steps[currentStep];

  // Sync active tab with tour step
  useEffect(() => {
    if (!isTourVisible) return;

    if (step.tab && onNavigateTab && currentTab !== step.tab) {
      onNavigateTab(step.tab);
    }
  }, [currentStep, isTourVisible]);

  // Update target bounding box for visual spotlight (respects prefersReducedMotion)
  useEffect(() => {
    if (!isTourVisible) return;

    const updateRect = () => {
      if (step.targetSelector) {
        const el = document.querySelector(step.targetSelector);
        if (el) {
          el.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
          });
          setTargetRect(el.getBoundingClientRect());
          return;
        }
      }
      setTargetRect(null);
    };

    const timer = setTimeout(updateRect, 150);
    window.addEventListener('resize', updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep, isTourVisible, currentTab, prefersReducedMotion]);

  // Audio voice-over on step change if audio is enabled
  useEffect(() => {
    if (!isTourVisible || !isAudioEnabled) return;

    const speechText = `${step.title}. ${step.text} ${
      step.bullets ? step.bullets.map((b) => `${b.label}: ${b.desc}`).join('. ') : ''
    }`;

    speechService.speak(speechText);

    return () => {
      speechService.stop();
    };
  }, [currentStep, isTourVisible, isAudioEnabled]);

  // Focus next button on step change
  useEffect(() => {
    if (isTourVisible) {
      const timer = setTimeout(() => {
        nextButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isTourVisible]);

  // Keyboard navigation: Escape closes, ArrowLeft / ArrowRight navigates
  useEffect(() => {
    if (!isTourVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinishTour();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < steps.length - 1) {
          e.preventDefault();
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          e.preventDefault();
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinishTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinishTour = () => {
    speechService.stop();
    try {
      localStorage.setItem('tourCompleted', 'true');
    } catch {
      // ignore
    }
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const toggleAudio = () => {
    if (isAudioEnabled) {
      speechService.stop();
      setIsAudioEnabled(false);
    } else {
      setIsAudioEnabled(true);
    }
  };

  if (!isTourVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-dialog-title"
      aria-describedby="tour-dialog-desc"
    >
      {/* Visual Highlight Outline on target element (Respects prefers-reduced-motion) */}
      {targetRect && (
        <div
          className={`fixed pointer-events-none z-50 rounded-2xl border-4 border-[var(--accent)] ${
            prefersReducedMotion
              ? 'shadow-none'
              : 'shadow-[0_0_25px_var(--accent)] transition-all duration-300'
          }`}
          style={{
            top: `${Math.max(8, targetRect.top - 6)}px`,
            left: `${Math.max(8, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Main Tour Card Container */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-[var(--bg-surface-elevated)] border-3 border-[var(--border-color)] p-6 sm:p-8 shadow-2xl text-[var(--text-primary)] space-y-6 my-auto">
        {/* Top Bar with Step counter, TTS Toggle, and Close button */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base flex items-center justify-center shadow">
              {currentStep + 1}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Schritt {currentStep + 1} von {steps.length}
              </span>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                Federführer Einführung
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle Button */}
            <button
              onClick={toggleAudio}
              className={`touch-target p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
                isAudioEnabled
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                  : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title={isAudioEnabled ? 'Vorlesen deaktivieren' : 'Vorlesen aktivieren'}
              aria-label={isAudioEnabled ? 'Audio-Begleitung ausschalten' : 'Audio-Begleitung einschalten'}
            >
              {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="hidden sm:inline">{isAudioEnabled ? 'Ton an' : 'Stumm'}</span>
            </button>

            {/* Close / ESC Button */}
            <button
              onClick={handleFinishTour}
              className="touch-target p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors"
              aria-label="Tour beenden (ESC)"
              title="Tour beenden (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Live Region for Screenreaders */}
        <div className="sr-only" aria-live="polite">
          {`Schritt ${currentStep + 1} von ${steps.length}: ${step.title}. ${step.text}`}
        </div>

        {/* Title & Body */}
        <div className="space-y-3">
          <h2 id="tour-dialog-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {step.title}
          </h2>

          <p id="tour-dialog-desc" className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed">
            {step.text}
          </p>

          {/* Highlight Notification badge */}
          {step.highlightNotice && (
            <div className="p-3 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)] text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>{step.highlightNotice}</span>
            </div>
          )}

          {/* Bullets explanation */}
          {step.bullets && step.bullets.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2.5 max-h-56 overflow-y-auto">
              {step.bullets.map((b, i) => (
                <div key={i} className="text-base leading-relaxed flex items-start gap-2.5">
                  <span className="text-[var(--accent)] font-bold text-lg leading-none mt-0.5">•</span>
                  <div>
                    <strong className="text-[var(--text-primary)] font-bold">{b.label}:</strong>{' '}
                    <span className="text-[var(--text-secondary)]">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-3 rounded-full transition-all touch-target ${
                idx === currentStep
                  ? 'w-8 bg-[var(--accent)]'
                  : 'w-3 bg-[var(--border-color)] hover:bg-[var(--text-muted)]'
              }`}
              aria-label={`Gehe zu Schritt ${idx + 1}`}
              title={`Schritt ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFinishTour}
              className="touch-target px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
            >
              Überspringen
            </button>

            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="touch-target px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-sm font-bold text-[var(--text-primary)] hover:border-[var(--accent)] flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Zurück
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              ref={nextButtonRef}
              onClick={handleNext}
              className="touch-target px-6 py-3 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base flex items-center gap-2 shadow-lg hover:opacity-95 transition-all"
            >
              <span>{currentStep === steps.length - 1 ? 'Tour abschließen' : 'Weiter'}</span>
              {currentStep === steps.length - 1 ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
