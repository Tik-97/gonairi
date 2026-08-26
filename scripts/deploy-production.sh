#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/gonairi"
PORT="4031"
NVM_DIR="/mnt/projects/system/nvm"

echo "=== Gonairi production deploy ==="

cd "${APP_DIR}"

echo "Commit:"
git rev-parse HEAD

#
# Load Node / NVM
#
export NVM_DIR

if [ -s "${NVM_DIR}/nvm.sh" ]; then
    . "${NVM_DIR}/nvm.sh"
else
    echo "ERROR: NVM not found at ${NVM_DIR}"
    exit 1
fi

nvm use 20

echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "PM2: $(pm2 -v)"

#
# Verify environment
#
if [ ! -f "${APP_DIR}/.env" ]; then
    echo "ERROR: ${APP_DIR}/.env does not exist"
    exit 1
fi

#
# Install dependencies
#
echo "Installing dependencies..."

npm ci --no-audit --no-fund

#
# Prisma
#
echo "Generating Prisma client..."

npx prisma generate

echo "Running database migrations..."

npx prisma migrate deploy

#
# Build Next.js
#
echo "Building Next.js..."

NODE_OPTIONS="--max-old-space-size=1536" npm run build

#
# Verify production build
#
if [ ! -f "${APP_DIR}/.next/BUILD_ID" ]; then
    echo "ERROR: Next.js build did not create .next/BUILD_ID"
    exit 1
fi

echo "Build successful."

#
# Restart / create PM2 process
#
echo "Restarting Gonairi..."

if pm2 describe gonairi >/dev/null 2>&1; then

    PORT="${PORT}" \
    pm2 restart gonairi --update-env

else

    PORT="${PORT}" \
    pm2 start npm \
        --name gonairi \
        --cwd "${APP_DIR}" \
        -- start

fi

#
# Health check
#
echo "Waiting for Gonairi to start..."

HEALTH_OK=false

for attempt in {1..10}; do

    if curl \
        --fail \
        --silent \
        --show-error \
        --max-time 5 \
        "http://127.0.0.1:${PORT}/" \
        >/dev/null
    then
        HEALTH_OK=true
        break
    fi

    echo "Health check attempt ${attempt}/10 failed..."
    sleep 2
done

if [ "${HEALTH_OK}" != "true" ]; then

    echo "ERROR: Gonairi failed health check."

    echo "=== PM2 status ==="
    pm2 list || true

    echo "=== Gonairi logs ==="
    pm2 logs gonairi --lines 100 --nostream || true

    exit 1
fi

echo "Gonairi health check passed."

#
# Save PM2 configuration
#
pm2 save

echo "=== Deployment completed successfully ==="