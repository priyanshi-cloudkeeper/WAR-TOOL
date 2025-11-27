# gcp_assets.py
import json
import re
from typing import List

import pandas as pd

try:
    from google.cloud import asset_v1
    from google.oauth2 import service_account
    import google.auth

    GCP_LIBS_AVAILABLE = True
except ImportError:
    GCP_LIBS_AVAILABLE = False


def _parse_project_id_from_name(full_name: str):
    """
    Try to extract project ID from full resource name, e.g.
    //compute.googleapis.com/projects/my-project/zones/...
    """
    if not isinstance(full_name, str):
        return None
    m = re.search(r"projects/([^/]+)", full_name)
    return m.group(1) if m else None


def get_gcp_client(auth_mode: str, sa_file, st) -> "asset_v1.AssetServiceClient":
    """
    Return an AssetServiceClient using the chosen auth mode.
    We pass `st` so we can show nice Streamlit errors and stop the app.
    """
    if not GCP_LIBS_AVAILABLE:
        st.error(
            "google-cloud-asset / google-auth not installed. "
            "Run: `pip install google-cloud-asset google-auth`"
        )
        st.stop()

    if auth_mode == "Service Account JSON":
        if not sa_file:
            st.error("Please upload a Service Account JSON file.")
            st.stop()
        try:
            info = json.loads(sa_file.read().decode("utf-8"))
            creds = service_account.Credentials.from_service_account_info(info)
        except Exception as e:
            st.error(f"Failed to parse Service Account JSON: {e}")
            st.stop()
        client = asset_v1.AssetServiceClient(credentials=creds)
    else:  # Application Default Credentials
        try:
            creds, _ = google.auth.default()
            client = asset_v1.AssetServiceClient(credentials=creds)
        except Exception as e:
            st.error(f"Failed to use Application Default Credentials: {e}")
            st.stop()

    return client


def fetch_assets_live(
    scope: str,
    client: "asset_v1.AssetServiceClient",
    asset_types: List[str],
    max_assets: int,
    st,
):
    """
    Call Cloud Asset Inventory ListAssets API and return a list of assets.
    scope: e.g. 'organizations/123456789', 'projects/my-project', 'folders/456789'
    asset_types: list of strings, or empty list for all types
    """
    request = asset_v1.ListAssetsRequest(
        parent=scope,
        content_type=asset_v1.ContentType.RESOURCE,
        asset_types=asset_types or [],
    )

    assets = []
    try:
        for asset in client.list_assets(request=request):
            assets.append(asset)
            if len(assets) >= max_assets:
                break
    except Exception as e:
        st.error(f"Error while fetching assets from GCP: {e}")
        st.stop()

    return assets


def assets_to_dataframe(assets) -> pd.DataFrame:
    """
    Convert Cloud Asset protos into a flat DataFrame.
    Columns used later:
      - Full name
      - Display name
      - Asset type
      - Project Id
      - Location
    """

    rows = []
    for asset in assets:
        name = asset.name
        asset_type = asset.asset_type
        project_id = _parse_project_id_from_name(name)

        resource = getattr(asset, "resource", None)
        location = None
        data = {}

        if resource is not None:
            location = getattr(resource, "location", None)
            try:
                data = dict(resource.data)
            except Exception:
                data = {}

        display_name = (
            data.get("displayName")
            or data.get("name")
            or name.split("/")[-1]
        )

        rows.append(
            {
                "Full name": name,
                "Display name": str(display_name),
                "Asset type": asset_type,
                "Project Id": project_id or "(no-project)",
                "Location": location or "(global/unknown)",
            }
        )

    df = pd.DataFrame(rows)
    return df
