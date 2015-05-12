BlazeComponent.extendComponent({
  template: function() {
    return 'listHeader';
  },

  editTitle: function(evt) {
    evt.preventDefault();
    var form = this.componentChildren('inlinedForm')[0];
    var newTitle = form.getValue();
    if ($.trim(newTitle)) {
      Lists.update(this.currentData()._id, {
        $set: {
          title: newTitle
        }
      });
    }
  },

  events: function() {
    return [{
      'click .js-open-list-menu': Popup.open('listAction'),
      submit: this.editTitle
    }];
  }
}).register('listHeader');
