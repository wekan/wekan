import DOMPurify from 'dompurify';

// Centralized secure DOMPurify configuration to prevent XSS and CSS injection attacks
export function getSecureDOMPurifyConfig() {
  return {
    // Block dangerous elements that can cause XSS and CSS injection
    FORBID_TAGS: [
      'svg', 'defs', 'use', 'g', 'symbol', 'marker', 'pattern', 'mask', 'clipPath',
      'linearGradient', 'radialGradient', 'stop', 'animate', 'animateTransform',
      'animateMotion', 'set', 'switch', 'foreignObject', 'script', 'style', 'link',
      'meta', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea',
      'select', 'option', 'button', 'label', 'fieldset', 'legend', 'frameset',
      'frame', 'noframes', 'base', 'basefont', 'isindex', 'dir', 'menu', 'menuitem'
    ],
    // Block dangerous attributes that can cause XSS and CSS injection
    FORBID_ATTR: [
      'xlink:href', 'href', 'onload', 'onerror', 'onclick', 'onmouseover',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
      'onunload', 'onresize', 'onscroll', 'onkeydown', 'onkeyup', 'onkeypress',
      'onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 'onmousemove',
      'ondblclick', 'oncontextmenu', 'onwheel', 'ontouchstart', 'ontouchend',
      'ontouchmove', 'ontouchcancel', 'onabort', 'oncanplay', 'oncanplaythrough',
      'ondurationchange', 'onemptied', 'onended', 'onerror', 'onloadeddata',
      'onloadedmetadata', 'onloadstart', 'onpause', 'onplay', 'onplaying',
      'onprogress', 'onratechange', 'onseeked', 'onseeking', 'onstalled',
      'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting', 'onbeforeunload',
      'onhashchange', 'onpagehide', 'onpageshow', 'onpopstate', 'onstorage',
      'onunload', 'style', 'class', 'id', 'data-*', 'aria-*'
    ],
    // Allow only safe image formats and protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Remove dangerous protocols
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Sanitize URLs to prevent malicious content loading
    SANITIZE_DOM: true,
    // Remove dangerous elements completely
    KEEP_CONTENT: false,
    // Additional security measures
    ADD_ATTR: [],
    // Block data URIs that could contain malicious content
    ALLOW_DATA_ATTR: false,
    // Custom hook to further sanitize content
    HOOKS: {
      uponSanitizeElement: function(node, data) {
        // Block any remaining dangerous elements
        const dangerousTags = ['svg', 'style', 'script', 'link', 'meta', 'iframe', 'object', 'embed', 'applet'];
        if (node.tagName && dangerousTags.includes(node.tagName.toLowerCase())) {
          if (process.env.DEBUG === 'true') {
            console.warn('Blocked potentially dangerous element:', node.tagName);
          }
          return false;
        }

        // Block img tags with SVG data URIs
        if (node.tagName && node.tagName.toLowerCase() === 'img') {
          const src = node.getAttribute('src');
          if (src && (src.startsWith('data:image/svg') || src.endsWith('.svg'))) {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked potentially malicious SVG image:', src);
            }
            return false;
          }
        }

        // Block elements with dangerous attributes
        const dangerousAttrs = ['style', 'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
        for (const attr of dangerousAttrs) {
          if (node.hasAttribute && node.hasAttribute(attr)) {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked element with dangerous attribute:', node.tagName, attr);
            }
            return false;
          }
        }

        return true;
      },
      uponSanitizeAttribute: function(node, data) {
        // Block style attributes completely
        if (data.attrName === 'style') {
          if (process.env.DEBUG === 'true') {
            console.warn('Blocked style attribute');
          }
          return false;
        }

        // Block class and id attributes that might be used for CSS injection
        if (data.attrName === 'class' || data.attrName === 'id') {
          if (process.env.DEBUG === 'true') {
            console.warn('Blocked class/id attribute:', data.attrName, data.attrValue);
          }
          return false;
        }

        // Block data attributes
        if (data.attrName && data.attrName.startsWith('data-')) {
          if (process.env.DEBUG === 'true') {
            console.warn('Blocked data attribute:', data.attrName);
          }
          return false;
        }

        return true;
      }
    }
  };
}

// Convenience function for secure sanitization
export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, getSecureDOMPurifyConfig());
}

// Convenience function for sanitizing text (no HTML)
export function sanitizeText(text) {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
}
