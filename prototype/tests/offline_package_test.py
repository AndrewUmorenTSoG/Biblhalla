"""Validate the standalone launch artifact, not merely source declarations."""
from pathlib import Path
import base64
import json
import re
import struct

root = Path(__file__).resolve().parents[1]
html = (root / 'PLAY.html').read_text()
assert 'INLINE_STYLE' not in html and 'INLINE_DATA' not in html and 'INLINE_SCRIPTS' not in html
assert "connect-src 'none'" in html
assert not re.search(r'<(?:script|link|img|iframe|audio|video)\b[^>]+(?:src|href)=["\']https?://', html)
assert not re.search(r'\b(?:fetch|WebSocket|XMLHttpRequest|importScripts)\s*\(', html)
images = re.findall(r'data:image/png;base64,([A-Za-z0-9+/=]+)', html)
assert len(images) == 5, len(images)
for data in images:
    raw = base64.b64decode(data, validate=True)
    assert raw[:8] == b'\x89PNG\r\n\x1a\n'
    width, height = struct.unpack('>II', raw[16:24])
    assert width > 0 and height > 0
atlas = json.loads((root / 'assets/atlas.json').read_text())
for hero in ('david', 'samson'):
    raw = (root / 'assets' / (hero + '.png')).read_bytes()
    width, height = struct.unpack('>II', raw[16:24])
    for pose in ('idle', 'run1', 'run2', 'jump', 'light', 'heavy'):
        frame = atlas[hero][pose]
        assert frame['x'] >= 0 and frame['y'] >= 0 and frame['w'] > 0 and frame['h'] > 0
        assert frame['x'] + frame['w'] <= width and frame['y'] + frame['h'] <= height
assert (root / 'iPadApp/OfflineGame.xcodeproj/project.pbxproj').is_file()
project = (root / 'iPadApp/OfflineGame.xcodeproj/project.pbxproj').read_text()
assert 'PBXResourcesBuildPhase' in project and 'path = ../PLAY.html' in project
assert len(re.findall(r'isa = PBXNativeTarget', project)) == 1
print(json.dumps({'self_contained': True, 'embedded_pngs': 5, 'atlas_frames': 12, 'external_runtime_resources': 0, 'outbound_connections_blocked': True, 'ipad_source_present_not_compiled': True}, indent=2))
