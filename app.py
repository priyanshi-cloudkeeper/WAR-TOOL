# # app.py
# import base64
# import re
# from pathlib import Path
# import os
# import streamlit as st
# import streamlit.components.v1 as components

# from gcp_assets import (
#     GCP_LIBS_AVAILABLE,
#     get_gcp_client,
#     fetch_assets_live,
#     assets_to_dataframe,
# )
# from graph_builder import (
#     build_graph_data,
#     export_graph_to_js,
#     CATEGORY_COLORS,
#     STATUS_BORDERS,
# )


# st.set_page_config(page_title="✨ GCP Live Architecture Visualizer", layout="wide")
# st.title("✨ GCP Live Architecture Visualizer")
# st.write(
#     "This tool connects **live to GCP** using Cloud Asset Inventory"

# )

# def inline_icon_images_in_js(js_text: str, base_dir: Path) -> str:
#     """
#     Find all `"image": "icons/XYZ.png"` entries in the JS and replace them
#     with inline base64 data URLs so they work inside the Streamlit iframe.
#     """
#     pattern = r'"image"\s*:\s*"([^"]+)"'
#     matches = set(re.findall(pattern, js_text))

#     for rel_path in matches:
#         # Only touch things under icons/
#         if not rel_path.startswith("icons/"):
#             continue

#         img_path = (base_dir / rel_path).resolve()

#         if not img_path.exists():
#             # If an icon is missing, just skip it; the node will fall back
#             # to the default box style.
#             continue

#         try:
#             with open(img_path, "rb") as f:
#                 b64 = base64.b64encode(f.read()).decode("ascii")
#             data_uri = f"data:image/png;base64,{b64}"
#             js_text = js_text.replace(
#                 f'"image": "{rel_path}"', f'"image": "{data_uri}"'
#             )
#         except Exception:
#             # On any error, skip this icon and leave the original path
#             continue

#     return js_text


# # --------------------------
# # Sidebar Controls
# # --------------------------

# with st.sidebar:
#     st.header("⚙️ GCP Connection")

#     if not GCP_LIBS_AVAILABLE:
#         st.warning(
#             "Install required libraries:\n\n"
#             "`pip install google-cloud-asset google-auth`"
#         )

#     auth_mode = st.radio(
#         "Authentication mode",
#         ["Service Account JSON", "Application Default Credentials"],
#     )

#     sa_file = None
#     if auth_mode == "Service Account JSON":
#         sa_file = st.file_uploader("Service Account key (JSON)", type=["json"])

#     st.markdown("---")

#     scope = st.text_input(
#         "Scope (parent)",
#         value="organizations/org-id",
#         help="Examples: organizations/org-id, folders/folder-id, projects/my-project-id",
#     )

#     max_assets = st.slider(
#         "Max assets to fetch (safety limit)",
#         min_value=100,
#         max_value=10000,
#         value=2000,
#         step=100,
#         help="Prevents accidentally pulling an entire org with 100k+ resources.",
#     )

#     st.markdown("**Asset types (optional filter)**")
#     common_types = [
#         "compute.googleapis.com/Instance",
#         "compute.googleapis.com/Network",
#         "compute.googleapis.com/Subnetwork",
#         "compute.googleapis.com/Firewall",
#         "storage.googleapis.com/Bucket",
#         "iam.googleapis.com/ServiceAccount",
#     ]
#     use_common_filter = st.checkbox(
#         "Limit to common infra types (recommended)",
#         value=True,
#     )
#     selected_types = []
#     if use_common_filter:
#         selected_types = st.multiselect(
#             "Common asset types",
#             common_types,
#             default=common_types,
#         )

#     st.markdown("---")
#     st.header("🎛️ Visualization")

#     use_icons = st.checkbox(
#         "Use local GCP icons (from ./icons)",
#         value=True,
#         help="Use icons for common services; falls back to colored boxes in the viewer.",
#     )

#     group_mode = st.selectbox(
#         "Grouping Mode",
#         ["Scope → Project → Resource", "Project → Resource Type"],
#     )
#     limit_nodes_per_project = st.slider(
#         "Max asset rows per project (for sampling)",
#         10,
#         1000,
#         200,
#     )
#     max_resources_per_type = st.slider(
#         "Max resources per type (per project)",
#         5,
#         80,
#         20,
#         help="Caps how many individual resources are drawn under each type to avoid huge lines.",
#     )

#     st.markdown("---")

# fetch_button = st.button("Fetch & Export Graph Data")

# if not fetch_button:
#     st.info(
#         "Configure the connection & click **Fetch & Export Graph Data**.\n\n"
#         "The interactive map will appear below using your existing `index.html` UI."
#     )
#     st.stop()

# if not scope:
#     st.error("Please provide a valid scope (e.g. organizations/123456789).")
#     st.stop()

# if not GCP_LIBS_AVAILABLE:
#     st.error("google-cloud-asset / google-auth not available. Install them and restart.")
#     st.stop()

# # --------------------------
# # Fetch Assets Live
# # --------------------------

# client = get_gcp_client(auth_mode, sa_file, st)

# assets = fetch_assets_live(
#     scope=scope,
#     client=client,
#     asset_types=selected_types if use_common_filter else [],
#     max_assets=max_assets,
#     st=st,
# )

# if not assets:
#     st.warning("No assets returned from Cloud Asset Inventory with this configuration.")
#     st.stop()

# df = assets_to_dataframe(assets)

# projects = sorted(df["Project Id"].unique().tolist())
# st.success(f"Fetched **{len(df)}** assets across **{len(projects)}** projects.")

# selected_projects = st.multiselect(
#     "Filter projects for visualization",
#     projects,
#     default=projects,
# )

# df_vis = df[df["Project Id"].isin(selected_projects)].copy()

# st.caption(f"Visualizing {len(df_vis)} assets after project filter.")

# with st.expander("📄 Show raw asset table"):
#     st.dataframe(df_vis)

# # --------------------------
# # Build graph & export JS
# # --------------------------

# nodes, edges = build_graph_data(
#     df_vis=df_vis,
#     scope=scope,
#     group_mode=group_mode,
#     limit_nodes_per_project=limit_nodes_per_project,
#     max_resources_per_type=max_resources_per_type,
#     use_icons=use_icons,
# )

# js_path = export_graph_to_js(nodes, edges, "graphData.js")

# # st.success(
# #     f"Graph data exported to `{js_path}`.\n\n"
# #     "Loading the interactive diagram below using your existing `index.html` + `network.js`, "
# #     "with local icons inlined so they work inside Streamlit."
# # )

# # --------------------------
# # Embed existing index.html in Streamlit
# # --------------------------
# base_dir = Path(__file__).parent

# index_html_path = base_dir / "index.html"
# graph_js_path = base_dir / "graphData.js"
# network_js_path = base_dir / "network.js"

# try:
#     index_html = index_html_path.read_text(encoding="utf-8")
#     graph_js = graph_js_path.read_text(encoding="utf-8")
#     network_js = network_js_path.read_text(encoding="utf-8")

#     # Inline icons as base64 in graphData.js
#     graph_js = inline_icon_images_in_js(graph_js, base_dir)

#     # Inline the two local scripts so the browser doesn't have to fetch files from disk
#     index_html = index_html.replace(
#         '<script src="graphData.js"></script>',
#         f"<script>\n{graph_js}\n</script>",
#     )
#     index_html = index_html.replace(
#         '<script src="network.js"></script>',
#         f"<script>\n{network_js}\n</script>",
#     )

#     # Render the full HTML (all your styling & controls preserved)
#     components.html(index_html, height=800, scrolling=True)

# except Exception as e:
#     st.error(f"Failed to load local HTML/JS viewer: {e}")
#     # st.info(
#     #     "If needed, you can still open `index.html` manually in the project folder "
#     #     "to debug the static viewer."
#     # )
# # if __name__ == "__main__":
# #     # Cloud Run injects the PORT variable. Default to 8080 for local.
# #     port = int(os.environ.get("PORT", 8181))
# #     app.run(host="0.0.0.0", port=port)

import base64
import re
import json
import os
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

from gcp_assets import (
    GCP_LIBS_AVAILABLE,
    get_gcp_client,
    fetch_assets_live,
    assets_to_dataframe,
)
from graph_builder import build_graph_data

# --------------------------
# Page Configuration
# --------------------------
st.set_page_config(
    page_title="✨ GCP Live Architecture Visualizer",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("✨ GCP Live Architecture Visualizer New")
st.markdown("This tool connects **live to GCP** using Cloud Asset Inventory to visualize your infrastructure.")

# --------------------------
# Session State Initialization
# --------------------------
if "master_df" not in st.session_state:
    st.session_state.master_df = None
if "scope" not in st.session_state:
    st.session_state.scope = ""

# --------------------------
# Helper Functions
# --------------------------
def inline_icon_images_in_js(js_text: str, base_dir: Path) -> str:
    """
    Find all "image": "icons/XYZ.png" entries in the JS and replace them
    with inline base64 data URLs so they work inside the Streamlit iframe.
    """
    pattern = r'"image"\s*:\s*"([^"]+)"'
    matches = set(re.findall(pattern, js_text))

    for rel_path in matches:
        if not rel_path.startswith("icons/"):
            continue

        img_path = (base_dir / rel_path).resolve()
        if not img_path.exists():
            continue

        try:
            with open(img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
            data_uri = f"data:image/png;base64,{b64}"
            js_text = js_text.replace(f'"{rel_path}"', f'"{data_uri}"')
        except Exception:
            continue

    return js_text

# --------------------------
# Sidebar: Controls
# --------------------------
with st.sidebar:
    st.header("⚙️ 1. GCP Connection")

    if not GCP_LIBS_AVAILABLE:
        st.warning("`google-cloud-asset` library not found. Please install it.")

    # Auth Configuration
    auth_mode = st.radio(
        "Authentication mode",
        ["Service Account JSON", "Application Default Credentials"],
    )

    sa_file = None
    if auth_mode == "Service Account JSON":
        sa_file = st.file_uploader("Service Account key (JSON)", type=["json"])

    scope_input = st.text_input(
        "Scope (parent)",
        value="organizations/123456789",
        help="Examples: organizations/org-id, folders/folder-id, projects/my-project-id",
    )

    # Fetch Controls
    with st.expander("Fetch Settings", expanded=False):
        max_assets = st.slider("Max assets limit", 100, 10000, 2000, 100)
        use_common_filter = st.checkbox("Limit to common infra types", value=True)
        
        common_types = [
            "compute.googleapis.com/Instance",
            "compute.googleapis.com/Network",
            "compute.googleapis.com/Subnetwork",
            "compute.googleapis.com/Firewall",
            "storage.googleapis.com/Bucket",
            "iam.googleapis.com/ServiceAccount",
            "container.googleapis.com/Cluster",
            "sqladmin.googleapis.com/Instance"
        ]
        
        selected_types = []
        if use_common_filter:
            selected_types = st.multiselect("Asset Types", common_types, default=common_types)

    # Fetch Action
    fetch_clicked = st.button("🚀 Fetch Live Data", type="primary")

    st.markdown("---")
    
    # Visualization Controls (Always visible so you can tweak them)
    st.header("🎨 2. Visualization")
    
    use_icons = st.checkbox("Use local GCP icons", value=True)
    
    group_mode = st.selectbox(
        "Grouping Mode",
        ["Scope → Project → Resource", "Project → Resource Type"],
    )
    
    limit_nodes_per_project = st.slider("Max nodes per project", 10, 1000, 200)
    max_resources_per_type = st.slider("Max resources per type", 5, 80, 20)
    
    # Reset
    if st.session_state.master_df is not None:
        st.markdown("---")
        if st.button("Clear / Reset"):
            st.session_state.master_df = None
            st.rerun()

# --------------------------
# Logic: Fetch Data
# --------------------------
if fetch_clicked:
    if not scope_input:
        st.error("Please provide a valid scope.")
    elif not GCP_LIBS_AVAILABLE:
        st.error("GCP libraries missing.")
    else:
        with st.spinner("Connecting to Google Cloud..."):
            try:
                client = get_gcp_client(auth_mode, sa_file, st)
                assets = fetch_assets_live(
                    scope=scope_input,
                    client=client,
                    asset_types=selected_types if use_common_filter else [],
                    max_assets=max_assets,
                    st=st,
                )
                
                if not assets:
                    st.warning("No assets found.")
                else:
                    # Success: Store in Session State
                    df_new = assets_to_dataframe(assets)
                    st.session_state.master_df = df_new
                    st.session_state.scope = scope_input
                    st.success(f"Fetched {len(df_new)} assets!")
                    st.rerun() # Force a reload to refresh the UI state
            except Exception as e:
                st.error(f"Fetch failed: {str(e)}")

# --------------------------
# Logic: Main Visualization
# --------------------------

# If no data yet, show instructions
if st.session_state.master_df is None:
    st.info("👈 Configure authentication in the sidebar and click **Fetch Live Data** to start.")
    st.stop()

# If we have data, proceed to visualization
df = st.session_state.master_df
scope = st.session_state.scope

# 1. Project Filtering
all_projects = sorted(df["Project Id"].unique().tolist())
st.subheader("Filter View")

selected_projects = st.multiselect(
    "Select Projects to Visualize",
    options=all_projects,
    default=all_projects
)

if not selected_projects:
    st.warning("Please select at least one project.")
    st.stop()

# 2. Filter Data
df_vis = df[df["Project Id"].isin(selected_projects)].copy()
st.caption(f"Visualizing {len(df_vis)} assets across {len(selected_projects)} projects.")

# 3. Build Graph Data (In Memory)
nodes, edges = build_graph_data(
    df_vis=df_vis,
    scope=scope,
    group_mode=group_mode,
    limit_nodes_per_project=limit_nodes_per_project,
    max_resources_per_type=max_resources_per_type,
    use_icons=use_icons,
)

# 4. Prepare HTML/JS
base_dir = Path(__file__).parent
index_html_path = base_dir / "index.html"
network_js_path = base_dir / "network.js"

if not index_html_path.exists() or not network_js_path.exists():
    st.error("Missing index.html or network.js files.")
else:
    # Read templates
    index_html = index_html_path.read_text(encoding="utf-8")
    network_js = network_js_path.read_text(encoding="utf-8")

    # Generate the Data Script
    # We inject the nodes/edges directly into a script tag
    nodes_json = json.dumps(nodes)
    edges_json = json.dumps(edges)
    
    data_script = f"""
    const RAW_NODES = {nodes_json};
    const RAW_EDGES = {edges_json};
    """
    
    # Inline Icons (apply to the data script since it contains the "image" paths)
    data_script = inline_icon_images_in_js(data_script, base_dir)

    # 5. Inject into HTML
    # Replace graphData.js import with the raw data
    index_html = index_html.replace(
        '<script src="graphData.js"></script>', 
        f"<script>{data_script}</script>"
    )
    
    # Replace network.js import with the code
    index_html = index_html.replace(
        '<script src="network.js"></script>', 
        f"<script>{network_js}</script>"
    )

    # 6. Render
    components.html(index_html, height=850, scrolling=False)