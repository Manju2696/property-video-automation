import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
TEMPLATES_DIR = BASE_DIR / "templates"
TEMPLATE_ASSETS_DIR = TEMPLATES_DIR / "assets"
PLAYWRIGHT_BROWSERS_PATH = BASE_DIR / ".playwright-browsers"
UPLOADS_DIR = DATA_DIR / "uploads"
PREVIEWS_DIR = DATA_DIR / "previews"
EXPORTS_DIR = DATA_DIR / "exports"
MUSIC_DIR = DATA_DIR / "music"

DB_PATH = DATA_DIR / "property_video.db"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
APP_PASSWORD = os.getenv("APP_PASSWORD", "admin123")

os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", str(PLAYWRIGHT_BROWSERS_PATH))

for directory in (UPLOADS_DIR, PREVIEWS_DIR, EXPORTS_DIR, MUSIC_DIR, TEMPLATE_ASSETS_DIR, PLAYWRIGHT_BROWSERS_PATH):
    directory.mkdir(parents=True, exist_ok=True)
