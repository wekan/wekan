// #140: real-time shared editing of a card description
// (models/lib/sharedDescription.js, server/sharedDescription.js). While the
// description textarea is open it follows the card's shared Yjs document:
// local typing is sent as Yjs updates, everybody else's arrives through the
// publication and is written into the textarea with the caret kept in place.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import * as Y from 'yjs';
import autosize from 'autosize';

const { applyTextChange, initialText, bytesToBase64, base64ToBytes } = require('/models/lib/sharedDescription');

const CardDescriptionDocs = new Mongo.Collection('cardDescriptionDocs');
const SEND_DELAY_MS = 100;

export function attachSharedDescription({ cardId, textarea, saved }) {
  if (!cardId || !textarea) return { flush() {}, detach() {} };
  let ydoc = null;
  let ytext = null;
  let generation = null;
  let pending = [];
  let timer = null;

  function send() {
    clearTimeout(timer);
    timer = null;
    if (!pending.length || !generation) return;
    const update = pending.length === 1 ? pending[0] : Y.mergeUpdates(pending);
    pending = [];
    // A refused update ('description-doc-reset') needs nothing here: the new
    // document arrives through the subscription and start() sends this
    // editor's text as its draft.
    Meteor.callAsync('applyCardDescriptionUpdate', cardId, generation, bytesToBase64(update)).catch(() => {});
  }

  function onUpdate(update, origin) {
    if (origin !== 'local') return;
    pending.push(update);
    if (!timer) timer = setTimeout(send, SEND_DELAY_MS);
  }

  function show(text, selection) {
    if (textarea.value === text) return;
    textarea.value = text;
    if (selection && document.activeElement === textarea) textarea.setSelectionRange(selection[0], selection[1]);
    autosize.update(textarea);
  }

  function start(doc) {
    if (ydoc) ydoc.destroy();
    pending = [];
    ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, base64ToBytes(doc.state), 'remote');
    ytext = ydoc.getText('description');
    generation = doc.generation;
    ydoc.on('update', onUpdate);
    const { text, push } = initialText({ textarea: textarea.value, saved, shared: ytext.toString() });
    if (push) ydoc.transact(() => applyTextChange(ytext, ytext.toString(), text), 'local');
    else show(text);
  }

  function merge(doc) {
    // An edit that fired no input event (an autocomplete insert, Markdown
    // conversion) is taken in first, so the remote merge cannot undo it.
    onInput();
    const caret = [textarea.selectionStart, textarea.selectionEnd]
      .map(index => Y.createRelativePositionFromTypeIndex(ytext, index));
    Y.applyUpdate(ydoc, base64ToBytes(doc.state), 'remote');
    const selection = caret.map(rel => Y.createAbsolutePositionFromRelativePosition(rel, ydoc)?.index ?? 0);
    show(ytext.toString(), selection);
  }

  function onInput() {
    if (!ytext) return;
    ydoc.transact(() => applyTextChange(ytext, ytext.toString(), textarea.value), 'local');
  }

  const subscription = Meteor.subscribe('cardDescriptionDoc', cardId);
  const computation = Tracker.autorun(() => {
    const doc = CardDescriptionDocs.findOne(cardId);
    if (!doc || !doc.state) return;
    Tracker.nonreactive(() => {
      try {
        if (doc.generation !== generation) start(doc);
        else merge(doc);
      } catch (e) {
        // A document this editor cannot read leaves the textarea as it is:
        // Save still works exactly as without shared editing.
      }
    });
  });
  textarea.addEventListener('input', onInput);

  return {
    flush: send,
    detach() {
      send();
      textarea.removeEventListener('input', onInput);
      computation.stop();
      subscription.stop();
      if (ydoc) ydoc.destroy();
      ydoc = null;
      ytext = null;
    },
  };
}
