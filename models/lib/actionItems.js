'use strict';

// Action items from a comment or a description
// (docs/Features/Cards/Action-Items.md): the "who does what" lines meeting
// notes end with, which Confluence and Jira find with AI, found here by their
// shape.
//
// Pure, no Meteor. Tests: tests/actionItems.test.cjs.

const MAX_ITEMS = 50;
const MAX_TITLE = 500;

const FENCE = /^\s*(```|~~~)/;
const TODO = /^\s*(?:[-*+]\s+)?TODO\s*:\s*(.+?)\s*$/i;
const BOX = /^\s*(?:[-*+]\s+)?\[ \]\s+(.+?)\s*$/;
const MENTION_FIRST = /^\s*(?:[-*+]\s+)?@([\w.-]+)\s+(.+?)\s*$/;
const LEADING_MENTION = /^@([\w.-]+)\s+(.+)$/;

// usernames: the board's active members. A mention of anybody else stays in
// the title. Returns [{ title, username }].
function actionItems(text, usernames = []) {
  const members = new Set(usernames);
  const out = [];
  let inFence = false;
  for (const line of String(text || '').split(/\r?\n/)) {
    if (FENCE.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    let body = null;
    let m = TODO.exec(line) || BOX.exec(line);
    if (m) body = m[1];
    else if ((m = MENTION_FIRST.exec(line))) body = `@${m[1]} ${m[2]}`;
    if (!body) continue;
    let username = null;
    const mention = LEADING_MENTION.exec(body);
    if (mention && members.has(mention[1])) {
      username = mention[1];
      body = mention[2];
    }
    const title = body.trim().slice(0, MAX_TITLE);
    if (!title) continue;
    out.push({ title, username });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

module.exports = { MAX_ITEMS, actionItems };
