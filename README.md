This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy to Fly.io

This app **cannot** run on Vercel or any other serverless platform: it needs a persistent, writable filesystem for its SQLite database, and it spawns headless Chrome (via `lhci`) as a real child process, which serverless execution environments don't support. It must run as a long-running Docker container with a persistent volume — this repo is set up for [Fly.io](https://fly.io).

### Prerequisites

- [`flyctl`](https://fly.io/docs/flyctl/install/) installed
- `fly auth login`

### First-time deploy

```bash
fly apps create lighthouse-dashboard
fly volumes create lighthouse_data --size 1 --region nrt
fly secrets set AUTH_USERNAME=your_username AUTH_PASSWORD=your_strong_password
fly deploy
fly status
fly logs
```

Replace the example credentials with your own values. If the app name is already taken, choose another name and update `app` in `fly.toml`. The first deployment creates a new, empty production database on the volume; the local `dev.db` is not included in the image. After deployment, open the app, sign in, add a URL, and trigger one run to verify that Chromium can complete a Lighthouse report.

### Auth

The whole app sits behind a single shared login (`AUTH_USERNAME`/`AUTH_PASSWORD`, set via `fly secrets set` — never commit these to `fly.toml`). There are no per-user accounts.

- **Only the most recently successful login stays valid.** Logging in anywhere immediately invalidates every other active session. This is intentional — treat it as "whoever logged in last has the session."
- The session is held **in memory**, not the database — every `fly deploy` or machine restart clears it, so everyone has to log back in once afterward.
- `/api/health` is intentionally left unauthenticated so Fly's health check can keep reaching it without a cookie.
- There's no rate-limiting on the login endpoint — acceptable for a small internal tool, but worth knowing if you ever expose this more broadly.

`fly.toml` is already configured with:
- The mounted volume (`/data`) that the SQLite database lives on
- `CHROME_PATH` and `LHCI_COLLECT__SETTINGS__CHROME_FLAGS` (`--no-sandbox` is required for Chrome to launch as root in a container) — **do not remove these**, `lhci` will fail to launch Chrome without them
- The Docker startup command runs `prisma migrate deploy` against the mounted database before starting Next.js. Fly release commands run without persistent volumes, so they cannot migrate this SQLite database.

### Constraints — read before touching `fly.toml`

- **Never run `fly scale count >1`.** SQLite (in WAL mode) does not support multiple machines sharing one volume. This app must always run as exactly one machine.
- Migrations run automatically when the app machine starts, including after each deploy. A failed migration prevents the app from starting.
- There is no managed database backup here (unlike a hosted Postgres) — the SQLite file lives on the Fly volume alone. Arrange volume snapshots and a consistent off-Fly SQLite backup; copying only `prod.db` while WAL mode is active can miss recent writes.

### Cost

Fly.io has **no free tier** (removed October 2024) and **no built-in spending cap or budget alert** — billing is pure usage-based. This app's configuration (`shared-cpu-1x`, 1GB RAM, 1GB volume, Tokyo region) runs roughly **$6–10/month**. Recommended: fund your Fly account via prepaid credit rather than an uncapped card, so usage draws down a balance instead of billing indefinitely, and check the Fly dashboard's billing page periodically.
