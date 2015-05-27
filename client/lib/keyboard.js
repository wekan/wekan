// XXX Pressing `?` should display a list of all shortcuts available.
//
// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

Mousetrap.bind('w', function() {
  Sidebar.toogle();
});

Mousetrap.bind('q', function() {
  var currentBoardId = Session.get('currentBoard');
  var currentUserId = Meteor.userId();
  if (currentBoardId && currentUserId) {
    Filter.members.toogle(currentUserId);
  }
});

Mousetrap.bind('x', function() {
  if (Filter.isActive()) {
    Filter.reset();
  }
});

Mousetrap.bind(['down', 'up'], function(evt, key) {
  if (! Session.get('currentCard')) {
    return;
  }

  var nextFunc = (key === 'down' ? 'next' : 'prev');
  var nextCard = $('.js-minicard.is-selected')[nextFunc]('.js-minicard').get(0);
  if (nextCard) {
    var nextCardId = Blaze.getData(nextCard)._id;
    Utils.goCardId(nextCardId);
  }
});

// Pressing `Escape` should close the last opened “element” and only the last
// one. Components can register themselves using a label a condition, and an
// action. This is used by Popup or inlinedForm for instance. When we press
// escape we execute the action which have a condition is valid and his the the
// highest in the label hierarchy.
EscapeActions = {
  _actions: [],

  // Executed in order
  hierarchy: [
    'textcomplete',
    'popup',
    'inlinedForm',
    'sidebarView',
    'detailedPane'
  ],

  register: function(label, condition, action) {
    // XXX Rewrite this with ES6: .push({ priority, condition, action })
    var priority = this.hierarchy.indexOf(label);
    if (priority === -1) {
      throw Error('You must define the label in the EscapeActions hierarchy');
    }
    this._actions.push({
      priority: priority,
      condition: condition,
      action: action
    });
    // XXX Rewrite this with ES6: => function
    this._actions = _.sortBy(this._actions, function(a) { return a.priority; });
  },

  executeLowest: function() {
    var topActiveAction = _.find(this._actions, function(a) {
      return !! a.condition();
    });
    return topActiveAction && topActiveAction.action();
  },

  executeLowerThan: function(label) {
    var maxPriority, currentAction;
    if (! label)
      maxPriority = Infinity;
    else
      maxPriority = this.hierarchy.indexOf(label);

    for (var i = 0; i < this._actions.length; i++) {
      currentAction = this._actions[i];
      if (currentAction.priority > maxPriority)
        return;
      if (!! currentAction.condition())
        currentAction.action();
    }
  }
};

Mousetrap.bind('esc', function() {
  EscapeActions.executeLowest();
});
