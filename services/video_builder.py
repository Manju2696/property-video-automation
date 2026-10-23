"""Video generation and export for property listings."""

from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
from collections.abc import Callable
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from config import EXPORTS_DIR, MUSIC_DIR, PREVIEWS_DIR
from services import db_service
from services.intro_templates import generate_intro_preview
from services.outro_templates import generate_outro_preview

logger = logging.getLogger(__name__)

FPS = 30
INTRO_DURATION = 5
OUTRO_DURATION = 5
CROSSFADE_DURATION = 0.75
ZOOM_INTENSITY_MULTIPLIER = 0.25

SUPPORTED_FFMPEG_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

ProgressMessageCallback = Callable[[int, str], None]
PreviewProgressCallback = Callable[[int, int, str], None]


def _run_ffmpeg(args: list[str], step: str) -> None:
    cmd = ["ffmpeg", "-y", *args]
    logger.info("Running FFmpeg (%s): %s", step, " ".join(cmd))
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        if result.stderr:
            logger.debug("FFmpeg stderr (%s): %s", step, result.stderr)
    except subprocess.CalledProcessError as exc:
        logger.error("FFmpeg failed (%s): %s", step, exc.stderr)
        raise RuntimeError(f"FFmpeg step failed ({step}): {exc.stderr}") from exc


def _get_video_duration(video_path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(result.stdout.strip())


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for font_path in candidates:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _report_progress(
    callback: ProgressMessageCallback | None,
    progress_start: int,
    progress_end: int,
    fraction: float,
    message: str,
) -> None:
    if callback:
        percent = int(progress_start + (progress_end - progress_start) * fraction)
        callback(max(progress_start, min(progress_end, percent)), message)


def _get_max_zoom(project) -> float:
    intensity = float(project.zoom_intensity if project.zoom_intensity is not None else 1.2)
    return 1.0 + intensity * ZOOM_INTENSITY_MULTIPLIER


def prepare_photo(
    input_path: str,
    output_path: str,
    width: int = 1920,
    height: int = 1080,
) -> str:
    """Scale and center-crop a photo to exactly fill the target frame with no black bars."""
    source = Path(input_path)
    if not source.exists():
        raise FileNotFoundError(f"Photo not found: {input_path}")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    cover_filter = (
        f"scale=w='if(gt(iw/ih,{width}/{height}),(-1),{width})':"
        f"h='if(gt(iw/ih,{width}/{height}),{height},(-1))',"
        f"crop={width}:{height}"
    )
    _run_ffmpeg(
        [
            "-i",
            str(source),
            "-vf",
            cover_filter,
            "-q:v",
            "2",
            str(output),
        ],
        f"prepare_photo_{output.stem}",
    )
    return str(output)


def _ensure_ffmpeg_source(source_path: str, temp_dir: Path, index: int) -> Path:
    """Convert unsupported formats to JPEG before cover-crop preparation."""
    source = Path(source_path)
    if not source.exists():
        raise FileNotFoundError(f"Photo not found: {source_path}")

    if source.suffix.lower() in SUPPORTED_FFMPEG_EXTENSIONS:
        return source

    converted_path = temp_dir / f"source_{index:03d}.jpg"
    _run_ffmpeg(
        ["-i", str(source), "-frames:v", "1", "-q:v", "2", str(converted_path)],
        f"convert_source_{index:03d}",
    )
    return converted_path


def _prepare_photo_input(
    source_path: str,
    prepared_dir: Path,
    index: int,
    width: int,
    height: int,
) -> Path:
    source = _ensure_ffmpeg_source(source_path, prepared_dir, index)
    prepared_path = prepared_dir / f"photo_{index:03d}.jpg"
    prepare_photo(str(source), str(prepared_path), width=width, height=height)
    return prepared_path


TEMPLATE_WIDTH = 1920
TEMPLATE_HEIGHT = 1080


def _scale_clip_to_size(
    input_path: Path,
    output_path: Path,
    width: int,
    height: int,
    crf: int,
    preset: str,
) -> None:
    _run_ffmpeg(
        [
            "-i",
            str(input_path),
            "-vf",
            (
                f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
                f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
            ),
            *_encode_args(crf, preset),
            str(output_path),
        ],
        output_path.stem,
    )


def _finalize_template_clip(
    raw_clip: Path,
    output_path: Path,
    width: int,
    height: int,
    crf: int,
    preset: str,
) -> None:
    if width == TEMPLATE_WIDTH and height == TEMPLATE_HEIGHT:
        shutil.move(str(raw_clip), str(output_path))
        return
    _scale_clip_to_size(raw_clip, output_path, width, height, crf, preset)
    if raw_clip.exists():
        raw_clip.unlink()


def _create_intro_clip(
    project,
    photos: list,
    output_path: Path,
    width: int,
    height: int,
    crf: int,
    preset: str,
) -> None:
    photo_paths = [photo.file_path for photo in photos[:4]]
    raw_clip = output_path.parent / f"intro_raw_{project.intro_template or 'A'}.mp4"
    generate_intro_preview(
        project.intro_template or "A",
        project.name,
        project.beds,
        project.baths,
        project.sqft,
        project.listing_price,
        str(raw_clip),
        photo_paths=photo_paths,
        duration_ms=INTRO_DURATION * 1000,
        crf=crf,
        preset=preset,
    )
    _finalize_template_clip(raw_clip, output_path, width, height, crf, preset)


def _create_outro_clip(
    project,
    agent,
    photos: list,
    output_path: Path,
    width: int,
    height: int,
    crf: int,
    preset: str,
) -> None:
    bg_photo = photos[0].file_path if photos else None
    raw_clip = output_path.parent / f"outro_raw_{project.outro_template or '1'}.mp4"
    generate_outro_preview(
        project.outro_template or "1",
        agent.name if agent else "Your Agent",
        agent.phone if agent and agent.phone else "",
        agent.email if agent and agent.email else "",
        str(raw_clip),
        bg_photo=bg_photo,
        location=project.name,
        duration_ms=OUTRO_DURATION * 1000,
        crf=crf,
        preset=preset,
    )
    _finalize_template_clip(raw_clip, output_path, width, height, crf, preset)


def _create_room_label_overlay(
    room_type: str,
    output_path: Path,
    width: int,
    height: int,
) -> None:
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    label = room_type or "Other"
    font = _load_font(30 if width < height else 36, bold=True)

    text_bbox = draw.textbbox((0, 0), label, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    padding_x = 24
    padding_y = 14
    box_width = text_width + padding_x * 2
    box_height = text_height + padding_y * 2
    box_x = 32
    box_y = height - box_height - 40

    draw.rounded_rectangle(
        [(box_x, box_y), (box_x + box_width, box_y + box_height)],
        radius=14,
        fill=(0, 0, 0, int(255 * 0.6)),
    )
    draw.text(
        (box_x + padding_x, box_y + padding_y),
        label,
        font=font,
        fill=(255, 255, 255, 255),
    )
    overlay.save(output_path)


def _encode_args(crf: int, preset: str) -> list[str]:
    return ["-c:v", "libx264", "-crf", str(crf), "-preset", preset, "-pix_fmt", "yuv420p"]


def _build_photo_clip(
    photo_path: Path,
    output_path: Path,
    duration: float,
    zoom_direction: str,
    width: int,
    height: int,
    max_zoom: float,
    crf: int,
    preset: str,
) -> None:
    # `on` keeps zoom frame-accurate. Incremental `zoom` plus `-t` skips frames.
    frames = max(2, int(round(duration * FPS)))
    zoom_range = max(max_zoom - 1.0, 0.0)
    span = max(frames - 1, 1)
    if zoom_range < 0.001:
        zoom_expr = "1.001"
    elif zoom_direction == "out":
        zoom_expr = f"{max_zoom:.6f}-({zoom_range:.6f})*on/{span}"
    else:
        zoom_expr = f"1.001+({zoom_range:.6f})*on/{span}"

    zoompan = (
        f"scale=8000:-1:flags=lanczos,zoompan=z='{zoom_expr}':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        f"d={frames}:s={width}x{height}:fps={FPS},fps={FPS}"
    )

    _run_ffmpeg(
        [
            "-loop",
            "1",
            "-framerate",
            str(FPS),
            "-i",
            str(photo_path),
            "-vf",
            zoompan,
            "-frames:v",
            str(frames),
            "-r",
            str(FPS),
            *_encode_args(crf, preset),
            str(output_path),
        ],
        output_path.stem,
    )


def _apply_overlay(
    clip_path: Path,
    overlay_path: Path,
    output_path: Path,
    crf: int,
    preset: str,
) -> None:
    _run_ffmpeg(
        [
            "-i",
            str(clip_path),
            "-i",
            str(overlay_path),
            "-filter_complex",
            "overlay=0:0",
            *_encode_args(crf, preset),
            str(output_path),
        ],
        output_path.stem,
    )


def _concat_with_crossfade(
    segment_paths: list[Path],
    output_path: Path,
    crf: int,
    preset: str,
    transition_duration: float = CROSSFADE_DURATION,
) -> None:
    if not segment_paths:
        raise ValueError("No video segments provided for stitching")

    if len(segment_paths) == 1:
        shutil.copy(str(segment_paths[0]), str(output_path))
        return

    durations = [_get_video_duration(path) for path in segment_paths]
    safe_transition = min(
        transition_duration,
        min(durations) * 0.45,
        1.5,
    )
    safe_transition = max(safe_transition, 0.2)

    ffmpeg_inputs: list[str] = []
    for path in segment_paths:
        ffmpeg_inputs.extend(["-i", str(path)])

    filter_parts: list[str] = []
    current_label = "[0:v]"
    accumulated_duration = durations[0]

    for index in range(1, len(segment_paths)):
        offset = max(0.0, accumulated_duration - safe_transition)
        output_label = "[vout]" if index == len(segment_paths) - 1 else f"[v{index:02d}]"
        filter_parts.append(
            f"{current_label}[{index}:v]xfade=transition=fade:duration={safe_transition:.3f}:offset={offset:.3f}{output_label}"
        )
        current_label = output_label
        accumulated_duration += durations[index] - safe_transition

    filter_complex = ";".join(filter_parts)
    _run_ffmpeg(
        [
            *ffmpeg_inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            "[vout]",
            "-r",
            str(FPS),
            *_encode_args(crf, preset),
            str(output_path),
        ],
        "crossfade_concat",
    )


def _render_video(
    project,
    photos: list,
    agent,
    work_dir: Path,
    output_path: Path,
    width: int,
    height: int,
    orientation: str,
    crf: int,
    preset: str,
    progress_callback: ProgressMessageCallback | None = None,
    progress_start: int = 0,
    progress_end: int = 100,
) -> str:
    segments_dir = work_dir / "segments" / orientation
    prepared_dir = work_dir / "prepared" / f"{width}x{height}"
    segments_dir.mkdir(parents=True, exist_ok=True)
    prepared_dir.mkdir(parents=True, exist_ok=True)

    video_no_music = work_dir / f"{orientation}_no_music.mp4"
    segment_paths: list[Path] = []
    total_photos = len(photos)
    duration = float(project.photo_duration or 4.0)
    max_zoom = _get_max_zoom(project)

    _report_progress(progress_callback, progress_start, progress_end, 0.05, "Rendering intro...")
    intro_clip = segments_dir / "intro.mp4"
    _create_intro_clip(project, photos, intro_clip, width, height, crf, preset)
    segment_paths.append(intro_clip)

    for index, photo in enumerate(photos, start=1):
        photo_fraction = 0.10 + (0.65 * index / max(total_photos, 1))
        _report_progress(
            progress_callback,
            progress_start,
            progress_end,
            photo_fraction,
            f"Processing photo {index} of {total_photos}...",
        )

        prepared_photo = _prepare_photo_input(
            photo.file_path,
            prepared_dir,
            index,
            width,
            height,
        )
        raw_clip = segments_dir / f"clip_{index:03d}.mp4"
        labeled_clip = segments_dir / f"clip_{index:03d}_labeled.mp4"
        overlay_png = segments_dir / f"overlay_{index:03d}.png"

        _build_photo_clip(
            prepared_photo,
            raw_clip,
            duration,
            photo.zoom_direction or "in",
            width,
            height,
            max_zoom,
            crf,
            preset,
        )
        _create_room_label_overlay(photo.room_type or "Other", overlay_png, width, height)
        _apply_overlay(raw_clip, overlay_png, labeled_clip, crf, preset)
        segment_paths.append(labeled_clip)

    _report_progress(progress_callback, progress_start, progress_end, 0.82, "Rendering outro...")
    outro_clip = segments_dir / "outro.mp4"
    _create_outro_clip(project, agent, photos, outro_clip, width, height, crf, preset)
    segment_paths.append(outro_clip)

    _report_progress(progress_callback, progress_start, progress_end, 0.90, "Applying cross-dissolve transitions...")
    _concat_with_crossfade(segment_paths, video_no_music, crf, preset)

    music_track = project.music_track
    music_path = MUSIC_DIR / music_track if music_track else None
    if music_path and music_path.exists():
        _report_progress(progress_callback, progress_start, progress_end, 0.96, "Adding background music...")
        video_duration = _get_video_duration(video_no_music)
        fade_start = max(0.0, video_duration - 2.0)
        volume = project.music_volume if project.music_volume is not None else 0.5
        _run_ffmpeg(
            [
                "-i",
                str(video_no_music),
                "-i",
                str(music_path),
                "-filter_complex",
                f"[1:a]volume={volume},afade=t=out:st={fade_start}:d=2[a]",
                "-map",
                "0:v",
                "-map",
                "[a]",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-shortest",
                str(output_path),
            ],
            f"add_music_{orientation}",
        )
    else:
        shutil.move(str(video_no_music), str(output_path))

    _report_progress(progress_callback, progress_start, progress_end, 1.0, "Export complete.")
    return str(output_path)


def generate_preview(
    project_id: int,
    progress_callback: PreviewProgressCallback | None = None,
) -> str:
    """Build a preview MP4 for the project and return the output path."""
    project = db_service.get_project(project_id)
    if not project:
        raise ValueError(f"Project {project_id} not found")

    photos = [photo for photo in db_service.list_photos(project_id) if photo.is_visible]
    if not photos:
        db_service.update_project(project_id, status="failed")
        raise ValueError("No visible photos found for preview generation")

    agent = db_service.get_agent(project.agent_id) if project.agent_id else None
    preview_dir = PREVIEWS_DIR / str(project_id)
    output_path = preview_dir / "preview.mp4"

    def message_callback(percent: int, message: str) -> None:
        if not progress_callback:
            return
        match = re.search(r"Processing photo (\d+) of (\d+)", message)
        if match:
            current = int(match.group(1))
            total = int(match.group(2))
            photo_name = Path(photos[current - 1].file_path).name
            progress_callback(current, total, photo_name)

    try:
        result = _render_video(
            project=project,
            photos=photos,
            agent=agent,
            work_dir=preview_dir,
            output_path=output_path,
            width=1920,
            height=1080,
            orientation="landscape",
            crf=23,
            preset="medium",
            progress_callback=message_callback,
        )
        db_service.update_project(project_id, status="review")
        return result
    except Exception:
        logger.exception("Preview generation failed for project %s", project_id)
        db_service.update_project(project_id, status="failed")
        raise


def export_project(
    project_id: int,
    formats: list[str],
    progress_callback: ProgressMessageCallback | None = None,
) -> dict[str, str | None]:
    """Render final export videos for the requested formats."""
    project = db_service.get_project(project_id)
    if not project:
        raise ValueError(f"Project {project_id} not found")

    photos = [photo for photo in db_service.list_photos(project_id) if photo.is_visible]
    if not photos:
        raise ValueError("No visible photos found for export")

    agent = db_service.get_agent(project.agent_id) if project.agent_id else None
    export_dir = EXPORTS_DIR / str(project_id)
    export_dir.mkdir(parents=True, exist_ok=True)

    normalized_formats = []
    for fmt in formats:
        key = fmt.lower().strip()
        if key in {"landscape", "vertical"} and key not in normalized_formats:
            normalized_formats.append(key)

    if not normalized_formats:
        raise ValueError("No valid export formats selected")

    results: dict[str, str | None] = {"landscape": None, "vertical": None}
    db_service.update_project(project_id, status="rendering")

    try:
        format_count = len(normalized_formats)
        for index, fmt in enumerate(normalized_formats):
            progress_start = int((index / format_count) * 100)
            progress_end = int(((index + 1) / format_count) * 100)

            if fmt == "landscape":
                output_path = export_dir / "landscape.mp4"
                results["landscape"] = _render_video(
                    project=project,
                    photos=photos,
                    agent=agent,
                    work_dir=export_dir,
                    output_path=output_path,
                    width=1920,
                    height=1080,
                    orientation="landscape",
                    crf=18,
                    preset="slow",
                    progress_callback=progress_callback,
                    progress_start=progress_start,
                    progress_end=progress_end,
                )
            elif fmt == "vertical":
                output_path = export_dir / "vertical.mp4"
                results["vertical"] = _render_video(
                    project=project,
                    photos=photos,
                    agent=agent,
                    work_dir=export_dir,
                    output_path=output_path,
                    width=1080,
                    height=1920,
                    orientation="vertical",
                    crf=18,
                    preset="slow",
                    progress_callback=progress_callback,
                    progress_start=progress_start,
                    progress_end=progress_end,
                )

        db_service.update_project(project_id, status="done")
        return results
    except Exception:
        logger.exception("Export failed for project %s", project_id)
        db_service.update_project(project_id, status="failed")
        raise
