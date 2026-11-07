import crypto from 'crypto';

function getConnectorKey(secretOverride?: string): Buffer {
  const rawSecret =
    secretOverride ||
    process.env.CONNECTOR_SECRET ||
    process.env.SESSION_SECRET ||
    'federfuehrer-dev-connector-secret-key-32chars';
  return crypto.createHash('sha256').update(String(rawSecret), 'utf8').digest();
}

export interface EncryptedEnvelope {
  v: 1;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
}

/**
 * Verschlüsselt Connector-Zugangsdaten pro Nutzerin mit AES-256-GCM (Schlüssel aus CONNECTOR_SECRET).
 * Die Klartextdaten verlassen den Speicher nie unverschlüsselt Richtung Datenbank.
 */
export function encryptCredentials(
  credentials: Record<string, any>,
  secretOverride?: string
): string {
  const key = getConnectorKey(secretOverride);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = JSON.stringify(credentials || {});
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const envelope: EncryptedEnvelope = {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('hex'),
    tag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
  };

  return JSON.stringify(envelope);
}

/**
 * Entschlüsselt einen AES-256-GCM-Umschlag wieder in das ursprüngliche Zugangsdaten-Objekt.
 * Schlägt bei manipuliertem Ciphertext oder falschem Schlüssel fehl.
 */
export function decryptCredentials<T = Record<string, any>>(
  encryptedPayload: string,
  secretOverride?: string
): T {
  const parsed = JSON.parse(encryptedPayload) as EncryptedEnvelope;
  if (!parsed || parsed.alg !== 'aes-256-gcm' || !parsed.iv || !parsed.tag || !parsed.data) {
    throw new Error('Ungültiges Format der verschlüsselten Zugangsdaten.');
  }

  const key = getConnectorKey(secretOverride);
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.tag, 'hex');
  const ciphertext = Buffer.from(parsed.data, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted) as T;
}

/**
 * Berechnet eine HMAC-SHA256-Signatur für ausgehende Webhook-Aufrufe.
 * Format: "sha256=<hex>"
 */
export function signWebhookPayload(payload: string | Buffer, secret: string): string {
  const hmac = crypto.createHmac('sha256', String(secret)).update(payload).digest('hex');
  return `sha256=${hmac}`;
}

/**
 * Prüft eine Webhook-Signatur zeitkonstant gegen Manipulation.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  const expected = signWebhookPayload(payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signatureHeader || ''), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Entfernt verschlüsselte oder geheime Felder strikt aus jeder API-Antwort.
 */
export function sanitizeConnectorAccountForResponse(row: {
  id: string;
  ownerId: string;
  connectorId: string;
  kind: string;
  accountLabel: string;
  isActive: boolean;
  createdAt?: Date | number;
  updatedAt?: Date | number;
}) {
  return {
    id: row.id,
    ownerId: row.ownerId,
    connectorId: row.connectorId,
    kind: row.kind,
    accountLabel: row.accountLabel || row.connectorId,
    isActive: Boolean(row.isActive),
    configured: true,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt || Date.now(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : row.updatedAt || Date.now(),
  };
}
