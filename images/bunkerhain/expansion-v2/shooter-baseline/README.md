# BUNKERHAIN SHOOTER baseline

Dieser unveränderte Source-Snapshot ist die verbindliche Railshooter-Version. Kein Lauf-/Dialogspiel. Architektur, Grenzen, Asset-Download und Erweiterungspunkte stehen in `../ARCHITECTURE.md`.

1. Acht Original-PNGs vom dort verlinkten GitHub-Manifest nach `public/assets/` laden.
2. `npm ci`
3. `npm run dev -- --host 0.0.0.0`
4. `npx tsc --noEmit` und `npm run build`

Bilder und node_modules sind absichtlich nicht dupliziert. Vorhandene Scripts: dev, build, preview. Tests/PWA/Level 2 sind in dieser Baseline noch nicht implementiert.
