BlazeComponent.extendComponent({
  onCreated() {
    // Provide the expected parent component properties for cardDetails
    this.showOverlay = new ReactiveVar(false);
    this.mouseHasEnterCardDetails = false;
  },

  selectedCard() {
    // The selected card is now passed as a parameter to the component
    return this.currentData();
  },

  events() {
    return [
      {
        'click .js-close-card-details'(event) {
          event.preventDefault();
          // Find the ganttView template instance and clear selectedCardId
          let view = Blaze.currentView;
          while (view) {
            if (view.templateInstance && view.templateInstance().selectedCardId) {
              view.templateInstance().selectedCardId.set(null);
              break;
            }
            view = view.parentView;
          }
        },
      },
    ];
  },
}).register('ganttCard');

// Add click handler to ganttView for card titles
Template.ganttView.events({
  'click .js-gantt-card-title'(event, template) {
    event.preventDefault();
    // Get card ID from the closest row's data attribute
    const $row = template.$(event.currentTarget).closest('tr');
    const cardId = $row.data('card-id');

    if (cardId) {
      template.selectedCardId.set(cardId);
    }
  },
});