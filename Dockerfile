# Multi-Stage Dockerfile für Federführer
# Läuft nicht als root, mit ffmpeg für Spracherkennung

# ==========================================
# Stage 1: Dependencies installieren
# ==========================================
FROM node:22-alpine AS deps

WORKDIR /app

# Dependencies kopieren
COPY package.json package-lock.json* ./

# Dependencies installieren
RUN npm ci --legacy-peer-deps

# ==========================================
# Stage 2: Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Dependencies aus Stage 1 kopieren
COPY --from=deps /app/node_modules ./node_modules

# Source-Code kopieren
COPY . .

# Build ausführen
ARG GIT_SHA=unknown
RUN npm run build

# ==========================================
# Stage 3: Production
# ==========================================
FROM node:22-alpine AS runner

# ffmpeg für Spracherkennung installieren
RUN apk add --no-cache ffmpeg

# Nicht als root laufen
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Dependencies aus Stage 1 kopieren
COPY --from=deps /app/node_modules ./node_modules

# Build-Artefakte aus Stage 2 kopieren
COPY --from=builder /app/dist ./dist

# Package-Dateien kopieren
COPY package.json ./

# Scripts und andere benötigte Dateien
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY lib ./lib
COPY src ./src
COPY data ./data
COPY tsconfig.json ./
COPY server.ts ./
COPY drizzle.config.ts ./

# IDEAS_DIR Volume erstellen
RUN mkdir -p /data/ideen && chown -R nodejs:nodejs /data/ideen
VOLUME ["/data/ideen"]

# Umgebungsvariablen
ENV NODE_ENV=production
ENV PORT=3000
ENV IDEAS_DIR=/data/ideen
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

# Als nodejs-User wechseln
USER nodejs

# Port freigeben
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Server starten
CMD ["npm", "start"]
