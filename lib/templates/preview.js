'use strict';

const footer = require('./footer');

// https://github.com/dagrejs/dagre-d3/wiki

module.exports = dot =>
`<!DOCTYPE html>
<meta charset="utf-8">
<body>
<script src="//d3js.org/d3.v4.min.js"></script>
<script src="https://dagrejs.github.io/project/graphlib-dot/v0.6.3/graphlib-dot.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/dagre-d3/0.6.3/dagre-d3.min.js"></script>

<svg width="800" height="600">
  <g></g>
</svg>

<script>
const svg = d3.select('svg');
const inner = d3.select('svg g');
const zoom = d3.zoom().on('zoom', () => {
  inner.attr('transform', d3.event.transform);
});
svg.call(zoom);
const render = dagreD3.render();
const g = graphlibDot.read(\`${dot}\`);
if (!g.graph().hasOwnProperty("marginx") &&
    !g.graph().hasOwnProperty("marginy")) {
  g.graph().marginx = 20;
  g.graph().marginy = 20;
}
g.graph().transition = selection =>
  selection.transition().duration(500);

d3.select("svg g").call(render, g);

</script>
<!--
<script src="https://unpkg.com/viz.js@1.8.1/viz.js" type="javascript/worker"></script>
<script src="https://unpkg.com/d3-graphviz@2.6.1/build/d3-graphviz.js"></script>
<div id="graph" style="text-align: center;"></div>
<script>
d3.select("#graph").graphviz()
    .fade(false)
    .renderDot(\`${dot}\`);
</script>
-->
${footer}
</body>
</html>`;
