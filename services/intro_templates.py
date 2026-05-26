"""Intro slide templates rendered from HTML/CSS animations."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from services.template_renderer import (
    build_intro_context,
    get_intro_template_path,
    render_template_frame,
    render_template_png,
    render_template_video,
)

INTRO_TEMPLATE_NAMES = {
    "A": "Split Panel White",
    "B": "Hero Overlay",
    "C": "Gradient Left",
    "D": "Dark Card Split",
    "E": "Elegant Light",
    "F": "Bold Dark Split",
    "G": "Center Minimal",
    "H": "Photo Grid",
    "I": "Gold Strip Tour",
    "J": "Bottom Banner",
}

# Backward-compatible alias used by the UI
TEMPLATE_NAMES = INTRO_TEMPLATE_NAMES

THUMB_WIDTH = 384
THUMB_HEIGHT = 216
PREVIEW_FRAME_MS = 2800


def generate_intro_preview(
    template_id: str,
    property_name: str,
    beds: int,
    baths: int,
    sqft: int,
    price: float,
    output_path: str,
    photo_paths: list[str] | None = None,
    duration_ms: int = 5000,
    crf: int = 23,
    preset: str = "medium",
) -> str:
    """Render the selected intro template animation to an MP4 clip."""
    context = build_intro_context(property_name, beds, baths, sqft, price, photo_paths)
    template_path = get_intro_template_path(template_id)
    return render_template_video(
        template_path,
        context,
        Path(output_path),
        duration_ms=duration_ms,
        crf=crf,
        preset=preset,
    )


def generate_intro_still(
    template_id: str,
    property_name: str,
    beds: int,
    baths: int,
    sqft: int,
    price: float,
    output_path: str,
    photo_paths: list[str] | None = None,
    time_ms: int = PREVIEW_FRAME_MS,
) -> str:
    """Render a single PNG frame from the intro animation."""
    context = build_intro_context(property_name, beds, baths, sqft, price, photo_paths)
    template_path = get_intro_template_path(template_id)
    return render_template_png(template_path, context, Path(output_path), time_ms=time_ms)


def generate_intro_thumbnail(template_id: str, photo_paths: list[str] | None = None) -> Image.Image:
    """Render a small preview image for template selection."""
    context = build_intro_context(
        "123 Main Street",
        4,
        3,
        2500,
        450000.0,
        photo_paths,
    )
    template_path = get_intro_template_path(template_id)
    image = render_template_frame(template_path, context, PREVIEW_FRAME_MS)
    return image.resize((THUMB_WIDTH, THUMB_HEIGHT), Image.LANCZOS)
