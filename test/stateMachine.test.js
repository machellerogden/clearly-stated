// test/stateMachine.test.js
import { describe, it, expect } from 'vitest'
import { parseStateMachine, hasEndState } from '../src/lib/model/stateMachine.js'

describe('parseStateMachine', () => {
  it('should parse a valid definition', () => {
    const definition = {
      StartAt: 'A',
      States: {
        A: { Type: 'Task', Next: 'B' },
        B: { Type: 'Task', End: true }
      },
    }

    const parsed = parseStateMachine(definition)
    expect(parsed).toBeDefined()
    expect(parsed.start).toBe('A')
    expect(parsed.states).toHaveLength(2)
    expect(parsed.states[0]).toEqual(
      expect.objectContaining({ id: 'A', Type: 'Task', Next: 'B' })
    )
  })

  it('should throw if definition is missing "StartAt"', () => {
    const definition = {
      States: {
        A: { Type: 'Task', End: true }
      },
    }
    expect(() => parseStateMachine(definition)).toThrowError(/must have "StartAt"/i)
  })

  it('should throw if definition is missing "States"', () => {
    const definition = {
      StartAt: 'A'
    }
    expect(() => parseStateMachine(definition)).toThrowError(/must have "StartAt" and "States"/i)
  })

  it('should throw if "StartAt" references a non-existing state', () => {
    const definition = {
      StartAt: 'X',
      States: {
        A: { Type: 'Task', End: true }
      },
    }
    expect(() => parseStateMachine(definition)).toThrowError(/not found in "States"/i)
  })
})

describe('hasEndState', () => {
  it('returns true if any state has End: true', () => {
    const parsed = {
      start: 'A',
      states: [
        { id: 'A', Type: 'Task', Next: 'B' },
        { id: 'B', Type: 'Task', End: true },
      ],
    }
    expect(hasEndState(parsed)).toBe(true)
  })

  it('returns false if no state meets end criteria', () => {
    const parsed = {
      start: 'A',
      states: [
        { id: 'A', Type: 'Task', Next: 'B' },
        { id: 'B', Type: 'Task', Next: 'C' },
      ],
    }
    expect(hasEndState(parsed)).toBe(false)
  })
})
