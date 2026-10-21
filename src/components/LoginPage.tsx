import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben.');
        return;
      }

      onLoginSuccess();
    } catch (err) {
      setError('Verbindung zum Server nicht möglich. Bitte versuche es gleich nochmal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent)] text-[var(--accent-contrast)] mx-auto flex items-center justify-center font-bold text-3xl mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Willkommen beim Federführer
          </h1>
          <p className="text-[var(--text-muted)] mt-2">
            Dein Schreib- und Weltbau-Studio
          </p>
        </div>

        {/* Login-Formular */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-lg space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-3 text-lg rounded-xl border-2 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              style={{ minHeight: '48px' }}
              placeholder="Dein Benutzername"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 text-lg rounded-xl border-2 border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              style={{ minHeight: '48px' }}
              placeholder="Dein Passwort"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-lg font-semibold rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 transition-opacity"
            style={{ minHeight: '48px' }}
          >
            {loading ? 'Anmeldung läuft...' : 'Anmelden'}
          </button>
        </form>

        {/* Footer-Hinweis */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Deine Daten bleiben auf deinem eigenen Server.
        </p>
      </div>
    </div>
  );
}
