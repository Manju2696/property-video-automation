from datetime import datetime
from typing import Any, Optional

from database import get_connection
from models import Agent, Photo, Project


def _row_to_agent(row) -> Agent:
    return Agent(
        id=row["id"],
        name=row["name"],
        phone=row["phone"] or "",
        email=row["email"] or "",
        photo_path=row["photo_path"],
        logo_path=row["logo_path"],
        created_at=row["created_at"],
    )


def _row_to_project(row) -> Project:
    return Project(
        id=row["id"],
        name=row["name"],
        beds=row["beds"] or 0,
        baths=row["baths"] or 0,
        sqft=row["sqft"] or 0,
        listing_price=row["listing_price"] or 0.0,
        agent_id=row["agent_id"],
        status=row["status"] or "uploading",
        intro_template=row["intro_template"] or "A",
        outro_template=row["outro_template"] or "1",
        animation_style=row["animation_style"] or "fade_in",
        music_track=row["music_track"],
        music_volume=row["music_volume"] or 0.5,
        photo_duration=row["photo_duration"] or 4.0,
        zoom_intensity=row["zoom_intensity"] or 1.2,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_photo(row) -> Photo:
    return Photo(
        id=row["id"],
        project_id=row["project_id"],
        file_path=row["file_path"],
        room_type=row["room_type"],
        confidence=row["confidence"],
        sequence_order=row["sequence_order"] or 0,
        zoom_direction=row["zoom_direction"] or "in",
        is_visible=row["is_visible"] if row["is_visible"] is not None else 1,
        created_at=row["created_at"],
    )


# --- Agents ---


def create_agent(
    name: str,
    phone: str = "",
    email: str = "",
    photo_path: Optional[str] = None,
    logo_path: Optional[str] = None,
) -> Agent:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO agents (name, phone, email, photo_path, logo_path)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, phone, email, photo_path, logo_path),
        )
        agent_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
    return _row_to_agent(row)


def get_agent(agent_id: int) -> Optional[Agent]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
    return _row_to_agent(row) if row else None


def list_agents() -> list[Agent]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM agents ORDER BY name").fetchall()
    return [_row_to_agent(row) for row in rows]


def update_agent(agent_id: int, **kwargs: Any) -> Optional[Agent]:
    allowed = {"name", "phone", "email", "photo_path", "logo_path"}
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return get_agent(agent_id)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [agent_id]

    with get_connection() as conn:
        conn.execute(f"UPDATE agents SET {set_clause} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
    return _row_to_agent(row) if row else None


def delete_agent(agent_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
    return cursor.rowcount > 0


# --- Projects ---


def create_project(
    name: str,
    beds: int = 0,
    baths: int = 0,
    sqft: int = 0,
    listing_price: float = 0.0,
    agent_id: Optional[int] = None,
    status: str = "uploading",
    intro_template: str = "A",
    outro_template: str = "1",
    animation_style: str = "fade_in",
    music_track: Optional[str] = None,
    music_volume: float = 0.5,
    photo_duration: float = 4.0,
    zoom_intensity: float = 1.2,
) -> Project:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO projects (
                name, beds, baths, sqft, listing_price, agent_id, status,
                intro_template, outro_template, animation_style, music_track,
                music_volume, photo_duration, zoom_intensity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name, beds, baths, sqft, listing_price, agent_id, status,
                intro_template, outro_template, animation_style, music_track,
                music_volume, photo_duration, zoom_intensity,
            ),
        )
        project_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return _row_to_project(row)


def get_project(project_id: int) -> Optional[Project]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return _row_to_project(row) if row else None


def list_projects(status: Optional[str] = None) -> list[Project]:
    with get_connection() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall()
    return [_row_to_project(row) for row in rows]


def update_project(project_id: int, **kwargs: Any) -> Optional[Project]:
    allowed = {
        "name", "beds", "baths", "sqft", "listing_price", "agent_id", "status",
        "intro_template", "outro_template", "animation_style", "music_track",
        "music_volume", "photo_duration", "zoom_intensity",
    }
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return get_project(project_id)

    updates["updated_at"] = datetime.now().isoformat()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [project_id]

    with get_connection() as conn:
        conn.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return _row_to_project(row) if row else None


def delete_project(project_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return cursor.rowcount > 0


# --- Photos ---


def create_photo(
    project_id: int,
    file_path: str,
    room_type: Optional[str] = None,
    confidence: Optional[float] = None,
    sequence_order: int = 0,
    zoom_direction: str = "in",
    is_visible: int = 1,
) -> Photo:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO photos (
                project_id, file_path, room_type, confidence,
                sequence_order, zoom_direction, is_visible
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id, file_path, room_type, confidence,
                sequence_order, zoom_direction, is_visible,
            ),
        )
        photo_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()
    return _row_to_photo(row)


def get_photo(photo_id: int) -> Optional[Photo]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()
    return _row_to_photo(row) if row else None


def list_photos(project_id: int) -> list[Photo]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM photos WHERE project_id = ? ORDER BY sequence_order",
            (project_id,),
        ).fetchall()
    return [_row_to_photo(row) for row in rows]


def update_photo(photo_id: int, **kwargs: Any) -> Optional[Photo]:
    allowed = {
        "file_path", "room_type", "confidence", "sequence_order",
        "zoom_direction", "is_visible",
    }
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return get_photo(photo_id)

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [photo_id]

    with get_connection() as conn:
        conn.execute(f"UPDATE photos SET {set_clause} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM photos WHERE id = ?", (photo_id,)).fetchone()
    return _row_to_photo(row) if row else None


def delete_photo(photo_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute("DELETE FROM photos WHERE id = ?", (photo_id,))
    return cursor.rowcount > 0
