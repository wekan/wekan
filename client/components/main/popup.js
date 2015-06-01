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
  },
  // This handler intends to solve a pretty tricky bug with our popup
  // transition. The transition is implemented using a large container
  // (.content-container) that is moved on the x-axis (from 0 to n*PopupSize)
  // inside a wrapper (.container-wrapper) with a hidden overflow. The problem
  // is that sometimes the wrapper is scrolled -- even if there are no
  // scrollbars. This happen for instance when the newly opened popup has some
  // focused field, the browser will automatically scroll the wrapper, resulting
  // in moving the whole popup container outside of the popup wrapper. To
  // disable this behavior we have to manually reset the scrollLeft position
  // whenever it is modified.
  'scroll .content-wrapper': function(evt) {
    evt.currentTarget.scrollLeft = 0;
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
