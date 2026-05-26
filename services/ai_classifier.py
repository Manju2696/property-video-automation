"""AI-powered room classification for listing photos."""

from __future__ import annotations

import base64
import json
import logging
import re
from collections.abc import Callable
from pathlib import Path

from config import ANTHROPIC_API_KEY, GEMINI_API_KEY
from services import db_service

logger = logging.getLogger(__name__)

PROMPT = """You are an expert real estate photo classifier. Analyze this property photo carefully and determine exactly what room, area, or view it shows.

CLASSIFICATION RULES:
- Look at furniture, fixtures, appliances, and architectural features to determine the room type
- Front View: exterior front of the house, driveway, front yard, front door entrance
- Living Room: sofas, TV area, fireplace, open seating area (not dining)
- Kitchen: countertops, cabinets, stove, oven, refrigerator, sink, island
- Dining Room: dining table with chairs, formal or casual eating area
- Primary Bedroom: largest bedroom, usually with ensuite bathroom access or walk-in closet
- Bedroom: any bedroom that is not the primary (smaller, no ensuite indicators)
- Bathroom: toilet, shower, bathtub, vanity, sink, mirrors
- Office: desk, bookshelves, computer setup, study area
- Laundry: washer, dryer, laundry sink, utility room
- Hallway: corridors, staircases, entryway, foyer
- Backyard: rear exterior, patio, deck, garden, outdoor seating
- Pool: swimming pool, hot tub, pool area
- Garage: garage door, cars, storage, workshop
- Aerial View: drone shot, bird's eye view of the property
- Other: anything that does not clearly fit the above categories

SEQUENCING CONTEXT:
Real estate videos follow a natural walkthrough order. First you see the home from outside (Front View), then enter through the main living areas (Living Room, Kitchen, Dining Room), move to private spaces (Bedrooms, Bathrooms, Office), utility areas (Laundry, Hallway), and finish with outdoor spaces (Backyard, Pool, Garage) and aerial shots.

RESPONSE FORMAT:
Return ONLY a valid JSON object with no other text, no markdown, no explanation:
{"room_type": "exact room type from the list above", "confidence": 0.95}

Confidence guidelines:
- 0.9 to 1.0: Very clear, obvious room type (e.g., kitchen with visible appliances)
- 0.7 to 0.9: Fairly clear but some ambiguity (e.g., open-plan space that could be living/dining)
- 0.5 to 0.7: Unclear, making best guess (e.g., empty room, partial view)
- Below 0.5: Very uncertain, use "Other"

If the photo shows a transitional or multi-purpose space, pick the PRIMARY function of the room."""

GEMINI_MODEL = "gemini-3.1-pro-preview"

VALID_ROOM_TYPES = {
    "Front View",
    "Living Room",
    "Kitchen",
    "Dining Room",
    "Primary Bedroom",
    "Bathroom",
    "Bedroom",
    "Office",
    "Laundry",
    "Hallway",
    "Backyard",
    "Pool",
    "Garage",
    "Aerial View",
    "Other",
}

SEQUENCE_PRIORITY = {
    "Front View": 1,
    "Living Room": 2,
    "Kitchen": 3,
    "Dining Room": 4,
    "Primary Bedroom": 5,
    "Bathroom": 6,
    "Bedroom": 7,
    "Office": 8,
    "Laundry": 9,
    "Hallway": 10,
    "Backyard": 11,
    "Pool": 12,
    "Garage": 13,
    "Aerial View": 14,
    "Other": 15,
}

JSON_OBJECT_PATTERN = re.compile(
    r'\{\s*"room_type"\s*:\s*"([^"]+)"\s*,\s*"confidence"\s*:\s*([0-9.]+)\s*\}',
    re.IGNORECASE,
)

MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _get_media_type(image_path: Path) -> str:
    return MIME_TYPES.get(image_path.suffix.lower(), "image/jpeg")


def _read_image_base64(image_path: str) -> tuple[str, str]:
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    image_bytes = path.read_bytes()
    media_type = _get_media_type(path)
    return base64.b64encode(image_bytes).decode("utf-8"), media_type


def _normalize_room_type(room_type: str) -> str:
    cleaned = room_type.strip()
    if cleaned in VALID_ROOM_TYPES:
        return cleaned
    return "Other"


def _normalize_confidence(confidence: float | str | None, default: float = 0.0) -> float:
    try:
        value = float(confidence)
    except (TypeError, ValueError):
        return default
    return max(0.0, min(1.0, value))


def _build_result(room_type: str, confidence: float | str | None) -> dict:
    return {
        "room_type": _normalize_room_type(room_type),
        "confidence": _normalize_confidence(confidence),
    }


def _find_room_type_in_text(text: str) -> str | None:
    for room_type in sorted(VALID_ROOM_TYPES, key=len, reverse=True):
        if room_type.lower() in text.lower():
            return room_type
    return None


def _parse_classification_response(text: str) -> dict:
    logger.info("Raw classification API response: %s", text)

    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return _build_result(data.get("room_type", "Other"), data.get("confidence", 0.0))
    except json.JSONDecodeError:
        pass

    match = JSON_OBJECT_PATTERN.search(cleaned) or JSON_OBJECT_PATTERN.search(text)
    if match:
        return _build_result(match.group(1), match.group(2))

    room_type = _find_room_type_in_text(text)
    if room_type:
        logger.warning("Parsed room_type from free text, defaulting confidence to 0.5")
        return _build_result(room_type, 0.5)

    logger.warning("Could not parse classification response, defaulting to Other")
    return {"room_type": "Other", "confidence": 0.0}


def _classify_with_gemini(image_b64: str, media_type: str) -> dict:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    image_part = {
        "mime_type": media_type,
        "data": base64.b64decode(image_b64),
    }
    response = model.generate_content(
        [PROMPT, image_part],
        request_options={"timeout": 30},
    )
    return _parse_classification_response(response.text)


def _classify_with_anthropic(image_b64: str, media_type: str) -> dict:
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured")

    import anthropic

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": PROMPT},
                ],
            }
        ],
    )
    text = message.content[0].text
    return _parse_classification_response(text)


def classify_photo(image_path: str) -> dict:
    """Classify a property photo using Gemini, falling back to Anthropic."""
    try:
        image_b64, media_type = _read_image_base64(image_path)
    except Exception as exc:
        logger.exception("Failed to read image %s: %s", image_path, exc)
        return {"room_type": "Other", "confidence": 0.0}

    try:
        result = _classify_with_gemini(image_b64, media_type)
        logger.info("Gemini classified %s as %s", image_path, result["room_type"])
        return result
    except Exception as exc:
        logger.warning("Gemini classification failed for %s: %s", image_path, exc)

    try:
        result = _classify_with_anthropic(image_b64, media_type)
        logger.info("Anthropic classified %s as %s", image_path, result["room_type"])
        return result
    except Exception as exc:
        logger.exception("Anthropic classification failed for %s: %s", image_path, exc)
        return {"room_type": "Other", "confidence": 0.0}


def classify_and_sequence_project(
    project_id: int,
    progress_callback: Callable[[int, int, str], None] | None = None,
) -> None:
    """Classify all project photos, sequence them, and mark project as review."""
    photos = db_service.list_photos(project_id)
    total = len(photos)

    classified_photos = []
    for index, photo in enumerate(photos, start=1):
        photo_name = Path(photo.file_path).name
        if progress_callback:
            progress_callback(index, total, photo_name)

        result = classify_photo(photo.file_path)
        db_service.update_photo(
            photo.id,
            room_type=result["room_type"],
            confidence=result["confidence"],
        )
        classified_photos.append(
            {
                "id": photo.id,
                "room_type": result["room_type"],
                "original_order": photo.sequence_order or index,
            }
        )

    classified_photos.sort(
        key=lambda item: (
            SEQUENCE_PRIORITY.get(item["room_type"], SEQUENCE_PRIORITY["Other"]),
            item["original_order"],
        )
    )

    for sequence_order, photo_data in enumerate(classified_photos, start=1):
        db_service.update_photo(photo_data["id"], sequence_order=sequence_order)

    db_service.update_project(project_id, status="review")
