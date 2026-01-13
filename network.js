// network.js
// Global vis objects
let network;
let nodesDS;
let edgesDS;

// For tiered layout
let currentHorizontalSpacing = 160;

// Details panel DOM refs
let detailPanelEl;
let detailTitleEl;
let detailSubtitleEl;
let detailBodyEl;
let detailIconEl;
let detailCloseEl;

// Highlight state
let highlightedNodeId = null;

// -------------------------------
// Helper: classify nodes by id
// -------------------------------
function classifyNode(node) {
  const id = String(node.id);

  if (id.startsWith("scope::")) {
    return { level: 0, group: "scope" };
  }
  if (id.startsWith("proj::")) {
    return { level: 1, group: "project" };
  }
  if (id.startsWith("type::")) {
    return { level: 2, group: "type" };
  }
  if (id.startsWith("agg::")) {
    return { level: 3, group: "aggregate" };
  }
  // Everything else is a concrete resource
  return { level: 3, group: "resource" };
}

// -------------------------------
// Decorate nodes with level/group
// -------------------------------
function decorateNodes(rawNodes) {
  return rawNodes.map((n) => {
    const info = classifyNode(n);
    const base = { ...n };

    base.level = info.level;
    base.group = info.group;

    if (!base.font) base.font = {};
    base.font.face = base.font.face || "Inter";
    base.font.size = base.font.size || 11;

    // Add title tooltip (name + type)
    const dn = base.displayName || base.label || base.name || "";
    const at = base.assetType || "";
    if (!base.title) {
      base.title = dn || at ? `${dn || "(unnamed)"}\n${at}` : "";
    }

    // Subtle rounded boxes
    base.shapeProperties = base.shapeProperties || { borderRadius: 5 };

    // If an icon is present, respect it (image nodes)
    const hasImage = !!base.image;

    if (info.group === "scope" || info.group === "project") {
      base.shape = hasImage ? (base.shape || "image") : (base.shape || "box");
      base.size = base.size || 35;
      base.mass = base.mass || 5;
      base.color =
        base.color || {
          background: "#e7f1ff",
          border: "#4c6ef5",
          highlight: { background: "#d0e1ff", border: "#364fc7" },
        };
      base.margin = base.margin || 10;
      base.widthConstraint = base.widthConstraint || { minimum: 120, maximum: 220 };
      base.shadow = {
        enabled: true,
        size: 12,
        x: 0,
        y: 3,
        color: "rgba(76, 110, 245, 0.25)",
      };
    } else if (info.group === "type") {
      base.shape = hasImage ? (base.shape || "image") : (base.shape || "box");
      base.size = base.size || 30;
      base.mass = base.mass || 4;
      base.color =
        base.color || {
          background: "#fff4e6",
          border: "#f08c00",
          highlight: { background: "#ffe3bf", border: "#d9480f" },
        };
      base.margin = base.margin || 8;
      base.widthConstraint = base.widthConstraint || { minimum: 110, maximum: 200 };
      base.shadow = {
        enabled: true,
        size: 10,
        x: 0,
        y: 3,
        color: "rgba(240, 140, 0, 0.25)",
      };
    } else if (info.group === "aggregate") {
      base.shape = "box";
      base.size = base.size || 26;
      base.mass = base.mass || 3;
      base.color =
        base.color || {
          background: "#fff9db",
          border: "#f59f00",
          highlight: { background: "#fff3bf", border: "#e67700" },
        };
      base.font.size = base.font.size || 11;
      base.margin = base.margin || 6;
      base.widthConstraint = base.widthConstraint || { minimum: 100, maximum: 200 };
      base.shadow = {
        enabled: true,
        size: 8,
        x: 0,
        y: 2,
        color: "rgba(245, 159, 0, 0.25)",
      };
    } else {
      // resource instances
      base.shape = hasImage ? (base.shape || "image") : (base.shape || "box");
      base.size = base.size || (hasImage ? 32 : 24);
      base.mass = base.mass || 1.8;
      base.color =
        base.color || {
          background: "#e6f4ea",
          border: "#2f9e44",
          highlight: { background: "#d3f9d8", border: "#2b8a3e" },
        };
      base.margin = base.margin || 6;
      base.widthConstraint = base.widthConstraint || { minimum: 90, maximum: 180 };
      base.shadow = {
        enabled: true,
        size: 8,
        x: 0,
        y: 2,
        color: "rgba(46, 204, 113, 0.24)",
      };
    }

    // Keep a copy of original color for highlighting logic
    base._baseColor = base.color;

    return base;
  });
}

// -------------------------------
// Tiered layout (Holori-style)
// -------------------------------
function applyTieredLayout(spacingX = 160, spacingY = 140) {
  const levels = {};
  nodesDS.forEach((node) => {
    const level = node.level || 0;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node.id);
  });

  const levelKeys = Object.keys(levels)
    .map((x) => parseInt(x, 10))
    .sort((a, b) => a - b);

  const totalLevels = levelKeys.length;
  const middleIndex = (totalLevels - 1) / 2;

  levelKeys.forEach((level, levelIndex) => {
    const ids = levels[level];
    const y = (levelIndex - middleIndex) * spacingY;

    const count = ids.length;
    const totalWidth = (count - 1) * spacingX;

    ids.forEach((id, index) => {
      const x = index * spacingX - totalWidth / 2;
      nodesDS.update({
        id,
        x,
        y,
        physics: false,
        fixed: { x: true, y: true },
      });
    });
  });
}

// -------------------------------
// Force-directed layout
// -------------------------------
function enableForceLayout() {
  // Unfix positions so physics can move them
  nodesDS.forEach((node) => {
    if (node.fixed) {
      nodesDS.update({ id: node.id, fixed: false, physics: true });
    }
  });

  network.setOptions({
    layout: {
      hierarchical: {
        enabled: false,
      },
      improvedLayout: true,
    },
    physics: {
      enabled: true,
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -40,
        centralGravity: 0.02,
        springLength: 150,
        springConstant: 0.16,
        damping: 0.45,
        avoidOverlap: 0.7,
      },
      stabilization: {
        enabled: true,
        iterations: 300,
      },
      maxVelocity: 25,
      minVelocity: 0.5,
      timestep: 0.35,
    },
  });

  network.stabilize(300);
}

// -------------------------------
// Details panel helpers
// -------------------------------
function initDetailsPanel() {
  detailPanelEl = document.getElementById("node-detail-panel");
  detailTitleEl = document.getElementById("node-detail-title");
  detailSubtitleEl = document.getElementById("node-detail-subtitle");
  detailBodyEl = document.getElementById("node-detail-body");
  detailIconEl = document.getElementById("node-detail-icon");
  detailCloseEl = document.getElementById("node-detail-close");

  if (detailCloseEl && detailPanelEl) {
    detailCloseEl.addEventListener("click", () => {
      hideNodeDetails();
      clearActiveNodeHighlight();
    });
  }
}

function hideNodeDetails() {
  if (!detailPanelEl) return;
  detailPanelEl.style.display = "none";
}

// Helper to safely stringify labels object into chips HTML
function buildLabelsChips(labels) {
  if (!labels || typeof labels !== "object") return "";
  const entries = Object.entries(labels);
  if (!entries.length) return "";

  const chips = entries
    .slice(0, 15)
    .map(
      ([k, v]) =>
        `<span class="node-detail-chip">${k}: ${String(v)}</span>`
    )
    .join("");

  return chips
    ? `<div class="node-detail-section-title">Labels</div>
       <div class="node-detail-chip-row">${chips}</div>`
    : "";
}

// Helper for building a simple KV section
function buildKVSection(title, rows) {
  const htmlRows = rows
    .filter((r) => r && r.value)
    .map(
      (r) =>
        `<div class="node-detail-kv-row">
           <div class="node-detail-kv-label">${r.label}</div>
           <div class="node-detail-kv-value">${r.value}</div>
         </div>`
    )
    .join("");

  if (!htmlRows) return "";
  return `<div class="node-detail-section-title">${title}</div>${htmlRows}`;
}

// Main function to render details for either a resource or an aggregate node
function showNodeDetails(node) {
  if (!detailPanelEl || !detailTitleEl || !detailBodyEl) return;
  if (!node) return;

  const isAggregate = node.group === "aggregate";
  const meta = node.metadata || {};
  const labels = node.labels || meta.labels || {};
  const state = node.state || meta.state || meta.status;
  const shortType =
    (node.assetType || "").split("/").pop() ||
    (isAggregate ? "Resources" : "Resource");

  // Title & subtitle
  if (isAggregate) {
    detailTitleEl.textContent = `More ${shortType}`;
    detailSubtitleEl.textContent = node.projectId
      ? `Project: ${node.projectId}`
      : node.assetType || "";
  } else {
    const displayName =
      node.displayName || node.label || node.name || "Resource";
    detailTitleEl.textContent = displayName;
    detailSubtitleEl.textContent = node.assetType || "";
  }

  // Icon (for real resources only)
  if (detailIconEl) {
    if (!isAggregate && node.image) {
      detailIconEl.style.display = "block";
      detailIconEl.src = node.image;
    } else {
      detailIconEl.style.display = "none";
      detailIconEl.src = "";
    }
  }

  // Top chips (type, group, state)
  const chips = [];

  if (shortType) {
    chips.push(`<span class="node-detail-chip">${shortType}</span>`);
  }

  if (node.group === "resource") {
    chips.push(`<span class="node-detail-chip">Resource instance</span>`);
  } else if (node.group === "type") {
    chips.push(`<span class="node-detail-chip">Resource type</span>`);
  } else if (node.group === "project") {
    chips.push(`<span class="node-detail-chip">Project</span>`);
  } else if (node.group === "scope") {
    chips.push(`<span class="node-detail-chip">Scope</span>`);
  } else if (node.group === "aggregate") {
    chips.push(`<span class="node-detail-chip">Group of resources</span>`);
  }

  if (state) {
    chips.push(
      `<span class="node-detail-chip">State: ${String(state)}</span>`
    );
  }

  const chipsHtml = chips.length
    ? `<div class="node-detail-chip-row">${chips.join("")}</div>`
    : "";

  // General section
  const generalRows = [
    { label: "Project", value: node.projectId || meta.projectId },
    { label: "Location", value: node.location || meta.location },
    { label: "Asset type", value: node.assetType },
    { label: "Full name", value: node.fullName || meta.fullName },
  ];
  const generalHtml = buildKVSection("General", generalRows);

  // Identifiers section
  const identifiersRows = [
    { label: "ID", value: node.id },
    { label: "Name", value: node.name || meta.name },
    {
      label: "Short name",
      value: node.displayName || node.label || meta.displayName,
    },
  ];
  const identifiersHtml = buildKVSection("Identifiers", identifiersRows);

  // Networking section (best-effort)
  const networkingRows = [
    { label: "Network", value: node.network || meta.network },
    { label: "Subnetwork", value: node.subnetwork || meta.subnetwork },
    { label: "Region", value: node.region || meta.region },
    { label: "IP", value: node.ip || meta.ip },
  ];
  const networkingHtml = buildKVSection("Networking", networkingRows);

  // IAM / security section (if present)
  const iamMembers = node.iamMembers || meta.iamMembers;
  const serviceAccount =
    node.serviceAccount || meta.serviceAccount || meta.saEmail;

  const iamRows = [
    { label: "Service account", value: serviceAccount },
    {
      label: "IAM members",
      value: Array.isArray(iamMembers)
        ? `${iamMembers.length} member(s)`
        : undefined,
    },
  ];
  const iamHtml = buildKVSection("IAM & Security", iamRows);

  // Labels chips
  const labelsHtml = buildLabelsChips(labels);

  // Extras (for aggregate "+ N more" nodes)
  let extrasHtml = "";
  if (isAggregate && node.extraCount && Array.isArray(node.extraResources)) {
    const items = node.extraResources
      .map((res, idx) => {
        const name =
          res.displayName || res.name || res.fullName || "(unnamed)";
        const loc =
          res.location && res.location !== "(global/unknown)"
            ? ` <span style="color:#9ca3af">(${res.location})</span>`
            : "";
        const typeShort =
          (res.assetType || node.assetType || "")
            .split("/")
            .pop() || "";

        const typeFragment = typeShort
          ? `<span style="color:#6b7280;font-size:0.72rem;margin-left:4px;">[${typeShort}]</span>`
          : "";

        return `<li style="margin-bottom:0.15rem;">
          <button type="button"
                  class="extra-link"
                  onclick="showExtraResourceDetails('${node.id}', ${idx})">
            ${name}${loc}${typeFragment}
          </button>
        </li>`;
      })
      .join("");

    extrasHtml =
      `<div class="node-detail-section-title">Additional resources (${node.extraCount})</div>` +
      `<ul style="padding-left:1.1rem;margin:0 0 0.5rem;">${items}</ul>`;
  }

  detailBodyEl.innerHTML =
    chipsHtml +
    generalHtml +
    identifiersHtml +
    networkingHtml +
    iamHtml +
    labelsHtml +
    extrasHtml;

  detailPanelEl.style.display = "block";
}

// Called when user clicks one of the "additional resources" items
function showExtraResourceDetails(aggNodeId, index) {
  const aggNode = nodesDS.get(aggNodeId);
  if (!aggNode || !Array.isArray(aggNode.extraResources)) return;

  const res = aggNode.extraResources[index];
  if (!res) return;

  // Build a "virtual" node-like object for this extra resource
  const virtualNode = {
    id: res.id || `${aggNodeId}::extra::${index}`,
    group: "resource",
    displayName: res.displayName || res.name || res.fullName || "(unnamed)",
    label: res.displayName || res.name || res.fullName,
    fullName: res.fullName,
    name: res.name,
    location: res.location || aggNode.location,
    projectId: res.projectId || aggNode.projectId,
    assetType: res.assetType || aggNode.assetType,
    state: res.state || res.status,
    labels: res.labels,
    metadata: res.metadata,
    image: res.image,
  };

  showNodeDetails(virtualNode);
  setActiveNodeHighlight(aggNodeId); // keep highlight on the group
}

// -------------------------------
// Highlighting helpers
// -------------------------------
function setActiveNodeHighlight(nodeId) {
  highlightedNodeId = nodeId;

  const connectedNodes = network.getConnectedNodes(nodeId);
  const connectedEdges = network.getConnectedEdges(nodeId);

  const allNodes = nodesDS.get();
  const nodeUpdates = [];

  allNodes.forEach((node) => {
    const isMain = node.id === nodeId;
    const isNeighbor = connectedNodes.includes(node.id);
    const baseColor = node._baseColor || node.color;

    if (!node._baseColor) {
      node._baseColor = baseColor;
    }

    const newColor = { ...baseColor };

    if (!isMain && !isNeighbor) {
      // fade non-neighbors
      newColor.opacity = 0.18;
      nodeUpdates.push({
        id: node.id,
        color: newColor,
        font: { ...node.font, color: "#9ca3af" },
      });
    } else {
      newColor.opacity = 1.0;
      nodeUpdates.push({
        id: node.id,
        color: newColor,
        font: { ...node.font, color: "#111827" },
      });
    }
  });

  nodesDS.update(nodeUpdates);

  // Edge highlighting
  const allEdges = edgesDS.get();
  const edgeUpdates = allEdges.map((edge) => {
    const isConnected = connectedEdges.includes(edge.id);
    if (!edge._baseColor) edge._baseColor = edge.color || { color: "#ced4da" };

    const color = isConnected
      ? { ...edge._baseColor, color: "#94a3b8" }
      : { ...edge._baseColor, color: "rgba(206, 212, 218, 0.2)" };

    return {
      id: edge.id,
      color,
      width: isConnected ? 1.6 : 0.8,
    };
  });
  edgesDS.update(edgeUpdates);
}

function clearActiveNodeHighlight() {
  highlightedNodeId = null;

  const allNodes = nodesDS.get();
  const nodeUpdates = allNodes.map((node) => {
    const baseColor = node._baseColor || node.color;
    const color = { ...baseColor, opacity: 1.0 };

    return {
      id: node.id,
      color,
      font: { ...node.font, color: "#111827" },
    };
  });
  nodesDS.update(nodeUpdates);

  const allEdges = edgesDS.get();
  const edgeUpdates = allEdges.map((edge) => {
    const base = edge._baseColor || edge.color || { color: "#ced4da" };
    return {
      id: edge.id,
      color: base,
      width: 1,
    };
  });
  edgesDS.update(edgeUpdates);
}

// -------------------------------
// Initialize network
// -------------------------------
function initNetwork() {
  if (!Array.isArray(RAW_NODES) || !Array.isArray(RAW_EDGES)) {
    console.error("RAW_NODES / RAW_EDGES not defined.");
    return;
  }

  const nodesDecorated = decorateNodes(RAW_NODES);

  nodesDS = new vis.DataSet(nodesDecorated);
  edgesDS = new vis.DataSet(RAW_EDGES);

  const container = document.getElementById("mynetwork");
  const data = {
    nodes: nodesDS,
    edges: edgesDS,
  };

  const options = {
    layout: {
      improvedLayout: true,
      hierarchical: {
        enabled: false,
      },
    },
    physics: {
      enabled: true,
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -35,
        centralGravity: 0.015,
        springLength: 140,
        springConstant: 0.16,
        damping: 0.52,
        avoidOverlap: 0.65,
      },
      stabilization: {
        enabled: true,
        iterations: 220,
      },
    },
    edges: {
      smooth: {
        type: "dynamic",
        roundness: 0.25,
      },
      width: 1,
      selectionWidth: 2,
      hoverWidth: 1.5,
      color: {
        color: "#ced4da",
        highlight: "#94a3b8",
        hover: "#94a3b8",
      },
      arrows: {
        to: { enabled: false },
      },
    },
    nodes: {
      borderWidth: 1,
      borderWidthSelected: 2,
      chosen: {
        node(values) {
          values.borderWidth = 2.5;
          values.size = values.size * 1.05;
        },
      },
      font: {
        face: "Inter",
        size: 11,
        color: "#111827",
      },
    },
    interaction: {
      hover: true,
      tooltipDelay: 120,
      multiselect: true,
      navigationButtons: true,
      keyboard: true,
    },
  };

  network = new vis.Network(container, data, options);


  // Apply initial tiered layout
  applyTieredLayout(currentHorizontalSpacing, 140);
  network.fit({ animation: { duration: 600, easingFunction: "easeInOutQuad" } });
  network.setOptions({ physics: { enabled: true } });

  // Zoom indicator
  const zoomLabel = document.getElementById("zoom-display");
  network.on("zoom", (params) => {
    const scale = params.scale || network.getScale();
    zoomLabel.textContent = `Zoom: ${Math.round(scale * 100)}%`;
  });

  // Node click: focus, highlight, details
  network.on("click", (params) => {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      const node = nodesDS.get(nodeId);

      network.focus(nodeId, {
        scale: 1.2,
        animation: { duration: 400, easingFunction: "easeInOutQuad" },
      });

      setActiveNodeHighlight(nodeId);

      if (node && (node.group === "resource" || node.group === "aggregate")) {
        showNodeDetails(node);
      } else {
        hideNodeDetails();
      }
    } else {
      // Clicked on empty space – clear highlight & panel
      clearActiveNodeHighlight();
      hideNodeDetails();
    }
  });

  // Double-click to toggle cluster-by-type (optional)
  network.on("doubleClick", (params) => {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      if (network.isCluster(nodeId)) {
        network.openCluster(nodeId);
        clearActiveNodeHighlight();
      } else {
        clusterResourcesAround(nodeId);
      }
    }
  });

  setupControls();
  initDetailsPanel();
}

// -------------------------------
// Simple clustering helper
// -------------------------------
function clusterResourcesAround(nodeId) {
  const node = nodesDS.get(nodeId);
  if (!node) return;

  // Only cluster around “type” or “project” nodes
  if (node.group !== "type" && node.group !== "project") return;

  const clusterOptionsByData = {
    joinCondition: (childNode) =>
      childNode.id !== nodeId &&
      childNode.group === "resource" &&
      edgesDS.get({
        filter: (e) =>
          (e.from === nodeId && e.to === childNode.id) ||
          (e.to === nodeId && e.from === childNode.id),
      }).length > 0,
    clusterNodeProperties: {
      id: "cluster::" + nodeId + "::" + Date.now(),
      label: node.label + " – resources",
      group: "resource",
      shape: "box",
      font: { face: "Inter", size: 11 },
      borderWidth: 1,
      color: {
        background: "#d3f9d8",
        border: "#2b8a3e",
      },
    },
  };

  network.cluster(clusterOptionsByData);
}

// -------------------------------
// Wire up sidebar controls
// -------------------------------
function setupControls() {
  const layoutRadios = document.querySelectorAll('input[name="layout-mode"]');
  const physicsToggle = document.getElementById("physics-toggle");
  const spacingRange = document.getElementById("spacing-range");

  layoutRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) {
        if (radio.value === "tiered") {
          // Disable physics before setting fixed positions
          network.setOptions({ physics: { enabled: false } });
          clearActiveNodeHighlight();
          applyTieredLayout(currentHorizontalSpacing, 140);
          network.fit({
            animation: { duration: 500, easingFunction: "easeInOutQuad" },
          });
        } else if (radio.value === "force") {
          clearActiveNodeHighlight();
          enableForceLayout();
        }
      }
    });
  });

  physicsToggle.addEventListener("change", () => {
    network.setOptions({
      physics: { enabled: physicsToggle.checked },
    });
  });

  spacingRange.addEventListener("input", () => {
    currentHorizontalSpacing = parseInt(spacingRange.value, 10) || 160;
    const tieredSelected = document.querySelector(
      'input[name="layout-mode"][value="tiered"]'
    ).checked;
    if (tieredSelected) {
      applyTieredLayout(currentHorizontalSpacing, 140);
      network.fit({
        animation: { duration: 400, easingFunction: "easeInOutQuad" },
      });
    }
  });
}

// -------------------------------
// Boot
// -------------------------------
window.addEventListener("DOMContentLoaded", initNetwork);


