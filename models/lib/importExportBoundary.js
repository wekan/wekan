'use strict';

// One structural trust boundary for every import/export dialect. Adapters map
// fields; they do not get to decide whether prototypes, cycles or giant nested
// values are safe. `sanitizeHtml` is injected by the server so this pure module
// stays usable in plain-Node tests and in client bundles.

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const SECRET_KEY = /(?:password|passwd|secret|api[_-]?key|api[_-]?token|auth[_-]?token|private[_-]?key|login[_-]?token)/i;

function sanitizeTransferValue(input, options = {}) {
  const limits = {
    maxDepth: options.maxDepth || 40,
    maxNodes: options.maxNodes || 250000,
    maxArray: options.maxArray || 100000,
    maxString: options.maxString || 4 * 1024 * 1024,
    maxBinaryString: options.maxBinaryString || 512 * 1024 * 1024,
  };
  const warnings = [];
  const seen = new WeakSet();
  let nodes = 0;

  function walk(value, path, depth) {
    nodes += 1;
    if (nodes > limits.maxNodes) throw new Error('Import/export object limit exceeded');
    if (depth > limits.maxDepth) throw new Error(`Import/export nesting limit exceeded at ${path}`);
    if (value == null || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        warnings.push({ path, reason: 'non-finite number removed' });
        return null;
      }
      return value;
    }
    if (typeof value === 'string') {
      // Canonical JSON and the Excel transport legitimately carry base64.
      // Give syntactically-valid base64 a separate cap while retaining a much
      // smaller limit for attacker-controlled prose/markup.
      const binaryLimit = value.length > limits.maxString
        && /\/(?:file|avatarFile|excelBase64)$/.test(path)
        && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value)
        ? limits.maxBinaryString : limits.maxString;
      if (value.length > binaryLimit) throw new Error(`Import/export string limit exceeded at ${path}`);
      // Avoid running multi-megabyte base64 attachment bodies through DOMPurify,
      // but do pass every string that can carry active markup, a script URL or
      // CSS payload through WeKan's established server sanitizer.
      const looksActive = /<\/?[a-z][^>]*>|(?:javascript|vbscript|data)\s*:|@import\b|expression\s*\(|url\s*\(/i.test(value);
      if (typeof options.sanitizeHtml === 'function' && looksActive) {
        const clean = options.sanitizeHtml(value);
        if (clean !== value) warnings.push({ path, reason: 'unsafe markup sanitized' });
        return clean;
      }
      return value;
    }
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        warnings.push({ path, reason: 'invalid date removed' });
        return null;
      }
      return new Date(value.getTime());
    }
    if (typeof value !== 'object') {
      warnings.push({ path, reason: `unsupported ${typeof value} removed` });
      return null;
    }
    if (seen.has(value)) throw new Error(`Import/export cycle at ${path}`);
    seen.add(value);
    if (Array.isArray(value)) {
      if (value.length > limits.maxArray) throw new Error(`Import/export array limit exceeded at ${path}`);
      const result = value.map((entry, index) => walk(entry, `${path}/${index}`, depth + 1));
      seen.delete(value);
      return result;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      throw new Error(`Import/export non-plain object at ${path}`);
    }
    const result = {};
    for (const key of Object.keys(value)) {
      const childPath = `${path}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`;
      if (BLOCKED_KEYS.has(key)) {
        warnings.push({ path: childPath, reason: 'prototype key removed' });
        continue;
      }
      if (options.direction === 'export' && SECRET_KEY.test(key)) {
        warnings.push({ path: childPath, reason: 'secret field removed' });
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        warnings.push({ path: childPath, reason: 'accessor removed' });
        continue;
      }
      result[key] = walk(descriptor.value, childPath, depth + 1);
    }
    seen.delete(value);
    return result;
  }

  return { value: walk(input, '', 0), warnings };
}

function neutralizeSpreadsheetFormula(value) {
  if (typeof value !== 'string') return value;
  return /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
}

export { sanitizeTransferValue, neutralizeSpreadsheetFormula, BLOCKED_KEYS };
