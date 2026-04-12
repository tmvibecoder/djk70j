#!/bin/bash
# DJK Ottenhofen Event — Deploy-Skript für Hetzner
# Aufruf vom Server: bash /var/www/djk-ottenhofen-event/app/scripts/deploy.sh
# Oder direkt:       curl -fsSL https://raw.githubusercontent.com/tmvibecoder/djk70j/main/scripts/deploy.sh | bash

set -euo pipefail

APP_DIR="/var/www/djk-ottenhofen-event/app"
APP_NAME="djk-ottenhofen-event"
PORT=3000

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

echo "[1/7] Stoppe alten Prozess auf Port $PORT (falls vorhanden)..."
PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "  → Killing PIDs: $PIDS"
  kill $PIDS 2>/dev/null || true
  sleep 2
  # Falls noch da, härter killen
  PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null || true
    sleep 1
  fi
else
  echo "  → Port $PORT war frei"
fi

echo ""
echo "[2/7] Hole neuesten Code von GitHub..."
git fetch origin
git reset --hard origin/main
echo "  → HEAD: $(git log --oneline -1)"

echo ""
echo "[3/7] Installiere Dependencies (npm ci)..."
npm ci --no-audit --no-fund

echo ""
echo "[4/7] Generiere Prisma Client..."
npx prisma generate

echo ""
echo "[5/7] Baue Next.js Production-Build..."
npm run build

echo ""
echo "[6/7] Starte unter pm2 als '$APP_NAME' auf Port $PORT..."
pm2 delete "$APP_NAME" 2>/dev/null || true
PORT=$PORT pm2 start npm --name "$APP_NAME" -- start
pm2 save

echo ""
echo "[7/7] Status & Health-Check..."
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
