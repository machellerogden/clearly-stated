// src/lib/layout.js

/**
 * assignLayers(adjacency, start)
 *
 * - Performs a BFS from `start` to assign each node a "layer" (vertical level).
 * - Returns a map of nodeId -> layerIndex.
 * - If your graph is truly acyclic, the BFS layering is straightforward.
 * - If there's a cycle, BFS still assigns layers, but you'll see repeated visits
 *   if you're not careful. We'll track visited to avoid infinite loops.
 */
export function assignLayers(adjacency, start) {
  const queue = [start];
  const visited = new Set([start]);
  const layerByNode = new Map();
  layerByNode.set(start, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    const currentLayer = layerByNode.get(current);

    const neighbors = adjacency.get(current) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        layerByNode.set(next, currentLayer + 1);
        queue.push(next);
      }
    }
  }

  return layerByNode;
}

/**
 * computePositions(layerByNode, { layerHeight = 120, nodeSpacing = 80, canvasWidth = 800, startY = 100 } = {})
 *
 * - Takes the map of nodeId -> layer (from assignLayers) and determines an (x, y) for each node.
 * - Returns a Map<nodeId, { x, y }> that you can feed into your existing drawing logic.
 * - We also handle orphan states by placing them in a special "orphan" layer
 *   after we've assigned BFS layers.
 */
export function computePositions(adjacency, layerByNode, {
  layerHeight = 120,
  nodeSpacing = 80,
  canvasWidth = 800,
  startY = 100,
} = {}) {
  // 1) Group nodes by assigned layer
  const layers = new Map(); // layerIndex -> nodeId[]
  for (const [nodeId, layer] of layerByNode.entries()) {
    if (!layers.has(layer)) {
      layers.set(layer, []);
    }
    layers.get(layer).push(nodeId);
  }

  // 2) Identify "orphans" - nodes not in layerByNode
  const orphanNodes = [];
  for (const nodeId of adjacency.keys()) {
    if (!layerByNode.has(nodeId)) {
      orphanNodes.push(nodeId);
    }
  }
  // We'll place orphans in a separate layer, after the max BFS layer
  let maxLayer = 0;
  if (layers.size > 0) {
    maxLayer = Math.max(...layers.keys());
  }
  if (orphanNodes.length > 0) {
    layers.set(maxLayer + 1, orphanNodes);
  }

  // 3) For each layer, position nodes horizontally
  const positions = new Map();
  for (const [layer, nodeIds] of layers.entries()) {
    // Sort for stable ordering, or leave as is
    nodeIds.sort();
    const totalWidth = (nodeIds.length - 1) * nodeSpacing;
    const startX = (canvasWidth / 2) - (totalWidth / 2);
    const y = startY + layer * layerHeight;

    nodeIds.forEach((nodeId, index) => {
      const x = startX + index * nodeSpacing;
      positions.set(nodeId, { x, y });
    });
  }

  return positions;
}
