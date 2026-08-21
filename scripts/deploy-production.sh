#!/usr/bin/env bash

set -Eeuo pipefail
umask 027

readonly APP_DIR="${DEPLOY_APP_DIR:-/var/www/gonairi}"
readonly PM2_APP_NAME="${DEPLOY_PM2_APP_NAME:-gonairi}"
readonly EXPECTED_SHA="${1:-}"
readonly LOCK_FILE="${DEPLOY_LOCK_FILE:-/var/lock/gonairi-deploy.lock}"

failure_report() {
  local exit_code=$?
  echo "[deploy] Failed at line ${BASH_LINENO[0]} with exit code ${exit_code}." >&2
  if command -v pm2 >/dev/null 2>&1; then
    pm2 logs "${PM2_APP_NAME}" --lines 50 --nostream 2>/dev/null || true
  fi
  exit "${exit_code}"
}
trap failure_report ERR

if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # PM2 and Node are commonly installed through NVM on small VPS hosts.
  # shellcheck disable=SC1091
  set +u
  source "${HOME}/.nvm/nvm.sh"
  set -u
fi

for executable in git node npm npx pm2 flock; do
  command -v "${executable}" >/dev/null 2>&1 || {
    echo "[deploy] Required command is unavailable: ${executable}" >&2
    exit 1
  }
done

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "[deploy] Another GoNairi deployment is already running." >&2
  exit 1
fi

cd "${APP_DIR}"
export NODE_ENV=production

if [[ "$(git branch --show-current)" != "master" ]]; then
  echo "[deploy] ${APP_DIR} must be checked out on the master branch." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "[deploy] Refusing to overwrite tracked changes in ${APP_DIR}." >&2
  git status --short >&2
  exit 1
fi

echo "[deploy] Fetching master..."
git fetch --prune origin master

readonly TARGET_SHA="${EXPECTED_SHA:-$(git rev-parse origin/master)}"
if ! git merge-base --is-ancestor "${TARGET_SHA}" origin/master; then
  echo "[deploy] Requested revision ${TARGET_SHA} is not on origin/master." >&2
  exit 1
fi

git merge --ff-only "${TARGET_SHA}"
readonly DEPLOYED_SHA="$(git rev-parse HEAD)"
if [[ "${DEPLOYED_SHA}" != "${TARGET_SHA}" ]]; then
  echo "[deploy] Expected ${TARGET_SHA}, but the working tree is ${DEPLOYED_SHA}." >&2
  exit 1
fi

echo "[deploy] Installing locked dependencies..."
npm ci --include=dev --no-audit --no-fund

echo "[deploy] Building application and regenerating Prisma Client..."
npm run build

echo "[deploy] Applying database migrations..."
npm run db:migrate:deploy

echo "[deploy] Running idempotent production seed..."
npm run db:seed

echo "[deploy] Restarting PM2 application ${PM2_APP_NAME}..."
pm2 restart "${PM2_APP_NAME}" --update-env

sleep 3
readonly APP_PID="$(pm2 pid "${PM2_APP_NAME}" | awk 'NF { print $1; exit }')"
if [[ ! "${APP_PID}" =~ ^[1-9][0-9]*$ ]]; then
  echo "[deploy] PM2 application ${PM2_APP_NAME} is not online after restart." >&2
  exit 1
fi

pm2 save
echo "[deploy] Successfully deployed ${DEPLOYED_SHA}; ${PM2_APP_NAME} is online as PID ${APP_PID}."
