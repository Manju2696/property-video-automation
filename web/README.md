# Property Video Pro (Remotion)

Next.js platform that turns listing photos into property marketing videos using Remotion for preview and export.

## Requirements

- Node.js 20+
- FFmpeg available on PATH (used by Remotion renderer)

## Setup

```bash
cd web
cp .env.example .env
npm install
npx prisma migrate dev
```

Set at least one of `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` for AI room classification. Login password defaults to `admin123`.

Optional: drop `.mp3` files into `data/music/` for background tracks.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Remotion Studio (composition debugging):

```bash
npm run studio
```

## Deploy on Vercel

1. Import [Manju2696/property-video-automation](https://github.com/Manju2696/property-video-automation)
2. Set **Root Directory** to `web` (required — otherwise Vercel looks at Python `app.py` and errors)
3. Framework preset: **Next.js**
4. Add env vars from `.env.example`
5. For production data, point `DATABASE_URL` at **Postgres** (Neon, Supabase, etc.) — SQLite file URLs do not work on Vercel

CLI (from this folder):

```bash
cd web
vercel
```

MP4 export and durable photo storage are designed for local/server disk; on Vercel the UI/preview and classification APIs can run, but expect export/uploads to need Blob storage + Remotion Lambda for a full cloud setup.

## Flow

1. **Dashboard** — browse projects
2. **New Project** — upload photos, property/agent details, choose intro/outro templates
3. **Review** — reorder photos, edit room labels, live Remotion Player preview
4. **Export** — render landscape and/or vertical MP4 locally via Remotion

## Stack

- Next.js App Router + Tailwind
- Prisma + SQLite (`data/property_video.db`)
- Remotion Player + `@remotion/renderer` for local MP4 export
- Gemini / Anthropic for photo classification
