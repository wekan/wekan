// Download names describe WHAT was exported, independently of the title drawn
// inside the document. Keep this in one place so PDF and Excel cannot disagree.
function cleanPart(value, fallback = 'Export') {
  const cleaned = String(value || '')
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[. -]+|[. -]+$/g, '')
    .slice(0, 100);
  return cleaned || fallback;
}

function exportFilename(type, translate, identity, extension) {
  const localizedType = cleanPart(
    typeof translate === 'function' ? translate(type) : type,
    type,
  );
  return `${localizedType}-${cleanPart(identity, '1')}.${extension}`;
}

// `filename` is an ASCII fallback for older clients; `filename*` is the real,
// UTF-8 name used by current browsers (RFC 5987).
function attachmentDisposition(filename) {
  const ascii = String(filename).normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '').replace(/[\\"]/g, '-') || 'export';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export { attachmentDisposition, cleanPart, exportFilename };
