import fs from 'node:fs';
import path from 'node:path';

// Keep inline server maps available for stack traces without making V8 scan
// their base64 text at every boot. Do not register them as program.json
// sourceMap entries: Meteor eagerly reads and parses those before startup.
export function externalizeServerSourceMaps(bundle) {
  const server = path.join(bundle, 'programs/server');
  const manifest = path.join(server, 'program.json');
  if (!fs.existsSync(manifest)) return { count: 0, removedBytes: 0 };
  const program = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  let count = 0;
  let removedBytes = 0;
  for (const entry of program.load || []) {
    if (!entry.path?.endsWith('.js')) continue;
    const file = path.resolve(server, entry.path);
    if (!file.startsWith(path.resolve(server) + path.sep)) throw new Error('Server script outside bundle');
    if (!fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, 'utf8');
    // Only a final, standalone directive, never text embedded in a JS string.
    const match = /(?:^|\n)(\/\/# sourceMappingURL=data:application\/json(?:;charset=[\w-]+)?;base64,([A-Za-z0-9+/=]+))\s*$/.exec(code);
    if (!match) continue;
    const raw = Buffer.from(match[2], 'base64');
    const map = JSON.parse(raw.toString('utf8'));
    if (map.version !== 3 || !(typeof map.mappings === 'string' || Array.isArray(map.sections))) {
      throw new Error(`Invalid inline source map in ${entry.path}`);
    }
    // Distinct suffix survives subsequent bundle-trim runs that remove *.map.
    const name = path.basename(file) + '.runtime-source-map.json';
    const external = path.join(path.dirname(file), name);
    fs.writeFileSync(external, raw);
    const start = match.index + (code[match.index] === '\n' ? 1 : 0);
    const updated = code.slice(0, start) + '//# sourceMappingURL=' + name + '\n';
    const mode = fs.statSync(file).mode & 0o777;
    fs.chmodSync(file, mode | 0o200);
    try { fs.writeFileSync(file, updated); } finally { fs.chmodSync(file, mode); }
    removedBytes += Buffer.byteLength(code) - Buffer.byteLength(updated);
    count++;
  }
  return { count, removedBytes };
}
