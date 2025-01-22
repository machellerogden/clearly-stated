// test/analysis.test.js
import { describe, it, expect } from 'vitest'
import {
  buildAdjacency,
  getReachableStates,
  detectCycles
} from '../src/lib/model/analysis.js'

describe('buildAdjacency', () => {
  it('should build adjacency for a simple Next chain', () => {
    const definition = {
      StartAt: 'A',
      States: {
        A: { Type: 'Task', Next: 'B' },
        B: { Type: 'Task', End: true },
      },
    };
    const { adjacency, start } = buildAdjacency(definition);
    expect(start).toBe('A');
    expect(Array.from(adjacency.keys())).toEqual(['A', 'B']);
    expect(adjacency.get('A')).toEqual(['B']);
    expect(adjacency.get('B')).toEqual([]);
  });

  it('should handle Choice states', () => {
    const definition = {
      StartAt: 'ChoiceState',
      States: {
        ChoiceState: {
          Type: 'Choice',
          Choices: [
            { Next: 'X' },
            { Next: 'Y' }
          ],
          Default: 'Z'
        },
        X: { Type: 'Task', End: true },
        Y: { Type: 'Task', End: true },
        Z: { Type: 'Task', End: true },
      },
    };
    const { adjacency } = buildAdjacency(definition);
    expect(adjacency.get('ChoiceState').sort()).toEqual(['X', 'Y', 'Z']);
  });

  // Add more tests for Parallel, Map, Catch, etc.
});

describe('getReachableStates', () => {
  it('should find reachable states in a linear chain', () => {
    const definition = {
      StartAt: 'A',
      States: {
        A: { Type: 'Task', Next: 'B' },
        B: { Type: 'Task', Next: 'C' },
        C: { Type: 'Task', End: true },
        D: { Type: 'Task', End: true } // unreachable
      },
    };
    const { adjacency, start } = buildAdjacency(definition);
    const reachable = getReachableStates(adjacency, start);
    expect(reachable).toEqual(new Set(['A', 'B', 'C']));
  });
});

describe('detectCycles', () => {
  it('should detect a simple cycle', () => {
    const definition = {
      StartAt: 'A',
      States: {
        A: { Type: 'Task', Next: 'B' },
        B: { Type: 'Task', Next: 'A' },
      },
    };
    const { adjacency } = buildAdjacency(definition);
    const cycles = detectCycles(adjacency);
    // We expect something like [ [ 'A', 'B' ] ] or [ [ 'B', 'A' ] ]
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('should detect no cycles in a linear chain', () => {
    const definition = {
      StartAt: 'A',
      States: {
        A: { Type: 'Task', Next: 'B' },
        B: { Type: 'Task', End: true },
      },
    };
    const { adjacency } = buildAdjacency(definition);
    const cycles = detectCycles(adjacency);
    expect(cycles).toHaveLength(0);
  });
});
