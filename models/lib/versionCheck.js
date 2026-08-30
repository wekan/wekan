export function versionParts(value) {
  const match = String(value || '').trim().match(
    /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:[-+][0-9A-Za-z.-]+)?$/,
  );
  return match ? match.slice(1, 4).map(part => Number(part || 0)) : null;
}

export function compareVersions(current, newest) {
  const a = versionParts(current);
  const b = versionParts(newest);
  if (!a || !b) return null;
  for (let i = 0; i < 3; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

const VERSION_MANIFEST_LABELS = [
  'WeKan',
  'FerretDB',
  'Meteor',
  'Node',
  'NPM',
];

export function parseVersionManifest(value) {
  if (typeof value !== 'string' || value.length > 1024) return null;
  const lines = value.replace(/\r\n/g, '\n').trim().split('\n');
  if (lines.length !== VERSION_MANIFEST_LABELS.length) return null;
  const versions = {};
  for (let i = 0; i < VERSION_MANIFEST_LABELS.length; i += 1) {
    const label = VERSION_MANIFEST_LABELS[i];
    const match = lines[i].match(new RegExp(`^${label} (v?\\d+\\.\\d+(?:\\.\\d+)?(?:[-+][0-9A-Za-z.-]+)?)$`));
    if (!match || !versionParts(match[1])) return null;
    versions[label.toLowerCase()] = match[1].replace(/^v/, '');
  }
  const text = VERSION_MANIFEST_LABELS
    .map(label => `${label} ${versions[label.toLowerCase()]}`)
    .join('\n');
  return { text, versions };
}
