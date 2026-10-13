'use strict';

// Update to the newest WeKan, or change to another version.
//
// The versions on offer are the GitHub releases of wekan/wekan that carry a
// single file for THIS platform (wekan-<version>-<target>-single-file[.exe]),
// plus the versions already kept in wekan-files/versions, which work offline.
//
// Changing version, step by step:
//   1. download the release's file and its .sha256sum to wekan-files/versions,
//      and refuse it unless the checksum matches;
//   2. back up wekan-files (backup.cjs) - a database a newer WeKan has
//      migrated may not open in an older one, so going back needs the backup;
//   3. stop a running WeKan;
//   4. keep the current executable as wekan-files/versions/wekan-<version>,
//      and move the new one to the executable's own name. Renaming a running
//      executable is allowed on Windows too, deleting it is not, so it is
//      renamed;
//   5. start WeKan again if it was running.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPO = 'wekan/wekan';

function isWindowsTarget(target) {
  return /^win/.test(target);
}

function assetName(version, target) {
  return `wekan-${version}-${target}-single-file${isWindowsTarget(target) ? '.exe' : ''}`;
}

function compareVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/**
 * GitHub's release list -> the versions with a single file for `target`,
 * newest first. Drafts are skipped; prereleases are marked.
 */
function releasesFor(json, target) {
  const out = [];
  for (const rel of Array.isArray(json) ? json : []) {
    if (!rel || rel.draft) continue;
    const version = String(rel.tag_name || '').replace(/^v/, '');
    if (!/^\d+(\.\d+)+$/.test(version)) continue;
    const name = assetName(version, target);
    const asset = (rel.assets || []).find(a => a.name === name);
    if (!asset) continue;
    const sum = (rel.assets || []).find(a => a.name === `${name}.sha256sum`);
    out.push({
      version,
      published: rel.published_at || '',
      prerelease: !!rel.prerelease,
      url: asset.browser_download_url,
      size: asset.size,
      shaUrl: sum ? sum.browser_download_url : '',
    });
  }
  return out.sort((x, y) => compareVersions(y.version, x.version));
}

async function fetchReleases(target, { fetchImpl = fetch, pages = 3 } = {}) {
  const all = [];
  for (let page = 1; page <= pages; page += 1) {
    const res = await fetchImpl(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'wekan-single-file' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`GitHub answered ${res.status} for the list of releases.`);
    const json = await res.json();
    all.push(...json);
    if (json.length < 100) break;
  }
  return releasesFor(all, target);
}

/** Versions kept in wekan-files/versions, newest first. */
function keptVersions(layout, target, fsImpl = fs) {
  const exe = isWindowsTarget(target) ? '.exe' : '';
  const re = new RegExp(`^wekan-(\\d+(?:\\.\\d+)+)${exe.replace('.', '\\.')}$`);
  try {
    return fsImpl.readdirSync(layout.versions)
      .map(n => re.exec(n))
      .filter(Boolean)
      .map(m => ({ version: m[1], file: path.join(layout.versions, m[0]) }))
      .sort((x, y) => compareVersions(y.version, x.version));
  } catch (e) {
    return [];
  }
}

function parseSha256sum(text) {
  const m = /^([0-9a-f]{64})\b/i.exec(String(text || '').trim());
  return m ? m[1].toLowerCase() : null;
}

async function download(release, layout, { fetchImpl = fetch, log = () => {} } = {}) {
  if (!release.shaUrl) throw new Error(`WeKan ${release.version} publishes no checksum for this file; not installing it unverified.`);
  const sumRes = await fetchImpl(release.shaUrl, { signal: AbortSignal.timeout(30000) });
  if (!sumRes.ok) throw new Error(`Could not download the checksum (${sumRes.status}).`);
  const want = parseSha256sum(await sumRes.text());
  if (!want) throw new Error('The checksum file is not a SHA-256 sum.');
  fs.mkdirSync(layout.versions, { recursive: true });
  // Unique per download: a second download of the same version (a retry,
  // a refused file) never touches the first one's file.
  const partial = path.join(layout.versions, `.download-${release.version}-${process.pid}-${crypto.randomBytes(4).toString('hex')}`);
  log(`Downloading WeKan ${release.version} (${Math.round((release.size || 0) / 1048576)} MiB) ...`);
  const res = await fetchImpl(release.url);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}).`);
  const hash = crypto.createHash('sha256');
  const out = fs.createWriteStream(partial);
  let got = 0;
  let shown = 0;
  try {
    for await (const chunk of res.body) {
      hash.update(chunk);
      got += chunk.length;
      if (!out.write(chunk)) await new Promise(r => out.once('drain', r));
      if (release.size && got - shown > release.size / 10) {
        shown = got;
        log(`  ${Math.round((got / release.size) * 100)} %`);
      }
    }
    await new Promise((resolve, reject) => out.end(err => (err ? reject(err) : resolve())));
  } catch (err) {
    out.destroy();
    fs.rmSync(partial, { force: true });
    throw err;
  }
  const digest = hash.digest('hex');
  if (digest !== want) {
    fs.rmSync(partial, { force: true });
    throw new Error(`The download does not match its checksum (got ${digest}, expected ${want}); nothing was changed.`);
  }
  fs.chmodSync(partial, 0o755);
  return partial;
}

/**
 * Puts `newFile` in place of the executable, keeping the current one as
 * wekan-files/versions/wekan-<currentVersion>.
 */
function install({ layout, newFile, currentVersion, target, fsImpl = fs }) {
  const exe = isWindowsTarget(target) ? '.exe' : '';
  fsImpl.mkdirSync(layout.versions, { recursive: true });
  const keep = path.join(layout.versions, `wekan-${currentVersion}${exe}`);
  if (path.resolve(newFile) === path.resolve(keep)) {
    throw new Error(`WeKan ${currentVersion} is the version running now.`);
  }
  fsImpl.rmSync(keep, { force: true });
  fsImpl.renameSync(layout.exePath, keep);
  try {
    // A kept version is copied, so it stays kept; a download is moved.
    if (path.dirname(path.resolve(newFile)) === path.resolve(layout.versions) && !path.basename(newFile).startsWith('.download-')) {
      fsImpl.copyFileSync(newFile, layout.exePath);
    } else {
      fsImpl.renameSync(newFile, layout.exePath);
    }
    fsImpl.chmodSync(layout.exePath, 0o755);
  } catch (err) {
    // Put the old executable back rather than leave none at all.
    try {
      fsImpl.renameSync(keep, layout.exePath);
    } catch (e) {
      // reported below with the original error
    }
    throw err;
  }
  return keep;
}

module.exports = {
  REPO, assetName, compareVersions, releasesFor, fetchReleases, keptVersions,
  parseSha256sum, download, install,
};
