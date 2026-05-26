"""Outro slide templates rendered from HTML/CSS animations."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from services.template_renderer import (
    build_outro_context,
    get_outro_template_path,
    render_template_frame,
    render_template_video,
)

OUTRO_TEMPLATE_NAMES = {
    "1": "Center Contact Strip",
    "2": "Bold Call Today",
    "3": "Gradient Left Panel",
    "4": "Serif Elegant",
    "5": "Gold Badge Chips",
    "6": "Gold Lines Frame",
    "7": "Big Today Type",
    "8": "Bottom Gradient Bar",
    "9": "Gold Slide Left",
    "10": "Initials Circle",
}

THUMB_WIDTH = 384
THUMB_HEIGHT = 216
PREVIEW_FRAME_MS = 2600


def generate_outro_preview(
    template_id: str,
    agent_name: str,
    phone: str,
    email: str,
    output_path: str,
    bg_photo: str | None = None,
    heading: str | None = None,
    location: str | None = None,
    duration_ms: int = 5000,
    crf: int = 23,
    preset: str = "medium",
) -> str:
    context = build_outro_context(
        agent_name=agent_name,
        phone=phone,
        email=email,
        bg_photo=bg_photo,
        heading=heading or "CONTACT FOR A SHOWING",
        location=location or "Your City, ST",
    )
    template_path = get_outro_template_path(template_id)
    return render_template_video(
        template_path,
        context,
        Path(output_path),
        duration_ms=duration_ms,
        crf=crf,
        preset=preset,
    )


def generate_outro_thumbnail(template_id: str, bg_photo: str | None = None) -> Image.Image:
    context = build_outro_context(
        agent_name="Jane Smith",
        phone="(555) 123-4567",
        email="jane@realty.com",
        bg_photo=bg_photo,
    )
    template_path = get_outro_template_path(template_id)
    image = render_template_frame(template_path, context, PREVIEW_FRAME_MS)
    return image.resize((THUMB_WIDTH, THUMB_HEIGHT), Image.LANCZOS)
