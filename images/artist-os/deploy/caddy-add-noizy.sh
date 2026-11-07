#!/bin/sh
# Insert the /noizy block before the /telegrow block, validate, then apply in place (keeps the inode,
# because the Caddyfile is a single-file bind mount) and reload. Run on servermitte.
set -e
D=/usr/local/bin/docker
C=caddy_dubs-caddy_1
F=/volume1/docker/caddy/Caddyfile
MODE="$1"

if grep -q '@noizy path' "$F"; then echo "noizy block already present"; exit 0; fi
[ -f "$F.bak-vor-noizy-20261104" ] || cp -p "$F" "$F.bak-vor-noizy-20261104"

awk 'FNR==NR { s = s $0 ORS; next } /# --- \/telegrow & \/api/ { printf "%s", s } { print }' /tmp/noizy.snippet "$F" > /tmp/Caddyfile.noizy
diff "$F" /tmp/Caddyfile.noizy || true

$D exec -i $C sh -c 'cat > /tmp/Caddyfile.noizy && caddy validate --config /tmp/Caddyfile.noizy --adapter caddyfile' < /tmp/Caddyfile.noizy
echo "VALID"

if [ "$MODE" = "apply" ]; then
  cat /tmp/Caddyfile.noizy > "$F"
  $D exec $C caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  echo "RELOADED"
fi
