from pathlib import Path

import streamlit as st

from config import MUSIC_DIR, UPLOADS_DIR
from database import init_db
from services import ai_classifier, db_service
from services.intro_templates import TEMPLATE_NAMES
from services.outro_templates import OUTRO_TEMPLATE_NAMES
from services.template_previews import ensure_intro_preview_paths, ensure_outro_preview_paths

init_db()

st.set_page_config(page_title="New Project", page_icon="➕", layout="wide")

if not st.session_state.get("authenticated", False):
    st.error("Please login first")
    st.stop()

INTRO_TEMPLATES = [chr(i) for i in range(ord("A"), ord("J") + 1)]
OUTRO_TEMPLATES = [str(i) for i in range(1, 11)]
ANIMATION_STYLES = ["fade_in", "slide_up", "scale_pop", "slide_left"]
WIZARD_KEYS = [
    "wizard_step",
    "uploaded_photos",
    "property_name",
    "beds",
    "baths",
    "sqft",
    "listing_price",
    "agent_mode",
    "selected_agent_id",
    "new_agent_name",
    "new_agent_phone",
    "new_agent_email",
    "new_agent_photo_data",
    "new_agent_logo_data",
    "intro_template",
    "outro_template",
    "animation_style",
    "music_track",
    "music_volume",
    "photo_duration",
]


def load_intro_thumbnails() -> dict[str, Path]:
    return ensure_intro_preview_paths(list(TEMPLATE_NAMES.keys()))


def load_outro_thumbnails() -> dict[str, Path]:
    return ensure_outro_preview_paths(list(OUTRO_TEMPLATE_NAMES.keys()))


def init_wizard_state() -> None:
    defaults = {
        "wizard_step": 1,
        "uploaded_photos": [],
        "property_name": "",
        "beds": 3,
        "baths": 2,
        "sqft": 1800,
        "listing_price": 450000.0,
        "agent_mode": "Select existing agent",
        "selected_agent_id": None,
        "new_agent_name": "",
        "new_agent_phone": "",
        "new_agent_email": "",
        "new_agent_photo_data": None,
        "new_agent_logo_data": None,
        "intro_template": "A",
        "outro_template": "1",
        "animation_style": "fade_in",
        "music_track": "None",
        "music_volume": 50,
        "photo_duration": 4.0,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def clear_wizard_state() -> None:
    for key in WIZARD_KEYS:
        st.session_state.pop(key, None)
    st.session_state.pop("reset_wizard", None)


if st.session_state.pop("reset_wizard", False):
    clear_wizard_state()

init_wizard_state()

step = st.session_state["wizard_step"]

st.title("New Project")
st.caption("Create a new property video in three easy steps.")
st.progress(step / 3, text=f"Step {step} of 3")
st.markdown("---")


def save_agent_asset(agent_id: int, asset_data: dict | None) -> str | None:
    if not asset_data:
        return None
    agent_dir = UPLOADS_DIR / "agents" / str(agent_id)
    agent_dir.mkdir(parents=True, exist_ok=True)
    file_path = agent_dir / asset_data["name"]
    file_path.write_bytes(asset_data["bytes"])
    return str(file_path)


def save_project_photos(project_id: int, photos: list[dict]) -> None:
    project_dir = UPLOADS_DIR / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)
    for index, photo in enumerate(photos):
        file_path = project_dir / photo["name"]
        file_path.write_bytes(photo["bytes"])
        db_service.create_photo(
            project_id=project_id,
            file_path=str(file_path),
            sequence_order=index,
        )


def list_music_tracks() -> list[str]:
    tracks = sorted(path.name for path in MUSIC_DIR.glob("*.mp3"))
    return ["None", *tracks]


def render_photo_grid(photos: list[dict]) -> None:
    if not photos:
        return
    cols = st.columns(5)
    for index, photo in enumerate(photos):
        with cols[index % 5]:
            st.image(photo["bytes"], caption=photo["name"], width=150)


# --- Step 1: Upload Photos ---

if step == 1:
    st.subheader("Step 1 — Upload Photos")
    uploaded_files = st.file_uploader(
        "Upload listing photos",
        type=["jpg", "jpeg", "png", "webp"],
        accept_multiple_files=True,
        key="photo_upload",
    )

    if uploaded_files:
        st.session_state["uploaded_photos"] = [
            {"name": uploaded.name, "bytes": uploaded.getvalue(), "type": uploaded.type}
            for uploaded in uploaded_files
        ]

    photos = st.session_state["uploaded_photos"]
    st.caption(f"{len(photos)} photo{'s' if len(photos) != 1 else ''} selected")

    if photos:
        render_photo_grid(photos)

    if st.button("Continue", type="primary", disabled=len(photos) == 0):
        st.session_state["wizard_step"] = 2
        st.rerun()


# --- Step 2: Property & Agent Details ---

elif step == 2:
    st.subheader("Step 2 — Property & Agent Details")

    agent_mode = st.radio(
        "Agent",
        ["Select existing agent", "Create new agent"],
        horizontal=True,
        key="agent_mode",
    )

    agents = db_service.list_agents()

    if agent_mode == "Create new agent":
        upload_col1, upload_col2 = st.columns(2)
        with upload_col1:
            agent_photo_upload = st.file_uploader(
                "Agent photo",
                type=["jpg", "jpeg", "png", "webp"],
                key="agent_photo_upload",
            )
        with upload_col2:
            agent_logo_upload = st.file_uploader(
                "Agent logo",
                type=["jpg", "jpeg", "png", "webp"],
                key="agent_logo_upload",
            )
        if agent_photo_upload:
            st.session_state["new_agent_photo_data"] = {
                "name": agent_photo_upload.name,
                "bytes": agent_photo_upload.getvalue(),
            }
        if agent_logo_upload:
            st.session_state["new_agent_logo_data"] = {
                "name": agent_logo_upload.name,
                "bytes": agent_logo_upload.getvalue(),
            }

    with st.form("step2_form"):
        left_col, right_col = st.columns(2)

        with left_col:
            st.markdown("**Property Details**")
            property_name = st.text_input(
                "Property name *",
                value=st.session_state["property_name"],
                placeholder="123 Main St",
            )
            beds = st.number_input("Bedrooms", min_value=0, value=st.session_state["beds"])
            baths = st.number_input("Bathrooms", min_value=0, value=st.session_state["baths"])
            sqft = st.number_input("Square feet", min_value=0, value=st.session_state["sqft"])
            listing_price = st.number_input(
                "Listing price ($)",
                min_value=0.0,
                value=float(st.session_state["listing_price"]),
                step=1000.0,
                format="%.0f",
            )

        with right_col:
            st.markdown("**Agent Details**")
            selected_agent_id = st.session_state["selected_agent_id"]

            if agent_mode == "Select existing agent":
                if agents:
                    agent_labels = {
                        f"{agent.name} ({agent.email or 'no email'})": agent.id for agent in agents
                    }
                    default_index = 0
                    if selected_agent_id in agent_labels.values():
                        default_index = list(agent_labels.values()).index(selected_agent_id)
                    selected_label = st.selectbox(
                        "Choose agent",
                        options=list(agent_labels.keys()),
                        index=default_index,
                    )
                    selected_agent_id = agent_labels[selected_label]
                else:
                    st.warning("No agents found. Switch to **Create new agent**.")
            else:
                new_agent_name = st.text_input(
                    "Agent name *",
                    value=st.session_state["new_agent_name"],
                )
                new_agent_phone = st.text_input(
                    "Phone",
                    value=st.session_state["new_agent_phone"],
                )
                new_agent_email = st.text_input(
                    "Email",
                    value=st.session_state["new_agent_email"],
                )

        btn_back, btn_continue = st.columns(2)
        with btn_back:
            back = st.form_submit_button("Back")
        with btn_continue:
            continue_btn = st.form_submit_button("Continue", type="primary")

    if back:
        st.session_state["wizard_step"] = 1
        st.rerun()

    if continue_btn:
        errors = []
        if not property_name.strip():
            errors.append("Property name is required.")

        if agent_mode == "Select existing agent":
            if not agents:
                errors.append("Create a new agent or add an agent to the database first.")
        elif not new_agent_name.strip():
            errors.append("Agent name is required.")

        if errors:
            for error in errors:
                st.error(error)
        else:
            st.session_state.update(
                {
                    "property_name": property_name.strip(),
                    "beds": beds,
                    "baths": baths,
                    "sqft": sqft,
                    "listing_price": listing_price,
                    "selected_agent_id": selected_agent_id if agent_mode == "Select existing agent" else None,
                    "new_agent_name": new_agent_name.strip() if agent_mode == "Create new agent" else "",
                    "new_agent_phone": new_agent_phone if agent_mode == "Create new agent" else "",
                    "new_agent_email": new_agent_email if agent_mode == "Create new agent" else "",
                }
            )
            st.session_state["wizard_step"] = 3
            st.rerun()


# --- Step 3: Video Style ---

elif step == 3:
    st.subheader("Step 3 — Video Style")

    music_options = list_music_tracks()
    if st.session_state["music_track"] not in music_options:
        st.session_state["music_track"] = "None"

    st.markdown("**Intro Template**")
    selected_intro = st.session_state.get("intro_template", "A")
    with st.spinner("Loading intro template previews..."):
        intro_thumbnails = load_intro_thumbnails()
    template_ids = list(TEMPLATE_NAMES.keys())

    for row_start in range(0, len(template_ids), 5):
        cols = st.columns(5)
        for col, template_id in zip(cols, template_ids[row_start : row_start + 5]):
            with col:
                if template_id == selected_intro:
                    st.markdown("**Selected**")
                st.image(str(intro_thumbnails[template_id]), use_container_width=True)
                st.caption(f"{template_id} - {TEMPLATE_NAMES[template_id]}")
                if st.button("Select", key=f"intro_select_{template_id}", use_container_width=True):
                    st.session_state["intro_template"] = template_id
                    st.rerun()

    st.markdown("**Outro Template**")
    selected_outro = st.session_state.get("outro_template", "1")
    with st.spinner("Loading outro template previews..."):
        outro_thumbnails = load_outro_thumbnails()
    outro_template_ids = list(OUTRO_TEMPLATE_NAMES.keys())

    for row_start in range(0, len(outro_template_ids), 5):
        cols = st.columns(5)
        for col, template_id in zip(cols, outro_template_ids[row_start : row_start + 5]):
            with col:
                if template_id == selected_outro:
                    st.markdown("**Selected**")
                st.image(str(outro_thumbnails[template_id]), use_container_width=True)
                st.caption(f"{template_id} - {OUTRO_TEMPLATE_NAMES[template_id]}")
                if st.button("Select", key=f"outro_select_{template_id}", use_container_width=True):
                    st.session_state["outro_template"] = template_id
                    st.rerun()

    with st.form("step3_form"):
        style_left, style_right = st.columns(2)

        with style_left:
            st.write(f"Selected intro: **{selected_intro} - {TEMPLATE_NAMES.get(selected_intro, selected_intro)}**")
            st.write(
                f"Selected outro: **{selected_outro} - {OUTRO_TEMPLATE_NAMES.get(selected_outro, selected_outro)}**"
            )
            animation_style = st.selectbox(
                "Animation style",
                ANIMATION_STYLES,
                index=ANIMATION_STYLES.index(st.session_state["animation_style"]),
            )

        with style_right:
            music_track = st.selectbox(
                "Music",
                music_options,
                index=music_options.index(st.session_state["music_track"]),
            )
            music_volume = st.slider(
                "Music volume",
                min_value=0,
                max_value=100,
                value=st.session_state["music_volume"],
            )
            photo_duration = st.slider(
                "Photo duration (seconds)",
                min_value=2.0,
                max_value=8.0,
                value=float(st.session_state["photo_duration"]),
                step=0.5,
            )

        btn_back, btn_create = st.columns(2)
        with btn_back:
            back = st.form_submit_button("Back")
        with btn_create:
            create_project = st.form_submit_button("Create Project", type="primary")

    if back:
        st.session_state["wizard_step"] = 2
        st.rerun()

    if create_project:
        st.session_state.update(
            {
                "intro_template": st.session_state.get("intro_template", "A"),
                "outro_template": st.session_state.get("outro_template", "1"),
                "animation_style": animation_style,
                "music_track": music_track,
                "music_volume": music_volume,
                "photo_duration": photo_duration,
            }
        )

        agent_id = st.session_state["selected_agent_id"]
        if st.session_state["agent_mode"] == "Create new agent":
            agent = db_service.create_agent(
                name=st.session_state["new_agent_name"],
                phone=st.session_state["new_agent_phone"],
                email=st.session_state["new_agent_email"],
            )
            agent_id = agent.id
            photo_path = save_agent_asset(agent_id, st.session_state["new_agent_photo_data"])
            logo_path = save_agent_asset(agent_id, st.session_state["new_agent_logo_data"])
            if photo_path or logo_path:
                db_service.update_agent(agent_id, photo_path=photo_path, logo_path=logo_path)

        music_value = None if st.session_state["music_track"] == "None" else st.session_state["music_track"]

        project = db_service.create_project(
            name=st.session_state["property_name"],
            beds=st.session_state["beds"],
            baths=st.session_state["baths"],
            sqft=st.session_state["sqft"],
            listing_price=st.session_state["listing_price"],
            agent_id=agent_id,
            status="processing",
            intro_template=st.session_state["intro_template"],
            outro_template=st.session_state["outro_template"],
            animation_style=st.session_state["animation_style"],
            music_track=music_value,
            music_volume=st.session_state["music_volume"] / 100,
            photo_duration=st.session_state["photo_duration"],
        )

        save_project_photos(project.id, st.session_state["uploaded_photos"])

        st.session_state["current_project_id"] = project.id

        with st.status("Processing photos with AI...", expanded=True) as status:
            progress_bar = st.progress(0, text="Starting classification...")

            def on_progress(current: int, total: int, photo_name: str) -> None:
                st.write(f"Classifying: {photo_name}...")
                progress_bar.progress(current / total, text=f"Photo {current} of {total}")

            ai_classifier.classify_and_sequence_project(
                project.id,
                progress_callback=on_progress,
            )
            status.update(label="AI classification complete!", state="complete")

        clear_wizard_state()
        st.success("Project created! Photos have been classified and sequenced.")
        st.switch_page("pages/3_Review.py")
