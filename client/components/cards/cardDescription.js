import { UnsavedEdits } from '/client/lib/unsavedEdits';
import { attachSharedDescription } from '/client/lib/sharedDescription';

const descriptionFormIsOpen = new ReactiveVar(false);

// #140: while the form is open, everybody editing this description edits it
// together (client/lib/sharedDescription.js).
Template.descriptionForm.onRendered(function () {
  const card = this.data;
  this.sharedDescription = attachSharedDescription({
    cardId: card && card._id,
    textarea: this.find('textarea.js-new-description-input'),
    saved: card && typeof card.getDescription === 'function' ? card.getDescription() || '' : '',
  });
});

Template.descriptionForm.onDestroyed(function () {
  descriptionFormIsOpen.set(false);
  if (this.sharedDescription) this.sharedDescription.detach();
});

Template.descriptionForm.helpers({
  descriptionFormIsOpen() {
    return descriptionFormIsOpen.get();
  },
});

Template.descriptionForm.events({
  async 'submit .js-card-description'(event, tpl) {
    event.preventDefault();
    const description = tpl.currentComponent ? tpl.currentComponent().getValue() : tpl.$('textarea').val();
    // #140: the last typing reaches the shared document before the save, so
    // the save matches it and the others keep editing without a reset.
    if (tpl.sharedDescription) tpl.sharedDescription.flush();
    await this.setDescription(description);
    // #6455: a successful save means there is no unsaved draft anymore; clear
    // any pre-existing draft record so the "You have an unsaved description"
    // warning does not stick around after saving.
    UnsavedEdits.reset({ fieldName: 'cardDescription', docId: this._id });
  },
  // Keyboard submission belongs to the enclosing inlinedCardDescription,
  // which owns the Save button; this nested template contains only the editor.
});
