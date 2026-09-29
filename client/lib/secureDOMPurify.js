import DOMPurify from 'dompurify';

// Centralized secure DOMPurify configuration to prevent XSS and CSS injection attacks.
//
// options.stripLinks — when true, anchor (<a>) tags are removed while their visible
// text is kept, so every link renders as plain, non-clickable text. Used by the
// Admin Panel / Features "render links as plain text" toggle.
export function getSecureDOMPurifyConfig(options = {}) {
  const config = {
    // Allow common markdown elements including anchor tags
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 's'],
    // Allow safe attributes including href for anchor tags
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'width', 'height', 'target', 'rel'],
    // Allow safe protocols for links
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
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
    // Forbid <a> but keep its inner text, so links become plain, non-clickable text.
    config.FORBID_TAGS = config.FORBID_TAGS.concat(['a']);
  }

  return config;
}

// Convenience function for secure sanitization
export function sanitizeHTML(html, options = {}) {
  return DOMPurify.sanitize(html, getSecureDOMPurifyConfig(options));
}

// Convenience function for sanitizing text (no HTML)
export function sanitizeText(text) {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}
