// Node equivalent of tests/offline_package_test.py.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'PLAY.html'), 'utf8');
assert(!/INLINE_STYLE|INLINE_DATA|INLINE_SCRIPTS/.test(html));
assert(html.includes("connect-src 'none'"));
assert(!/<(?:script|link|img|iframe|audio|video)\b[^>]+(?:src|href)=["']https?:\/\//.test(html));
assert(!/\b(?:fetch|WebSocket|XMLHttpRequest|importScripts)\s*\(/.test(html));
const images = [...html.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)];
assert.equal(images.length, 5);
for (const image of images) {
  const raw = Buffer.from(image[1], 'base64');
  assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(raw.readUInt32BE(16) > 0 && raw.readUInt32BE(20) > 0);
}
const atlas = JSON.parse(fs.readFileSync(path.join(root, 'assets/atlas.json'), 'utf8'));
for (const hero of ['david', 'samson']) {
  const raw = fs.readFileSync(path.join(root, 'assets', hero + '.png'));
  for (const pose of ['idle', 'run1', 'run2', 'jump', 'light', 'heavy']) {
    const frame = atlas[hero][pose];
    assert(frame.x >= 0 && frame.y >= 0 && frame.w > 0 && frame.h > 0);
    assert(frame.x + frame.w <= raw.readUInt32BE(16) && frame.y + frame.h <= raw.readUInt32BE(20));
  }
}
const project = fs.readFileSync(path.join(root, 'iPadApp/OfflineGame.xcodeproj/project.pbxproj'), 'utf8');
assert(project.includes('PBXResourcesBuildPhase') && project.includes('path = ../PLAY.html'));
assert.equal([...project.matchAll(/isa = PBXNativeTarget/g)].length, 1);
console.log(JSON.stringify({self_contained: true, embedded_pngs: 5, atlas_frames: 12, external_runtime_resources: 0, outbound_connections_blocked: true, ipad_source_present_not_compiled: true}, null, 2));
