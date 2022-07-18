const descriptionFormIsOpen = new ReactiveVar(false);

BlazeComponent.extendComponent({
  onDestroyed() {
    descriptionFormIsOpen.set(false);
    $('.note-popover').hide();
  },

  descriptionFormIsOpen() {
    return descriptionFormIsOpen.get();
  },

  getInput() {
    return this.$('.js-new-description-input');
  },

  events() {
    return [
      {
        'submit .js-card-description'(event) {
          event.preventDefault();
          const description = this.currentComponent().getValue();
          this.data().setDescription(description);
        },
        // Pressing Ctrl+Enter should submit the form
        'keydown form textarea'(evt) {
          if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
            const submitButton = this.find('button[type=submit]');
            if (submitButton) {
              submitButton.click();
            }
          }
        },
      },
    ];
  },
}).register('descriptionForm');
