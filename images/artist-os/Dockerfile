# Next.js standalone build. Build with: docker build --build-arg BASE_PATH=/noizy -t noizy-web .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ARG BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$BASE_PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://build:build@127.0.0.1:1/build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/app/data/uploads
# ffmpeg converts admin uploads (WhatsApp photos/videos) to WebP/MP4
RUN apk add --no-cache ffmpeg && addgroup -S app && adduser -S app -G app && mkdir -p /app/data/uploads && chown -R app:app /app/data
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
