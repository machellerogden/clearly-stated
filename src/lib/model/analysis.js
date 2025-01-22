/**
 * buildAdjacency(definition)
 *
 * Returns: {
 *   adjacency: Map<string, string[]>,
 *   start: string
 * }
 */
export function buildAdjacency(definition) {
  const { StartAt, States } = definition;
  const adjacency = new Map();

  function addEdge(from, to) {
    if (!from || !to) return;
    if (!adjacency.has(from)) {
      adjacency.set(from, []);
    }
    adjacency.get(from).push(to);
  }

  function processState(stateName, stateDef) {
    switch (stateDef.Type) {
      case 'Task':
      case 'Pass':
      case 'Wait':
        // Add the 'Next' edge if present
        if (stateDef.Next) addEdge(stateName, stateDef.Next);

        // For 'Catch' clauses, each leads to Next
        if (Array.isArray(stateDef.Catch)) {
          for (const c of stateDef.Catch) {
            addEdge(stateName, c.Next);
          }
        }
        break;

      case 'Choice':
        // Each Choice clause leads to a Next
        if (Array.isArray(stateDef.Choices)) {
          for (const choice of stateDef.Choices) {
            if (choice.Next) addEdge(stateName, choice.Next);
          }
        }
        // There's also an optional Default
        if (stateDef.Default) {
          addEdge(stateName, stateDef.Default);
        }
        break;

      case 'Parallel':
        // Each branch is a nested state machine
        if (Array.isArray(stateDef.Branches)) {
          for (const branch of stateDef.Branches) {
            // Build adjacency for the branch
            const sub = buildAdjacency(branch);
            // Link the parallel state to the branch's StartAt
            addEdge(stateName, branch.StartAt);
            // Merge sub-graph adjacency
            mergeAdjacency(adjacency, sub.adjacency);
          }
        }
        // Then link the parallel state to its "Next"
        if (stateDef.Next) addEdge(stateName, stateDef.Next);
        break;

      case 'Map':
        // Map may have an ItemProcessor or Iterator that is a sub-state-machine
        const subMachine = stateDef.ItemProcessor ?? stateDef.Iterator;
        if (subMachine) {
          const sub = buildAdjacency(subMachine);
          // Link from the Map state to the sub-machine's StartAt
          addEdge(stateName, subMachine.StartAt);
          // Merge adjacency
          mergeAdjacency(adjacency, sub.adjacency);
        }
        // Also link to Next
        if (stateDef.Next) addEdge(stateName, stateDef.Next);
        break;

      case 'Succeed':
      case 'Fail':
      default:
        // No Next (terminal state)
        break;
    }
  }

  // Populate adjacency from each state
  for (const [stateName, stateDef] of Object.entries(States)) {
    if (!adjacency.has(stateName)) {
      adjacency.set(stateName, []);
    }
    processState(stateName, stateDef);
  }

  return { adjacency, start: StartAt };
}

/**
 * mergeAdjacency(target, source)
 *
 * Merges edges from `source` into `target`.
 * target and source are both Map<string, string[]>.
 */
function mergeAdjacency(target, source) {
  for (const [key, edges] of source.entries()) {
    if (!target.has(key)) {
      target.set(key, []);
    }
    target.set(key, [ ...new Set([...target.get(key), ...edges]) ]);
  }
}

/**
 * getReachableStates(adjacency, start)
 *
 * @param {Map<string, string[]>} adjacency - adjacency list
 * @param {string} start - starting node
 * @returns {Set<string>} all reachable states
 */
export function getReachableStates(adjacency, start) {
  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adjacency.get(current) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }
  }

  return visited;
}

/**
 * detectCycles(adjacency)
 *
 * @param {Map<string, string[]>} adjacency
 * @returns {string[][]} an array of cycles, each cycle is an array of state IDs
 */
export function detectCycles(adjacency) {
  const visited = new Set();
  const stack = new Set();
  const allCycles = [];

  /**
   * dfs helper
   */
  function dfs(node, path) {
    visited.add(node);
    stack.add(node);
    path.push(node);

    const neighbors = adjacency.get(node) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        // Continue DFS
        dfs(next, path);
      } else if (stack.has(next)) {
        // Found a cycle - record it
        const cycleStartIndex = path.indexOf(next);
        const cyclePath = path.slice(cycleStartIndex);
        allCycles.push(cyclePath);
      }
    }

    stack.delete(node);
    path.pop();
  }

  // Start DFS from every node in adjacency
  for (const node of adjacency.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return allCycles;
}
