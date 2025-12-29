BlazeComponent.extendComponent({
  onCreated() {
    // Provide the expected parent component properties for cardDetails
    this.showOverlay = new ReactiveVar(false);
    this.mouseHasEnterCardDetails = false;
  },

  selectedCard() {
    // Get the selected card from the parent ganttView template
    const parentView = this.view.parentView;
    if (parentView && parentView.templateInstance) {
      const cardId = parentView.templateInstance().selectedCardId.get();
      return cardId ? ReactiveCache.getCard(cardId) : null;
    }
    return null;
  },

  events() {
    return [
      {
        'click .js-close-gantt-card'(event) {
          // Find the parent ganttView template and clear the selected card
          const parentView = this.view.parentView;
          if (parentView && parentView.templateInstance) {
            parentView.templateInstance().selectedCardId.set(null);
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