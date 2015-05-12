Template.membersWidget.rendered = function() {
  if (! Meteor.user().isBoardMember())
    return;

  _.each(['.js-member', '.js-label'], function(className) {
    Utils.liveEvent('mouseover', function($this) {
      $this.find(className).draggable({
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
};

