<script>
  import { onMount, onDestroy } from 'svelte'
  import { assignLayers, computePositions } from './view/layout.js'
  import * as PIXI from 'pixi.js'

  /**
   * PROPS
   */
  let { adjacency, nodeData = {}, start, detailLevel = 0 } = $props()

  /**
   * PIXI APP
   */
  let app = $state(null)
  let container

  // Our main containers
  let graphContainer
  let nodesContainer
  let edgesContainer

  // Data references
  let nodeGraphics = new Map()  // nodeId -> Container
  let edgeGraphics = []
  let positions = new Map()

  // Pan & zoom
  let isPanning = false
  let lastPointerPosition = { x: 0, y: 0 }
  let scaleFactor = 1
  const MIN_SCALE = 0.4
  const MAX_SCALE = 2.5
  const ZOOM_STEP = 0.1

  /**
   * ON MOUNT
   */
  onMount(async () => {
    app = new PIXI.Application()

    // PixiJS v8 style
    await app.init({
        width: 900,
        height: 600,
        background: '#f1f3f5', // a light gray background
        autoDensity: true,
        antialias: true,
        resolution: window.devicePixelRatio
    })

    container.appendChild(app.canvas)

    // Create top-level containers
    graphContainer = new PIXI.Container()
    nodesContainer = new PIXI.Container()
    edgesContainer = new PIXI.Container()

    graphContainer.addChild(edgesContainer)
    graphContainer.addChild(nodesContainer)
    app.stage.addChild(graphContainer)

    // Layout, draw, interactivity
    layoutNodes()
    drawEdges()
    drawNodes()
    enableInteractivity()

    // Pan & zoom events
    app.canvas.addEventListener('pointerdown', onPointerDown)
    app.canvas.addEventListener('pointermove', onPointerMove)
    app.canvas.addEventListener('pointerup', onPointerUp)
    app.canvas.addEventListener('pointercancel', onPointerUp)
    app.canvas.addEventListener('pointerout', onPointerUp)
    app.canvas.addEventListener('wheel', onWheel, { passive: false })
  })

  /**
   * ON DESTROY
   */
  onDestroy(() => {
    if (app?.canvas) {
      app.canvas.removeEventListener('pointerdown', onPointerDown)
      app.canvas.removeEventListener('pointermove', onPointerMove)
      app.canvas.removeEventListener('pointerup', onPointerUp)
      app.canvas.removeEventListener('pointercancel', onPointerUp)
      app.canvas.removeEventListener('pointerout', onPointerUp)
      app.canvas.removeEventListener('wheel', onWheel)
    }
    app?.destroy(true)
  })

  /**
   * RE-DRAW on adjacency/detail changes
   */
  $effect(() => {
    if (!app || !nodesContainer || !edgesContainer) return

    edgesContainer?.removeChildren?.()
    nodesContainer?.removeChildren?.()
    nodeGraphics.clear()
    edgeGraphics.forEach(e => e.destroy())
    edgeGraphics = []

    drawEdges()
    drawNodes()
    enableInteractivity()
  })

  /**
   * LAYOUT
   */
  function layoutNodes() {
    const layerByNode = assignLayers(adjacency, start)
    positions = computePositions(adjacency, layerByNode, {
      layerHeight: 140,
      nodeSpacing: 130,
      canvasWidth: 900,
      startY: 80
    })
  }

  /**
   * DRAW NODES
   * - Each node is a container with a rounded rectangle background
   * - We apply a drop shadow filter to the container
   */
  function drawNodes() {
    for (const nodeId of adjacency.keys()) {
      const pos = positions.get(nodeId)
      if (!pos) continue

      // Node container
      const nodeContainer = new PIXI.Container()

      // ROUNDED RECT background
      // We'll center it on (0,0) so text is easily anchored
      const width = detailLevel >= 2 ? 160 : 100
      const height = 44
      const cornerRadius = 8

      // Choose fill color based on node type
      const nodeType = nodeData[nodeId]?.Type
      let fillColor = 0xffffff // default white
      let strokeColor = 0xdcdcdc // a light gray border
      if (nodeType === 'Choice') {
        fillColor = 0xffedd5 // a pale orange
        strokeColor = 0xfaa154
      } else if (nodeType === 'Succeed' || nodeType === 'Fail') {
        fillColor = 0xe8ffec // a pale green
        strokeColor = 0x5bae76
      } else if (nodeType === 'Task') {
        fillColor = 0xeff6ff // a pale blue
        strokeColor = 0x9ec2f4
      }

      const background = new PIXI.Graphics()
      background
        .setStrokeStyle(1, strokeColor, 1)  // 1px stroke, colored
        .setFillStyle(fillColor, 1)         // fill with chosen color
        .roundRect(-width/2, -height/2, width, height, cornerRadius)
        .fill()
        .stroke()

      nodeContainer.filters = []

      nodeContainer.addChild(background)

      // Node label
      if (detailLevel >= 1) {
        const labelStyle = {
          fill: '#333333',
          fontSize: detailLevel === 1 ? 14 : 18,
          fontFamily: 'Inter, sans-serif'
        }
        const label = new PIXI.Text({
          text: nodeId,
          style: labelStyle
        })
        label.anchor.set(0.5, 0.5) // center label in the rect
        nodeContainer.addChild(label)

        if (detailLevel >= 2) {
          // Node type text
          const typeStyle = {
            fill: '#555555',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif'
          }
          const typeText = new PIXI.Text({
            text: nodeType || 'Task',
            style: typeStyle
          })
          // place below the main label
          typeText.anchor.set(0.5, -0.1)
          nodeContainer.addChild(typeText)
        }
      }

      // Position container
      nodeContainer.x = pos.x
      nodeContainer.y = pos.y

      // Interactivity
      nodeContainer.interactive = true
      nodeContainer.buttonMode = true

      nodesContainer.addChild(nodeContainer)
      nodeGraphics.set(nodeId, nodeContainer)
    }
  }

  /**
   * DRAW EDGES
   * - We'll draw a cubic Bézier curve with a subtle color
   * - Then place a small arrow at the end
   */
  function drawEdges() {
    for (const [src, targets] of adjacency.entries()) {
      const srcPos = positions.get(src)
      if (!srcPos) continue

      for (const dst of targets) {
        const dstPos = positions.get(dst)
        if (!dstPos) continue

        const g = new PIXI.Graphics()
        // A nice subtle color for edges
        g.setStrokeStyle(2, 0x999999, 1)

        // We'll do a simple cubic curve:
        // control1 = (sx, (sy+dy)/2)
        // control2 = (dx, (sy+dy)/2)
        // to produce a gentle arch
        const sx = srcPos.x
        const sy = srcPos.y
        const dx = dstPos.x
        const dy = dstPos.y

        const cx1 = sx
        const cy1 = (sy + dy) / 2
        const cx2 = dx
        const cy2 = (sy + dy) / 2

        // Move to start
        g.moveTo(sx, sy)
        // Draw cubic curve
        g.bezierCurveTo(cx1, cy1, cx2, cy2, dx, dy)
        g.stroke()

        // Draw arrow near the end
        drawArrow(g, sx, sy, dx, dy)

        edgesContainer.addChild(g)
        edgeGraphics.push(g)
      }
    }
  }

  /**
   * drawArrow(g, sx, sy, dx, dy)
   * Just a small arrow at the line's endpoint
   * We'll approximate angle by direct line from start->end
   */
  function drawArrow(g, sx, sy, dx, dy) {
    // arrow style: 8px arrow
    const arrowLength = 10
    const angle = Math.atan2(dy - sy, dx - sx)
    g.moveTo(dx, dy)
    g.lineTo(
      dx - arrowLength * Math.cos(angle - 0.3),
      dy - arrowLength * Math.sin(angle - 0.3)
    )
    g.moveTo(dx, dy)
    g.lineTo(
      dx - arrowLength * Math.cos(angle + 0.3),
      dy - arrowLength * Math.sin(angle + 0.3)
    )
    g.stroke()
  }

  /**
   * enableInteractivity()
   */
  function enableInteractivity() {
    nodeGraphics.forEach((nodeContainer, nodeId) => {
      nodeContainer.on('pointerover', () => {
        nodeContainer.scale.set(1.03)
      })

      nodeContainer.on('pointerout', () => {
        nodeContainer.scale.set(1.0)
      })

      nodeContainer.on('pointerdown', () => {
        console.log(`Clicked node: ${nodeId}`)
      })
    })
  }

  /**
   * =========================
   *      PAN & ZOOM
   * =========================
   */
  function onPointerDown(e) {
    isPanning = true
    lastPointerPosition = { x: e.clientX, y: e.clientY }
  }

  function onPointerMove(e) {
    if (!isPanning) return
    const dx = e.clientX - lastPointerPosition.x
    const dy = e.clientY - lastPointerPosition.y
    graphContainer.x += dx
    graphContainer.y += dy
    lastPointerPosition = { x: e.clientX, y: e.clientY }
  }

  function onPointerUp() {
    isPanning = false
  }

  function onWheel(e) {
    e.preventDefault()
    const direction = e.deltaY > 0 ? -1 : 1
    let newScale = scaleFactor + direction * ZOOM_STEP
    newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE)
    scaleFactor = newScale
    graphContainer.scale.set(scaleFactor)
  }
</script>

<!-- Container -->
<div bind:this={container} style="width: 100%; height: 100%;">
</div>

<style>
  :global(canvas) {
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
  }
</style>
