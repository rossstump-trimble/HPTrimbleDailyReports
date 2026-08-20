# Localhost development — no Trimble Identity

This is the UI app for the HP Demo Day prototype (bowling sheet + trade daily intake). Work on `localhost`. Trimble Identity (TID) is **not** used locally. TID is only used when the app is deployed on the VPN/VM (`hp-trimble-lab.com`).

Open this folder in Cursor:

```
HP_Demo_Day/_ref/project-sight-boiler
```

That directory is its own git repo. UI edits belong here, on a feature branch, then a PR into `main`. After merge, the VM can pull `main` and restart.

---

## Auth split

| Where | Auth |
|---|---|
| `http://localhost:3000` or `http://127.0.0.1:3000` | Auto-signed in as **Local Developer**. No TID. No Cloud Console callback. |
| `AUTH_MODE=local` in `.env.local` | Same as localhost, even if the host header is unusual. |
| Deployed VPN/VM (`hp-trimble-lab.com`) | **TID only.** Do not set `AUTH_MODE=local` on the VM. |

Trade-partner intake (`/intake/...`) is public in both environments so QR flows do not require a login.

---

## Prerequisites

- Node.js 20+
- npm (comes with Node)
- Git
- Cursor (optional but this how-to is written for it)

You do **not** need:

- Trimble Identity client secrets
- VPN, for UI work
- Google / Gemini keys, unless you are testing photo extraction
- Docker

---

## Cursor setup (humans and agents)

1. Clone or open the prototype repo so `package.json` is at the workspace root (or open `HP_Demo_Day/_ref/project-sight-boiler` if you are inside CompliantScheduling).
2. Copy the local env file if you do not already have one:

```bash
cp .env.local.example .env.local
```

`.env.local` already sets `AUTH_MODE=local`. Do not add `TID_CLIENT_SECRET` here.

3. Install and start:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000). You should land in the app as **Local Developer** with no Trimble sign-in screen.

If port 3000 is busy:

```bash
lsof -ti tcp:3000 | xargs kill -9
npm run dev
```

If `npm install` fails on the `prepare` / husky hook:

```bash
HUSKY=0 npm install
```

### Cursor agent instructions

When this workspace is opened in Cursor, agents should follow `.cursor/skills/local-startup/SKILL.md` and `.cursor/rules/local-dev.mdc`:

- Start `npm run dev` from this directory.
- Never send the browser to `id.trimble.com` on localhost.
- Never write TID secrets into `.env.local`.
- Put UI work on a branch (`ui/<short-name>` or `feat/<short-name>`), not directly on `main`.

---

## Useful local URLs

| URL | What it is |
|---|---|
| http://localhost:3000 | Project list / home |
| http://localhost:3000/projects | Project cards + QR codes (QR points at localhost intake) |
| http://localhost:3000/projects/cys07/bowling | Bowling matrix |
| http://localhost:3000/intake/cys07 | Trade daily intake |
| http://localhost:3000/api/auth/mode | Should return `{"mode":"local","tidEnabled":false}` |

Local data lives in a JSON store under `data/` (see `lib/store.ts`). It is **not** the VM’s data. Do not commit generated local store files.

Gemini photo extraction needs a Google key. Voice intake needs a speech-to-text key (`GROQ_API_KEY` preferred for Whisper, or `OPENAI_API_KEY`, or the same `GEMINI_API_KEY` used for photos). The rest of the UI, bowling grid, and manual intake confirm/submit work without those keys.

---

## Branch workflow (so the VM can take your work later)

Do not commit UI experiments on `main`. `main` is what the VM deploys.

```bash
git checkout main
git pull origin main
git checkout -b ui/bowling-header-tweak
```

Make changes, then:

```bash
npm test
git add -p
git commit -m "ui: describe the visible change"
git push -u origin HEAD
```

Open a pull request against `main` on GitHub. After it is merged, the deployed prototype is updated by pulling `main` on the VM and restarting systemd (`project-sight-boiler.service`). You do not need SSH or TID to contribute UI.

Suggested branch prefixes:

- `ui/` — layout, chrome, copy, CSS
- `feat/` — new prototype behavior
- `fix/` — broken local or prod UI

Keep PRs small and screenshot the localhost page you changed.

---

## What localhost will never do

- Redirect to `https://id.trimble.com`
- Require a registered TID callback of `http://localhost:3000/auth/callback`
- Call ProjectSight live APIs with an operator token

Those belong on the VPN-hosted VM only.

To **force** TID even on localhost (almost never what you want): `AUTH_MODE=tid` in `.env.local`. Leave that unset for UI work.

---

## Production / VPN (for context only)

The live demo is served from the GCP VM as `https://hp-trimble-lab.com`, systemd unit `project-sight-boiler.service`, working directory `/opt/project-sight-boiler`. That environment uses TID. Contributors do not deploy from localhost.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser goes to Trimble Identity on localhost | Confirm you are on `localhost` or `127.0.0.1`, and `.env.local` has `AUTH_MODE=local`. Restart `npm run dev`. |
| `/api/auth/mode` says `"tid"` on localhost | Host header is not loopback, or `AUTH_MODE=tid`. Set `AUTH_MODE=local` and restart. |
| Blank page / compile error | Read the terminal where `next dev` is running. |
| `EADDRINUSE :::3000` | Kill the old process: `lsof -ti tcp:3000 \| xargs kill -9` |
| Intake extract / voice transcribe fails | Expected without a Gemini/Groq/OpenAI key. Fill the confirmation form by hand, or set `GROQ_API_KEY` (Whisper) for phone voice intake. |
| Changes not on the VM | They will not appear until the branch is merged to `main` and the VM is pulled. |
