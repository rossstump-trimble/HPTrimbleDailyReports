---
name: local-startup
description: Start the HP Demo Day prototype UI on localhost without Trimble Identity. Use when opening this repo in Cursor, running the Next.js app locally, doing UI edits, restarting the dev server, or setting up a new machine for bowling/intake work.
---

# Local Startup — HPproto UI (no TID)

Follow this when the user wants localhost UI, UI edits, or a working Cursor environment for `HP_Demo_Day/_ref/project-sight-boiler`.

## Hard rules

- App root is this directory (where `package.json` lives).
- Local UI is `http://localhost:3000`.
- **Do not use Trimble Identity on localhost.** Do not add TID client secrets. Do not register `http://localhost:3000/auth/callback`.
- TID is only for the deployed VPN/VM (`hp-trimble-lab.com`).
- Put work on a branch (`ui/…`, `feat/…`, `fix/…`), not `main`.

## Start

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
# If this workspace is CompliantScheduling, the app is:
#   HP_Demo_Day/_ref/project-sight-boiler

test -f .env.local || cp .env.local.example .env.local

# Free a stale Next server
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null || true

HUSKY=0 npm install
npm run dev
```

Verify:

```bash
curl -s http://localhost:3000/api/auth/mode
# Expected: {"mode":"local","tidEnabled":false}
```

Open http://localhost:3000 — signed in as **Local Developer**, no TID screen.

## Git

```bash
git checkout main && git pull
git checkout -b ui/short-description
# edit, then
npm test
git add -p && git commit && git push -u origin HEAD
```

Open a PR to `main`. The VM deploys `main` after merge; do not SSH to the VM for UI work.

## Troubleshooting

- Browser hits `id.trimble.com` → not in local mode. Check `.env.local` has `AUTH_MODE=local` and the URL is localhost. Restart `npm run dev`.
- `EADDRINUSE` on 3000 → kill the process on that port, then `npm run dev`.
- Full human how-to: `LOCAL-DEV.md` in this directory.
