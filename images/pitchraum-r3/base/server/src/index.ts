import { createApp } from './app';

/**
 * Start-Eintrag des Demo-Servers.
 * Bauen:  npx esbuild server/src/index.ts --bundle --platform=node --format=esm --outfile=server/dist/index.js --external:express
 * Start:  node server/dist/index.js   (vorher „npm run build“ für die Website)
 */
const port = Number(process.env.PORT || 3000);
const app = createApp({ serveStatic: true });

app.listen(port, () => {
  console.log(`Pitchraum-Demo-Server läuft auf http://localhost:${port}`);
  console.log('Alle Daten liegen nur im Arbeitsspeicher und werden nach 24 Stunden gelöscht.');
});
