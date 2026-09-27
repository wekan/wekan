'use strict';

// A provider's item ID is meaningful only within its server and project.
// Keep this tuple readable and deterministic; it contains no credential.
function normalizeSyncSource(source) {
  const projectKey = String(source.projectKey || '').trim();
  if (!projectKey) throw new Error('A Sync project is required.');
  let url = source.url || '';
  if (source.type === 'github') url = 'https://api.github.com';
  if (source.type === 'gitlab' && !url) url = 'https://gitlab.com';
  let parsed;
  try { parsed = new URL(url); } catch (error) { throw new Error('A valid Sync server URL is required.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('Use a Sync server URL without credentials, query parameters or fragments.');
  }
  return { ...source, url: parsed.href.replace(/\/+$/, ''), projectKey };
}

function syncSourceKey(source) {
  const normalized = normalizeSyncSource(source);
  return JSON.stringify([normalized.type, normalized.url, normalized.projectKey]);
}

module.exports = { normalizeSyncSource, syncSourceKey };
