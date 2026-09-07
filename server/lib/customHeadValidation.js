import { parseDocument } from 'htmlparser2';

const TAG_ATTRIBUTES = Object.freeze({
  meta: new Set(['charset', 'content', 'http-equiv', 'name', 'property']),
  link: new Set(['color', 'crossorigin', 'href', 'media', 'rel', 'sizes', 'type']),
});

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeHref(value) {
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const parsed = new URL(value, 'https://wekan.invalid/');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export function sanitizeCustomHeadTags(input, expectedTag) {
  if (typeof input !== 'string') throw new Error('custom-head-invalid');
  if (input.length > 20000) throw new Error('custom-head-too-long');
  const document = parseDocument(input, { decodeEntities: true });
  const output = [];
  for (const node of document.children || []) {
    if (node.type === 'text' && !String(node.data || '').trim()) continue;
    if (node.type === 'comment') continue;
    if (node.type !== 'tag' || node.name !== expectedTag) {
      throw new Error('custom-head-invalid-tag');
    }
    if ((node.children || []).some(child => child.type !== 'text'
      || String(child.data || '').trim())) throw new Error('custom-head-invalid-content');
    const allowed = TAG_ATTRIBUTES[expectedTag];
    const attributes = [];
    for (const [name, value] of Object.entries(node.attribs || {})) {
      if (!allowed.has(name) || /^on/i.test(name)) throw new Error('custom-head-invalid-attribute');
      if (name === 'href' && !safeHref(value)) throw new Error('custom-head-invalid-url');
      attributes.push(`${name}="${escapeAttribute(value)}"`);
    }
    if (expectedTag === 'link' && !node.attribs?.rel) throw new Error('custom-head-link-rel');
    if (expectedTag === 'meta' && !node.attribs?.charset && !node.attribs?.name
      && !node.attribs?.['http-equiv'] && !node.attribs?.property) {
      throw new Error('custom-head-meta-identity');
    }
    output.push(`<${expectedTag}${attributes.length ? ` ${attributes.join(' ')}` : ''}>`);
  }
  return output.join('\n');
}

export function normalizePwaJson(input, expectedShape) {
  if (typeof input !== 'string') throw new Error('custom-pwa-json-invalid');
  if (input.length > 100000) throw new Error('custom-pwa-json-too-long');
  if (!input.trim()) return '';
  let parsed;
  try { parsed = JSON.parse(input); } catch (_) { throw new Error('custom-pwa-json-invalid'); }
  if (expectedShape === 'object'
    && (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')) {
    throw new Error('custom-manifest-invalid');
  }
  if (expectedShape === 'array' && !Array.isArray(parsed)) {
    throw new Error('custom-assetlinks-invalid');
  }
  return JSON.stringify(parsed, null, 2);
}

export function customHeadMarkup(setting) {
  if (!setting?.customHeadEnabled) return '';
  const parts = [];
  if (String(setting.customHeadMetaTags || '').trim()) {
    parts.push(sanitizeCustomHeadTags(setting.customHeadMetaTags, 'meta'));
  }
  if (String(setting.customHeadLinkTags || '').trim()) {
    let links = sanitizeCustomHeadTags(setting.customHeadLinkTags, 'link');
    if (setting.customManifestEnabled) {
      links = links.replace(/<link[^>]*rel="manifest"[^>]*>/gi, '').trim();
    }
    if (links) parts.push(links);
  }
  if (setting.customManifestEnabled) {
    parts.push('<link rel="manifest" href="/site.webmanifest" crossorigin="use-credentials">');
  }
  return parts.filter(Boolean).join('\n');
}
