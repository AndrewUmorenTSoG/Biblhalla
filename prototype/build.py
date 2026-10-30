"""Rebuild PLAY.html using Python's standard library; no network or packages."""
from pathlib import Path
import base64
import json

root = Path(__file__).resolve().parent
assets = {
    name: 'data:image/png;base64,' + base64.b64encode((root / 'assets' / (name + '.png')).read_bytes()).decode('ascii')
    for name in ('david', 'samson', 'elah', 'susa', 'builders')
}
atlas = json.loads((root / 'assets/atlas.json').read_text())
scripts = '\n'.join((root / 'src' / name).read_text() for name in ('simulation.js', 'input.js', 'renderer.js', 'audio.js', 'main.js'))
html = (root / 'src/shell.html').read_text()
html = html.replace('/* INLINE_STYLE */', (root / 'src/style.css').read_text())
html = html.replace('/* INLINE_DATA */', 'window.COVENANT_ASSETS=' + json.dumps(assets) + ';\nwindow.COVENANT_ATLAS=' + json.dumps(atlas) + ';')
html = html.replace('/* INLINE_SCRIPTS */', scripts)
(root / 'PLAY.html').write_text(html, encoding='utf-8')
print('Built PLAY.html:', (root / 'PLAY.html').stat().st_size, 'bytes')
