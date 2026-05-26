# Property Video Automation

Turn listing photos into polished property videos with AI-powered room classification and automated video assembly.

## Requirements

- Python 3.12

## Setup

```bash
cd property-video-automation
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

## Run

```bash
streamlit run app.py
```

## Project Structure

```
property-video-automation/
├── app.py                    # Main Streamlit app with landing page
├── config.py                 # Settings and paths
├── database.py               # SQLite setup
├── models.py                 # Dataclass models
├── pages/                    # Streamlit multipage routes
├── services/                 # Business logic (AI, video, DB)
└── data/                     # Uploads, previews, exports, music
```

## Pages

| Page | Description |
|------|-------------|
| Dashboard | Project overview and metrics |
| New Project | Create projects and upload photos |
| Review | Photo order, classifications, video settings |
| Export | Generate and download final videos |

## Database

SQLite database stored at `data/property_video.db`. Tables: `agents`, `projects`, `photos`.

Initialized automatically on app startup via `init_db()`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for photo classification |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative classifier) |

## Status

AI classification and video building services are placeholders with TODO stubs. Database CRUD and UI scaffolding are functional.
