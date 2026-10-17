'use strict';

// Checklist or subtasks from a card's description
// (docs/Features/Cards/Checklist-From-Description.md): the list lines of the
// Markdown - Trello's "generate checklist" and Jira's "break down", here the
// lines the author already wrote as a list.
//
// Pure, no Meteor. Tests: tests/descriptionListItems.test.cjs.

const MAX_ITEMS = 100;
const MAX_TITLE = 500;

const FENCE = /^\s*(```|~~~)/;
// "- item", "* item", "+ item", "1. item", "1) item", each optionally with a
// task box, or a bare task box "[ ] item".
const ITEM = /^\s*(?:[-*+]|\d{1,4}[.)])\s+(?:\[([ xX])\]\s+)?(.+?)\s*$/;
const BOX = /^\s*\[([ xX])\]\s+(.+?)\s*$/;

// [{ title, checked }] in the order written.
function descriptionListItems(markdown) {
  const out = [];
  let inFence = false;
  for (const line of String(markdown || '').split(/\r?\n/)) {
    if (FENCE.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = ITEM.exec(line) || BOX.exec(line);
    if (!m) continue;
    const [, box, text] = m;
    const title = text.trim().slice(0, MAX_TITLE);
    if (!title) continue;
    out.push({ title, checked: box === 'x' || box === 'X' });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

module.exports = { MAX_ITEMS, descriptionListItems };
