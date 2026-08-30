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

export function validGitHubRelease(repository, release) {
  if (!release || release.draft || release.prerelease) return null;
  const tag = String(release.tag_name || '').trim();
  if (!versionParts(tag)) return null;
  const expected =
    `https://github.com/${repository}/releases/tag/${encodeURIComponent(tag)}`;
  if (release.html_url !== expected) {
    return null;
  }
  return { tag, url: expected };
}
