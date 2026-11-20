'use strict';
// Server-only: JSON read from a stream a chunk at a time and built into its
// value as it arrives, so an uploaded JSON export is never one string in
// memory. That matters beyond memory: a JavaScript string cannot be longer
// than about 512 MB, so `JSON.parse(await readFile(file, 'utf8'))` cannot read
// a larger export at all, however much memory the server has.
//
// A small state machine over the characters (RFC 8259): objects, arrays,
// strings with every escape (\uXXXX and surrogate pairs), numbers, true, false
// and null. Chunk boundaries may fall anywhere - inside a string, an escape, a
// number or a literal. What it builds is what JSON.parse would: duplicate keys
// keep the last, and a key named __proto__ is an own property, never the
// prototype. Nesting is bounded (MAX_DEPTH) so a hostile file cannot exhaust
// the stack of whatever reads the result.

const MAX_DEPTH = 512;

class JsonStreamParser {
  constructor() {
    this.stack = [];      // [{ container, key }] - the open objects and arrays
    this.state = 'value'; // what may come next
    this.root = undefined;
    this.done = false;
    this.token = '';      // a number or literal being read
    this.str = null;      // a string being read: array of parts
    this.esc = null;      // inside an escape: '' after '\', or 'u' + hex digits
    this.pendingHigh = null; // a high surrogate waiting for its low half
    this.isKey = false;
  }

  fail(message) { throw new SyntaxError(`Invalid JSON: ${message}`); }

  put(value) {
    const top = this.stack[this.stack.length - 1];
    if (!top) {
      if (this.done) this.fail('more than one value');
      this.root = value;
      this.done = true;
      this.state = 'end';
      return;
    }
    if (Array.isArray(top.container)) {
      top.container.push(value);
    } else {
      Object.defineProperty(top.container, top.key, { value, writable: true, enumerable: true, configurable: true });
    }
    this.state = 'afterValue';
  }

  open(container) {
    if (this.stack.length >= MAX_DEPTH) this.fail(`nested deeper than ${MAX_DEPTH}`);
    this.put(container);
    this.stack.push({ container, key: null });
    this.state = Array.isArray(container) ? 'arrayStart' : 'objectStart';
  }

  close(isArray) {
    const top = this.stack.pop();
    if (!top || Array.isArray(top.container) !== isArray) this.fail(`unexpected ${isArray ? ']' : '}'}`);
    this.state = this.stack.length ? 'afterValue' : 'end';
  }

  endToken() {
    const t = this.token;
    this.token = '';
    if (t === 'true') return this.put(true);
    if (t === 'false') return this.put(false);
    if (t === 'null') return this.put(null);
    if (!/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(t)) this.fail(`bad token ${t.slice(0, 20)}`);
    return this.put(Number(t));
  }

  endString() {
    if (this.pendingHigh !== null) { this.str.push(String.fromCharCode(this.pendingHigh)); this.pendingHigh = null; }
    const text = this.str.join('');
    this.str = null;
    if (this.isKey) {
      this.isKey = false;
      this.stack[this.stack.length - 1].key = text;
      this.state = 'colon';
    } else {
      this.put(text);
    }
  }

  pushChar(code) {
    if (this.pendingHigh !== null) {
      if (code >= 0xdc00 && code <= 0xdfff) {
        this.str.push(String.fromCharCode(this.pendingHigh, code));
        this.pendingHigh = null;
        return;
      }
      this.str.push(String.fromCharCode(this.pendingHigh));
      this.pendingHigh = null;
    }
    if (code >= 0xd800 && code <= 0xdbff) this.pendingHigh = code;
    else this.str.push(String.fromCharCode(code));
  }

  write(chunk) {
    const s = String(chunk);
    let i = 0;
    while (i < s.length) {
      if (this.str !== null) {
        if (this.esc !== null) {
          const c = s[i++];
          if (this.esc === '') {
            const simple = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }[c];
            if (simple !== undefined) { this.pushChar(simple.charCodeAt(0)); this.esc = null; } else if (c === 'u') this.esc = 'u';
            else this.fail(`bad escape \\${c}`);
          } else {
            if (!/[0-9a-fA-F]/.test(c)) this.fail('bad \\u escape');
            this.esc += c;
            if (this.esc.length === 5) { this.pushChar(parseInt(this.esc.slice(1), 16)); this.esc = null; }
          }
          continue;
        }
        // Copy the run of ordinary characters at once.
        let j = i;
        while (j < s.length && s[j] !== '"' && s[j] !== '\\') {
          if (s.charCodeAt(j) < 0x20) this.fail('control character in a string');
          j += 1;
        }
        if (j > i) {
          if (this.pendingHigh !== null) { this.str.push(String.fromCharCode(this.pendingHigh)); this.pendingHigh = null; }
          this.str.push(s.slice(i, j));
        }
        if (j >= s.length) { i = j; continue; }
        if (s[j] === '"') { i = j + 1; this.endString(); continue; }
        this.esc = '';
        i = j + 1;
        continue;
      }
      const c = s[i];
      if (this.token) {
        if (/[0-9a-zA-Z.+-]/.test(c)) { this.token += c; i += 1; if (this.token.length > 400) this.fail('token too long'); continue; }
        this.endToken();
      }
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i += 1; continue; }
      i += 1;
      switch (this.state) {
        case 'value': case 'arrayStart':
          if (c === ']' && this.state === 'arrayStart') { this.close(true); break; }
          if (c === '{') this.open({});
          else if (c === '[') this.open([]);
          else if (c === '"') this.str = [];
          else if (/[-0-9tfn]/.test(c)) this.token = c;
          else this.fail(`unexpected ${c}`);
          break;
        case 'objectStart': case 'key':
          if (c === '}' && this.state === 'objectStart') { this.close(false); break; }
          if (c !== '"') this.fail('expected a key');
          this.isKey = true;
          this.str = [];
          break;
        case 'colon':
          if (c !== ':') this.fail('expected :');
          this.state = 'value';
          break;
        case 'afterValue': {
          const top = this.stack[this.stack.length - 1];
          const isArray = Array.isArray(top.container);
          if (c === ',') this.state = isArray ? 'value' : 'key';
          else if (c === ']' && isArray) this.close(true);
          else if (c === '}' && !isArray) this.close(false);
          else this.fail(`unexpected ${c}`);
          break;
        }
        case 'end': this.fail('more after the end');
        // falls through - unreachable, fail throws
        default: this.fail('bad state');
      }
    }
  }

  end() {
    if (this.str !== null) this.fail('unterminated string');
    if (this.token) this.endToken();
    if (!this.done || this.stack.length) this.fail('unexpected end');
    return this.root;
  }
}

// Parse a whole JSON document from a readable stream (a file on disk).
async function parseJsonStream(stream) {
  const parser = new JsonStreamParser();
  stream.setEncoding?.('utf8');
  let first = true;
  for await (const chunk of stream) {
    let text = String(chunk);
    if (first) { text = text.replace(/^\uFEFF/, ''); first = false; }
    parser.write(text);
  }
  return parser.end();
}

function parseJsonText(text) {
  const parser = new JsonStreamParser();
  parser.write(String(text).replace(/^\uFEFF/, ''));
  return parser.end();
}

module.exports = { JsonStreamParser, parseJsonStream, parseJsonText, MAX_DEPTH };
