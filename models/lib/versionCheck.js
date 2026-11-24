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

// Problems / Summary (docs/Compliance/README.md P3, [CRA] Annex I Part II(8)):
// "a newer WeKan is available", from the last time an administrator pressed
// Check version in Admin Panel / Settings / Version. WeKan never asks wekan.fi
// on its own - the check is the administrator's - so this only repeats what
// that check found, until the server runs that version.
export function updateProblem({ current, last } = {}) {
  const newest = last && last.versions && last.versions.wekan;
  if (!newest || compareVersions(current, newest) !== -1) return null;
  const when = last.checkedAt ? new Date(last.checkedAt).toISOString().slice(0, 10) : '';
  return {
    id: 'wekan-update',
    title: 'A newer WeKan is available',
    detail: `WeKan ${newest} is out; this server runs ${String(current).replace(/^v/, '')}. Security fixes go into the newest release only (SECURITY.md). Found by Check version in Admin Panel / Settings / Version${when ? ` on ${when}` : ''}.`,
  };
}
