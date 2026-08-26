#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/gonairi"
PORT="4031"

echo "=== Gonairi production deploy ==="

cd "${APP_DIR}"

echo "Commit:"
git rev-parse HEAD

#
# Load Node/NVM from 50 GB volume
#
export NVM_DIR="/mnt/projects/system/nvm"

if [ -s "${NVM_DIR}/nvm.sh" ]; then
    . "${NVM_DIR}/nvm.sh"
else
    echo "ERROR: NVM not found at ${NVM_DIR}"
    exit 1
fi

nvm use 20

echo "Node:"
node -v

echo "npm:"
npm -v

echo "PM2:"
pm2 -v

#
# Verify environment file
#
if [ ! -f "${APP_DIR}/.env" ]; then
    echo "ERROR: ${APP_DIR}/.env does not exist"
    exit 1
fi

#
# Install exact production dependencies
#
echo "Installing dependencies..."
npm ci

#
# Prisma
#
echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

#
# Build
#
echo "Building Next.js..."
npm run build

#
# Verify build before touching running process
#
if [ ! -f ".next/BUILD_ID" ]; then
    echo "ERROR: Next.js build did not create .next/BUILD_ID"
    exit 1
fi

#
# Restart / create PM2 app
#
echo "Restarting Gonairi..."

if pm2 describe gonairi >/dev/null 2>&1; then
    PORT="${PORT}" pm2 restart gonairi --update-env
else
    PORT="${PORT}" pm2 start npm \
        --name gonairi \
        --cwd "${APP_DIR}" \
        -- start
fi

#
# Give the app a moment, then verify
#
sleep 3

echo "Checking local application..."

if ! curl \
    --fail \
    --silent \
    --show-error \
    --max-time 10 \
    "http://127.0.0.1:${PORT}/" \
    >/dev/null
then
    echo "ERROR: Gonairi failed health check"

    pm2 logs gonairi --lines 50 --nostream || true

    exit 1
fi

echo "Gonairi health check passed."

#
# Persist PM2 process list
#
pm2 save

echo "=== Deployment completed successfully ==="