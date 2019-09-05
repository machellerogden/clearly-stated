'use strict';

const footer = require('./footer');

module.exports = dot =>
`<!DOCTYPE html>
<meta charset="utf-8">
<body>
<script src="//d3js.org/d3.v4.min.js"></script>
<script src="https://unpkg.com/viz.js@1.8.1/viz.js" type="javascript/worker"></script>
<script src="https://unpkg.com/d3-graphviz@2.6.1/build/d3-graphviz.js"></script>
<div id="graph" style="text-align: center;"></div>
<script>
d3.select("#graph").graphviz()
    .fade(false)
    .renderDot(\`${dot}\`);
</script>
${footer}
</body>
</html>`;
