/**
 * models/lib/importAttachmentDownload.js — downloading an attachment that an
 * IMPORTED BOARD FILE named, safely.
 *
 * An imported board (a Trello export, a WeKan export) can give an attachment a
 * `url` instead of inline bytes, and whoever wrote that file chose the URL. The
 * response is stored as an attachment and can be read back through WeKan, so an
 * unguarded download here is a non-blind SSRF — the issue fixed as
 * CVE-2026-30844, and again as LiveBleed for the live Trello import.
 *
 * Validating the URL is not enough on its own. The importers called
 * `Attachments.loadAsync(url)`, and Meteor-Files downloads with the platform
 * `fetch()`, which FOLLOWS REDIRECTS: a public URL that passes validation can
 * answer `302 Location: http://127.0.0.1:.../secret` and the loopback body is
 * what gets stored. That is FollowBleed (GHSA-j9p2-jm73-p549), reported against
 * the live import; the offline importers reached the same end through
 * Meteor-Files.
 *
 * So the download happens here instead, through fetchSafe: the URL is validated
 * at input time, then EVERY hop — the original and each redirect — is validated
 * and DNS-pinned before a packet is sent to it. The bytes come back to the
 * caller, which stores them with the same writeAsync() it already uses for an
 * attachment that arrived inline.
 */

import { validateAttachmentUrl } from './attachmentUrlValidation';

// Trello and S3 style download URLs legitimately redirect once or twice (to a
// signed URL, to a CDN). Each hop is validated, so following a few is safe;
// the limit only stops a redirect loop.
const MAX_IMPORT_REDIRECTS = 5;

/**
 * Fetch an attachment URL named by an imported board.
 *
 * @param {string} url
 * @returns {Promise<{blocked: true, reason: string} | {buffer: Buffer, type: string|null}>}
 *   `blocked` when the URL — or a redirect it answered with — is not allowed to
 *   be contacted; the caller skips that one attachment. Throws on an ordinary
 *   download failure (HTTP error, network), which callers already treat as
 *   "skip this attachment".
 */
export async function fetchImportedAttachment(url) {
  const validation = await validateAttachmentUrl(url);
  if (!validation.valid) {
    return { blocked: true, reason: validation.reason };
  }

  // Server-only, and required lazily so that importing this module from the
  // isomorphic models/ tree does not pull the guard into the client bundle.
  const { fetchSafe } = require('/server/lib/ssrfGuard');

  let res;
  try {
    res = await fetchSafe(url, { maxRedirects: MAX_IMPORT_REDIRECTS });
  } catch (error) {
    const message = (error && error.message) || 'download failed';
    if (/^SSRF_GUARD:/.test(message)) {
      return { blocked: true, reason: message };
    }
    throw error;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const type =
    ((res.headers && res.headers.get('content-type')) || '').split(';')[0].trim() || null;
  return { buffer: Buffer.from(await res.arrayBuffer()), type };
}
