const EditCardEstimate = BlazeComponent.extendComponent({
  template() {
    return 'editCardEstimate';
  },

  onCreated() {
    const self = this;
    self.error = new ReactiveVar('');
    self.card = self.data();
    self.estimate = ReactiveVar();
  },

  showEstimate() {
    return this.estimate.get();
  },

  events() {
    return [{
      'submit .edit-estimate'(evt) {
        evt.preventDefault();

        const estimateFromPage = evt.target.estimate.value;
        if (estimateFromPage && estimateFromPage > 0) {
          this._storeEstimate(estimateFromPage);
          Popup.close();
        }
        else {
          this.error.set('invalid-value');
          evt.target.estimate.focus();
        }
      },
      'click .js-delete-estimate'(evt) {
        evt.preventDefault();
        this._deleteEstimate();
        Popup.close();
      },
    }];
  },
});

// editCardEsimatePopup
(class extends EditCardEstimate {
  onCreated() {
    super.onCreated();
    if (this.data().estimate) {
      this.estimate.set(this.data().estimate);
    }
  }

  _storeEstimate(estimate) {
    this.card.setEstimate(estimate);
  }

  _deleteEstimate() {
    this.card.unsetEstimate();
  }
}).register('editCardEstimatePopup');

// Display card estimate
const CardEstimate = BlazeComponent.extendComponent({
  template() {
    return 'estimateBadge';
  },

  onCreated() {
    const self = this;
    self.estimate = ReactiveVar();
    self.autorun(() => {
      self.estimate.set(self.data().estimate);
    });
  },

  showEstimate() {
    return this.estimate.get();
  },

  showTitle() {
    return `${TAPi18n.__('editCardEstimate-title')}`;
  },

  events() {
    return [{
      'click .js-edit-estimate': Popup.open('editCardEstimate'),
    }];
  },
}).register('cardEstimate');


(class extends CardEstimate {
  showEstimate() {
    return this.estimate.get();
  }
}).register('minicardEstimate');