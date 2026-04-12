#!/bin/bash
# DJK Ottenhofen Event — Deploy-Skript für Hetzner
# One-liner: curl -fsSL https://raw.githubusercontent.com/tmvibecoder/djk70j/main/scripts/deploy.sh | bash

set -euo pipefail

APP_DIR="/var/www/djk-ottenhofen-event/app"
APP_NAME="djk-ottenhofen-event"
PORT=3010
NGINX_CONF="/etc/nginx/sites-enabled/djk-ottenhofen-event"

echo ""
echo "═══════════════════════════════════════════"
echo "  DJK Ottenhofen Deploy"
echo "═══════════════════════════════════════════"
echo ""

if [ ! -d "$APP_DIR" ]; then
  echo "✗ App-Verzeichnis nicht gefunden: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "[1/8] Hole neuesten Code von GitHub..."
git fetch origin
git reset --hard origin/main
echo "  → HEAD: $(git log --oneline -1)"

echo ""
echo "[2/8] Installiere Dependencies (npm ci)..."
npm ci --no-audit --no-fund

echo ""
echo "[3/8] Generiere Prisma Client..."
npx prisma generate

echo ""
echo "[4/8] Baue Next.js Production-Build..."
npm run build

echo ""
echo "[5/8] Stoppe alten DJK-Prozess (Crash-Loop beenden)..."
pm2 delete "$APP_NAME" 2>/dev/null || echo "  → kein alter pm2-Eintrag"
sleep 1
PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "  → Killing PIDs auf Port $PORT: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 2
fi

echo ""
echo "[6/8] Nginx-Config prüfen (Ziel: Port $PORT)..."
if grep -q "proxy_pass http://127.0.0.1:3000" "$NGINX_CONF" 2>/dev/null; then
  echo "  → nginx zeigt noch auf 3000, patche auf $PORT..."
  cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%s)"
  sed -i "s|proxy_pass http://127.0.0.1:3000|proxy_pass http://127.0.0.1:$PORT|g" "$NGINX_CONF"
  if nginx -t 2>&1 | tail -5; then
    systemctl reload nginx
    echo "  → nginx auf $PORT umgestellt und reloaded"
  else
    echo "✗ nginx -t fehlgeschlagen! Bitte manuell prüfen."
    exit 1
  fi
elif grep -q "proxy_pass http://127.0.0.1:$PORT" "$NGINX_CONF" 2>/dev/null; then
  echo "  → nginx zeigt bereits auf $PORT (ok)"
else
  echo "  ⚠ nginx-Config sieht anders aus als erwartet — lasse unverändert"
  echo "  ⚠ aktueller proxy_pass:"
  grep proxy_pass "$NGINX_CONF" || true
fi

echo ""
echo "[7/8] Starte unter pm2 als '$APP_NAME' auf Port $PORT..."
cd "$APP_DIR"
PORT=$PORT pm2 start npm --name "$APP_NAME" -- start
pm2 save

echo ""
echo "[8/8] Status & Health-Check..."
sleep 4
pm2 list
echo ""
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT/ || echo "000")
echo "Lokaler HTTP-Check (127.0.0.1:$PORT): $HTTP"

if [ "$HTTP" = "200" ] || [ "$HTTP" = "307" ] || [ "$HTTP" = "308" ]; then
  echo ""
  echo "✓ Deploy erfolgreich!"
  echo "  Live unter: https://djk-ottenhofen-event.de/protokolle"
  echo ""
  echo "  Logs ansehen:    pm2 logs $APP_NAME --lines 50"
  echo "  Neustart später: pm2 restart $APP_NAME"
else
  echo ""
  echo "✗ Health-Check fehlgeschlagen (HTTP $HTTP)"
  echo "  Logs anzeigen: pm2 logs $APP_NAME --lines 100"
  exit 1
fi
echo ""
