# Property Video Automation

Turn listing photos into polished property videos with AI-powered room classification and automated video assembly.

## Preferred app: Remotion platform

The main product UI now lives in **`web/`** — a Next.js + Remotion platform (preview + MP4 export).

```bash
cd web
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

See [web/README.md](web/README.md) for details. Default login password: `admin123`.

## Deploy on Vercel

Import the GitHub repo. This repo includes a root `vercel.json` with `"rootDirectory": "web"` so Next.js is built from `web/`.

If the dashboard still shows the wrong folder: **Settings → General → Root Directory → `web`**.

Do **not** leave Root Directory as `.` / empty — that is the Python/Streamlit tree and causes “No Next.js version detected”.

Required env vars in the Vercel project (same as `web/.env.example`):

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Local SQLite (`file:…`) will **not** persist on Vercel. Use Postgres (e.g. Neon) for production. |
| `APP_PASSWORD` | Login password |
| `AUTH_SECRET` | Long random string |
| `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` | Classification |

**Limits on Vercel serverless:** photo files and SQLite live on ephemeral disk (not durable), and Remotion MP4 export needs Chromium/FFmpeg — use local `npm run dev` for reliable export, or Remotion Lambda later.

## Legacy Streamlit app

The original Python/Streamlit + FFmpeg/Playwright pipeline remains in this repo for reference.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
streamlit run app.py
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for photo classification |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative classifier) |
| `APP_PASSWORD` | Login password (default `admin123`) |
