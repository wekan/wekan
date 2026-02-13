import DOMPurify from 'dompurify';

// Centralized secure DOMPurify configuration to prevent XSS and CSS injection attacks
export function getSecureDOMPurifyConfig() {
  return {
    // Allow common markdown elements including anchor tags
    ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span'],
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
    // Custom hooks for additional security
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

        // Block img tags with SVG data URIs that could contain malicious JavaScript
        if (node.tagName && node.tagName.toLowerCase() === 'img') {
          const src = node.getAttribute('src');
          if (src) {
            // Block all SVG data URIs to prevent XSS via embedded JavaScript
            if (src.startsWith('data:image/svg') || src.endsWith('.svg')) {
              if (process.env.DEBUG === 'true') {
                console.warn('Blocked potentially malicious SVG image:', src);
              }
              return false;
            }

            // Additional check for base64 encoded SVG with script tags
            if (src.startsWith('data:image/svg+xml;base64,')) {
              try {
                const base64Content = src.split(',')[1];
                const decodedContent = atob(base64Content);
                if (decodedContent.includes('<script') || decodedContent.includes('javascript:')) {
                  if (process.env.DEBUG === 'true') {
                    console.warn('Blocked SVG with embedded JavaScript:', src.substring(0, 100) + '...');
                  }
                  return false;
                }
              } catch (e) {
                // If decoding fails, block it as a safety measure
                if (process.env.DEBUG === 'true') {
                  console.warn('Blocked malformed SVG data URI:', src);
                }
                return false;
              }
            }
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

        // Allow href attribute for anchor tags only
        if (data.attrName === 'href') {
          // Only allow href on anchor tags
          if (node.tagName && node.tagName.toLowerCase() === 'a') {
            return true;
          } else {
            if (process.env.DEBUG === 'true') {
              console.warn('Blocked href attribute on non-anchor element:', node.tagName);
            }
            return false;
          }
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
