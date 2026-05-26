"""Render HTML/CSS animated templates to video or image frames."""

from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

from config import BASE_DIR, TEMPLATE_ASSETS_DIR, TEMPLATES_DIR
from PIL import Image

logger = logging.getLogger(__name__)

INTRO_DIR = TEMPLATES_DIR / "intro"
OUTRO_DIR = TEMPLATES_DIR / "outro"
ICONS_DIR = TEMPLATE_ASSETS_DIR / "icons"
PLACEHOLDER_PHOTO = TEMPLATE_ASSETS_DIR / "placeholders" / "photo.jpg"

DEFAULT_HEADING = "CONTACT FOR A SHOWING"
DEFAULT_LOCATION = "Your City, ST"


def path_to_uri(path: str | Path) -> str:
    resolved = Path(path).resolve()
    if not resolved.exists():
        resolved = PLACEHOLDER_PHOTO.resolve()
    return resolved.as_uri()


def substitute_template(html: str, context: dict[str, str]) -> str:
    rendered = html
    for key, value in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
    return rendered


def get_intro_template_path(template_id: str) -> Path:
    template_id = (template_id or "A").upper()
    return INTRO_DIR / f"template_{template_id}_animated.html"


def get_outro_template_path(template_id: str) -> Path:
    template_num = str(template_id or "1")
    return OUTRO_DIR / f"template_{template_num}_outro_animated.html"


def build_icon_context() -> dict[str, str]:
    return {
        "bed_icon": path_to_uri(ICONS_DIR / "bed.svg"),
        "bath_icon": path_to_uri(ICONS_DIR / "bath.svg"),
        "sqft_icon": path_to_uri(ICONS_DIR / "sqft.svg"),
    }


def build_photo_context(photo_paths: list[str], count: int = 4) -> dict[str, str]:
    paths = list(photo_paths[:count])
    while len(paths) < count:
        paths.append(str(PLACEHOLDER_PHOTO))
    return {f"photo_{index + 1}": path_to_uri(path) for index, path in enumerate(paths)}


def build_intro_context(
    property_name: str,
    beds: int,
    baths: int,
    sqft: int,
    price: float,
    photo_paths: list[str] | None = None,
) -> dict[str, str]:
    context = {
        "property_name": property_name,
        "bedrooms": str(beds),
        "bathrooms": str(baths),
        "area_sqft": f"{sqft:,}",
        "listing_price": f"${price:,.0f}",
    }
    context.update(build_icon_context())
    context.update(build_photo_context(photo_paths or []))
    return context


def build_outro_context(
    agent_name: str,
    phone: str,
    email: str,
    bg_photo: str | None = None,
    heading: str = DEFAULT_HEADING,
    location: str = DEFAULT_LOCATION,
) -> dict[str, str]:
    initials = "".join(part[0].upper() for part in agent_name.split()[:2]) or "AG"
    return {
        "bg_photo": path_to_uri(bg_photo or PLACEHOLDER_PHOTO),
        "heading": heading,
        "agent_name": agent_name or "Your Agent",
        "location": location,
        "phone": phone or "",
        "email": email or "",
        "agent_initials": initials,
    }


def _run_ffmpeg(args: list[str], step: str) -> None:
    cmd = ["ffmpeg", "-y", *args]
    logger.info("Running FFmpeg (%s): %s", step, " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed ({step}): {result.stderr}")


def render_template_frame(
    template_path: Path,
    context: dict[str, str],
    time_ms: int,
    width: int = 1920,
    height: int = 1080,
) -> Image.Image:
    from playwright.sync_api import sync_playwright

    html = substitute_template(template_path.read_text(encoding="utf-8"), context)
    with tempfile.TemporaryDirectory() as temp_dir:
        html_path = Path(temp_dir) / "render.html"
        screenshot_path = Path(temp_dir) / "frame.png"
        html_path.write_text(html, encoding="utf-8")

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(html_path.resolve().as_uri())
            page.wait_for_function("window.templateReady === true")
            page.evaluate(f"window.setAnimationTime({time_ms})")
            page.wait_for_timeout(50)
            page.screenshot(path=str(screenshot_path), type="png")
            browser.close()

        return Image.open(screenshot_path).convert("RGB")


def render_template_video(
    template_path: Path,
    context: dict[str, str],
    output_path: Path,
    duration_ms: int = 5000,
    fps: int = 30,
    width: int = 1920,
    height: int = 1080,
    crf: int = 23,
    preset: str = "medium",
) -> str:
    from playwright.sync_api import sync_playwright

    html = substitute_template(template_path.read_text(encoding="utf-8"), context)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        html_path = temp_root / "render.html"
        frames_dir = temp_root / "frames"
        frames_dir.mkdir()
        html_path.write_text(html, encoding="utf-8")

        total_frames = max(1, int(duration_ms / 1000 * fps))
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(html_path.resolve().as_uri())
            page.wait_for_function("window.templateReady === true")

            for frame_index in range(total_frames):
                time_ms = int(frame_index * 1000 / fps)
                page.evaluate(f"window.setAnimationTime({time_ms})")
                page.wait_for_timeout(50)
                frame_path = frames_dir / f"frame_{frame_index:04d}.png"
                page.screenshot(path=str(frame_path), type="png")

            browser.close()

        _run_ffmpeg(
            [
                "-framerate",
                str(fps),
                "-i",
                str(frames_dir / "frame_%04d.png"),
                "-c:v",
                "libx264",
                "-crf",
                str(crf),
                "-preset",
                preset,
                "-pix_fmt",
                "yuv420p",
                str(output_path),
            ],
            output_path.stem,
        )

    return str(output_path)


def render_template_png(
    template_path: Path,
    context: dict[str, str],
    output_path: Path,
    time_ms: int = 2800,
    width: int = 1920,
    height: int = 1080,
) -> str:
    image = render_template_frame(template_path, context, time_ms, width, height)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)
    return str(output_path)
