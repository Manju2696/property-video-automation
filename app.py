import streamlit as st

from config import APP_PASSWORD
from database import init_db

st.set_page_config(
    page_title="Property Video Automation",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded",
)

if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False

if not st.session_state["authenticated"]:
    st.markdown(
        "<style>[data-testid='stSidebar']{display:none;}</style>",
        unsafe_allow_html=True,
    )

    _, center_col, _ = st.columns([1, 1, 1])
    with center_col:
        st.title("🏠 Property Video Pro")
        st.text_input("Enter Password", type="password", key="password_input")

        if st.button("Login", type="primary", use_container_width=True):
            if st.session_state.get("password_input") == APP_PASSWORD:
                st.session_state["authenticated"] = True
                st.rerun()
            else:
                st.error("Incorrect password")

    st.stop()

init_db()

st.success("Welcome to Property Video Pro!")
nav_col1, nav_col2 = st.columns(2)
with nav_col1:
    if st.button("Go to Dashboard", type="primary", use_container_width=True):
        st.switch_page("pages/1_Dashboard.py")
with nav_col2:
    if st.button("Create New Project", use_container_width=True):
        st.session_state["reset_wizard"] = True
        st.switch_page("pages/2_New_Project.py")

st.markdown("---")

st.markdown(
    """
    <style>
    .hero {
        text-align: center;
        padding: 4rem 2rem;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border-radius: 16px;
        margin-bottom: 2rem;
    }
    .hero h1 {
        color: #ffffff;
        font-size: 2.8rem;
        margin-bottom: 1rem;
    }
    .hero p {
        color: #e0e0e0;
        font-size: 1.25rem;
        max-width: 600px;
        margin: 0 auto 2rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="hero">
        <h1>Turn Listing Photos into Stunning Videos</h1>
        <p>
            Upload property photos, let AI classify rooms and sequence them,
            then export polished listing videos in minutes.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.markdown("---")

st.subheader("How it works")
step1, step2, step3, step4 = st.columns(4)

with step1:
    st.markdown("**1. Upload**")
    st.caption("Add listing photos and property details.")

with step2:
    st.markdown("**2. Classify**")
    st.caption("AI identifies room types and suggests order.")

with step3:
    st.markdown("**3. Review**")
    st.caption("Preview transitions, music, and overlays.")

with step4:
    st.markdown("**4. Export**")
    st.caption("Download a ready-to-share listing video.")
