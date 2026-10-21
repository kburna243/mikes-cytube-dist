#!/bin/bash
# Federführer Backup-Skript
# Erstellt ein Backup der PostgreSQL-Datenbank und der Sprachnotizen
# Nutzung: ./scripts/backup.sh [ZIELVERZEICHNIS]

set -e

# Konfiguration
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="federfuehrer_${TIMESTAMP}"

# Umgebungsvariablen (aus .env oder Umgebung)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-federfuehrer}"
DB_USER="${DB_USER:-federfuehrer}"
IDEAS_DIR="${IDEAS_DIR:-/data/ideen}"

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hilfsfunktionen
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Backup-Verzeichnis erstellen
mkdir -p "$BACKUP_DIR"

log_info "Starte Backup: $BACKUP_NAME"
log_info "Zielverzeichnis: $BACKUP_DIR"

# Temporäres Verzeichnis
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# ==========================================
# 1. PostgreSQL-Datenbank sichern
# ==========================================
log_info "Sichere PostgreSQL-Datenbank..."

if command -v pg_dump &> /dev/null; then
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=custom \
        --file="$TEMP_DIR/database.dump" \
        2>/dev/null || {
            log_warn "pg_dump fehlgeschlagen (Datenbank nicht erreichbar?)"
        }
else
    log_warn "pg_dump nicht gefunden, überspringe Datenbanksicherung"
fi

# ==========================================
# 2. Sprachnotizen sichern
# ==========================================
log_info "Sichere Sprachnotizen aus $IDEAS_DIR..."

if [ -d "$IDEAS_DIR" ]; then
    tar -czf "$TEMP_DIR/ideas.tar.gz" -C "$IDEAS_DIR" . 2>/dev/null || {
        log_warn "Konnte Sprachnotizen nicht sichern"
    }
else
    log_warn "IDEAS_DIR ($IDEAS_DIR) existiert nicht, überspringe"
fi

# ==========================================
# 3. Backup archivieren
# ==========================================
log_info "Erstelle Backup-Archiv..."

tar -czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$TEMP_DIR" .

# ==========================================
# 4. Al Backups aufräumen (behält letzte 7)
# ==========================================
log_info "Räume alte Backups auf (behält letzte 7)..."

cd "$BACKUP_DIR"
ls -t federfuehrer_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm --
cd - > /dev/null

# ==========================================
# 5. Zusammenfassung
# ==========================================
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)

log_info "Backup erfolgreich erstellt!"
log_info "Datei: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
log_info "Größe: $BACKUP_SIZE"
log_info "Wiederherstellung: tar -xzf ${BACKUP_NAME}.tar.gz"
