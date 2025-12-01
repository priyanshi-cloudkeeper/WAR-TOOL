# app.py
import base64
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

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
    "The interactive map itself is rendered via your local `index.html` + JS viewer, "
    "embedded directly below."
)


def inline_icon_images_in_js(js_text: str, base_dir: Path) -> str:
    """
    Find all `"image": "icons/XYZ.png"` entries in the JS and replace them
    with inline base64 data URLs so they work inside the Streamlit iframe.
    """
    pattern = r'"image"\s*:\s*"([^"]+)"'
    matches = set(re.findall(pattern, js_text))

    for rel_path in matches:
        # Only touch things under icons/
        if not rel_path.startswith("icons/"):
            continue

        img_path = (base_dir / rel_path).resolve()

        if not img_path.exists():
            # If an icon is missing, just skip it; the node will fall back
            # to the default box style.
            continue

        try:
            with open(img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
            data_uri = f"data:image/png;base64,{b64}"
            js_text = js_text.replace(
                f'"image": "{rel_path}"', f'"image": "{data_uri}"'
            )
        except Exception:
            # On any error, skip this icon and leave the original path
            continue

    return js_text


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
        "The interactive map will appear below using your existing `index.html` UI."
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
    "Loading the interactive diagram below using your existing `index.html` + `network.js`, "
    "with local icons inlined so they work inside Streamlit."
)

# --------------------------
# Embed existing index.html in Streamlit
# --------------------------
base_dir = Path(__file__).parent

index_html_path = base_dir / "index.html"
graph_js_path = base_dir / "graphData.js"
network_js_path = base_dir / "network.js"

try:
    index_html = index_html_path.read_text(encoding="utf-8")
    graph_js = graph_js_path.read_text(encoding="utf-8")
    network_js = network_js_path.read_text(encoding="utf-8")

    # Inline icons as base64 in graphData.js
    graph_js = inline_icon_images_in_js(graph_js, base_dir)

    # Inline the two local scripts so the browser doesn't have to fetch files from disk
    index_html = index_html.replace(
        '<script src="graphData.js"></script>',
        f"<script>\n{graph_js}\n</script>",
    )
    index_html = index_html.replace(
        '<script src="network.js"></script>',
        f"<script>\n{network_js}\n</script>",
    )

    # Render the full HTML (all your styling & controls preserved)
    components.html(index_html, height=800, scrolling=True)

except Exception as e:
    st.error(f"Failed to load local HTML/JS viewer: {e}")
    st.info(
        "If needed, you can still open `index.html` manually in the project folder "
        "to debug the static viewer."
    )
