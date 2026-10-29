import { Meteor } from 'meteor/meteor';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { tripCanary } from '/server/lib/canary';

const { handlerLinkSchemes } = require('/models/lib/urlSchemeAllowlist');

// A link in card text to an operating-system handler with a code-execution
// history - ms-msdt:, search-ms:, telnet: and the rest of OS_HANDLERS in
// models/lib/urlSchemeAllowlist.js - is never made clickable, whatever Admin
// Panel -> Features -> URL lists. So writing one is never using the feature:
// it is an attempt on whoever would click it, and Admin Panel -> Problems
// shows who made it (canary 'sanitize.handler-link').
//
// SILENT, like every canary: the text is saved exactly as written and the
// writer is told nothing; the link stays plain text when it is shown. Only a
// link the write ADDS counts, so editing an old card that already had one,
// moving it or archiving it records nothing.

// Which fields of which collection hold text that is shown as markdown.
const WATCHED = [
  ['card', () => Cards, ['title', 'description']],
  ['comment', () => CardComments, ['text']],
  ['checklist', () => Checklists, ['title']],
  ['checklist item', () => ChecklistItems, ['title']],
];

// The OS-handler schemes `after` links to that `before` did not.
export function addedHandlerLinks(before, after) {
  const had = new Set(handlerLinkSchemes(before));
  return handlerLinkSchemes(after).filter(scheme => !had.has(scheme));
}

function watch(userId, where, field, before, after) {
  try {
    const added = addedHandlerLinks(before, after);
    if (added.length) {
      tripCanary('sanitize.handler-link', { userId, detail: `${where} ${field}: ${added.join(', ')}` });
    }
  } catch (e) { /* logging must never break the guard */ }
}

Meteor.startup(() => {
  // Resolved at startup, not at import: these models import each other.
  for (const [where, collectionOf, fields] of WATCHED) {
    const collection = collectionOf();
    if (!collection || !collection.before) continue;
    collection.before.insert((userId, doc) => {
      for (const field of fields) watch(userId, where, field, '', doc && doc[field]);
    });
    collection.before.update((userId, doc, fieldNames, modifier) => {
      const set = (modifier && modifier.$set) || {};
      for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(set, field)) watch(userId, where, field, doc && doc[field], set[field]);
      }
    });
  }
});
