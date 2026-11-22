// A ZIP attachment's file names in the slideshow, read through HTTP Range
// requests: the end of the file for where the central directory is (ZIP64 as
// well), then the central directory itself, as far as it is scrolled
// (attachmentWindow.js GrowingView). No entry is inflated or downloaded; a
// 4 GB archive of a million files costs the screenful of names shown.
//
// The directory is read by models/lib/zipDirectory.js, which the server's
// OpenDocument preview conversion shares.

import { RangeReader, GrowingView } from './attachmentWindow.js';
import { ZipDirectory } from '../../models/lib/zipDirectory.js';

export { ZipDirectory };

export async function openZipAttachment({ container, signal, size, url, emptyMessage, fetchImpl, viewportHeight }) {
  const reader = new RangeReader(url, size, { signal, fetchImpl });
  await reader.probeSize();
  const directory = await new ZipDirectory(reader).open();
  if (signal && signal.aborted) return { destroy() {} };
  container.replaceChildren();
  if (!directory.count) {
    container.textContent = emptyMessage;
    return { destroy() { container.replaceChildren(); } };
  }
  const entries = directory.entries();
  const doc = container.ownerDocument;
  const view = new GrowingView(container, {
    listTag: 'ul',
    viewportHeight,
    next: async () => {
      const rows = [];
      while (rows.length < 200) {
        const { value, done } = await entries.next();
        if (done) break;
        rows.push(value.name);
      }
      return rows.length ? rows : null;
    },
    // Archive paths are inert text: never HTML, links or extraction targets.
    renderRow: name => { const li = doc.createElement('li'); li.textContent = name; return li; },
  });
  await view.start();
  return { view, destroy() { view.destroy(); container.replaceChildren(); } };
}
