import { UnsavedEdits } from '/client/lib/unsavedEdits';

const descriptionFormIsOpen = new ReactiveVar(false);

Template.descriptionForm.onDestroyed(function () {
  descriptionFormIsOpen.set(false);
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
    await this.setDescription(description);
    // #6455: a successful save means there is no unsaved draft anymore; clear
    // any pre-existing draft record so the "You have an unsaved description"
    // warning does not stick around after saving.
    UnsavedEdits.reset({ fieldName: 'cardDescription', docId: this._id });
  },
  // Keyboard submission belongs to the enclosing inlinedCardDescription,
  // which owns the Save button; this nested template contains only the editor.
});
