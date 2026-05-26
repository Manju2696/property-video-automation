from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Agent:
    id: Optional[int]
    name: str
    phone: str
    email: str
    photo_path: Optional[str]
    logo_path: Optional[str]
    created_at: Optional[datetime] = None


@dataclass
class Project:
    id: Optional[int]
    name: str
    beds: int
    baths: int
    sqft: int
    listing_price: float
    agent_id: Optional[int]
    status: str = "uploading"
    intro_template: str = "A"
    outro_template: str = "1"
    animation_style: str = "fade_in"
    music_track: Optional[str] = None
    music_volume: float = 0.5
    photo_duration: float = 4.0
    zoom_intensity: float = 1.2
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Photo:
    id: Optional[int]
    project_id: int
    file_path: str
    room_type: Optional[str]
    confidence: Optional[float]
    sequence_order: int
    zoom_direction: str = "in"
    is_visible: int = 1
    created_at: Optional[datetime] = None
