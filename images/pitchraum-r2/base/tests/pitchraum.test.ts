/**
 * Echte HTTP-Tests gegen den laufenden Demo-Server (keine Mocks,
 * kein Ersetzen der Prüflogik).
 *
 * Start: npx vitest run
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../server/src/app';

let server: Server;
let baseUrl: string;

async function createWorkspace(): Promise<string> {
  const res = await fetch(`${baseUrl}/api/demo-workspaces`, { method: 'POST' });
  expect(res.status).toBe(201);
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/pitchraum_ws=([0-9a-f]{32})/);
  expect(match).toBeTruthy();
  return match![1];
}

function cookieHeader(cookie: string): Record<string, string> {
  return { Cookie: `pitchraum_ws=${cookie}` };
}

async function getState(cookie: string) {
  const res = await fetch(`${baseUrl}/api/state`, { headers: cookieHeader(cookie) });
  expect(res.status).toBe(200);
  return res.json();
}

async function createLink(
  cookie: string,
  overrides: Partial<{
    recipientName: string;
    productionTitle: string;
    personalNote: string;
    trackIds: string[];
  }> = {}
) {
  const body = {
    recipientName: 'Testperson (Fiktiv)',
    productionTitle: 'Testproduktion (Fiktiv)',
    personalNote: '',
    trackIds: ['trk-101'],
    ...overrides,
  };
  return fetch(`${baseUrl}/api/pitch-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('Arbeitsbereich-Trennung', () => {
  it('Arbeitsbereich A kann Daten von B weder lesen noch ändern', async () => {
    const cookieA = await createWorkspace();
    const cookieB = await createWorkspace();

    // A legt einen Anteil an trk-102 an und erstellt einen Link
    await fetch(`${baseUrl}/api/tracks/trk-102/splits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookieA) },
      body: JSON.stringify({ personName: 'Gast (Fiktiv)', role: 'Bassklarinette', sharePercent: 20 }),
    });
    const linkRes = await createLink(cookieA);
    expect(linkRes.status).toBe(201);

    const stateA = await getState(cookieA);
    const stateB = await getState(cookieB);

    // B sieht A's Anteil nicht und A's neuen Link nicht
    const splitsA = stateA.state.rightsFiles['trk-102'].splits.map((s) => s.personName);
    const splitsB = stateB.state.rightsFiles['trk-102'].splits.map((s) => s.personName);
    expect(splitsA).toContain('Gast (Fiktiv)');
    expect(splitsB).not.toContain('Gast (Fiktiv)');

    const linkRecipientsB = stateB.state.pitchLinks.map((l) => l.recipientName);
    expect(linkRecipientsB).not.toContain('Testperson (Fiktiv)');
    expect(stateA.state.pitchLinks.length).toBe(3);
    expect(stateB.state.pitchLinks.length).toBe(2);
  });

  it('Ohne gültiges Cookie gibt es keinen Zugriff auf einen Arbeitsbereich', async () => {
    const resNoCookie = await fetch(`${baseUrl}/api/state`);
    expect(resNoCookie.status).toBe(401);

    const resForged = await fetch(`${baseUrl}/api/state`, {
      headers: { Cookie: 'pitchraum_ws=' + 'f'.repeat(32) },
    });
    expect(resForged.status).toBe(401);
  });
});

describe('Empfängerlinks', () => {
  it('ein ungültiges Token liefert 404 und keinerlei Trackdaten', async () => {
    const resBad = await fetch(`${baseUrl}/api/l/das-ist-kein-token`);
    expect(resBad.status).toBe(404);

    const resUnknown = await fetch(`${baseUrl}/api/l/${'0'.repeat(32)}`);
    expect(resUnknown.status).toBe(404);
    const body = await resUnknown.json();
    expect(typeof body.error).toBe('string');
    expect(body.tracks).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('Nebel über dem Kanal');
    expect(JSON.stringify(body)).not.toContain('Nachtzug Richtung Küste');
  });

  it('ein Empfängerlink zeigt nur die Tracks dieses Links', async () => {
    const cookie = await createWorkspace();
    const linkRes = await createLink(cookie, { trackIds: ['trk-101', 'trk-104'] });
    const { link } = await linkRes.json();

    const publicRes = await fetch(`${baseUrl}/api/l/${link.token}`);
    expect(publicRes.status).toBe(200);
    const payload = await publicRes.json();
    expect(payload.tracks.map((t: { id: string }) => t.id).sort()).toEqual(['trk-101', 'trk-104']);
    expect(JSON.stringify(payload)).not.toContain('Nachtzug Richtung Küste');
    expect(Object.keys(payload.rightsFiles).sort()).toEqual(['trk-101', 'trk-104']);

    // Der Link funktioniert ohne Cookie (simulierter Zweitbrowser): kein Cookie-Header gesetzt.
    expect(publicRes.headers.get('content-type')).toContain('application/json');
  });

  it('Öffnen und Abspielen über den Link wird wirklich erfasst', async () => {
    const cookie = await createWorkspace();
    const linkRes = await createLink(cookie, { trackIds: ['trk-103'] });
    const { link } = await linkRes.json();

    // Öffnen (öffentlicher Aufruf ohne Cookie)
    await fetch(`${baseUrl}/api/l/${link.token}`);
    let state = await getState(cookie);
    let found = state.state.pitchLinks.find((l: { id: string }) => l.id === link.id);
    expect(found.statusOpened).toBe(true);
    expect(found.statusListened).toBe(false);

    // Abspielen
    const listenRes = await fetch(`${baseUrl}/api/l/${link.token}/listened`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: 'trk-103' }),
    });
    expect(listenRes.status).toBe(200);
    state = await getState(cookie);
    found = state.state.pitchLinks.find((l: { id: string }) => l.id === link.id);
    expect(found.statusListened).toBe(true);
    expect(found.lastListenedTrackId).toBe('trk-103');
  });

  it('eine Anfrage über den Link erscheint nur im richtigen Arbeitsbereich', async () => {
    const cookieA = await createWorkspace();
    const cookieB = await createWorkspace();
    const linkRes = await createLink(cookieA, { trackIds: ['trk-102'] });
    const { link } = await linkRes.json();

    const inquiryRes = await fetch(`${baseUrl}/api/l/${link.token}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackId: 'trk-102',
        recipientName: 'Claudia Test (Fiktiv)',
        productionTitle: 'Testfilm (Fiktiv)',
        usageScope: 'Werbeanzeige, 1 Jahr (Fiktiv)',
        message: 'Bitte melden.',
      }),
    });
    expect(inquiryRes.status).toBe(201);

    const stateA = await getState(cookieA);
    const stateB = await getState(cookieB);
    const inA = stateA.state.inquiries.filter(
      (i: { recipientName: string }) => i.recipientName === 'Claudia Test (Fiktiv)'
    );
    const inB = stateB.state.inquiries.filter(
      (i: { recipientName: string }) => i.recipientName === 'Claudia Test (Fiktiv)'
    );
    expect(inA.length).toBe(1);
    expect(inA[0].stage).toBe('neu_eingegangen');
    expect(inA[0].trackId).toBe('trk-102');
    expect(inB.length).toBe(0);
  });

  it('Anfrage für einen Track, der nicht zum Link gehört, wird abgelehnt', async () => {
    const cookie = await createWorkspace();
    const linkRes = await createLink(cookie, { trackIds: ['trk-101'] });
    const { link } = await linkRes.json();

    const res = await fetch(`${baseUrl}/api/l/${link.token}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackId: 'trk-105',
        recipientName: 'Claudia Test (Fiktiv)',
        productionTitle: 'Testfilm (Fiktiv)',
        usageScope: 'Nutzung (Fiktiv)',
        message: '',
      }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Serverseitige Prüfung', () => {
  it('lehnt ungültige Eingaben mit verständlicher Meldung ab', async () => {
    const cookie = await createWorkspace();

    // Fehlende Pflichtfelder
    let res = await createLink(cookie, { recipientName: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Name der Person');

    // Leere Trackauswahl
    res = await createLink(cookie, { trackIds: [] });
    expect(res.status).toBe(400);

    // Fremder Track
    res = await createLink(cookie, { trackIds: ['trk-999'] });
    expect(res.status).toBe(400);

    // Anteile außerhalb 0–100
    res = await fetch(`${baseUrl}/api/tracks/trk-101/splits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ personName: 'X', role: 'Y', sharePercent: 150 }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('zwischen 0 und 100');

    res = await fetch(`${baseUrl}/api/tracks/trk-101/splits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ personName: 'X', role: 'Y', sharePercent: -5 }),
    });
    expect(res.status).toBe(400);

    // Falscher Typ
    res = await fetch(`${baseUrl}/api/tracks/trk-101/splits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ personName: 'X', role: 'Y', sharePercent: 'achtzig' }),
    });
    expect(res.status).toBe(400);

    // Zu langer Text (Längenbegrenzung)
    res = await createLink(cookie, { personalNote: 'a'.repeat(601) });
    expect(res.status).toBe(400);

    // Unbekannter Status
    res = await fetch(`${baseUrl}/api/inquiries/inq-001/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ stage: 'erledigt_irgendwie' }),
    });
    expect(res.status).toBe(400);
  });

  it('begrenzt die Körpergröße auf 100 kB', async () => {
    const cookie = await createWorkspace();
    const res = await fetch(`${baseUrl}/api/pitch-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({
        recipientName: 'Test',
        productionTitle: 'Test',
        personalNote: 'a'.repeat(120_000),
        trackIds: ['trk-101'],
      }),
    });
    expect(res.status).toBe(413);
  });

  it('setzt grundlegende Sicherheits-Header', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('setzt das Arbeitsbereich-Cookie als HttpOnly mit SameSite=Lax', async () => {
    const res = await fetch(`${baseUrl}/api/demo-workspaces`, { method: 'POST' });
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });
});

describe('Meine Seite', () => {
  const validBrand = {
    '--brand-primary': '#8FB6FF',
    '--brand-secondary': '#1B2233',
    '--brand-background': '#0B0D12',
    '--brand-accent': '#FFD166',
    '--brand-text': '#F2F4F8',
    '--font-family-display': "'Space Grotesk', 'Arial Narrow', sans-serif",
    '--font-family-body': "'Inter', 'Helvetica Neue', Arial, sans-serif",
    '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
  };

  const validSettings = {
    artistName: 'Lukas Mertens',
    tagline: 'Musik für Bilder (Fiktiv)',
    intro: 'Kurzer Text.',
    layoutId: 'plakat',
    brand: validBrand,
    featuredTrackId: 'trk-104',
  };

  it('speichert gültige Seiteneinstellungen und liest sie wieder', async () => {
    const cookie = await createWorkspace();
    const putRes = await fetch(`${baseUrl}/api/meine-seite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify(validSettings),
    });
    expect(putRes.status).toBe(200);
    const saved = await putRes.json();
    expect(saved.layoutId).toBe('plakat');

    const state = await getState(cookie);
    expect(state.myPage.layoutId).toBe('plakat');
    expect(state.myPage.featuredTrackId).toBe('trk-104');
  });

  it('lehnt ungültige Gestalt, Farben und fremde Haupttracks ab', async () => {
    const cookie = await createWorkspace();

    let res = await fetch(`${baseUrl}/api/meine-seite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ ...validSettings, layoutId: 'hologramm' }),
    });
    expect(res.status).toBe(400);

    res = await fetch(`${baseUrl}/api/meine-seite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({
        ...validSettings,
        brand: { ...validBrand, '--brand-accent': 'orange-ish' },
      }),
    });
    expect(res.status).toBe(400);

    res = await fetch(`${baseUrl}/api/meine-seite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ ...validSettings, featuredTrackId: 'trk-999' }),
    });
    expect(res.status).toBe(400);
  });

  it('meine Seite bleibt im eigenen Arbeitsbereich', async () => {
    const cookieA = await createWorkspace();
    const cookieB = await createWorkspace();
    await fetch(`${baseUrl}/api/meine-seite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookieA) },
      body: JSON.stringify(validSettings),
    });
    const stateB = await getState(cookieB);
    expect(stateB.myPage).toBeNull();
  });
});

describe('Komplettablauf (Abnahme A–C)', () => {
  it('Link verschicken → im Zweitbrowser anhören + anfragen → Status beim Komponisten', async () => {
    const cookie = await createWorkspace();

    // Zwei Tracks verschicken
    const linkRes = await createLink(cookie, {
      recipientName: 'Miriam Kähler (Fiktiv)',
      productionTitle: 'Fernsehfilm „Winterflut“ (Fiktiv)',
      personalNote: 'Hallo Miriam, wie besprochen.',
      trackIds: ['trk-101', 'trk-105'],
    });
    expect(linkRes.status).toBe(201);
    const { link } = await linkRes.json();
    expect(link.token).toMatch(/^[0-9a-f]{32}$/);

    // „Zweiter Browser“: öffnen, abspielen, anfragen — alles ohne Cookie
    await fetch(`${baseUrl}/api/l/${link.token}`);
    await fetch(`${baseUrl}/api/l/${link.token}/listened`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: 'trk-101' }),
    });
    await fetch(`${baseUrl}/api/l/${link.token}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackId: 'trk-101',
        recipientName: 'Miriam Kähler (Fiktiv)',
        productionTitle: 'Fernsehfilm „Winterflut“ (Fiktiv)',
        usageScope: 'Eröffnungsszene, TV DACH (Fiktiv)',
        message: 'Passt sehr gut.',
      }),
    });

    // Beim Komponisten: „Angehört“ und die Anfrage sind da
    let state = await getState(cookie);
    const updated = state.state.pitchLinks.find((l: { id: string }) => l.id === link.id);
    expect(updated.statusOpened).toBe(true);
    expect(updated.statusListened).toBe(true);
    const newInquiry = state.state.inquiries.find(
      (i: { pitchLinkId: string }) => i.pitchLinkId === link.id
    );
    expect(newInquiry).toBeTruthy();
    expect(newInquiry.stage).toBe('neu_eingegangen');

    // Status auf „Im Gespräch“ setzen
    const stageRes = await fetch(`${baseUrl}/api/inquiries/${newInquiry.id}/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader(cookie) },
      body: JSON.stringify({ stage: 'in_abstimmung' }),
    });
    expect(stageRes.status).toBe(200);
    state = await getState(cookie);
    expect(
      state.state.inquiries.find((i: { id: string }) => i.id === newInquiry.id).stage
    ).toBe('in_abstimmung');
  });

  it('Zurücksetzen legt die Fantasiedaten neu an und macht alte Tokens ungültig', async () => {
    const cookie = await createWorkspace();
    const before = await getState(cookie);
    const oldToken = before.state.pitchLinks[0].token;

    const resetRes = await fetch(`${baseUrl}/api/workspace/reset`, {
      method: 'POST',
      headers: cookieHeader(cookie),
    });
    expect(resetRes.status).toBe(200);
    const after = await resetRes.json();
    expect(after.state.pitchLinks[0].token).not.toBe(oldToken);

    const oldLinkRes = await fetch(`${baseUrl}/api/l/${oldToken}`);
    expect(oldLinkRes.status).toBe(404);
  });
});
