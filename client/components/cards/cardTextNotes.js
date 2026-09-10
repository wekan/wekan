import { ReactiveCache } from '/imports/reactiveCache';
import CardTextNotes from '/models/cardTextNotes';

// GitHub issue #595: "Markdown textfile attachment" - an attachable text
// NOTE (separate from the card's own description) with markdown support,
// editable in a popup, so a card can carry several distinct text blocks
// instead of cramming everything into one description field.
//
// The edit popup reuses the exact same `editor`/`viewer` templates the card
// description already uses (client/components/main/editor.jade) - no new
// markdown editing widget is written here.

Template.cardTextNotes.helpers({
  textNotes() {
    return ReactiveCache.getCardTextNotes(
      { cardId: this._id },
      { sort: { createdAt: 1 } },
    );
  },
});

Template.cardTextNotes.events({
  // "Add text note" is clicked with the CARD as data context (cardTextNotes'
  // own context), so the popup receives {_id: <cardId>} and no cardId/text of
  // its own - it is an editor with nothing pre-filled yet.
  'click .js-add-text-note': Popup.open('cardTextNoteEdit'),
  // "Edit"/"Delete" are clicked inside `each textNotes`, so the popup instead
  // receives the note itself (which has its own cardId).
  'click .js-edit-text-note': Popup.open('cardTextNoteEdit'),
  'click .js-delete-text-note': Popup.open('cardTextNoteDelete'),
});

Template.cardTextNoteEditPopup.events({
  'submit .js-card-text-note-edit-form'(event, tpl) {
    event.preventDefault();
    const title = tpl.$('.js-card-text-note-title-input').val().trim();
    const text = tpl.currentComponent
      ? tpl.currentComponent().getValue()
      : tpl.$('.js-card-text-note-text-input').val();

    // A note being edited carries its own cardId; the "add" popup's context
    // is the card itself, so cardId is absent and _id is the CARD's id.
    const isExistingNote = !!this.cardId;
    if (isExistingNote) {
      CardTextNotes.update(this._id, {
        $set: { title, text },
      });
    } else {
      const cardId = this._id;
      const card = ReactiveCache.getCard(cardId);
      CardTextNotes.insert({
        cardId,
        boardId: card && card.boardId,
        title,
        text,
      });
    }
    Popup.back();
  },
  'click .js-delete-text-note-from-popup'(event) {
    event.preventDefault();
    if (this.cardId) {
      CardTextNotes.remove(this._id);
    }
    Popup.back();
  },
});

Template.cardTextNoteDeletePopup.events({
  'submit'(event) {
    event.preventDefault();
    if (this.cardId) {
      CardTextNotes.remove(this._id);
    }
    Popup.back();
  },
});
