const descriptionFormIsOpen = new ReactiveVar(false);

Template.descriptionForm.onDestroyed(function () {
  descriptionFormIsOpen.set(false);
  $('.note-popover').hide();
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
  },
  // Pressing Ctrl+Enter should submit the form
  'keydown form textarea'(evt, tpl) {
    if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
      const submitButton = tpl.find('button[type=submit]');
      if (submitButton) {
        submitButton.click();
      }
    }
  },
});
