# app.py
import streamlit as st

from gcp_assets import (
    GCP_LIBS_AVAILABLE,
    get_gcp_client,
    fetch_assets_live,
    assets_to_dataframe,
)
from graph_builder import (
    build_graph_data,
    export_graph_to_js,
    CATEGORY_COLORS,
    STATUS_BORDERS,
)


st.set_page_config(page_title="✨ GCP Live Architecture Visualizer", layout="wide")
st.title("✨ GCP Live Architecture Visualizer — Holori-style (No DB)")
st.write(
    "This tool connects **live to GCP** using Cloud Asset Inventory and builds an "
    "interactive architecture diagram. Everything runs in memory — no database. "
    "The interactive map itself is rendered via a local `index.html` + JS viewer."
)

# --------------------------
# Sidebar Controls
# --------------------------

with st.sidebar:
    st.header("⚙️ GCP Connection")

    if not GCP_LIBS_AVAILABLE:
        st.warning(
            "Install required libraries:\n\n"
            "`pip install google-cloud-asset google-auth`"
        )

    auth_mode = st.radio(
        "Authentication mode",
        ["Service Account JSON", "Application Default Credentials"],
    )

    sa_file = None
    if auth_mode == "Service Account JSON":
        sa_file = st.file_uploader("Service Account key (JSON)", type=["json"])

    st.markdown("---")

    scope = st.text_input(
        "Scope (parent)",
        value="organizations/123456789",
        help="Examples: organizations/123456789, folders/456789, projects/my-project-id",
    )

    max_assets = st.slider(
        "Max assets to fetch (safety limit)",
        min_value=100,
        max_value=10000,
        value=2000,
        step=100,
        help="Prevents accidentally pulling an entire org with 100k+ resources.",
    )

    st.markdown("**Asset types (optional filter)**")
    common_types = [
        "compute.googleapis.com/Instance",
        "compute.googleapis.com/Network",
        "compute.googleapis.com/Subnetwork",
        "compute.googleapis.com/Firewall",
        "storage.googleapis.com/Bucket",
        "iam.googleapis.com/ServiceAccount",
    ]
    use_common_filter = st.checkbox(
        "Limit to common infra types (recommended)",
        value=True,
    )
    selected_types = []
    if use_common_filter:
        selected_types = st.multiselect(
            "Common asset types",
            common_types,
            default=common_types,
        )

    st.markdown("---")
    st.header("🎛️ Visualization")

    use_icons = st.checkbox(
        "Use local GCP icons (from ./icons)",
        value=True,
        help="Use icons for common services; falls back to colored boxes in the viewer.",
    )

    group_mode = st.selectbox(
        "Grouping Mode",
        ["Scope → Project → Resource", "Project → Resource Type"],
    )
    limit_nodes_per_project = st.slider(
        "Max asset rows per project (for sampling)",
        10,
        1000,
        200,
    )
    max_resources_per_type = st.slider(
        "Max resources per type (per project)",
        5,
        80,
        20,
        help="Caps how many individual resources are drawn under each type to avoid huge lines.",
    )

    st.markdown("---")
    st.markdown("**Legend — Categories**")
    for cat, col in CATEGORY_COLORS.items():
        st.markdown(
            f'<div style="display:flex;align-items:center;margin-bottom:4px;">'
            f'<div style="width:14px;height:14px;border-radius:3px;'
            f'background:{col};margin-right:6px;border:1px solid #aaa;"></div>'
            f'<span style="font-size:13px;">{cat}</span></div>',
            unsafe_allow_html=True,
        )

    st.markdown("**Legend — Status border**")
    for status_name, col in STATUS_BORDERS.items():
        st.markdown(
            f'<div style="display:flex;align-items:center;margin-bottom:4px;">'
            f'<div style="width:14px;height:14px;border-radius:3px;'
            f'border:2px solid {col};margin-right:6px;"></div>'
            f'<span style="font-size:13px;">{status_name}</span></div>',
            unsafe_allow_html=True,
        )

fetch_button = st.button("🚀 Fetch & Export Graph Data")

if not fetch_button:
    st.info(
        "Configure the connection & click **Fetch & Export Graph Data**.\n\n"
        "Then open `index.html` in this folder to view the interactive map."
    )
    st.stop()

if not scope:
    st.error("Please provide a valid scope (e.g. organizations/123456789).")
    st.stop()

if not GCP_LIBS_AVAILABLE:
    st.error("google-cloud-asset / google-auth not available. Install them and restart.")
    st.stop()

# --------------------------
# Fetch Assets Live
# --------------------------

client = get_gcp_client(auth_mode, sa_file, st)

assets = fetch_assets_live(
    scope=scope,
    client=client,
    asset_types=selected_types if use_common_filter else [],
    max_assets=max_assets,
    st=st,
)

if not assets:
    st.warning("No assets returned from Cloud Asset Inventory with this configuration.")
    st.stop()

df = assets_to_dataframe(assets)

projects = sorted(df["Project Id"].unique().tolist())
st.success(f"Fetched **{len(df)}** assets across **{len(projects)}** projects.")

selected_projects = st.multiselect(
    "Filter projects for visualization",
    projects,
    default=projects,
)

df_vis = df[df["Project Id"].isin(selected_projects)].copy()

st.caption(f"Visualizing {len(df_vis)} assets after project filter.")

with st.expander("📄 Show raw asset table"):
    st.dataframe(df_vis)

# --------------------------
# Build graph & export JS
# --------------------------

nodes, edges = build_graph_data(
    df_vis=df_vis,
    scope=scope,
    group_mode=group_mode,
    limit_nodes_per_project=limit_nodes_per_project,
    max_resources_per_type=max_resources_per_type,
    use_icons=use_icons,
)

js_path = export_graph_to_js(nodes, edges, "graphData.js")

st.success(
    f"Graph data exported to `{js_path}`.\n\n"
    "Now open **`index.html`** (in the same WAR-TOOL folder) in your browser to see the interactive diagram."
)

st.code(
    "cd /Users/priyanshityagi/Documents/Work/GCP/WAR-TOOL\n"
    "open index.html    # or double-click index.html in Finder",
    language="bash",
)
