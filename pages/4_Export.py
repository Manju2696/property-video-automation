from pathlib import Path

import streamlit as st

from config import EXPORTS_DIR
from database import init_db
from services import db_service, video_builder

init_db()

st.set_page_config(page_title="Export", page_icon="📤", layout="wide")

if not st.session_state.get("authenticated", False):
    st.error("Please login first")
    st.stop()


def format_file_size(size_bytes: int) -> str:
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    if size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"


def resolve_project_id() -> int | None:
    if st.session_state.get("current_project_id"):
        return st.session_state["current_project_id"]

    query_project_id = st.query_params.get("project_id")
    if query_project_id:
        try:
            return int(query_project_id)
        except (TypeError, ValueError):
            return None
    return None


def get_export_formats(format_choice: str) -> list[str]:
    if format_choice.startswith("Landscape"):
        return ["landscape"]
    if format_choice.startswith("Vertical"):
        return ["vertical"]
    return ["landscape", "vertical"]


project_id = resolve_project_id()
if not project_id:
    st.warning("No project selected. Open a project from Review or the Dashboard first.")
    if st.button("Back to Dashboard"):
        st.switch_page("pages/1_Dashboard.py")
    st.stop()

project = db_service.get_project(project_id)
if not project:
    st.error("Project not found.")
    st.stop()

photos = db_service.list_photos(project_id)
visible_photos = [photo for photo in photos if photo.is_visible]
agent = db_service.get_agent(project.agent_id) if project.agent_id else None
export_dir = EXPORTS_DIR / str(project_id)

st.title("Export")
st.caption("Render and download your final listing videos.")

st.subheader(project.name)
summary_col1, summary_col2 = st.columns(2)
with summary_col1:
    st.write(
        f"**{project.beds}** beds · **{project.baths}** baths · "
        f"**{project.sqft:,}** sqft · **${project.listing_price:,.0f}**"
    )
    st.write(f"**Photos:** {len(visible_photos)} visible / {len(photos)} total")
with summary_col2:
    st.write(f"**Agent:** {agent.name if agent else 'Not assigned'}")
    st.write(f"**Status:** {project.status}")

if visible_photos:
    thumb_cols = st.columns(4)
    for col, photo in zip(thumb_cols, visible_photos[:4]):
        photo_path = Path(photo.file_path)
        with col:
            if photo_path.exists():
                st.image(str(photo_path), use_container_width=True)
            else:
                st.caption("Missing photo")

st.markdown("---")

if not visible_photos:
    st.warning("This project has no visible photos. Add photos before exporting.")
    st.stop()

if project.status not in {"approved", "review", "done", "rendering", "failed"}:
    st.warning(
        "This project should be reviewed and approved before export. "
        "Go to the Review page and click **Approve & Export**."
    )

if st.session_state.pop("show_export_balloons", False):
    st.balloons()

format_choice = st.radio(
    "Choose export format",
    [
        "Landscape (16:9) — YouTube, Websites, MLS",
        "Vertical (9:16) — Instagram Reels, TikTok, Stories",
        "Both — Get both formats",
    ],
)

export_formats = get_export_formats(format_choice)
start_export = st.button("Start Export", type="primary", use_container_width=True)
retry_export = st.button("Retry Export") if project.status == "failed" else None

if start_export or retry_export:
    st.session_state["run_export"] = True
    st.session_state["export_formats"] = export_formats

if st.session_state.get("run_export"):
    st.session_state["run_export"] = False
    try:
        with st.status("Exporting...", expanded=True) as status:
            progress_bar = st.progress(0, text="Starting export...")
            step_text = st.empty()

            def on_progress(percent: int, message: str) -> None:
                progress_bar.progress(percent / 100, text=message)
                step_text.write(message)

            results = video_builder.export_project(
                project_id,
                st.session_state.get("export_formats", export_formats),
                progress_callback=on_progress,
            )
            status.update(label="Export finished!", state="complete")

        st.session_state["show_export_balloons"] = True
        st.success(
            "Export complete. "
            + ", ".join(f"{key}: `{path}`" for key, path in results.items() if path)
        )
        st.rerun()
    except Exception as exc:
        st.error(f"Export failed: {exc}")

st.markdown("---")
st.subheader("Download")

project = db_service.get_project(project_id)
landscape_path = export_dir / "landscape.mp4"
vertical_path = export_dir / "vertical.mp4"
available_files = []

if landscape_path.exists():
    available_files.append(
        ("landscape.mp4", landscape_path, "1920x1080", "16:9 Landscape")
    )
if vertical_path.exists():
    available_files.append(
        ("vertical.mp4", vertical_path, "1080x1920", "9:16 Vertical")
    )

if project.status == "done" and available_files:
    for filename, file_path, resolution, aspect in available_files:
        file_size = format_file_size(file_path.stat().st_size)
        st.write(f"**{filename}** — {file_size} — {resolution} ({aspect})")
        st.download_button(
            label=f"Download {filename}",
            data=file_path.read_bytes(),
            file_name=filename,
            mime="video/mp4",
            use_container_width=True,
        )
elif project.status == "rendering":
    st.info("Export is in progress...")
elif project.status == "failed":
    st.error("The last export failed. Use **Retry Export** above.")
else:
    st.info("Completed export files will appear here after a successful export.")

st.markdown("---")
nav_col1, nav_col2 = st.columns(2)
with nav_col1:
    if st.button("Back to Dashboard", use_container_width=True):
        st.switch_page("pages/1_Dashboard.py")
with nav_col2:
    if st.button("Create Another Project", use_container_width=True):
        st.session_state["reset_wizard"] = True
        st.switch_page("pages/2_New_Project.py")
