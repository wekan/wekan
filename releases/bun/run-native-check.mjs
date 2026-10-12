// Supervise with Node: a stuck native call can block Bun's own timers.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from './rebuild.mjs';
const [bundle, platform, arch] = process.argv.slice(2);
const binary = resolve(bundle, platform === 'win32' ? 'bun.exe' : 'bun');
run(binary, [fileURLToPath(new URL('./check-native.mjs', import.meta.url)),
  resolve(bundle), platform, arch], process.cwd(), {}, 180000);
