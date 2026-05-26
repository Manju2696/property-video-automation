"""Disk-cached HTML template preview thumbnails."""

from __future__ import annotations

import tempfile
from pathlib import Path

from PIL import Image

from config import DATA_DIR, TEMPLATES_DIR
from services.template_renderer import (
    build_intro_context,
    build_outro_context,
    get_intro_template_path,
    get_outro_template_path,
    substitute_template,
)

PREVIEW_DIR = DATA_DIR / "template_previews"
CACHE_VERSION = "html-v2"
INTRO_PREVIEW_MS = 2800
OUTRO_PREVIEW_MS = 2600
THUMB_SIZE = (384, 216)


def _preview_path(kind: str, template_id: str) -> Path:
    return PREVIEW_DIR / kind / f"{template_id}_{CACHE_VERSION}.jpg"


def _is_stale(output_path: Path, template_path: Path) -> bool:
    if not output_path.exists():
        return True
    return template_path.stat().st_mtime > output_path.stat().st_mtime


def _save_thumbnail(image: Image.Image, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    thumb = image.resize(THUMB_SIZE, Image.LANCZOS)
    thumb.save(output_path, "JPEG", quality=90)
    return output_path


def _render_html_frame(
    html: str,
    time_ms: int,
    width: int = 1920,
    height: int = 1080,
) -> Image.Image:
    from playwright.sync_api import sync_playwright

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
            page.wait_for_timeout(100)
            page.screenshot(path=str(screenshot_path), type="png")
            browser.close()

        return Image.open(screenshot_path).convert("RGB")


def _render_missing_previews(
    kind: str,
    template_ids: list[str],
    build_context,
    get_template_path,
    time_ms: int,
) -> None:
    stale_ids = [
        template_id
        for template_id in template_ids
        if _is_stale(_preview_path(kind, template_id), get_template_path(template_id))
    ]
    if not stale_ids:
        return

    from playwright.sync_api import sync_playwright

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        with tempfile.TemporaryDirectory() as temp_dir:
            html_path = Path(temp_dir) / "render.html"
            screenshot_path = Path(temp_dir) / "frame.png"

            for template_id in stale_ids:
                template_path = get_template_path(template_id)
                context = build_context(template_id)
                html = substitute_template(template_path.read_text(encoding="utf-8"), context)
                html_path.write_text(html, encoding="utf-8")

                page.goto(html_path.resolve().as_uri())
                page.wait_for_function("window.templateReady === true")
                page.evaluate(f"window.setAnimationTime({time_ms})")
                page.wait_for_timeout(100)
                page.screenshot(path=str(screenshot_path), type="png")

                with Image.open(screenshot_path) as image:
                    _save_thumbnail(image.convert("RGB"), _preview_path(kind, template_id))

        browser.close()


def _build_intro_preview_context(_template_id: str) -> dict[str, str]:
    return build_intro_context("123 Main Street", 4, 3, 2500, 450000.0)


def _build_outro_preview_context(_template_id: str) -> dict[str, str]:
    return build_outro_context(
        agent_name="Jane Smith",
        phone="(555) 123-4567",
        email="jane@realty.com",
    )


def ensure_intro_preview_paths(template_ids: list[str]) -> dict[str, Path]:
    _render_missing_previews(
        "intro",
        template_ids,
        _build_intro_preview_context,
        get_intro_template_path,
        INTRO_PREVIEW_MS,
    )
    return {template_id: _preview_path("intro", template_id) for template_id in template_ids}


def ensure_outro_preview_paths(template_ids: list[str]) -> dict[str, Path]:
    _render_missing_previews(
        "outro",
        template_ids,
        _build_outro_preview_context,
        get_outro_template_path,
        OUTRO_PREVIEW_MS,
    )
    return {template_id: _preview_path("outro", template_id) for template_id in template_ids}
