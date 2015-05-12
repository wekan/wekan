Template.cardActivities.events({
  'click .js-edit-action': function(evt) {
    var $this = $(evt.currentTarget);
    var container = $this.parents('.phenom-comment');

    // open and focus
    container.addClass('editing');
    container.find('textarea').focus();
  },
  'click .js-confirm-delete-action': function() {
    CardComments.remove(this._id);
  },
  'submit form': function(evt) {
    var $this = $(evt.currentTarget);
    var container = $this.parents('.phenom-comment');
    var text = container.find('textarea');

    if ($.trim(text.val())) {
      CardComments.update(this._id, {
        $set: {
          text: text.val()
        }
      });

      // reset editing class
      $('.editing').removeClass('editing');
    }
    evt.preventDefault();
  }
});
