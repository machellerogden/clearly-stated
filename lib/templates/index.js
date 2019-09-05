'use strict';

const path = require('path');
const footer = require('./footer');

module.exports = (files) => `<!DOCTYPE html>
<html>
<body>

    <h1>Files</h1>

        <ul>
        ${(function printTree(tree) {
            if (Array.isArray(tree)) return tree.map(printTree).join('');
            let result = [];
            if (tree.type === 'directory') {
                result.push(`<li>${tree.name}<ul>`);
                result = [ ...result, printTree(tree.children) ];
                result.push(`</ul></li>`);
            } else if (tree.type === 'file') {
                result.push(`<li><a href="/preview/${path.join(tree.path)}">${tree.name}</a></li>`);
            }
            return result.join('');
           })(files.children)}
        </ul>

    <link rel="stylesheet" type="text/css" href="https://cdn.rawgit.com/tuzz/3331384/raw/738521e21dd1250c415f6bafa5f50c0cc3dda866/github.css" />

${footer}
</body>
</html>`;


