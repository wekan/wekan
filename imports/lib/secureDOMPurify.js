import DOMPurify from 'dompurify';
import { allowedUriRegExp } from '/models/lib/urlSchemeAllowlist';

// Centralized secure DOMPurify configuration to prevent XSS and CSS injection attacks.
//
// options.stripLinks — when true, anchor (<a>) tags are removed while their visible
// text is kept (KEEP_CONTENT), so every link (both markdown links like
// [label](url) and raw HTML <a href> tags) renders as plain, non-clickable text.
// Used by the Admin Panel / Features "render links as plain text" toggle.
export function getSecureDOMPurifyConfig(options = {}) {
  const config = {
    // Allow common markdown elements including anchor tags
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'u', 's', 'del', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span'],
    // Allow safe attributes including href for anchor tags
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'width', 'height', 'target', 'rel'],
    // Allow safe protocols for links
    // Plus the custom schemes an administrator listed (#3218, options.urlSchemes
    // from models/lib/urlSchemeAllowlist.js, which never includes javascript:
    // or data:).
    ALLOWED_URI_REGEXP: allowedUriRegExp(options.urlSchemes),
    // Allow unknown protocols but be cautious
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Sanitize DOM for security
    SANITIZE_DOM: true,
    // Keep content but sanitize it
    KEEP_CONTENT: true,
    // Block dangerous elements that can cause XSS
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'svg', 'defs', 'use', 'g', 'symbol', 'marker', 'pattern', 'mask', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'animate', 'animateTransform', 'animateMotion', 'set', 'switch', 'foreignObject', 'link', 'meta', 'form', 'input', 'textarea', 'select', 'option', 'button', 'label', 'fieldset', 'legend', 'frameset', 'frame', 'noframes', 'base', 'basefont', 'isindex', 'dir', 'menu', 'menuitem'],
    // Block dangerous attributes but allow safe href
    FORBID_ATTR: ['xlink:href', 'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onresize', 'onscroll', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 'onmousemove', 'ondblclick', 'oncontextmenu', 'onwheel', 'ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel', 'onabort', 'oncanplay', 'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting', 'onbeforeunload', 'onhashchange', 'onpagehide', 'onpageshow', 'onpopstate', 'onstorage', 'onunload', 'style', 'class', 'id', 'data-*', 'aria-*'],
    // Block data URIs that could contain malicious content
    ALLOW_DATA_ATTR: false,
    // No HOOKS here: DOMPurify has no such option and never ran the functions
    // that used to sit in this key. FORBID_TAGS/FORBID_ATTR above already
    // remove every element and attribute those functions described (style,
    // class, id, data-*, inputs, svg), and ALLOWED_URI_REGEXP refuses data:
    // URLs.
  };

  if (options.stripLinks) {
    // Forbid <a> but keep its inner text (KEEP_CONTENT is already true above), so
    // links become plain, non-clickable text instead of clickable anchors.
    config.FORBID_TAGS = config.FORBID_TAGS.concat(['a']);
  }

  return config;
}

// Code highlighting classes (highlight.js): only these, only on <code>/<span>
// inside <pre>. Every other class is still removed by FORBID_ATTR. The markdown
// package keeps the same classes in its own pass; this is the card viewer's
// second pass, which would otherwise strip them again.
const HIGHLIGHT_CLASS = /^(?:hljs(?:-[a-z0-9_-]+)?|language-[a-z0-9_+#-]+)$/i;
function insidePre(node) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent.nodeName && parent.nodeName.toLowerCase() === 'pre') return true;
  }
  return false;
}
// An attribute hook keeps an attribute by setting data.forceKeepAttr (its
// return value is ignored). forceKeepAttr keeps the attribute AS IT IS ON THE
// ELEMENT, not data.attrValue, so the filtered value is written back first.
function keepHighlightClasses(node, data) {
  if (data.attrName !== 'class') return;
  const tag = node.nodeName ? node.nodeName.toLowerCase() : '';
  if ((tag !== 'code' && tag !== 'span') || !insidePre(node)) return;
  const classes = String(data.attrValue || '').split(/\s+/).filter(name => HIGHLIGHT_CLASS.test(name));
  if (!classes.length) return;
  data.attrValue = classes.join(' ');
  node.setAttribute('class', data.attrValue);
  data.forceKeepAttr = true;
}

// wekan/wekan#2419: the markdown package renders "- [ ] Task" as a disabled
// <input type="checkbox">, and the card viewer sanitizes that output again
// here. The config above forbids every <input>; sanitizeHTML() admits exactly
// that one shape and removes any other input (text, password, file, or one
// carrying a name, value or form), so card text cannot draw a live form field.
function onlyTaskCheckboxes(node) {
  if (!node.nodeName || node.nodeName.toLowerCase() !== 'input') return;
  const type = (node.getAttribute('type') || '').toLowerCase();
  if (type !== 'checkbox' || node.hasAttribute('name') || node.hasAttribute('value')
    || node.hasAttribute('form') || node.hasAttribute('formaction')) {
    node.parentNode.removeChild(node);
    return;
  }
  node.setAttribute('disabled', '');
}

// Convenience function for secure sanitization. The checkbox and highlight
// hooks are added for this call only, so other DOMPurify users in the app are
// not affected.
export function sanitizeHTML(html, options = {}) {
  const config = getSecureDOMPurifyConfig(options);
  config.ALLOWED_TAGS = config.ALLOWED_TAGS.concat(['input']);
  config.FORBID_TAGS = config.FORBID_TAGS.filter(tag => tag !== 'input');
  config.ALLOWED_ATTR = config.ALLOWED_ATTR.concat(['type', 'checked', 'disabled']);
  DOMPurify.addHook('uponSanitizeAttribute', keepHighlightClasses);
  DOMPurify.addHook('afterSanitizeAttributes', onlyTaskCheckboxes);
  try {
    return DOMPurify.sanitize(html, config);
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute', keepHighlightClasses);
    DOMPurify.removeHook('afterSanitizeAttributes', onlyTaskCheckboxes);
  }
}

// Convenience function for sanitizing text (no HTML)
export function sanitizeText(text) {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}
