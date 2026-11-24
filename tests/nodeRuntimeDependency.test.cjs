const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const read = file => fs.readFileSync(file, 'utf8');

test('runtime bundler rejects foreign architectures and preserves licensing', () => {
  const result = spawnSync('python3', ['-B', 'tests/bundle-node-runtime.py'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('Docker gives every platform libatomic and the C++ runtime, which distroless base-nossl lacks and node needs', () => {
  const docker = read('Dockerfile');
  // Unpacked from Debian 13 for the target CPU, with its dpkg record, then
  // copied over the distroless (or, for 386, the assembled) root.
  assert.match(docker, /^unpack \/extra gcc-14-base libgcc-s1 libstdc\+\+6 libatomic1$/m);
  assert.match(docker, /^COPY --from=runtime-root \/extra\/ \/$/m);
  assert.ok(docker.indexOf('COPY --from=runtime-root /extra/ /') > docker.lastIndexOf('\nFROM '), 'into the image itself');
  assert.doesNotMatch(docker, /apt-get (?:remove|purge)[^\n]*libatomic1/);
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
    // AppImage also wraps the musl bundles, whose node-runtime holds GCC's
    // C++ runtime instead; every glibc bundle must still carry libatomic.
    // Between the two, the musl branch adds every other library its Node.js
    // NEEDs (libatomic on x86-64, v12.53) - a block that only appends to
    // $required, so the glibc requirement still reaches the check loop.
    assert.match(workflow, name === 'AppImage'
      ? /else\n\s+required="\$required bundle\/node-runtime\/libatomic\.so\.1"\n\s+fi\n(?:(?!\s+required=")[^\n]*\n|\s+required="\$required [^\n]*\n)*?\s+for f in \$required/
      : /for f in [^\n]*bundle\/node-runtime\/libatomic.so.1/);
    assert.match(workflow, /cp -a bundle /);
  }
});
test('Sandstorm includes and checks libatomic in its private library tree', () => {
  const source = read('sandstorm-src/build-deps.sh');
  assert.match(source, /libz.so.1 libatomic.so.1; do/);
  assert.match(source, /\[ -f "\$DEPS\/lib\/x86_64-linux-gnu\/libatomic.so.1" \] \|\|/);
  assert.match(source, /cp -L \/usr\/share\/doc\/libatomic1\/copyright/);
});
