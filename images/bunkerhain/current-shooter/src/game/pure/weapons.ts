/**
 * Reine Spiellogik-Funktionen für Waffen, Munition, Health und Schild.
 */

export type WeaponType = "pistol" | "shotgun" | "smg" | "bass-cannon";
export type PickupType = "health" | "ammo" | "shotgun" | "smg" | "bass-cannon" | "shield";

export const MAX_HEARTS = 5;
export const INITIAL_HEARTS = 3;
export const MAX_SHIELD = 1;

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  maxAmmo: number; // Für Sonderwaffen der Gesamtkontingent-Cap; für Pistole Magazingröße
  isTemporary: boolean;
  burstCount?: number;
  burstIntervalSec?: number;
  pelletCount?: number;
  sparesCivilians?: boolean;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    type: "pistol",
    name: "Standardpistole",
    maxAmmo: 6,
    isTemporary: false,
  },
  shotgun: {
    type: "shotgun",
    name: "Streu-Shotgun",
    maxAmmo: 8,
    isTemporary: true,
    pelletCount: 5,
  },
  smg: {
    type: "smg",
    name: "Rave-SMG",
    maxAmmo: 36,
    isTemporary: true,
    burstCount: 3,
    burstIntervalSec: 0.08,
  },
  "bass-cannon": {
    type: "bass-cannon",
    name: "Basskanone",
    maxAmmo: 3,
    isTemporary: true,
    sparesCivilians: true,
  },
};

/**
 * Wendet Schaden auf Spieler an. Schild absorbiert 1 Schadenspunkt vollständig.
 */
export function applyDamage(
  currentHearts: number,
  hasShield: boolean,
  damageAmount = 1,
): { newHearts: number; shieldActive: boolean; absorbedByShield: boolean } {
  if (damageAmount <= 0) {
    return { newHearts: currentHearts, shieldActive: hasShield, absorbedByShield: false };
  }

  if (hasShield) {
    // Schild absorbiert den nächsten Schadenspunkt und zerbricht danach
    return {
      newHearts: currentHearts,
      shieldActive: false,
      absorbedByShield: true,
    };
  }

  const newHearts = Math.max(0, currentHearts - damageAmount);
  return {
    newHearts,
    shieldActive: false,
    absorbedByShield: false,
  };
}

/**
 * Wendet Heilung an. Maximal MAX_HEARTS (5). Am Cap keine Überheilung.
 */
export function applyHeal(
  currentHearts: number,
  healAmount = 1,
  maxHearts = MAX_HEARTS,
): { newHearts: number; healed: boolean } {
  if (currentHearts >= maxHearts) {
    return { newHearts: currentHearts, healed: false };
  }
  const newHearts = Math.min(maxHearts, currentHearts + healAmount);
  return { newHearts, healed: newHearts > currentHearts };
}

/**
 * Wendet Schild-Pickup an. Maximal 1 Schild.
 */
export function applyShieldPickup(
  hasShield: boolean,
): { shieldActive: boolean; applied: boolean } {
  if (hasShield) {
    return { shieldActive: true, applied: false };
  }
  return { shieldActive: true, applied: true };
}

/**
 * Wendet Munitions-Pickup an.
 * - Bei Pistole: füllt Magazin auf 6 auf.
 * - Bei temporärer Waffe: füllt Kontingent bis zum jeweiligen Cap auf.
 */
export function applyAmmoPickup(
  currentWeapon: WeaponType,
  currentAmmo: number,
): { newAmmo: number; applied: boolean } {
  const cap = WEAPON_CONFIGS[currentWeapon].maxAmmo;
  if (currentAmmo >= cap) {
    return { newAmmo: currentAmmo, applied: false };
  }
  return { newAmmo: cap, applied: true };
}

/**
 * Nimmt eine neue Waffe auf.
 * Temporäre Waffe ersetzt vorherige Sonderwaffe statt unbegrenzten Stapelns.
 */
export function equipWeapon(
  newWeapon: WeaponType,
): { activeWeapon: WeaponType; ammo: number } {
  const cap = WEAPON_CONFIGS[newWeapon].maxAmmo;
  return {
    activeWeapon: newWeapon,
    ammo: cap,
  };
}

/**
 * Verbraucht Munition für einen Einzelschuss oder ein Pellet.
 * Fällt bei 0 Vorrat einer temporären Waffe automatisch auf die Standardpistole zurück.
 */
export function consumeWeaponAmmo(
  currentWeapon: WeaponType,
  currentAmmo: number,
  cost = 1,
): { ok: boolean; newAmmo: number; nextWeapon: WeaponType; switchedToPistol: boolean } {
  if (currentAmmo < cost) {
    if (WEAPON_CONFIGS[currentWeapon].isTemporary) {
      // Wenn temporäre Waffe leer ist, zurück zur Pistole
      return { ok: false, newAmmo: 6, nextWeapon: "pistol", switchedToPistol: true };
    }
    return { ok: false, newAmmo: currentAmmo, nextWeapon: currentWeapon, switchedToPistol: false };
  }

  const remaining = currentAmmo - cost;
  if (WEAPON_CONFIGS[currentWeapon].isTemporary && remaining <= 0) {
    return {
      ok: true,
      newAmmo: 6, // Pistole startet voll geladen
      nextWeapon: "pistol",
      switchedToPistol: true,
    };
  }

  return {
    ok: true,
    newAmmo: remaining,
    nextWeapon: currentWeapon,
    switchedToPistol: false,
  };
}
