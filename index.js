'use strict';

const fs = require('fs');
const path = require('path');
const readdirp = require('readdirp');
const dirTree = require('directory-tree');
const { readOne } = require('dottle');

const express = require('express');
const app = express();
if (process.env.NODE_ENV != 'production') app.use(require('cors')());

const {
    index,
    preview
} = require('require-dir')('./lib/templates');

let clientId = 0;
const clients = {};

app.get('/events/', (req, res) => {
    req.socket.setTimeout(43200000); 
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('\n');
    ((clientId) => {
        clients[clientId] = res;
        req.on('close', () => delete clients[clientId]);
    })(++clientId);
});

const chokidarOptions =
  process.env.DOCKER === 'true'
    ? { usePolling: true, awaitWriteFinish: { stabilityThreshold: 1000 } }
    : {};

const watcher = require('chokidar').watch(path.join(__dirname, 'files'), chokidarOptions);

watcher.on('ready', () => {
    watcher.on('all', () => {
        console.log('file event detected. sending refresh.');
        for (let id in clients) {
            clients[id].write('data: "refresh"\n\n');
        }
    });
});

app.get('/preview/*', (req, res) => {
    const f = req.params[0] || '';
    fs.readFile(f, 'utf8', async (err, dots) => {
        res.send(preview(await readOne(dots)));
    });
});

const fileTree = () => dirTree('./files/', { exclude: [ /\.DS_Store/ ] });

app.get('/files', (req, res) => res.send(fileTree()));
app.get('/', (req, res) => res.send(index(fileTree())));

app.listen(process.env.PORT || 8888);
