// Supervise with Node: a stuck native call can block Bun's own timers.
// The output is captured, not inherited, so the verdict can read it: see
// native-check-verdict.mjs for what a killed run means.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nativeCheckVerdict } from './native-check-verdict.mjs';
const [bundle, platform, arch] = process.argv.slice(2);
const binary = resolve(bundle, platform === 'win32' ? 'bun.exe' : 'bun');
const result = spawnSync(binary, [fileURLToPath(new URL('./check-native.mjs', import.meta.url)),
  resolve(bundle), platform, arch], {
  cwd: process.cwd(), timeout: 180000, killSignal: 'SIGKILL', encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
});
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
const verdict = nativeCheckVerdict(result);
if (verdict.warning) console.log(`::warning::${verdict.warning}`);
if (!verdict.ok) throw new Error(verdict.message);
