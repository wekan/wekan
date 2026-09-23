const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const scratch = path.join(root, '.tools/tmp');
fs.mkdirSync(scratch, {recursive: true});
const mongo = (version, arches = ['x86_64', 'aarch64']) => ({version, downloads: arches.map(arch => ({archive: {
  url: `https://fastdl.mongodb.org/linux/mongodb-linux-${arch}-ubuntu2204-${version}.tgz`,
}}))});
function fixture() {
  const dir = fs.mkdtempSync(path.join(scratch, 'dependency-versions-'));
  for (const file of ['Dockerfile', 'snapcraft.yaml', 'Stackerfile.yml', 'package.json', 'package-lock.json',
    'sandstorm-pkgdef.capnp', '.meteor/release', 'docs/Platforms/Propietary/OS/Windows/Offline.md',
    'releases/version.sh', 'releases/dependency-versions.py', 'releases/update-website-version-info.sh',
    'releases/use-release-npm.sh']) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), {recursive: true});
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }
  fs.writeFileSync(path.join(dir,'releases/example.sh'), 'NODE_TAR="node-v26.1.0-linux-${NODE_ARCH}.tar.xz"\nhttps://fastdl.mongodb.org/linux/mongodb-linux-${MONGO_ARCH}-ubuntu2204-7.0.1.tgz\n');
  const metadata = {
    node: [{version: 'v26.99.0', files: ['linux-x64', 'linux-arm64']},
      {version: 'v26.100.0', files: ['linux-x64']}, {version: 'v27.0.0', files: ['linux-x64','linux-arm64']}],
    mongo: {versions: [mongo('7.0.99'), mongo('7.0.100', ['x86_64']), mongo('7.3.4'), mongo('8.0.1'), mongo('7.0.101-rc0')]},
    npm: {version: '12.99.0'},
  };
  for (const [name, data] of Object.entries(metadata)) fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(data));
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.writeFileSync(path.join(dir, 'bin/curl'), `#!/usr/bin/env python3
import os,sys
from pathlib import Path
if '--head' in sys.argv:
    print('404' if os.environ.get('FAIL_HEAD') else '200'); sys.exit(0)
u=sys.argv[-1]
name={'https://nodejs.org/dist/index.json':'node','https://downloads.mongodb.org/full.json':'mongo','https://registry.npmjs.org/npm/latest':'npm'}[u]
print(Path(name+'.json').read_text())
`, {mode: 0o755});
  return dir;
}
function run(dir, extra={}) {
  return spawnSync('bash', ['releases/version.sh', '11.91', '11.99'], {cwd: dir, encoding:'utf8',
    env: {...process.env, TMPDIR: scratch, PATH: path.join(dir,'bin')+':'+process.env.PATH,
      RELEASE_SKIP_DEP_DOWNLOAD:'1', USE_LOCAL_DEP_VERSIONS:'0', ...extra}});
}
test('real version bump selects supported pairs and updates website manifest', () => {
  const dir=fixture();
  try {
    const result=run(dir); assert.equal(result.status,0,result.stdout+result.stderr);
    const docker=fs.readFileSync(path.join(dir,'Dockerfile'),'utf8');
    assert.match(docker,/NODE_VERSION=v26\.99\.0/); assert.match(docker,/NPM_VERSION=12\.99\.0/);
    const snap=fs.readFileSync(path.join(dir,'snapcraft.yaml'),'utf8');
    assert.match(snap,/ubuntu2204-7\.0\.99\.tgz/);
    const refs=fs.readFileSync(path.join(dir,'releases/example.sh'),'utf8');
    assert.ok(refs.includes('node-v26.99.0-linux-${NODE_ARCH}.tar.xz'));
    assert.ok(refs.includes('mongodb-linux-${MONGO_ARCH}-ubuntu2204-7.0.99.tgz'));
    const web=path.join(dir,'website'); fs.mkdirSync(path.join(web,'install'),{recursive:true});
    fs.writeFileSync(path.join(web,'install/index.html'),'<h2><span class="version-number">v0.0</span></h2>');
    const manifest=spawnSync('bash',['releases/update-website-version-info.sh',web,dir,'11.99'],{
      cwd:dir,encoding:'utf8',env:{...process.env,FERRETDB_VERSION:'v1.83.0'}});
    assert.equal(manifest.status,0,manifest.stderr);
    const content=fs.readFileSync(path.join(web,'version.txt'),'utf8');
    assert.match(content,/WeKan 11\.99/); assert.match(content,/Node 26\.99\.0/); assert.match(content,/NPM 12\.99\.0/);
    assert.ok(fs.readFileSync(path.join(web,'install/index.html'),'utf8').includes(content.trim()));
    fs.writeFileSync(path.join(dir,'releases/npm-retry.sh'),'printf "%s\\n" "$@"\n');
    const npm=spawnSync('bash',['releases/use-release-npm.sh'],{cwd:dir,encoding:'utf8'});
    assert.equal(npm.status,0,npm.stderr); assert.match(npm.stdout,/npm@12\.99\.0/);
    fs.writeFileSync(path.join(dir,'Dockerfile'),'NPM_VERSION=broken\n');
    assert.notEqual(spawnSync('bash',['releases/use-release-npm.sh'],{cwd:dir}).status,0);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('invalid metadata and unavailable artifacts stop before version edits', () => {
  for (const fault of ['metadata','head']) {
    const dir=fixture();
    try {
      const before=fs.readFileSync(path.join(dir,'Dockerfile'),'utf8');
      if(fault==='metadata') fs.writeFileSync(path.join(dir,'mongo.json'),'{"versions":[]}');
      const result=run(dir,fault==='head'?{FAIL_HEAD:'1'}:{});
      assert.notEqual(result.status,0,result.stdout+result.stderr);
      assert.equal(fs.readFileSync(path.join(dir,'Dockerfile'),'utf8'),before);
    } finally {fs.rmSync(dir,{recursive:true,force:true});}
  }
});
