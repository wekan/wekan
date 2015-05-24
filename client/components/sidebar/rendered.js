Template.membersWidget.onRendered(function() {
  var self = this;
  if (! Meteor.user().isBoardMember())
    return;

  _.each(['.js-member', '.js-label'], function(className) {
    $(document).on('mouseover', function() {
      self.$(className).draggable({
        appendTo: 'body',
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 150,
        snap: false,
        snapMode: 'both',
        start: function() {
          Popup.close();
        }
      });
    });
  });
});
