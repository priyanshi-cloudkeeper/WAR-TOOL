
// // network.js
// // Global vis objects
// let network;
// let nodesDS;
// let edgesDS;

// // For tiered layout - Increased spacing for better visibility
// let currentHorizontalSpacing = 200;

// // Details panel DOM refs
// let detailPanelEl;
// let detailTitleEl;
// let detailSubtitleEl;
// let detailBodyEl;
// let detailIconEl;
// let detailCloseEl;

// // Highlight state
// let highlightedNodeId = null;

// // -------------------------------
// // Helper: classify nodes by id
// // -------------------------------
// function classifyNode(node) {
//   const id = String(node.id);

//   if (id.startsWith("scope::")) {
//     return { level: 0, group: "scope" };
//   }
//   if (id.startsWith("proj::")) {
//     return { level: 1, group: "project" };
//   }
//   if (id.startsWith("type::")) {
//     return { level: 2, group: "type" };
//   }
//   if (id.startsWith("agg::")) {
//     return { level: 3, group: "aggregate" };
//   }
//   // Everything else is a concrete resource
//   return { level: 3, group: "resource" };
// }

// // -------------------------------
// // Decorate nodes - VISUAL UPGRADE
// // -------------------------------
// function decorateNodes(rawNodes) {
//   return rawNodes.map((n) => {
//     const info = classifyNode(n);
//     const base = { ...n };

//     base.level = info.level;
//     base.group = info.group;

//     // 1. Unified Professional Typography
//     base.font = {
//       face: "Inter, system-ui, sans-serif",
//       size: 12,
//       color: "#334155", // Slate-700
//       multi: true,
//       vadjust: -1,
//       strokeWidth: 4, 
//       strokeColor: "#ffffff"
//     };

//     // Add title tooltip
//     const dn = base.displayName || base.label || base.name || "";
//     const at = base.assetType || "";
//     if (!base.title) {
//       base.title = dn || at ? `${dn || "(unnamed)"}\n${at}` : "";
//     }

//     const hasImage = !!base.image;

//     // 2. Proportional Styling Logic
//     if (info.group === "scope" || info.group === "project") {
//       base.shape = hasImage ? "image" : "box";
//       base.size = 40; 
//       base.margin = 14;
//       base.borderWidth = 2;
//       base.color = {
//         background: "#f8fafc", // Slate-50
//         border: "#4f46e5",     // Indigo-600
//         highlight: { background: "#eef2ff", border: "#4338ca" },
//       };
//       base.widthConstraint = { minimum: 140, maximum: 240 };
//       base.shadow = { enabled: true, color: 'rgba(79, 70, 229, 0.2)', size: 15, x: 0, y: 5 };
//     } 
//     else if (info.group === "type") {
//       base.shape = hasImage ? "image" : "box";
//       base.size = 32;
//       base.margin = 10;
//       base.borderWidth = 1;
//       base.color = {
//         background: "#fff7ed", // Orange-50
//         border: "#f97316",     // Orange-500
//         highlight: { background: "#ffedd5", border: "#ea580c" },
//       };
//       base.widthConstraint = { minimum: 120, maximum: 180 };
//       base.shadow = { enabled: true, color: 'rgba(249, 115, 22, 0.15)', size: 10, x: 0, y: 3 };
//     } 
//     else if (info.group === "aggregate") {
//       base.shape = "box";
//       base.size = 28;
//       base.margin = 8;
//       base.borderWidth = 1;
//       base.shapeProperties = { borderRadius: 6, borderDashes: [5, 5] }; 
//       base.color = {
//         background: "#fdf2f8", // Pink-50
//         border: "#db2777",     // Pink-600
//         highlight: { background: "#fce7f3", border: "#be185d" },
//       };
//       base.font.color = "#db2777";
//     } 
//     else {
//       base.shape = hasImage ? "image" : "box";
//       base.size = 34; 
//       base.margin = 8;
//       base.borderWidth = 1;
//       base.color = {
//         background: "#ffffff", // White
//         border: "#10b981",     // Emerald-500
//         highlight: { background: "#ecfdf5", border: "#059669" },
//       };
//       base.widthConstraint = { minimum: 90, maximum: 160 };
//       base.shadow = { enabled: true, color: 'rgba(0,0,0,0.06)', size: 8, x: 0, y: 4 };
//     }

//     base.shapeProperties = base.shapeProperties || { borderRadius: 8 };
//     base._baseColor = base.color;
//     return base;
//   });
// }

// // -------------------------------
// // Tiered layout (Spacious)
// // -------------------------------
// function applyTieredLayout(spacingX = 200, spacingY = 180) {
//   const levels = {};
//   nodesDS.forEach((node) => {
//     const level = node.level || 0;
//     if (!levels[level]) levels[level] = [];
//     levels[level].push(node.id);
//   });

//   const levelKeys = Object.keys(levels)
//     .map((x) => parseInt(x, 10))
//     .sort((a, b) => a - b);

//   const totalLevels = levelKeys.length;
//   const middleIndex = (totalLevels - 1) / 2;

//   levelKeys.forEach((level, levelIndex) => {
//     const ids = levels[level];
//     const y = (levelIndex - middleIndex) * spacingY;

//     const count = ids.length;
//     const totalWidth = (count - 1) * spacingX;

//     ids.forEach((id, index) => {
//       const x = index * spacingX - totalWidth / 2;
//       nodesDS.update({
//         id, x, y,
//         physics: false,
//         fixed: { x: true, y: true },
//       });
//     });
//   });
// }

// // -------------------------------
// // Force-directed layout (Stable)
// // -------------------------------
// function enableForceLayout() {
//   nodesDS.forEach((node) => {
//     nodesDS.update({ id: node.id, fixed: false, physics: true });
//   });

//   network.setOptions({
//     layout: { hierarchical: { enabled: false }, improvedLayout: true },
//     physics: {
//       enabled: true,
//       solver: "forceAtlas2Based",
//       forceAtlas2Based: {
//         gravitationalConstant: -120,
//         centralGravity: 0.01,
//         springLength: 180,
//         springConstant: 0.08,
//         damping: 0.4,
//         avoidOverlap: 1.0,
//       },
//       stabilization: { enabled: true, iterations: 600 },
//     },
//     edges: { smooth: { type: "continuous", roundness: 0.5 } }
//   });
//   network.stabilize(500);
// }

// // -------------------------------
// // DETAILS PANEL HELPERS (RESTORED EXACTLY)
// // -------------------------------
// function initDetailsPanel() {
//   detailPanelEl = document.getElementById("node-detail-panel");
//   detailTitleEl = document.getElementById("node-detail-title");
//   detailSubtitleEl = document.getElementById("node-detail-subtitle");
//   detailBodyEl = document.getElementById("node-detail-body");
//   detailIconEl = document.getElementById("node-detail-icon");
//   detailCloseEl = document.getElementById("node-detail-close");

//   if (detailCloseEl && detailPanelEl) {
//     detailCloseEl.addEventListener("click", () => {
//       hideNodeDetails();
//       clearActiveNodeHighlight();
//     });
//   }
// }

// function hideNodeDetails() {
//   if (!detailPanelEl) return;
//   detailPanelEl.style.display = "none";
// }

// // Helper to safely stringify labels object into chips HTML
// function buildLabelsChips(labels) {
//   if (!labels || typeof labels !== "object") return "";
//   const entries = Object.entries(labels);
//   if (!entries.length) return "";

//   const chips = entries
//     .slice(0, 15)
//     .map(
//       ([k, v]) =>
//         `<span class="node-detail-chip">${k}: ${String(v)}</span>`
//     )
//     .join("");

//   return chips
//     ? `<div class="node-detail-section-title">Labels</div>
//        <div class="node-detail-chip-row">${chips}</div>`
//     : "";
// }

// // Helper for building a simple KV section
// function buildKVSection(title, rows) {
//   const htmlRows = rows
//     .filter((r) => r && r.value)
//     .map(
//       (r) =>
//         `<div class="node-detail-kv-row">
//            <div class="node-detail-kv-label">${r.label}</div>
//            <div class="node-detail-kv-value">${r.value}</div>
//          </div>`
//     )
//     .join("");

//   if (!htmlRows) return "";
//   return `<div class="node-detail-section-title">${title}</div>${htmlRows}`;
// }

// // Main function to render details for either a resource or an aggregate node
// function showNodeDetails(node) {
//   if (!detailPanelEl || !detailTitleEl || !detailBodyEl) return;
//   if (!node) return;

//   const isAggregate = node.group === "aggregate";
//   const meta = node.metadata || {};
//   const labels = node.labels || meta.labels || {};
//   const state = node.state || meta.state || meta.status;
//   const shortType =
//     (node.assetType || "").split("/").pop() ||
//     (isAggregate ? "Resources" : "Resource");

//   // Title & subtitle
//   if (isAggregate) {
//     detailTitleEl.textContent = `More ${shortType}`;
//     detailSubtitleEl.textContent = node.projectId
//       ? `Project: ${node.projectId}`
//       : node.assetType || "";
//   } else {
//     const displayName =
//       node.displayName || node.label || node.name || "Resource";
//     detailTitleEl.textContent = displayName;
//     detailSubtitleEl.textContent = node.assetType || "";
//   }

//   // Icon (for real resources only)
//   if (detailIconEl) {
//     if (!isAggregate && node.image) {
//       detailIconEl.style.display = "block";
//       detailIconEl.src = node.image;
//     } else {
//       detailIconEl.style.display = "none";
//       detailIconEl.src = "";
//     }
//   }

//   // Top chips (type, group, state)
//   const chips = [];

//   if (shortType) {
//     chips.push(`<span class="node-detail-chip">${shortType}</span>`);
//   }

//   if (node.group === "resource") {
//     chips.push(`<span class="node-detail-chip">Resource instance</span>`);
//   } else if (node.group === "type") {
//     chips.push(`<span class="node-detail-chip">Resource type</span>`);
//   } else if (node.group === "project") {
//     chips.push(`<span class="node-detail-chip">Project</span>`);
//   } else if (node.group === "scope") {
//     chips.push(`<span class="node-detail-chip">Scope</span>`);
//   } else if (node.group === "aggregate") {
//     chips.push(`<span class="node-detail-chip">Group of resources</span>`);
//   }

//   if (state) {
//     chips.push(
//       `<span class="node-detail-chip">State: ${String(state)}</span>`
//     );
//   }

//   const chipsHtml = chips.length
//     ? `<div class="node-detail-chip-row">${chips.join("")}</div>`
//     : "";

//   // General section
//   const generalRows = [
//     { label: "Project", value: node.projectId || meta.projectId },
//     { label: "Location", value: node.location || meta.location },
//     { label: "Asset type", value: node.assetType },
//     { label: "Full name", value: node.fullName || meta.fullName },
//   ];
//   const generalHtml = buildKVSection("General", generalRows);

//   // Identifiers section
//   const identifiersRows = [
//     { label: "ID", value: node.id },
//     { label: "Name", value: node.name || meta.name },
//     {
//       label: "Short name",
//       value: node.displayName || node.label || meta.displayName,
//     },
//   ];
//   const identifiersHtml = buildKVSection("Identifiers", identifiersRows);

//   // Networking section (best-effort)
//   const networkingRows = [
//     { label: "Network", value: node.network || meta.network },
//     { label: "Subnetwork", value: node.subnetwork || meta.subnetwork },
//     { label: "Region", value: node.region || meta.region },
//     { label: "IP", value: node.ip || meta.ip },
//   ];
//   const networkingHtml = buildKVSection("Networking", networkingRows);

//   // IAM / security section (if present)
//   const iamMembers = node.iamMembers || meta.iamMembers;
//   const serviceAccount =
//     node.serviceAccount || meta.serviceAccount || meta.saEmail;

//   const iamRows = [
//     { label: "Service account", value: serviceAccount },
//     {
//       label: "IAM members",
//       value: Array.isArray(iamMembers)
//         ? `${iamMembers.length} member(s)`
//         : undefined,
//     },
//   ];
//   const iamHtml = buildKVSection("IAM & Security", iamRows);

//   // Labels chips
//   const labelsHtml = buildLabelsChips(labels);

//   // Extras (for aggregate "+ N more" nodes)
//   let extrasHtml = "";
//   if (isAggregate && node.extraCount && Array.isArray(node.extraResources)) {
//     const items = node.extraResources
//       .map((res, idx) => {
//         const name =
//           res.displayName || res.name || res.fullName || "(unnamed)";
//         const loc =
//           res.location && res.location !== "(global/unknown)"
//             ? ` <span style="color:#9ca3af">(${res.location})</span>`
//             : "";
//         const typeShort =
//           (res.assetType || node.assetType || "")
//             .split("/")
//             .pop() || "";

//         const typeFragment = typeShort
//           ? `<span style="color:#6b7280;font-size:0.72rem;margin-left:4px;">[${typeShort}]</span>`
//           : "";

//         return `<li style="margin-bottom:0.15rem;">
//           <button type="button"
//                   class="extra-link"
//                   onclick="showExtraResourceDetails('${node.id}', ${idx})">
//             ${name}${loc}${typeFragment}
//           </button>
//         </li>`;
//       })
//       .join("");

//     extrasHtml =
//       `<div class="node-detail-section-title">Additional resources (${node.extraCount})</div>` +
//       `<ul style="padding-left:1.1rem;margin:0 0 0.5rem;">${items}</ul>`;
//   }

//   detailBodyEl.innerHTML =
//     chipsHtml +
//     generalHtml +
//     identifiersHtml +
//     networkingHtml +
//     iamHtml +
//     labelsHtml +
//     extrasHtml;

//   detailPanelEl.style.display = "block";
// }

// // Called when user clicks one of the "additional resources" items
// function showExtraResourceDetails(aggNodeId, index) {
//   const aggNode = nodesDS.get(aggNodeId);
//   if (!aggNode || !Array.isArray(aggNode.extraResources)) return;

//   const res = aggNode.extraResources[index];
//   if (!res) return;

//   // Build a "virtual" node-like object for this extra resource
//   const virtualNode = {
//     id: res.id || `${aggNodeId}::extra::${index}`,
//     group: "resource",
//     displayName: res.displayName || res.name || res.fullName || "(unnamed)",
//     label: res.displayName || res.name || res.fullName,
//     fullName: res.fullName,
//     name: res.name,
//     location: res.location || aggNode.location,
//     projectId: res.projectId || aggNode.projectId,
//     assetType: res.assetType || aggNode.assetType,
//     state: res.state || res.status,
//     labels: res.labels,
//     metadata: res.metadata,
//     image: res.image,
//   };

//   showNodeDetails(virtualNode);
//   setActiveNodeHighlight(aggNodeId); // keep highlight on the group
// }

// // -------------------------------
// // Highlighting helpers
// // -------------------------------
// function setActiveNodeHighlight(nodeId) {
//   highlightedNodeId = nodeId;

//   const connectedNodes = network.getConnectedNodes(nodeId);
//   const connectedEdges = network.getConnectedEdges(nodeId);

//   const allNodes = nodesDS.get();
//   const nodeUpdates = [];

//   allNodes.forEach((node) => {
//     const isMain = node.id === nodeId;
//     const isNeighbor = connectedNodes.includes(node.id);
//     const baseColor = node._baseColor || node.color;

//     if (!node._baseColor) {
//       node._baseColor = baseColor;
//     }

//     const newColor = { ...baseColor };

//     if (!isMain && !isNeighbor) {
//       // fade non-neighbors
//       newColor.opacity = 0.18;
//       nodeUpdates.push({
//         id: node.id,
//         color: newColor,
//         font: { ...node.font, color: "rgba(148, 163, 184, 0.4)" },
//       });
//     } else {
//       newColor.opacity = 1.0;
//       nodeUpdates.push({
//         id: node.id,
//         color: newColor,
//         font: { ...node.font, color: "#111827" },
//       });
//     }
//   });

//   nodesDS.update(nodeUpdates);

//   // Edge highlighting
//   const allEdges = edgesDS.get();
//   const edgeUpdates = allEdges.map((edge) => {
//     const isConnected = connectedEdges.includes(edge.id);
//     if (!edge._baseColor) edge._baseColor = edge.color || { color: "#ced4da" };

//     const color = isConnected
//       ? { ...edge._baseColor, color: "#94a3b8" }
//       : { ...edge._baseColor, color: "rgba(206, 212, 218, 0.2)" };

//     return {
//       id: edge.id,
//       color,
//       width: isConnected ? 1.6 : 0.8,
//     };
//   });
//   edgesDS.update(edgeUpdates);
// }

// function clearActiveNodeHighlight() {
//   highlightedNodeId = null;

//   const allNodes = nodesDS.get();
//   const nodeUpdates = allNodes.map((node) => {
//     const baseColor = node._baseColor || node.color;
//     // Restore opacity
//     const color = { ...baseColor, opacity: 1.0 };
//     if(color.opacity) delete color.opacity; 

//     return {
//       id: node.id,
//       color: baseColor,
//       font: { ...node.font, color: "#334155" },
//     };
//   });
//   nodesDS.update(nodeUpdates);

//   const allEdges = edgesDS.get();
//   const edgeUpdates = allEdges.map((edge) => {
//     const base = edge._baseColor || edge.color || { color: "#ced4da" };
//     return {
//       id: edge.id,
//       color: base,
//       width: 1,
//     };
//   });
//   edgesDS.update(edgeUpdates);
// }

// // -------------------------------
// // Initialize network
// // -------------------------------
// function initNetwork() {
//   if (!Array.isArray(RAW_NODES) || !Array.isArray(RAW_EDGES)) {
//     console.error("RAW_NODES / RAW_EDGES not defined.");
//     return;
//   }

//   const nodesDecorated = decorateNodes(RAW_NODES);

//   nodesDS = new vis.DataSet(nodesDecorated);
//   edgesDS = new vis.DataSet(RAW_EDGES);

//   const container = document.getElementById("mynetwork");
//   const data = {
//     nodes: nodesDS,
//     edges: edgesDS,
//   };

//   const options = {
//     layout: {
//       improvedLayout: true,
//       hierarchical: {
//         enabled: false,
//       },
//     },
//     // Updated Physics for Stability
//     physics: {
//       enabled: true,
//       solver: "forceAtlas2Based",
//       forceAtlas2Based: {
//         gravitationalConstant: -130,
//         centralGravity: 0.01,
//         springLength: 180,
//         springConstant: 0.08,
//         damping: 0.45,
//         avoidOverlap: 1.0,
//       },
//       stabilization: {
//         enabled: true,
//         iterations: 600,
//       },
//     },
//     // Smoother Edge Styling
//     edges: {
//       smooth: {
//         type: "continuous",
//         roundness: 0.4,
//       },
//       width: 1.2,
//       selectionWidth: 2.5,
//       hoverWidth: 1.5,
//       color: {
//         color: "#cbd5e1", // Slate-300
//         highlight: "#64748b", // Slate-500
//         hover: "#94a3b8",
//       },
//       arrows: {
//         to: { enabled: false },
//       },
//     },
//     nodes: {
//       borderWidth: 1,
//       borderWidthSelected: 2,
//       chosen: {
//         node(values) {
//           values.borderWidth = 3;
//           values.shadow = true;
//           values.shadowSize = 15;
//         },
//       },
//     },
//     interaction: {
//       hover: true,
//       tooltipDelay: 100,
//       multiselect: true,
//       navigationButtons: true,
//       keyboard: true,
//     },
//   };

//   network = new vis.Network(container, data, options);

//   // Apply initial tiered layout
//   applyTieredLayout(currentHorizontalSpacing, 180);
//   network.fit({ animation: { duration: 800, easingFunction: "easeInOutQuad" } });
  
//   // Disable physics after initial settling
//   setTimeout(() => {
//      const tieredRadio = document.querySelector('input[name="layout-mode"][value="tiered"]');
//      if(tieredRadio && tieredRadio.checked) {
//         network.setOptions({ physics: { enabled: false } });
//      }
//   }, 1000);


//   // Zoom indicator
//   const zoomLabel = document.getElementById("zoom-display");
//   if (zoomLabel) {
//     network.on("zoom", (params) => {
//       const scale = params.scale || network.getScale();
//       zoomLabel.textContent = `Zoom: ${Math.round(scale * 100)}%`;
//     });
//   }

//   // Node click: focus, highlight, details
//   network.on("click", (params) => {
//     if (params.nodes.length === 1) {
//       const nodeId = params.nodes[0];
//       const node = nodesDS.get(nodeId);

//       network.focus(nodeId, {
//         scale: 1.2,
//         animation: { duration: 500, easingFunction: "easeInOutQuad" },
//       });

//       setActiveNodeHighlight(nodeId);

//       if (node && (node.group === "resource" || node.group === "aggregate")) {
//         showNodeDetails(node);
//       } else {
//         hideNodeDetails();
//       }
//     } else {
//       // Clicked on empty space – clear highlight & panel
//       clearActiveNodeHighlight();
//       hideNodeDetails();
//     }
//   });

//   // Double-click
//   network.on("doubleClick", (params) => {
//     if (params.nodes.length === 1) {
//       const nodeId = params.nodes[0];
//       if (network.isCluster(nodeId)) {
//         network.openCluster(nodeId);
//         clearActiveNodeHighlight();
//       } else {
//         clusterResourcesAround(nodeId);
//       }
//     }
//   });

//   setupControls();
//   initDetailsPanel();
// }

// // -------------------------------
// // Simple clustering helper
// // -------------------------------
// function clusterResourcesAround(nodeId) {
//   const node = nodesDS.get(nodeId);
//   if (!node) return;

//   // Only cluster around “type” or “project” nodes
//   if (node.group !== "type" && node.group !== "project") return;

//   const clusterOptionsByData = {
//     joinCondition: (childNode) =>
//       childNode.id !== nodeId &&
//       childNode.group === "resource" &&
//       edgesDS.get({
//         filter: (e) =>
//           (e.from === nodeId && e.to === childNode.id) ||
//           (e.to === nodeId && e.from === childNode.id),
//       }).length > 0,
//     clusterNodeProperties: {
//       id: "cluster::" + nodeId + "::" + Date.now(),
//       label: node.label + " (Grouped)",
//       group: "resource",
//       shape: "box",
//       font: { face: "Inter", size: 11 },
//       borderWidth: 1,
//       shapeProperties: { borderDashes: [5,5] },
//       color: {
//         background: "#f0fdf4",
//         border: "#16a34a",
//       },
//     },
//   };

//   network.cluster(clusterOptionsByData);
// }

// // -------------------------------
// // Wire up sidebar controls
// // -------------------------------
// function setupControls() {
//   const layoutRadios = document.querySelectorAll('input[name="layout-mode"]');
//   const physicsToggle = document.getElementById("physics-toggle");
//   const spacingRange = document.getElementById("spacing-range");

//   layoutRadios.forEach((radio) => {
//     radio.addEventListener("change", () => {
//       if (radio.checked) {
//         if (radio.value === "tiered") {
//           // Disable physics before setting fixed positions
//           network.setOptions({ physics: { enabled: false } });
//           clearActiveNodeHighlight();
//           applyTieredLayout(currentHorizontalSpacing, 180);
//           network.fit({
//             animation: { duration: 500, easingFunction: "easeInOutQuad" },
//           });
//         } else if (radio.value === "force") {
//           clearActiveNodeHighlight();
//           enableForceLayout();
//         }
//       }
//     });
//   });

//   if (physicsToggle) {
//     physicsToggle.addEventListener("change", () => {
//       network.setOptions({
//         physics: { enabled: physicsToggle.checked },
//       });
//     });
//   }

//   if (spacingRange) {
//     spacingRange.addEventListener("input", () => {
//       currentHorizontalSpacing = parseInt(spacingRange.value, 10) || 160;
//       const tieredSelected = document.querySelector(
//         'input[name="layout-mode"][value="tiered"]'
//       ).checked;
//       if (tieredSelected) {
//         applyTieredLayout(currentHorizontalSpacing, 180);
//       }
//     });
//   }
// }

// // -------------------------------
// // Boot
// // -------------------------------
// window.addEventListener("DOMContentLoaded", initNetwork);

// network.js

// -------------------------------
// Global vis objects & State
// -------------------------------
let network;
let nodesDS;
let edgesDS;
let expandedNodes = new Set(); // Tracks which nodes are currently open

// Layout Grid Spacing
let currentHorizontalSpacing = 240;
const VERTICAL_SPACING = 200;

// Details panel DOM refs
let detailPanelEl;
let detailTitleEl;
let detailSubtitleEl;
let detailBodyEl;
let detailIconEl;
let detailCloseEl;

// -------------------------------
// 1. Helper: classify nodes by id
// -------------------------------
function classifyNode(node) {
  const id = String(node.id);
  if (id.startsWith("scope::")) return { level: 0, group: "scope" };
  if (id.startsWith("proj::")) return { level: 1, group: "project" };
  if (id.startsWith("type::")) return { level: 2, group: "type" };
  if (id.startsWith("agg::")) return { level: 3, group: "aggregate" };
  return { level: 3, group: "resource" };
}

// -------------------------------
// 2. Decorate nodes (Visual Styling)
// -------------------------------
function decorateNodes(rawNodes) {
  return rawNodes.map((n) => {
    const info = classifyNode(n);
    const base = { ...n };

    base.level = info.level;
    base.group = info.group;

    // Typography
    base.font = {
      face: "Inter, system-ui, sans-serif",
      size: 13,
      color: "#334155", // Slate-700
      strokeWidth: 4,
      strokeColor: "#ffffff",
      multi: true
    };

    // VISUAL CUE: Add folder icon to expandable nodes
    // Note: We only set the default "closed" state here.
    const isExpandable = base.level < 3;
    if (isExpandable && !base.label.includes("📂") && !base.label.includes("🏢")) {
      if (base.group === 'scope') base.label = "🏢 " + base.label;
      else base.label = "📂 " + base.label;
    }

    // Tooltip
    if (!base.title) {
        base.title = `${base.displayName || base.name}\n${base.assetType}`;
    }

    const hasImage = !!base.image;

    // SHAPE & COLOR RULES
    if (info.group === "scope" || info.group === "project") {
      base.shape = "box"; 
      base.margin = 12;
      base.borderWidth = 2;
      base.color = { background: "#f8fafc", border: "#4f46e5" }; // Indigo
      base.widthConstraint = { minimum: 160, maximum: 260 };
      base.shadow = { enabled: true, color: 'rgba(79, 70, 229, 0.15)', size: 15, x: 0, y: 5 };
    } 
    else if (info.group === "type") {
      base.shape = "box";
      base.margin = 10;
      base.borderWidth = 1;
      base.color = { background: "#fff7ed", border: "#f97316" }; // Orange
      base.widthConstraint = { minimum: 140, maximum: 200 };
      base.shadow = { enabled: true, color: 'rgba(249, 115, 22, 0.1)', size: 10, x: 0, y: 3 };
    } 
    else {
      // Resources
      base.shape = hasImage ? "image" : "dot";
      base.size = 24;
      base.borderWidth = 1;
      base.color = { background: "#ffffff", border: "#10b981" }; // Emerald
      base.shadow = { enabled: true, color: 'rgba(0,0,0,0.06)', size: 8, x: 0, y: 4 };
    }

    base.shapeProperties = { borderRadius: 6 };
    base._baseColor = base.color;
    return base;
  });
}

// -------------------------------
// 3. Drill-Down & Collapse Logic (The Core)
// -------------------------------

// Main Toggle Function
function toggleNode(parentNodeId) {
  if (expandedNodes.has(parentNodeId)) {
    collapseNode(parentNodeId);
  } else {
    expandNode(parentNodeId);
  }
}

function expandNode(parentNodeId) {
  const currentIds = nodesDS.getIds();
  
  // 1. Find child edges in master data
  const childEdges = RAW_EDGES.filter(e => e.from === parentNodeId);
  const childIds = childEdges.map(e => e.to);
  
  // 2. Identify new nodes to load
  const decoratedMaster = decorateNodes(RAW_NODES);
  const nodesToLoad = decoratedMaster.filter(n => 
    childIds.includes(n.id) && !currentIds.includes(n.id)
  );

  if (nodesToLoad.length > 0) {
    // Add to live datasets
    nodesDS.add(nodesToLoad);
    edgesDS.add(childEdges);
    
    // Track State
    expandedNodes.add(parentNodeId);
    
    // Optional: Visual Feedback (Change Icon to Open)
    // You can customize this to change the icon if you wish
    // const parentNode = nodesDS.get(parentNodeId);
    // if(parentNode.label.includes("📂")) { ... }

    // 3. Check which layout mode is active
    const forceRadio = document.querySelector('input[name="layout-mode"][value="force"]');
    const isForceMode = forceRadio && forceRadio.checked;

    if (isForceMode) {
      // In force mode, allow new nodes to float
      const parentPos = network.getPositions([parentNodeId])[parentNodeId];
      nodesToLoad.forEach(n => {
         nodesDS.update({ id: n.id, x: parentPos.x, y: parentPos.y, fixed: false });
      });
    } else {
      // In tiered mode, re-lock the grid
      applyRigidGrid();
    }

    network.fit({ animation: { duration: 600, easingFunction: "easeInOutQuad" } });
  }
}

function collapseNode(parentNodeId) {
  // 1. Find all downstream children recursively
  const nodesToRemove = [];
  const edgesToRemove = [];

  function findChildrenRecursive(id) {
    // Get edges going OUT from this node
    const connectedEdges = edgesDS.get({
      filter: (e) => e.from === id
    });
    
    connectedEdges.forEach(edge => {
      edgesToRemove.push(edge.id);
      
      // Only remove the child node if it isn't connected to something else (Tree structure assumption)
      if (!nodesToRemove.includes(edge.to)) {
          nodesToRemove.push(edge.to);
          
          // RECURSE: Find children of this child
          findChildrenRecursive(edge.to);
          
          // Remove from expanded set if it was expanded
          expandedNodes.delete(edge.to);
      }
    });
  }

  findChildrenRecursive(parentNodeId);

  // 2. Remove from DataSets
  if (nodesToRemove.length > 0) {
    nodesDS.remove(nodesToRemove);
    edgesDS.remove(edgesToRemove);
    expandedNodes.delete(parentNodeId); // Mark parent as collapsed

    // 3. Refresh Layout
    const tieredRadio = document.querySelector('input[name="layout-mode"][value="tiered"]');
    if (tieredRadio && tieredRadio.checked) {
      applyRigidGrid();
    }
    
    network.fit({ animation: { duration: 600, easingFunction: "easeInOutQuad" } });
  }
}

// -------------------------------
// 4. Layout Algorithms
// -------------------------------

// A. Rigid Grid (Holori Style)
function applyRigidGrid() {
  const nodes = nodesDS.get();
  const levels = {};

  // Disable physics globally for the grid
  network.setOptions({ physics: { enabled: false } });

  // Group visible nodes by level
  nodes.forEach((node) => {
    if (!levels[node.level]) levels[node.level] = [];
    levels[node.level].push(node.id);
  });

  const levelKeys = Object.keys(levels).sort((a,b) => a - b);

  levelKeys.forEach((lvl) => {
    const ids = levels[lvl];
    const rowWidth = (ids.length - 1) * currentHorizontalSpacing;
    const startX = -rowWidth / 2;

    ids.forEach((id, index) => {
      nodesDS.update({
        id: id,
        x: startX + (index * currentHorizontalSpacing),
        y: lvl * VERTICAL_SPACING,
        fixed: true, // LOCK NODES
        physics: false
      });
    });
  });
}

// B. Force Directed (Physics Style)
function enableForceLayout() {
  // 1. Unfix all nodes so they can move
  const updates = nodesDS.get().map(n => ({
    id: n.id,
    fixed: false, // UNLOCK NODES
    physics: true
  }));
  nodesDS.update(updates);

  // 2. Enable Physics Engine
  network.setOptions({
    physics: {
      enabled: true,
      solver: "forceAtlas2Based",
      forceAtlas2Based: {
        gravitationalConstant: -100, // Negative repulsion
        springLength: 150,
        springConstant: 0.08,
        damping: 0.4,
        avoidOverlap: 1
      },
      stabilization: { enabled: false }
    }
  });
  
  network.stabilize(100);
}

// -------------------------------
// 5. Network Initialization
// -------------------------------
function initNetwork() {
  if (typeof RAW_NODES === 'undefined') {
    console.error("RAW_NODES not loaded.");
    return;
  }

  const allDecorated = decorateNodes(RAW_NODES);
  
  // INITIAL STATE: Only load Level 0 (Organization/Scope)
  const initialNodes = allDecorated.filter(n => n.level === 0);
  
  nodesDS = new vis.DataSet(initialNodes);
  edgesDS = new vis.DataSet([]); 

  const container = document.getElementById("mynetwork");
  const options = {
    layout: { improvedLayout: false }, 
    physics: { enabled: false }, // Default to Grid (Off)
    edges: {
      smooth: { 
        type: "cubicBezier", 
        forceDirection: "vertical", 
        roundness: 0.5 
      },
      color: "#cbd5e1",
      width: 1.5,
      arrows: { to: { enabled: false } }
    },
    nodes: { borderWidthSelected: 2 },
    interaction: { 
      hover: true, 
      navigationButtons: true, 
      keyboard: true,
      dragNodes: true
    }
  };

  network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, options);

  // CLICK HANDLER
  network.on("click", (params) => {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      const node = nodesDS.get(nodeId);

      // --- CHANGED: Use Toggle Logic ---
      toggleNode(nodeId);
      // ---------------------------------

      setActiveNodeHighlight(nodeId);

      if (node.group === "resource" || node.group === "aggregate") {
        showNodeDetails(node);
      } else {
        hideNodeDetails();
      }
    } else {
      clearActiveNodeHighlight();
      hideNodeDetails();
    }
  });

  // Apply Grid by default
  applyRigidGrid();
  
  initDetailsPanel();
  setupControls();
  
  network.on("zoom", (p) => {
    const el = document.getElementById("zoom-display");
    if(el) el.textContent = `Zoom: ${Math.round(network.getScale() * 100)}%`;
  });
}

// -------------------------------
// 6. UI: Controls & Details Panel
// -------------------------------
function setupControls() {
  // Spacing Slider
  const spacingRange = document.getElementById("spacing-range");
  if (spacingRange) {
    spacingRange.addEventListener("input", (e) => {
      currentHorizontalSpacing = parseInt(e.target.value, 10);
      const tieredRadio = document.querySelector('input[name="layout-mode"][value="tiered"]');
      if (tieredRadio && tieredRadio.checked) {
        applyRigidGrid();
      }
    });
  }

  // Layout Toggle Logic (FIXED)
  const layoutRadios = document.querySelectorAll('input[name="layout-mode"]');
  layoutRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "tiered") {
            applyRigidGrid();
        } else {
            enableForceLayout();
        }
    });
  });
}

function initDetailsPanel() {
  detailPanelEl = document.getElementById("node-detail-panel");
  detailTitleEl = document.getElementById("node-detail-title");
  detailSubtitleEl = document.getElementById("node-detail-subtitle");
  detailBodyEl = document.getElementById("node-detail-body");
  detailIconEl = document.getElementById("node-detail-icon");
  detailCloseEl = document.getElementById("node-detail-close");

  if (detailCloseEl) {
    detailCloseEl.addEventListener("click", () => {
      hideNodeDetails();
      clearActiveNodeHighlight();
    });
  }
}

function showNodeDetails(node) {
  if (!detailPanelEl || !node) return;
  
  detailTitleEl.textContent = (node.label || "").replace(/^[📂🏢]\s/, "");
  detailSubtitleEl.textContent = node.assetType || "";
  
  if (detailIconEl) {
    detailIconEl.style.display = node.image ? "block" : "none";
    detailIconEl.src = node.image || "";
  }

  // Generate Metadata Table
  let html = `<div class="node-detail-section-title">Details</div>`;
  const skip = ['id', 'label', 'title', 'image', 'shape', 'color', 'font', 'level', 'group', 'x', 'y', 'fixed', 'physics', '_baseColor', 'widthConstraint', 'shadow', 'shapeProperties', 'margin'];
  
  Object.keys(node).forEach(k => {
      if(skip.includes(k) || typeof node[k] === 'object') return;
      html += `<div class="node-detail-kv-row">
                 <div class="node-detail-kv-label">${k}</div>
                 <div class="node-detail-kv-value">${node[k]}</div>
               </div>`;
  });

  detailBodyEl.innerHTML = html;
  detailPanelEl.style.display = "block";
}

function hideNodeDetails() {
  if (detailPanelEl) detailPanelEl.style.display = "none";
}

// -------------------------------
// 7. Highlighting Logic
// -------------------------------
function setActiveNodeHighlight(nodeId) {
  const connectedNodes = network.getConnectedNodes(nodeId);
  const updates = nodesDS.get().map(n => {
    const isRelated = n.id === nodeId || connectedNodes.includes(n.id);
    return {
      id: n.id,
      color: { ...n._baseColor, opacity: isRelated ? 1.0 : 0.2 },
      font: { color: isRelated ? "#334155" : "#cbd5e1" }
    };
  });
  nodesDS.update(updates);
}

function clearActiveNodeHighlight() {
  const updates = nodesDS.get().map(n => ({
    id: n.id,
    color: { ...n._baseColor, opacity: 1.0 },
    font: { color: "#334155" }
  }));
  nodesDS.update(updates);
}

// Boot
window.addEventListener("DOMContentLoaded", initNetwork);