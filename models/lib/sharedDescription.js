'use strict';

// #140: real-time shared editing of a card description. Everybody who has the
// description open edits one Yjs document (a Y.Text), so two people typing at
// once both keep what they typed instead of the later Save replacing the
// earlier one. The editor stays the plain Markdown textarea: each change to
// it becomes the smallest Y.Text edit, and each remote change is written back
// with the caret kept where it was. Pure: tests/sharedDescription.test.cjs.

// The largest single update a client may send, and the largest document the
// server keeps. A description is text; this is far above any real one.
const MAX_UPDATE_BYTES = 256 * 1024;
const MAX_STATE_BYTES = 1024 * 1024;
// A document nobody has touched for this long is started again from the
// saved description rather than resumed.
const IDLE_MS = 24 * 60 * 60 * 1000;

// The one contiguous change that turns `before` into `after`: what a single
// keystroke, paste or cut in a textarea always is.
function textDiff(before, after) {
  const a = String(before ?? '');
  const b = String(after ?? '');
  let start = 0;
  const max = Math.min(a.length, b.length);
  while (start < max && a.charCodeAt(start) === b.charCodeAt(start)) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a.charCodeAt(endA - 1) === b.charCodeAt(endB - 1)) {
    endA--;
    endB--;
  }
  // Never split a UTF-16 surrogate pair: an emoji is removed or inserted whole.
  if (start > 0 && (isLowSurrogate(a.charCodeAt(start)) || isLowSurrogate(b.charCodeAt(start)))) start--;
  if (endA < a.length && isLowSurrogate(a.charCodeAt(endA)) && endA > start) {
    endA++;
    endB++;
  }
  return { index: start, remove: endA - start, insert: b.slice(start, endB) };
}

function isLowSurrogate(code) {
  return code >= 0xdc00 && code <= 0xdfff;
}

// Apply the textarea's change to the Y.Text that held `before`.
function applyTextChange(ytext, before, after) {
  const { index, remove, insert } = textDiff(before, after);
  if (remove) ytext.delete(index, remove);
  if (insert) ytext.insert(index, insert);
  return remove > 0 || insert.length > 0;
}

// What the textarea should show on first sync. With no draft of its own (it
// shows the saved description) it adopts the shared text, which may already
// hold somebody else's unsaved typing. With a draft, the draft is kept and is
// sent as this editor's change - reverting the others would lose their work,
// and dropping the draft would lose this user's.
function initialText({ textarea, saved, shared }) {
  const own = String(textarea ?? '');
  if (own === String(saved ?? '')) return { text: String(shared ?? ''), push: false };
  return { text: own, push: own !== String(shared ?? '') };
}

function isStale(doc, now = Date.now()) {
  return !doc || !doc.updatedAt || now - new Date(doc.updatedAt).getTime() > IDLE_MS;
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBytes(text) {
  if (typeof text !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4) throw new Error('invalid base64');
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(text, 'base64'));
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

module.exports = {
  MAX_UPDATE_BYTES, MAX_STATE_BYTES, IDLE_MS,
  textDiff, applyTextChange, initialText, isStale, bytesToBase64, base64ToBytes,
};
