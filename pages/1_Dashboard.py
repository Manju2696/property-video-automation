from datetime import datetime
from functools import lru_cache
from pathlib import Path

import streamlit as st
from PIL import Image, ImageOps

from database import init_db
from services import db_service

init_db()

st.set_page_config(page_title="My Projects", page_icon="📊", layout="wide")

if not st.session_state.get("authenticated", False):
    st.error("Please login first")
    st.stop()

st.markdown(
    """
    <style>
    div[data-testid="stHorizontalBlock"] > div[data-testid="column"] > div[data-testid="stVerticalBlockBorderWrapper"] {
        height: 100%;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

FILTER_OPTIONS = ["All", "Processing", "Review", "Done"]


def filter_projects(projects: list, filter_name: str) -> list:
    if filter_name == "All":
        return projects
    if filter_name == "Processing":
        return [p for p in projects if p.status in ("processing", "uploading", "rendering")]
    if filter_name == "Review":
        return [p for p in projects if p.status in ("review", "approved")]
    if filter_name == "Done":
        return [p for p in projects if p.status in ("done", "exported")]
    return projects


def get_status_caption(status: str) -> str:
    if status in ("processing", "uploading", "rendering"):
        return "🟡 Processing"
    if status in ("review", "approved"):
        return "🔵 Review"
    if status in ("done", "exported"):
        return "🟢 Done"
    if status == "failed":
        return "🔴 Failed"
    return f"⚪ {status.title()}"


def format_created_at(created_at) -> str:
    if not created_at:
        return "Unknown"
    if isinstance(created_at, datetime):
        return created_at.strftime("%b %d, %Y")
    try:
        return datetime.fromisoformat(str(created_at)).strftime("%b %d, %Y")
    except ValueError:
        return str(created_at)[:10]


def get_first_photo_path(project_id: int) -> Path | None:
    photos = db_service.list_photos(project_id)
    if not photos:
        return None
    path = Path(photos[0].file_path)
    return path if path.exists() else None


@lru_cache
def get_placeholder_image() -> Image.Image:
    return Image.new("RGB", (400, 300), color=(120, 120, 120))


def get_thumbnail_image(photo_path: Path) -> Image.Image:
    with Image.open(photo_path) as image:
        return ImageOps.fit(image.convert("RGB"), (400, 300), method=Image.LANCZOS)


def render_project_card(project) -> None:
    photo_path = get_first_photo_path(project.id)
    thumbnail = get_thumbnail_image(photo_path) if photo_path else get_placeholder_image()
    st.image(thumbnail, use_container_width=True)

    st.markdown(f"**{project.name}**")
    st.caption(get_status_caption(project.status))
    st.caption(format_created_at(project.created_at))

    if st.button("Open →", key=f"open_project_{project.id}", use_container_width=True):
        st.session_state["current_project_id"] = project.id
        st.switch_page("pages/3_Review.py")


title_col, btn_col = st.columns([5, 1])
with title_col:
    st.title("My Projects")
with btn_col:
    st.write("")
    if st.button("New Project", type="primary", use_container_width=True):
        st.session_state["reset_wizard"] = True
        st.switch_page("pages/2_New_Project.py")

filter_col, _ = st.columns([2, 4])
with filter_col:
    status_filter = st.selectbox("Filter by status", FILTER_OPTIONS, label_visibility="collapsed")

projects = filter_projects(db_service.list_projects(), status_filter)

st.markdown("---")

if not projects:
    st.info("No projects yet. Create your first listing video!")
else:
    for row_start in range(0, len(projects), 3):
        cols = st.columns(3)
        row_projects = projects[row_start : row_start + 3]
        for col, project in zip(cols, row_projects):
            with col:
                with st.container(border=True):
                    render_project_card(project)
