// XXX This event list must be abstracted somewhere else.
function whichTransitionEvent() {
  var t;
  var el = document.createElement('fakeelement');
  var transitions = {
    transition:'transitionend',
    OTransition:'oTransitionEnd',
    MozTransition:'transitionend',
    WebkitTransition:'webkitTransitionEnd'
  };

  for (t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t];
    }
  }
}
var transitionEvent = whichTransitionEvent();

Popup.template.events({
  click: function(evt) {
    if (evt.originalEvent) {
      evt.originalEvent.clickInPopup = true;
    }
  },
  'click .js-back-view': function() {
    Popup.back();
  },
  'click .js-close-pop-over': function() {
    Popup.close();
  },
  'click .js-confirm': function() {
    this.__afterConfirmAction.call(this);
  }
});

// When a popup content is removed (ie, when the user press the "back" button),
// we need to wait for the container translation to end before removing the
// actual DOM element. For that purpose we use the undocumented `_uihooks` API.
Popup.template.onRendered(function() {
  var container = this.find('.content-container');
  container._uihooks = {
    removeElement: function(node) {
      $(node).addClass('no-height');
      $(container).one(transitionEvent, function() {
        node.parentNode.removeChild(node);
      });
    }
  };
});
