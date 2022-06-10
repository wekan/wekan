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
        // was keydown
        // extraevent for saving input. buffer of keydown vs buffer time
        'keyup form textarea'(evt) {
          const description = this.getInput()[0].value;
          this.data().setDescription(description);
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
