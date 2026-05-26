import os
from pathlib import Path

import streamlit as st
from PIL import Image, ImageOps
from streamlit_sortables import sort_items

from config import MUSIC_DIR, PREVIEWS_DIR
from database import init_db
from services import db_service, video_builder
from services.intro_templates import TEMPLATE_NAMES as INTRO_TEMPLATE_NAMES
from services.outro_templates import OUTRO_TEMPLATE_NAMES

init_db()

st.set_page_config(page_title="Review", page_icon="👁️", layout="wide")

if not st.session_state.get("authenticated", False):
    st.error("Please login first")
    st.stop()

ROOM_TYPES = [
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
]
ROOM_OPTIONS = [*ROOM_TYPES, "Custom"]
INTRO_TEMPLATES = [chr(i) for i in range(ord("A"), ord("J") + 1)]
OUTRO_TEMPLATES = [str(i) for i in range(1, 11)]
ANIMATION_STYLES = ["fade_in", "slide_up", "scale_pop", "slide_left"]
THUMB_SIZE = (300, 200)
STATUS_LABELS = {
    "uploading": "Uploading",
    "processing": "Processing",
    "review": "Review",
    "approved": "Approved",
    "rendering": "Rendering",
    "done": "Done",
    "failed": "Failed",
    "exported": "Exported",
}


def resolve_project_id() -> int | None:
    if st.session_state.get("current_project_id"):
        return int(st.session_state["current_project_id"])

    query_project_id = st.query_params.get("project_id")
    if query_project_id:
        try:
            return int(query_project_id)
        except (TypeError, ValueError):
            return None
    return None


def list_music_tracks() -> list[str]:
    tracks = sorted(path.name for path in MUSIC_DIR.glob("*.mp3"))
    return ["None", *tracks]


def room_select_index(room_type: str | None) -> int:
    current = room_type or "Other"
    if current in ROOM_TYPES:
        return ROOM_OPTIONS.index(current)
    return ROOM_OPTIONS.index("Custom")


@st.cache_data
def get_photo_thumbnail(image_path: str) -> Image.Image:
    with Image.open(image_path) as image:
        return ImageOps.fit(image.convert("RGB"), THUMB_SIZE, Image.LANCZOS)


def build_sort_label(photo) -> str:
    room = photo.room_type or "Other"
    return f"#{photo.sequence_order} · {room} · id:{photo.id}"


def parse_photo_id_from_label(label: str) -> int:
    return int(label.rsplit("id:", maxsplit=1)[-1])


def apply_photo_order(photo_ids: list[int]) -> None:
    for sequence_order, photo_id in enumerate(photo_ids, start=1):
        db_service.update_photo(photo_id, sequence_order=sequence_order)


def reorder_photo_to_position(project_id: int, photo_id: int, new_position: int) -> None:
    photos = db_service.list_photos(project_id)
    total = len(photos)
    if total == 0:
        return

    new_position = max(1, min(total, int(new_position)))
    ordered = list(photos)
    current_index = next((index for index, photo in enumerate(ordered) if photo.id == photo_id), None)
    if current_index is None:
        return

    photo = ordered.pop(current_index)
    ordered.insert(new_position - 1, photo)
    apply_photo_order([item.id for item in ordered])


def sync_position_state(photos: list, force: bool = False) -> None:
    for photo in photos:
        key = f"position_{photo.id}"
        expected = photo.sequence_order or 1
        if force or key not in st.session_state:
            st.session_state[key] = expected


def handle_position_change(photo_id: int, project_id: int) -> None:
    key = f"position_{photo_id}"
    new_position = st.session_state.get(key)
    if new_position is None:
        return

    photos = db_service.list_photos(project_id)
    photo = next((item for item in photos if item.id == photo_id), None)
    if photo is None:
        return

    current_position = photo.sequence_order or 1
    if int(new_position) == current_position:
        return

    reorder_photo_to_position(project_id, photo_id, int(new_position))
    updated_photos = db_service.list_photos(project_id)
    sync_position_state(updated_photos, force=True)
    st.rerun()


def save_all_changes(project_id: int, project, photos: list) -> None:
    music_track = st.session_state.get("music_track", "None")
    music_value = None if music_track == "None" else music_track

    db_service.update_project(
        project_id,
        name=st.session_state["property_name"].strip(),
        beds=int(st.session_state["beds"]),
        baths=int(st.session_state["baths"]),
        sqft=int(st.session_state["sqft"]),
        listing_price=float(st.session_state["listing_price"]),
        agent_id=st.session_state.get("selected_agent_id", project.agent_id),
        photo_duration=float(st.session_state["photo_duration"]),
        zoom_intensity=float(st.session_state["zoom_intensity"]),
        music_track=music_value,
        music_volume=float(st.session_state["music_volume"]) / 100,
        intro_template=st.session_state["intro_template"],
        outro_template=st.session_state["outro_template"],
        animation_style=st.session_state["animation_style"],
    )

    for photo in photos:
        selected_room = st.session_state.get(f"room_{photo.id}", photo.room_type or "Other")
        if selected_room == "Custom":
            selected_room = st.session_state.get(f"custom_room_{photo.id}", "Other").strip() or "Other"

        zoom_direction = "in" if st.session_state.get(f"zoom_{photo.id}", True) else "out"
        is_visible = 1 if st.session_state.get(f"visible_{photo.id}", True) else 0

        db_service.update_photo(
            photo.id,
            room_type=selected_room,
            zoom_direction=zoom_direction,
            is_visible=is_visible,
        )


with st.sidebar:
    st.markdown("### Navigation")
    if st.button("Dashboard", use_container_width=True):
        st.switch_page("pages/1_Dashboard.py")
    if st.button("New Project", use_container_width=True):
        st.switch_page("pages/2_New_Project.py")


project_id = resolve_project_id()
if not project_id:
    st.error("No project selected.")
    if st.button("Back to Dashboard"):
        st.switch_page("pages/1_Dashboard.py")
    st.stop()

project = db_service.get_project(project_id)
if not project:
    st.error("Project not found.")
    if st.button("Back to Dashboard"):
        st.switch_page("pages/1_Dashboard.py")
    st.stop()

photos = db_service.list_photos(project_id)
agent = db_service.get_agent(project.agent_id) if project.agent_id else None
agents = db_service.list_agents()
preview_path = PREVIEWS_DIR / str(project_id) / "preview.mp4"
music_options = list_music_tracks()
current_music = project.music_track if project.music_track in music_options else "None"

if "selected_agent_id" not in st.session_state:
    st.session_state["selected_agent_id"] = project.agent_id

for photo in photos:
    if photo.room_type and photo.room_type not in ROOM_TYPES:
        st.session_state.setdefault(f"custom_room_{photo.id}", photo.room_type)

status_label = STATUS_LABELS.get(project.status, project.status.title())
st.markdown(f"## {project.name}  \nStatus: **{status_label}**")

st.subheader("Video Preview")
if preview_path.exists():
    st.video(str(preview_path))
elif project.status == "processing":
    st.info("Preview is being generated...")
else:
    st.info("No preview yet. Click **Generate Preview** below.")

st.subheader("Photo Sequence")
if not photos:
    st.info("No photos uploaded for this project yet.")
else:
    sort_labels = [build_sort_label(photo) for photo in photos]
    sorted_labels = sort_items(
        sort_labels,
        direction="horizontal",
        key=f"photo_sort_{project_id}",
    )
    current_ids = [photo.id for photo in photos]
    sorted_ids = [parse_photo_id_from_label(label) for label in sorted_labels]
    if sorted_ids != current_ids:
        apply_photo_order(sorted_ids)
        photos = db_service.list_photos(project_id)
        sync_position_state(photos, force=True)
        st.rerun()

    st.caption("Drag the labels below to reorder, or change the position number on each photo card.")

    total_photos = len(photos)
    sync_position_state(photos)
    for row_start in range(0, total_photos, 5):
        row_photos = photos[row_start : row_start + 5]
        cols = st.columns(5)
        for col, photo in zip(cols, row_photos):
            with col:
                with st.container(border=True):
                    if os.path.exists(photo.file_path):
                        st.image(get_photo_thumbnail(photo.file_path), use_container_width=True)
                    else:
                        st.caption("Image file missing")

                    st.selectbox(
                        "Room type",
                        ROOM_OPTIONS,
                        index=room_select_index(photo.room_type),
                        key=f"room_{photo.id}",
                    )
                    if st.session_state.get(f"room_{photo.id}") == "Custom":
                        st.text_input("Custom room name", key=f"custom_room_{photo.id}")

                    confidence = photo.confidence if photo.confidence is not None else 0.0
                    st.caption(f"Confidence: {confidence:.0%}")

                    toggle_col1, toggle_col2 = st.columns(2)
                    with toggle_col1:
                        st.toggle(
                            "Zoom In",
                            value=(photo.zoom_direction or "in") == "in",
                            key=f"zoom_{photo.id}",
                        )
                    with toggle_col2:
                        st.toggle(
                            "Visible",
                            value=bool(photo.is_visible),
                            key=f"visible_{photo.id}",
                        )

                    st.number_input(
                        "Position",
                        min_value=1,
                        max_value=total_photos,
                        step=1,
                        key=f"position_{photo.id}",
                        on_change=handle_position_change,
                        args=(photo.id, project_id),
                    )

st.markdown("---")

with st.expander("Property Details", expanded=False):
    prop_col1, prop_col2, prop_col3, prop_col4, prop_col5 = st.columns(5)
    with prop_col1:
        st.text_input("Property name", value=project.name, key="property_name")
    with prop_col2:
        st.number_input("Beds", min_value=0, value=project.beds, key="beds")
    with prop_col3:
        st.number_input("Baths", min_value=0, value=project.baths, key="baths")
    with prop_col4:
        st.number_input("SqFt", min_value=0, value=project.sqft, key="sqft")
    with prop_col5:
        st.number_input(
            "Price ($)",
            min_value=0.0,
            value=float(project.listing_price),
            step=1000.0,
            format="%.0f",
            key="listing_price",
        )

with st.expander("Agent Details", expanded=False):
    if agent:
        st.write(f"Current agent: **{agent.name}**")
    else:
        st.write("No agent assigned.")

    if agents:
        agent_labels = {f"{item.name} ({item.email or 'no email'})": item.id for item in agents}
        label_list = list(agent_labels.keys())
        default_index = 0
        if project.agent_id in agent_labels.values():
            default_index = list(agent_labels.values()).index(project.agent_id)
        selected_label = st.selectbox("Change agent", label_list, index=default_index, key="agent_select_label")
        st.session_state["selected_agent_id"] = agent_labels[selected_label]
    else:
        st.info("No agents in the database.")
        st.session_state["selected_agent_id"] = project.agent_id

with st.expander("Video Settings", expanded=False):
    video_col1, video_col2, video_col3, video_col4 = st.columns(4)
    with video_col1:
        st.slider(
            "Photo duration (seconds)",
            min_value=2.0,
            max_value=8.0,
            value=float(project.photo_duration or 4.0),
            step=0.5,
            key="photo_duration",
        )
    with video_col2:
        st.slider(
            "Zoom intensity",
            min_value=1.0,
            max_value=3.0,
            value=float(project.zoom_intensity or 1.2),
            step=0.1,
            key="zoom_intensity",
            help="1.0 = 25% zoom, 2.0 = 50% zoom, 3.0 = 75% zoom",
        )
    with video_col3:
        st.selectbox(
            "Music",
            music_options,
            index=music_options.index(current_music),
            key="music_track",
        )
    with video_col4:
        st.slider(
            "Volume",
            min_value=0,
            max_value=100,
            value=int(round((project.music_volume or 0.5) * 100)),
            key="music_volume",
        )

with st.expander("Templates", expanded=False):
    intro_index = (
        INTRO_TEMPLATES.index(project.intro_template)
        if project.intro_template in INTRO_TEMPLATES
        else 0
    )
    outro_index = (
        OUTRO_TEMPLATES.index(project.outro_template)
        if project.outro_template in OUTRO_TEMPLATES
        else 0
    )
    animation_index = (
        ANIMATION_STYLES.index(project.animation_style)
        if project.animation_style in ANIMATION_STYLES
        else 0
    )
    template_col1, template_col2, template_col3 = st.columns(3)
    with template_col1:
        st.selectbox(
            "Intro template",
            INTRO_TEMPLATES,
            index=intro_index,
            key="intro_template",
            format_func=lambda template_id: f"{template_id} - {INTRO_TEMPLATE_NAMES.get(template_id, template_id)}",
        )
    with template_col2:
        st.selectbox(
            "Outro template",
            OUTRO_TEMPLATES,
            index=outro_index,
            key="outro_template",
            format_func=lambda template_id: f"{template_id} - {OUTRO_TEMPLATE_NAMES.get(template_id, template_id)}",
        )
    with template_col3:
        st.selectbox(
            "Animation style",
            ANIMATION_STYLES,
            index=animation_index,
            key="animation_style",
        )

st.markdown("---")
action_col1, action_col2, action_col3 = st.columns(3)

with action_col1:
    if st.button("Save Changes", use_container_width=True):
        save_all_changes(project_id, project, photos)
        st.success("Changes saved!")
        st.rerun()

with action_col2:
    if st.button("Generate Preview", type="primary", use_container_width=True):
        save_all_changes(project_id, project, photos)
        visible_photos = [
            photo
            for photo in db_service.list_photos(project_id)
            if st.session_state.get(f"visible_{photo.id}", bool(photo.is_visible))
        ]
        if not visible_photos:
            st.error("No visible photos available to build a preview.")
        else:
            try:
                with st.status("Building preview video...", expanded=True) as status:
                    progress_bar = st.progress(0, text="Starting preview generation...")

                    def on_progress(current: int, total: int, photo_name: str) -> None:
                        st.write(f"Processing photo {current}/{total}: {photo_name}")
                        progress_bar.progress(current / total, text=f"Photo {current} of {total}")

                    output_path = video_builder.generate_preview(
                        project_id,
                        progress_callback=on_progress,
                    )
                    status.update(label="Preview video ready!", state="complete")

                st.success(f"Preview generated: `{output_path}`")
                st.rerun()
            except Exception as exc:
                st.error(f"Preview generation failed: {exc}")

with action_col3:
    if st.button("Approve & Export", use_container_width=True):
        save_all_changes(project_id, project, photos)
        db_service.update_project(project_id, status="approved")
        st.session_state["current_project_id"] = project_id
        st.switch_page("pages/4_Export.py")
