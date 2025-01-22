// test/canvasComponent.test.js
import { describe, it, expect } from 'vitest'
// Possibly use a library like @testing-library/svelte if you want to do
// DOM-based or snapshot tests
import { render } from '@testing-library/svelte'
import Canvas from '../src/lib/Canvas.svelte'

describe('Canvas.svelte', () => {
  it('renders without crashing', async () => {
    const adjacency = new Map([
      ['A', ['B']],
      ['B', []],
    ])
    const { container } = render(Canvas, {
      adjacency,
      nodeData: { A: { Type: 'Task' }, B: { Type: 'Succeed' } },
      start: 'A',
      detailLevel: 1,
    })
    expect(container).toBeTruthy()
  })
})
