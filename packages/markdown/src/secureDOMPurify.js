import DOMPurify from 'dompurify';

// MathML (presentation) tags emitted by Temml for LaTeX math ($...$ / $$...$$).
// Browsers render these natively, so allowing them lets math survive sanitization.
// Deliberately EXCLUDES `annotation-xml`, which can smuggle HTML/SVG and is a
// known MathML XSS vector; Temml only emits the plain-text `annotation` element.
const MATHML_TAGS = [
  'math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext',
  'mspace', 'msup', 'msub', 'msubsup', 'mfrac', 'mroot', 'msqrt', 'mover',
  'munder', 'munderover', 'mmultiscripts', 'mprescripts', 'none', 'mtable',
  'mtr', 'mtd', 'mlabeledtr', 'mpadded', 'mphantom', 'mstyle', 'merror',
  'menclose', 'maction',
];
// Presentation attributes MathML uses for layout/semantics. None can execute
// script; color/size use dedicated math* attributes rather than CSS `style`,
// which remains blocked. `class`/`id`/`style` stay blocked by the hooks below.
const MATHML_ATTR = [
  'xmlns', 'display', 'displaystyle', 'scriptlevel', 'mathvariant', 'mathcolor',
  'mathbackground', 'mathsize', 'dir', 'stretchy', 'fence', 'separator',
  'accent', 'accentunder', 'largeop', 'movablelimits', 'symmetric', 'form',
  'lspace', 'rspace', 'voffset', 'depth', 'linethickness', 'minsize', 'maxsize',
  'open', 'close', 'notation', 'columnalign', 'rowalign', 'columnspacing',
  'rowspacing', 'columnlines', 'rowlines', 'align', 'encoding', 'actiontype',
  'selection',
];

// wekan/wekan#3218: the link rule with the administrator's custom URL schemes
// added. The app parses the setting (models/lib/urlSchemeAllowlist.js, which
// has the same builder and refuses javascript:, data: and the rest); this
// package cannot import app code, so it keeps this copy, and
// tests/urlSchemeAllowlist.test.cjs checks the two agree.
const SCHEME_NAME = /^[a-z][a-z0-9+.-]{0,31}$/;
// Never linked whatever the list says - the same set as the app's parser.
const NEVER_LINKED = [
  'javascript', 'vbscript', 'livescript', 'data', 'blob', 'about', 'filesystem',
  'view-source', 'jar', 'wyciwyg', 'ms-its', 'mhtml', 'res',
];
export function linkableSchemes(schemes) {
  return (Array.isArray(schemes) ? schemes : [])
    .filter(name => typeof name === 'string' && SCHEME_NAME.test(name) && !NEVER_LINKED.includes(name));
}
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
export function allowedUriRegExp(schemes = []) {
  const extra = linkableSchemes(schemes).map(escapeRegExp);
  const names = ['(?:f|ht)tps?', 'mailto', 'tel', 'callto', 'cid', 'xmpp', ...extra].join('|');
  return new RegExp(`^(?:(?:${names}):|[^a-z]|[a-z+.\\-]+(?:[^a-z+.\\-:]|$))`, 'i');
}

// Centralized secure DOMPurify configuration to prevent XSS and CSS injection attacks
export function getSecureDOMPurifyConfig(urlSchemes = []) {
  return {
    // Allow common markdown elements including anchor tags, plus MathML for Temml math.
    // wekan/wekan#2419: 'input' is allowed so a GFM task-list checkbox
    // ("- [ ] Task") survives sanitization as a real, disabled <input
    // type="checkbox">; the onlyTaskCheckboxes hook below still restricts it to
    // exactly that shape (a disabled checkbox with no name/value/form).
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'u', 's', 'del', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'input', ...MATHML_TAGS],
    // Allow safe attributes including href for anchor tags, plus MathML presentation attributes.
    // 'type', 'checked', 'disabled' are for the task-list checkbox above (#2419).
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'width', 'height', 'target', 'rel', 'type', 'checked', 'disabled', ...MATHML_ATTR],
    // Allow safe protocols for links
    // Plus any custom schemes the administrator listed (#3218).
    ALLOWED_URI_REGEXP: allowedUriRegExp(urlSchemes),
    // Allow unknown protocols but be cautious
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Sanitize DOM for security
    SANITIZE_DOM: true,
    // Keep content but sanitize it
    KEEP_CONTENT: true,
    // Block dangerous elements that can cause XSS
    // 'input' is intentionally NOT forbidden here (#2419 task-list checkbox) -
    // ALLOWED_TAGS above is the whitelist that matters, and the hooks below
    // pin it down to a plain disabled checkbox with no form to submit to
    // ('form' stays forbidden), so it can never become a text/password field
    // or carry a name/value/formaction.
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'svg', 'defs', 'use', 'g', 'symbol', 'marker', 'pattern', 'mask', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'animate', 'animateTransform', 'animateMotion', 'set', 'switch', 'foreignObject', 'link', 'meta', 'form', 'textarea', 'select', 'option', 'button', 'label', 'fieldset', 'legend', 'frameset', 'frame', 'noframes', 'base', 'basefont', 'isindex', 'dir', 'menu', 'menuitem'],
    // Block dangerous attributes but allow safe href
    FORBID_ATTR: ['xlink:href', 'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onresize', 'onscroll', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 'onmousemove', 'ondblclick', 'oncontextmenu', 'onwheel', 'ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel', 'onabort', 'oncanplay', 'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting', 'onbeforeunload', 'onhashchange', 'onpagehide', 'onpageshow', 'onpopstate', 'onstorage', 'onunload', 'style', 'class', 'id', 'data-*', 'aria-*'],
    // Block data URIs that could contain malicious content
    ALLOW_DATA_ATTR: false,
    // Element and attribute rules that the lists above cannot express are
    // DOMPurify hooks, installed around each call by secureSanitize() below.
    // (A HOOKS key in this object would be ignored: DOMPurify has no such
    // option, which is how the #2419 checkbox rule silently never ran.)
  };
}

// Code highlighting classes (highlight.js): only these, only on <code>/<span>
// inside <pre>. Every other class is still removed by FORBID_ATTR.
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

// wekan/wekan#2419: an <input> may only be the task-list checkbox markdown
// emits - a plain, disabled checkbox. A text/password/file field in card text
// would be a live control somebody could type a password into.
// An element hook drops an element by removing it from the tree; its return
// value is ignored.
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

// Sanitize with this package's config and hooks. The hooks are added for this
// call only, so other DOMPurify users in the app are not affected.
export function secureSanitize(purifier, html, config = getSecureDOMPurifyConfig()) {
  purifier.addHook('uponSanitizeAttribute', keepHighlightClasses);
  purifier.addHook('afterSanitizeAttributes', onlyTaskCheckboxes);
  try {
    return purifier.sanitize(html, config);
  } finally {
    purifier.removeHook('uponSanitizeAttribute', keepHighlightClasses);
    purifier.removeHook('afterSanitizeAttributes', onlyTaskCheckboxes);
  }
}

// Convenience function for secure sanitization
export function sanitizeHTML(html) {
  return secureSanitize(DOMPurify, html);
}

// Convenience function for sanitizing text (no HTML)
export function sanitizeText(text) {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}
