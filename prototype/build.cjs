// Portable equivalent of build.py; uses only Node's standard library.
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assets = Object.fromEntries(['david', 'samson', 'elah', 'susa', 'builders'].map(name => [name, 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', name + '.png')).toString('base64')]));
const atlas = JSON.parse(read('assets/atlas.json'));
const scripts = ['simulation.js', 'input.js', 'renderer.js', 'audio.js', 'main.js'].map(name => read('src/' + name)).join('\n');
const html = read('src/shell.html').replace('/* INLINE_STYLE */', () => read('src/style.css')).replace('/* INLINE_DATA */', () => 'window.COVENANT_ASSETS=' + JSON.stringify(assets) + ';\nwindow.COVENANT_ATLAS=' + JSON.stringify(atlas) + ';').replace('/* INLINE_SCRIPTS */', () => scripts);
fs.writeFileSync(path.join(root, 'PLAY.html'), html, 'utf8');
console.log('Built PLAY.html:', Buffer.byteLength(html), 'bytes');
