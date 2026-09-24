import { unzipSync } from 'fflate';
import { assertSourceSize, readBoundedResponse } from './attachmentPreviewSource.js';

export const MAX_ZIP_ENTRIES = 2048;

export function listZipEntries(bytes) {
  assertSourceSize(bytes.byteLength);
  if (bytes.byteLength < 22) throw new Error('Invalid ZIP archive');
  const entries = [];
  // fflate's filter reads the central directory. Returning false for EVERY
  // entry means no payload is inflated, including encrypted or huge entries.
  unzipSync(bytes, { filter(entry) {
    if (entries.length >= MAX_ZIP_ENTRIES) throw new RangeError('Too many ZIP entries');
    entries.push(entry.name);
    return false;
  } });
  return entries;
}

export async function openZipAttachment({ container, signal, size, url, emptyMessage }) {
  assertSourceSize(size);
  const response = await fetch(url, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(`ZIP attachment fetch failed: ${response.status}`);
  assertSourceSize(Number(response.headers.get('content-length')));
  const entries = listZipEntries(new Uint8Array(await readBoundedResponse(response)));
  if (signal.aborted) return;
  const list = container.ownerDocument.createElement('ul');
  for (const name of entries) {
    const item = container.ownerDocument.createElement('li');
    // Archive paths are inert text: never HTML, links or extraction targets.
    item.textContent = name;
    list.appendChild(item);
  }
  container.replaceChildren();
  if (entries.length) container.appendChild(list);
  else container.textContent = emptyMessage;
}
