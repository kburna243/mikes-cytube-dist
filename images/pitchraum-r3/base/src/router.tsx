import React, { useEffect, useState } from 'react';

/**
 * Kleiner Router ohne Zusatzabhängigkeit:
 * History-API + popstate, interne Links bleiben echte <a>-Elemente
 * (neuer Tab, Kopieren der Adresse usw. funktionieren wie gewohnt).
 */
export function usePath(): string {
  const [path, setPath] = useState<string>(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function navigate(to: string): void {
  if (window.location.pathname !== to) {
    window.history.pushState({}, '', to);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={to}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          onClick?.(event);
          navigate(to);
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Setzt den Dokumenttitel seitenabhängig. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;
    return () => {
      /* Titel bleibt, bis die nächste Seite ihn setzt */
    };
  }, [title]);
}
