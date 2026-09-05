#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const script = path.join(repoRoot, 'releases/prepare-variant-repo.sh');

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  return result;
}

function write(root, name, contents) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function init(root) {
  run('git', ['init', '-q'], root);
  run('git', ['config', 'user.name', 'Test'], root);
  run('git', ['config', 'user.email', 'test@example.invalid'], root);
}

for (const [variant, title] of [
  ['wekan-ondra', 'Wekan Ondra'],
  ['wekan-gantt-gpl', 'Wekan Gantt GPL'],
]) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-variant-test-'));
  const source = path.join(temp, 'source');
  const target = path.join(temp, 'target');
  fs.mkdirSync(source);
  fs.mkdirSync(target);
  init(source);
  init(target);

  const snap = `name: wekan\ntitle: Wekan\nsource-code: https://github.com/wekan/wekan\n`;
  write(source, 'snapcraft.yaml', snap);
  write(source, 'snapcraft-core26.yaml', snap);
  write(source, 'package.json', '{"name": "wekan", "repository": "https://github.com/wekan/wekan.git"}\n');
  write(source, 'package-lock.json', '{"name": "wekan", "packages": {"": {"name": "wekan"}}}\n');
  write(source, 'Dockerfile', 'LABEL org.opencontainers.image.source="https://github.com/wekan/wekan"\n');
  write(source, 'docker-compose.yml', [
    'image: ghcr.io/wekan/wekan:latest',
    'image: quay.io/wekan/wekan:latest',
    'image: wekanteam/wekan:latest',
    '',
  ].join('\n'));
  write(source, '.gitignore', 'secret.txt\n');
  write(source, 'secret.txt', 'must not be copied\n');
  run('git', ['add', '.'], source);
  run('git', ['commit', '-qm', 'source'], source);

  write(target, 'stale.txt', 'remove me\n');
  run('git', ['add', '.'], target);
  run('git', ['commit', '-qm', 'target'], target);

  run(script, [source, target, variant, title], repoRoot);

  assert.strictEqual(fs.existsSync(path.join(target, 'stale.txt')), false);
  assert.strictEqual(fs.existsSync(path.join(target, 'secret.txt')), false);
  assert.match(fs.readFileSync(path.join(target, 'snapcraft.yaml'), 'utf8'), new RegExp(`^name: ${variant}$`, 'm'));
  assert.match(fs.readFileSync(path.join(target, 'snapcraft-core26.yaml'), 'utf8'), new RegExp(`^name: ${variant}$`, 'm'));
  assert.match(fs.readFileSync(path.join(target, 'package.json'), 'utf8'), new RegExp(`"name": "${variant}"`));
  assert.match(fs.readFileSync(path.join(target, 'Dockerfile'), 'utf8'), new RegExp(`github.com/wekan/${variant}`));
  const compose = fs.readFileSync(path.join(target, 'docker-compose.yml'), 'utf8');
  assert.match(compose, new RegExp(`ghcr.io/wekan/${variant}:`));
  assert.match(compose, new RegExp(`quay.io/wekan/${variant}:`));
  assert.match(compose, new RegExp(`wekanteam/${variant}:`));
}

console.log('prepareVariantRepo: 2 variants passed');
