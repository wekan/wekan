import { parseDocument } from 'htmlparser2';

const DROP_WITH_CONTENT = new Set([
  'applet', 'base', 'basefont', 'embed', 'frame', 'frameset', 'iframe',
  'isindex', 'link', 'meta', 'noframes', 'object', 'script', 'style',
]);

// DOMPurify deliberately needs a browser DOM. The Meteor server bundle has no
// DOM, so parse untrusted markup into a tree and retain text nodes only. Entity
// decoding stays disabled: an encoded "<script>" must remain encoded if a
// caller later places the stored text into an HTML context.
export function serverHtmlToPlainText(input) {
  const document = parseDocument(String(input || ''), { decodeEntities: false });

  function text(nodes) {
    let result = '';
    for (const node of nodes || []) {
      if (node.type === 'text') result += node.data || '';
      else if ((node.type === 'tag' || node.type === 'script' || node.type === 'style')
        && !DROP_WITH_CONTENT.has(String(node.name || '').toLowerCase())) {
        result += text(node.children);
      }
    }
    return result;
  }

  return text(document.children);
}

