// network.js

// Global vis objects
let network;
let nodesDS;
let edgesDS;

// For tiered layout
let currentHorizontalSpacing = 160;

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

    // Default styles (can be overridden by existing node props)
    if (!base.font) base.font = {};
    base.font.face = base.font.face || "Inter";

    if (info.group === "scope" || info.group === "project") {
      base.shape = base.shape || "box";
      base.color = base.color || {
        background: "#e7f1ff",
        border: "#4c6ef5",
        highlight: { background: "#d0e1ff", border: "#364fc7" },
      };
      base.font.size = base.font.size || 13;
      base.margin = base.margin || 10;
    } else if (info.group === "type") {
      base.shape = base.shape || "box";
      base.color = base.color || {
        background: "#fff4e6",
        border: "#f08c00",
        highlight: { background: "#ffe3bf", border: "#d9480f" },
      };
      base.font.size = base.font.size || 12;
      base.margin = base.margin || 8;
    } else {
      // resource instances
      base.shape = base.shape || "box";
      base.color = base.color || {
        background: "#e6f4ea",
        border: "#2f9e44",
        highlight: { background: "#d3f9d8", border: "#2b8a3e" },
      };
      base.font.size = base.font.size || 11;
      base.margin = base.margin || 6;
    }

    return base;
  });
}

// -------------------------------
// Tiered layout (Holori-style)
// -------------------------------
function applyTieredLayout(spacingX = 160, spacingY = 160) {
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
      nodesDS.update({ id: node.id, fixed: false });
    }
  });

  network.setOptions({
    layout: {
      hierarchical: {
        enabled: false,
      },
    },
    physics: {
      enabled: true,
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -35,
        centralGravity: 0.005,
        springLength: 130,
        springConstant: 0.18,
        damping: 0.4,
        avoidOverlap: 0.7,
      },
      stabilization: {
        enabled: true,
        iterations: 300,
      },
      maxVelocity: 20,
      minVelocity: 0.5,
      timestep: 0.35,
    },
  });

  network.stabilize(300);
}

// -------------------------------
// Initialize network
// -------------------------------
function initNetwork() {
  if (!Array.isArray(RAW_NODES) || !Array.isArray(RAW_EDGES)) {
    // Fallback if graphData.js wasn't generated.
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
        centralGravity: 0.01,
        springLength: 140,
        springConstant: 0.18,
        damping: 0.5,
        avoidOverlap: 0.6,
      },
      stabilization: {
        enabled: true,
        iterations: 200,
      },
    },
    edges: {
      smooth: {
        type: "dynamic",
        roundness: 0.3,
      },
      width: 1,
      color: {
        color: "#ced4da",
        highlight: "#adb5bd",
      },
      arrows: {
        to: { enabled: false },
      },
    },
    nodes: {
      borderWidth: 1,
      borderWidthSelected: 2,
      shadow: {
        enabled: false,
      },
      font: {
        face: "Inter",
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
  applyTieredLayout(currentHorizontalSpacing, 160);
  network.fit({ animation: { duration: 600, easingFunction: "easeInOutQuad" } });
  network.setOptions({ physics: { enabled: true } });

  // Zoom indicator
  const zoomLabel = document.getElementById("zoom-display");
  network.on("zoom", (params) => {
    const scale = params.scale || network.getScale();
    zoomLabel.textContent = `Zoom: ${Math.round(scale * 100)}%`;
  });

  // Simple node focus on click (like Holori)
  network.on("click", (params) => {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      network.focus(nodeId, {
        scale: 1.2,
        animation: { duration: 400, easingFunction: "easeInOutQuad" },
      });
    }
  });

  // Double-click to toggle cluster-by-type (optional)
  network.on("doubleClick", (params) => {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      if (network.isCluster(nodeId)) {
        network.openCluster(nodeId);
      } else {
        clusterResourcesAround(nodeId);
      }
    }
  });

  setupControls();
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
          applyTieredLayout(currentHorizontalSpacing, 160);
          network.fit({
            animation: { duration: 500, easingFunction: "easeInOutQuad" },
          });
        } else if (radio.value === "force") {
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
    // Only re-apply when in tiered mode
    const tieredSelected = document.querySelector(
      'input[name="layout-mode"][value="tiered"]'
    ).checked;
    if (tieredSelected) {
      applyTieredLayout(currentHorizontalSpacing, 160);
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
