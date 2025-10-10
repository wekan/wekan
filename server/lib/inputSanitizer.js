import DOMPurify from 'dompurify';

// Server-side input sanitization to prevent CSS injection and XSS attacks
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove any HTML tags and dangerous content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORBID_TAGS: ['style', 'script', 'link', 'meta', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'option', 'button', 'label', 'fieldset', 'legend', 'frameset', 'frame', 'noframes', 'base', 'basefont', 'isindex', 'dir', 'menu', 'menuitem', 'svg', 'defs', 'use', 'g', 'symbol', 'marker', 'pattern', 'mask', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'animate', 'animateTransform', 'animateMotion', 'set', 'switch', 'foreignObject'],
    FORBID_ATTR: ['style', 'class', 'id', 'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload', 'onresize', 'onscroll', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 'onmousemove', 'ondblclick', 'oncontextmenu', 'onwheel', 'ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel', 'onabort', 'oncanplay', 'oncanplaythrough', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked', 'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange', 'onwaiting', 'onbeforeunload', 'onhashchange', 'onpagehide', 'onpageshow', 'onpopstate', 'onstorage', 'onunload', 'xlink:href', 'href', 'data-*', 'aria-*'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    ADD_ATTR: [],
    ALLOW_DATA_ATTR: false
  });

  // Additional check for CSS injection patterns
  const cssInjectionPatterns = [
    /<style[^>]*>.*?<\/style>/gi,
    /style\s*=\s*["'][^"']*["']/gi,
    /@import\s+[^;]+;/gi,
    /url\s*\(\s*[^)]+\s*\)/gi,
    /expression\s*\(/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:/gi
  ];

  let cleaned = sanitized;
  for (const pattern of cssInjectionPatterns) {
    if (pattern.test(cleaned)) {
      if (process.env.DEBUG === 'true') {
        console.warn('Blocked potential CSS injection in input:', cleaned.substring(0, 100) + '...');
      }
      // Remove the dangerous content
      cleaned = cleaned.replace(pattern, '');
    }
  }

  return cleaned.trim();
}

// Specific function for sanitizing titles
export function sanitizeTitle(title) {
  if (typeof title !== 'string') {
    return title;
  }

  // First sanitize the input
  let sanitized = sanitizeInput(title);

  // Additional title-specific sanitization
  // Remove any remaining HTML entities that might be dangerous
  sanitized = sanitized.replace(/&[#\w]+;/g, '');

  // Remove any remaining angle brackets
  sanitized = sanitized.replace(/[<>]/g, '');

  // Limit length to prevent abuse
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
    if (process.env.DEBUG === 'true') {
      console.warn('Truncated long title input:', title.length, 'characters');
    }
  }

  return sanitized.trim();
}
