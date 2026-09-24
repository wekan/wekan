const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const read = file => fs.readFileSync(file, 'utf8');

test('runtime bundler rejects foreign architectures and preserves licensing', () => {
  const result = spawnSync('python3', ['-B', 'tests/bundle-node-runtime.py'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('Docker keeps libatomic outside the removable build dependencies', () => {
  const docker = read('Dockerfile');
  assert.match(docker, /apt-get install[^\n]*file libatomic1/);
  assert.doesNotMatch(docker.match(/ENV BUILD_DEPS="[^"]*"/)[0], /libatomic1/);
});
test('native and emulated Linux bundles both package their own runtime', () => {
  assert.match(read('releases/embed-verified-node.sh'), /python3 "\$here\/bundle-node-runtime.py" "\$dest" \|\| exit 1/);
  const emulated = read('releases/install-node-for-arch.sh');
  assert.match(emulated, /apt-install.sh[^\n]*libatomic1/);
  assert.match(emulated, /bundle-node-runtime.py" \/bundle\/node/);
  const launch = read('releases/ferretdb/start-wekan.sh');
  assert.match(launch, /export LD_LIBRARY_PATH="\$DIR\/node-runtime\$\{LD_LIBRARY_PATH:\+:\$LD_LIBRARY_PATH\}"/);
});
test('AppImage and Flatpak require the bundled library and preserve the bundle', () => {
  for (const name of ['AppImage', 'Flatpak']) {
    const workflow = read(`.github/workflows/${name}.yml`);
    assert.match(workflow, /for f in [^\n]*bundle\/node-runtime\/libatomic.so.1/);
    assert.match(workflow, /cp -a bundle /);
  }
});
test('Sandstorm includes and checks libatomic in its private library tree', () => {
  const source = read('sandstorm-src/build-deps.sh');
  assert.match(source, /libz.so.1 libatomic.so.1; do/);
  assert.match(source, /\[ -f "\$DEPS\/lib\/x86_64-linux-gnu\/libatomic.so.1" \] \|\|/);
  assert.match(source, /cp -L \/usr\/share\/doc\/libatomic1\/copyright/);
});
