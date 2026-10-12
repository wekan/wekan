// Run by the bundled Bun on the target OS/CPU, including inside VMs/containers.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const [bundle, platform, arch] = process.argv.slice(2);
if (!process.versions.bun) throw new Error('Native check must run under Bun');
if (process.platform !== platform || process.arch !== arch) {
  throw new Error(`Wrong runtime: ${process.platform}/${process.arch}; expected ${platform}/${arch}`);
}
const packages = JSON.parse(readFileSync(resolve(bundle, 'bun-native-packages.json'), 'utf8'));
for (const pkg of packages) {
  const loaded = require(resolve(bundle, pkg.dir));
  if (pkg.name === 'bcrypt') {
    const hash = await loaded.hash('bun-build-check', 4);
    if (!await loaded.compare('bun-build-check', hash) || await loaded.compare('wrong', hash)) throw new Error('bcrypt verification failed');
  } else if (pkg.name === 'argon2') {
    const hash = await loaded.hash('bun-build-check');
    if (!await loaded.verify(hash, 'bun-build-check') || await loaded.verify(hash, 'wrong')) throw new Error('argon2 verification failed');
  } else if (pkg.name === 'sharp') {
    await loaded({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  }
}
console.log(`Native Bun checks passed on ${platform}/${arch}`);
