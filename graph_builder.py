# graph_builder.py
import json
import re
from typing import List, Tuple, Dict

import pandas as pd

from icons import get_icon_for_asset_type


CATEGORY_COLORS = {
    "Compute": "#a5d8ff",
    "Storage": "#b2f2bb",
    "Networking": "#eebefa",
    "Security/IAM": "#ffa8a8",
    "Monitoring": "#ffd6e0",
    "Analytics": "#ffd8a8",
    "DevOps": "#ffe066",
    "Other": "#dee2e6",
}

STATUS_BORDERS = {
    "ENABLED": "#2f9e44",
    "ACTIVE": "#37b24d",
    "READY": "#f08c00",
    "RUNNING": "#228be6",
    "FAILED": "#e03131",
}


def clean_label(text: str) -> str:
    """Simplify long labels for readability."""
    if not isinstance(text, str):
        return str(text)
    text = re.sub(r"^projects/[^/]+/", "", text)
    text = text.replace("serviceAccounts/", "sa/")
    text = re.sub(r"@[^\s]+", "", text)
    text = text.replace("googleapis.com", "")
    text = text.replace("locations/", "")
    text = text.replace("repositories/", "repo/")
    return text[:60]


def classify_type(text: str) -> str:
    """Rough category based on asset type / resource type text."""
    text = str(text).lower()
    if any(k in text for k in ["compute", "instance", "vm", "gce"]):
        return "Compute"
    if any(k in text for k in ["storage", "bucket", "gcs"]):
        return "Storage"
    if any(k in text for k in ["network", "vpc", "route", "subnet", "firewall", "loadbalancer"]):
        return "Networking"
    if any(k in text for k in ["iam", "policy", "role", "serviceaccount", "kms"]):
        return "Security/IAM"
    if any(k in text for k in ["monitoring", "logging", "trace", "apm"]):
        return "Monitoring"
    if any(k in text for k in ["bigquery", "dataplex", "analytic", "dataflow", "dataproc"]):
        return "Analytics"
    if any(k in text for k in ["cloudbuild", "workflows", "deploy", "cicd", "clouddeploy"]):
        return "DevOps"
    return "Other"


def _create_scope_node(scope: str) -> Dict:
    return {
        "id": f"scope::{scope}",
        "label": f"Scope: {scope}",
        "title": f"GCP scope: {scope}",
        # shape & color chosen later by JS (via id prefix)
    }


def build_graph_data(
    df_vis: pd.DataFrame,
    scope: str,
    group_mode: str,
    limit_nodes_per_project: int,
    max_resources_per_type: int,
    use_icons: bool,
) -> Tuple[List[Dict], List[Dict]]:
    """
    Build vis-network-style nodes and edges.

    - group_mode:
        "Scope → Project → Resource"
        "Project → Resource Type"
    """
    nodes: List[Dict] = []
    edges: List[Dict] = []

    added_ids = set()

    # Root
    root_node = _create_scope_node(scope)
    nodes.append(root_node)
    added_ids.add(root_node["id"])

    for project in sorted(df_vis["Project Id"].unique()):
        proj_id = f"proj::{project}"
        if proj_id not in added_ids:
            nodes.append(
                {
                    "id": proj_id,
                    "label": project,
                    "title": f"Project: {project}",
                }
            )
            added_ids.add(proj_id)

        edges.append({"from": root_node["id"], "to": proj_id})

        subset = df_vis[df_vis["Project Id"] == project].head(limit_nodes_per_project)

        if group_mode == "Scope → Project → Resource":
            # Scope -> Project -> TYPE -> Resource
            for asset_type in sorted(subset["Asset type"].unique()):
                type_node_id = f"type::{project}::{asset_type}"
                if type_node_id not in added_ids:
                    short_type = asset_type.split("/")[-1]
                    nodes.append(
                        {
                            "id": type_node_id,
                            "label": clean_label(short_type),
                            "title": f"Type: {asset_type}<br>Project: {project}",
                        }
                    )
                    added_ids.add(type_node_id)

                edges.append({"from": proj_id, "to": type_node_id})

                type_subset = subset[subset["Asset type"] == asset_type]
                rows = type_subset.head(max_resources_per_type)
                extra = max(0, len(type_subset) - len(rows))

                # Concrete resource nodes (sampled)
                for _, row in rows.iterrows():
                    full_name = row["Full name"]
                    if full_name in added_ids:
                        continue

                    display = row["Display name"]
                    location = row["Location"]
                    label_text = f"{display} ({location})" if location else display
                    label_text = clean_label(label_text)

                    node = {
                        "id": full_name,
                        "label": label_text,
                        "title": (
                            f"{asset_type}<br>"
                            f"Project: {project}<br>"
                            f"Location: {location}<br>"
                            f"Full name: {full_name}"
                        ),
                        # extra fields used by JS panel
                        "assetType": asset_type,
                        "projectId": project,
                        "location": location,
                        "fullName": full_name,
                        "displayName": display,
                    }

                    if use_icons:
                        icon_path = get_icon_for_asset_type(asset_type)
                        if icon_path:
                            node["shape"] = "image"
                            node["image"] = icon_path

                    nodes.append(node)
                    added_ids.add(full_name)
                    edges.append({"from": type_node_id, "to": full_name})

                # Aggregated "+ N more" node with list of extra resources
                if extra > 0:
                    agg_id = f"agg::{project}::{asset_type}"
                    if agg_id not in added_ids:
                        # all rows beyond the sampled ones
                        extra_rows = type_subset.iloc[max_resources_per_type:]
                        extra_resources = []
                        for _, er in extra_rows.iterrows():
                            extra_resources.append(
                                {
                                    "displayName": er["Display name"],
                                    "fullName": er["Full name"],
                                    "location": er["Location"],
                                }
                            )

                        nodes.append(
                            {
                                "id": agg_id,
                                "label": f"+ {extra} more",
                                "title": (
                                    f"{extra} more {asset_type} resources in project {project}"
                                ),
                                # metadata for details panel
                                "assetType": asset_type,
                                "projectId": project,
                                "extraCount": extra,
                                "extraResources": extra_resources,
                            }
                        )
                        added_ids.add(agg_id)

                    edges.append({"from": type_node_id, "to": agg_id})

        else:  # "Project → Resource Type"
            for asset_type in sorted(subset["Asset type"].unique()):
                type_node_id = f"type::{project}::{asset_type}"
                if type_node_id not in added_ids:
                    short_type = asset_type.split("/")[-1]
                    nodes.append(
                        {
                            "id": type_node_id,
                            "label": clean_label(short_type),
                            "title": f"Type: {asset_type}<br>Project: {project}",
                        }
                    )
                    added_ids.add(type_node_id)

                edges.append({"from": proj_id, "to": type_node_id})

    return nodes, edges


def export_graph_to_js(
    nodes: List[Dict],
    edges: List[Dict],
    output_path: str = "graphData.js",
) -> str:
    """
    Writes the node and edge lists into a JS file that the front-end loads.
    """
    js = (
        "const RAW_NODES = "
        + json.dumps(nodes, indent=2)
        + ";\n\n"
        "const RAW_EDGES = "
        + json.dumps(edges, indent=2)
        + ";"
    )

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js)

    return output_path
