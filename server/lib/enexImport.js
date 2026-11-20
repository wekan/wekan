'use strict';
// Server-only: an Evernote .enex file parsed with htmlparser2 (as OPML is,
// server/lib/opmlImport.js) into the notes models/lib/enexFormat.js maps to
// cards. Each note's ENML content - XHTML inside a CDATA section - is parsed
// a second time to read its text, with every <en-todo> marked so the mapping
// can turn those lines into checklist items. Nothing in the content is kept
// as markup; resources (files) are counted, not decoded.
const { parseDocument, DomUtils } = require('htmlparser2');

const MAX_ENEX_LENGTH = 256 * 1024 * 1024;
const MAX_ENEX_NOTES = 50000;
const TODO = '\u0001';
const BLOCKS = new Set(['div', 'p', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'hr', 'table']);

// The text of an ENML document, a line per block, "\u0001x" / "\u0001 " before
// each to-do.
function enmlText(content) {
  const doc = parseDocument(String(content || '').replace(/<!DOCTYPE[^>]*>/i, ''), { xmlMode: true, decodeEntities: true });
  let out = '';
  const walk = nodes => {
    for (const node of nodes || []) {
      if (node.type === 'text') out += node.data.replace(/\s+/g, ' ');
      else if (node.type === 'cdata') walk(node.children);
      else if (node.type === 'tag') {
        const name = node.name.toLowerCase();
        if (name === 'script' || name === 'style' || name === 'en-media' || name === 'en-crypt') continue;
        if (name === 'br') { out += '\n'; continue; }
        if (name === 'en-todo') {
          if (out && !out.endsWith('\n')) out += '\n';
          out += `${TODO}${node.attribs && node.attribs.checked === 'true' ? 'x' : ' '}`;
          continue;
        }
        if (BLOCKS.has(name) && out && !out.endsWith('\n')) out += '\n';
        walk(node.children);
        if (BLOCKS.has(name) && !out.endsWith('\n')) out += '\n';
      }
    }
  };
  walk(doc.children);
  return out.split('\n').map(line => line.replace(/^ +| +$/g, '')).join('\n').trim();
}

function child(node, name) {
  return (node.children || []).find(c => c.type === 'tag' && c.name.toLowerCase() === name);
}
const textOf = node => (node ? DomUtils.textContent(node).trim() : '');

// { notes, cutOff } from the .enex text.
function readEnex(text) {
  const source = String(text == null ? '' : text);
  if (source.length > MAX_ENEX_LENGTH) throw new Error('Evernote export is too large');
  if (!/<en-export[\s>]/.test(source)) throw new Error('Not an Evernote export: no <en-export>');
  const doc = parseDocument(source.replace(/<!DOCTYPE[^>]*>/i, ''), { xmlMode: true, decodeEntities: true });
  const root = DomUtils.findOne(el => el.name === 'en-export', doc.children, true);
  const noteNodes = (root ? root.children : []).filter(c => c.type === 'tag' && c.name === 'note');
  const notes = noteNodes.slice(0, MAX_ENEX_NOTES).map(note => {
    const attributes = child(note, 'note-attributes');
    const content = child(note, 'content');
    return {
      title: textOf(child(note, 'title')),
      text: enmlText(content ? DomUtils.textContent(content) : ''),
      created: textOf(child(note, 'created')),
      updated: textOf(child(note, 'updated')),
      tags: (note.children || []).filter(c => c.type === 'tag' && c.name === 'tag').map(textOf),
      reminderTime: textOf(attributes && child(attributes, 'reminder-time')),
      reminderDoneTime: textOf(attributes && child(attributes, 'reminder-done-time')),
      author: textOf(attributes && child(attributes, 'author')),
      sourceUrl: textOf(attributes && child(attributes, 'source-url')),
      resources: (note.children || []).filter(c => c.type === 'tag' && c.name === 'resource').length,
    };
  });
  return { notes, cutOff: noteNodes.length > MAX_ENEX_NOTES };
}

module.exports = { readEnex, enmlText };
