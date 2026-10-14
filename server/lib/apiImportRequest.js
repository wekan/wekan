// The `request` the API importers' clients (models/lib/apiImport/<key>.js)
// are given on the server: one JSON request through the SSRF guard - the
// address checked and pinned, no redirects, bounded in time and size - so a
// self-hosted address (Planka) cannot point the server at its own network.
// Resolves to the parsed body; a non-2xx answer rejects with `.status` and a
// message that names only the origin and the status, never the answer.
import { fetchSafe } from '/server/lib/ssrfGuard';

const TIMEOUT_MS = 30000;
const MAX_RESPONSE_BYTES = 32 * 1024 * 1024;

// A self-hosted service on the server's own network (a Planka at
// 192.168.1.20) is refused by the guard; only the server's administrator may
// allow its host, as LIST_SYNC_ALLOWED_PRIVATE_HOSTS does for List Sync.
export function operatorAllowedImportHost(url, env = process.env) {
  const allowed = String(env.API_IMPORT_ALLOWED_PRIVATE_HOSTS || '').split(',')
    .map(host => host.trim().toLowerCase()).filter(Boolean);
  return allowed.length > 0 && allowed.includes(new URL(url).hostname.toLowerCase());
}

export async function apiImportRequest(url, { method = 'GET', headers = {}, body } = {}) {
  const origin = new URL(url).origin;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  let response;
  try {
    if (operatorAllowedImportHost(url)) {
      response = await fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Accept: 'application/json', ...headers, ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(payload === undefined ? {} : { body: payload }) });
      const length = Number(response.headers.get('content-length'));
      if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) throw new Error('too large');
    } else response = await fetchSafe(url, {
      method,
      headers: { Accept: 'application/json', ...headers,
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(payload)) }) },
      ...(payload === undefined ? {} : { body: payload }),
      timeoutMs: TIMEOUT_MS, totalTimeoutMs: TIMEOUT_MS, maxRedirects: 0, maxResponseBytes: MAX_RESPONSE_BYTES,
    });
  } catch (error) {
    const failed = new Error(/^SSRF_GUARD:/.test(error && error.message) ? `${origin} is not an address WeKan may reach` : `${origin} could not be reached`);
    failed.status = 0;
    throw failed;
  }
  if (!response.ok) {
    const error = new Error(`${origin} answered HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  try { return await response.json(); } catch (error) { throw new Error(`${origin} did not answer with JSON`); }
}

export default apiImportRequest;
