# Production auto-deployment

Every push to `master` (including a merged pull request) triggers
`.github/workflows/deploy-production.yml`. GitHub connects to the VPS over SSH
and deploys the exact commit that triggered the workflow.

The server deployment is intentionally fail-fast and serialized. It:

1. refuses to deploy over tracked server changes;
2. fast-forwards `/var/www/gonairi` to the requested `master` commit;
3. runs `npm ci` from `package-lock.json`;
4. regenerates Prisma Client and creates the production Next.js build;
5. applies pending Prisma migrations;
6. runs the idempotent geography, category, and Platform Admin seed;
7. restarts only the `gonairi` PM2 application and confirms it has a PID;
8. saves the healthy PM2 process list.

If install, build, migration, or seed fails, PM2 is not restarted and the
GitHub Actions job fails with the deployment output.

## One-time server preparation

The existing deployment must be on `master`, have no tracked local changes,
and be able to fetch the GitHub repository without an interactive password:

```bash
cd /var/www/gonairi
git switch master
git pull --ff-only origin master

command -v node npm npx pm2 flock
pm2 describe gonairi
```

Keep the production `.env` only on the server. It must contain at least valid
`DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` values. If the database has no
Platform Admin yet, also configure secure `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` values; production seeding rejects
the development admin credentials.

The server is currently using the `root` PM2 process, so the Actions SSH key
must initially be authorized for `root`. A dedicated unprivileged deployment
account is preferable once PM2 and the application are moved to that account.

## Dedicated GitHub Actions SSH key

Generate a key exclusively for this repository on a trusted machine:

```bash
ssh-keygen -t ed25519 -C "gonairi-github-actions" -f gonairi_deploy_key
ssh-copy-id -i gonairi_deploy_key.pub root@YOUR_SERVER_IP
```

Do not reuse a personal SSH key. Store the private key only in GitHub and
remove the local copy after verifying the workflow. Before storing the host
key, compare the VPS SSH fingerprint through the provider console, then obtain
the known-hosts entry:

```bash
ssh-keyscan -H YOUR_SERVER_IP
```

## GitHub production environment

In the GitHub repository, open **Settings → Environments**, create an
environment named `production`, restrict it to the `master` branch, and add
these environment secrets:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | VPS IP address or DNS name |
| `DEPLOY_PORT` | SSH port, normally `22` |
| `DEPLOY_USER` | `root` for the current PM2 installation |
| `DEPLOY_SSH_PRIVATE_KEY` | Complete contents of `gonairi_deploy_key` |
| `DEPLOY_SSH_KNOWN_HOSTS` | Verified `ssh-keyscan -H` output |

Environment protection can optionally require approval before production
deployment. GitHub encrypts Actions secrets and exposes them only to jobs that
explicitly reference them.

## First deployment and troubleshooting

Merging this workflow triggers its first run. If the server has not yet pulled
the workflow commit, the SSH command bootstraps it by fast-forwarding `master`
before invoking `scripts/deploy-production.sh`.

You can rerun a deployment from **Actions → Deploy production → Run workflow**.
The server-side deployment lock and the workflow concurrency group prevent two
deployments from running simultaneously.

Useful server checks:

```bash
cd /var/www/gonairi
git rev-parse HEAD
npx prisma migrate status
pm2 status gonairi
pm2 logs gonairi --lines 100 --nostream
```
