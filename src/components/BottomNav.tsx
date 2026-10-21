import React from 'react';
import { Home, BookOpen, Users, GitFork, Sparkles, Search } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingProposalsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  pendingProposalsCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Übersicht', icon: Home },
    { id: 'editor', label: 'Kapitel', icon: BookOpen },
    { id: 'world', label: 'Weltenbuch', icon: Users },
    { id: 'graph', label: 'Plot & Netz', icon: GitFork },
    { id: 'assistant', label: 'Co-Pilot', icon: Sparkles, badge: pendingProposalsCount },
    { id: 'research', label: 'Recherche', icon: Search },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-t border-[var(--border-color)] px-2 py-1 safe-area-inset-bottom"
      aria-label="Navigation für Mobilgeräte"
    >
      <div className="grid grid-cols-6 items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`touch-target flex flex-col items-center justify-center relative rounded-xl transition-colors ${
                isActive
                  ? 'text-[var(--accent)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-5 h-5 px-1 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-black flex items-center justify-center shadow"
                    aria-label={`${tab.badge} offene Vorschläge`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
