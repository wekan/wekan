// Run by the bundled Bun on the target OS/CPU, including inside VMs/containers.
import { readFileSync, writeSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { PASS_MARKER, STEP_PREFIX } from './native-check-verdict.mjs';
const require = createRequire(import.meta.url);
const [bundle, platform, arch] = process.argv.slice(2);
// Unbuffered writes: the supervisor SIGKILLs a stuck run, and a buffered
// console.log is lost with it - which left the FreeBSD logs with no line at all
// saying which package, or whether every check had already passed.
const say = (fd, text) => writeSync(fd, `${text}\n`);
if (!process.versions.bun) throw new Error('Native check must run under Bun');
if (process.platform !== platform || process.arch !== arch) {
  throw new Error(`Wrong runtime: ${process.platform}/${process.arch}; expected ${platform}/${arch}`);
}
const packages = JSON.parse(readFileSync(resolve(bundle, 'bun-native-packages.json'), 'utf8'));
for (const pkg of packages) {
  say(2, `${STEP_PREFIX}${pkg.name} (${pkg.dir})`);
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
  say(2, `${STEP_PREFIX}${pkg.name} ok`);
}
say(1, `${PASS_MARKER} ${platform}/${arch}`);
// Exit explicitly, as the load probes in rebuild.mjs do (and those pass on
// FreeBSD). Ending by running off the module left Bun to tear down its VM,
// which can deadlock on FreeBSD (oven-sh/bun#44595).
process.exit(0);
