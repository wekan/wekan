// Pressing `Escape` should close the last opened “element” and only the last
// one. Components can register themselves using a label a condition, and an
// action. This is used by Popup or inlinedForm for instance. When we press
// escape we execute the action which have a valid condition and his the highest
// in the label hierarchy.
EscapeActions = {
  _actions: [],

  // Executed in order
  hierarchy: [
    'textcomplete',
    'popup',
    'inlinedForm',
    'detailsPane',
    'multiselection',
    'sidebarView'
  ],

  register: function(label, action, condition, options) {
    condition = condition || function() { return true; };
    options = options || {};

    // XXX Rewrite this with ES6: .push({ priority, condition, action })
    var priority = this.hierarchy.indexOf(label);
    if (priority === -1) {
      throw Error('You must define the label in the EscapeActions hierarchy');
    }

    this._actions.push({
      priority: priority,
      condition: condition,
      action: action,
      noClickEscapeOn: options.noClickEscapeOn
    });
    // XXX Rewrite this with ES6: => function
    this._actions = _.sortBy(this._actions, function(a) { return a.priority; });
  },

  executeLowest: function() {
    return this._execute({
      multipleAction: false
    });
  },

  executeAll: function() {
    return this._execute({
      multipleActions: true
    });
  },

  executeUpTo: function(maxLabel) {
    return this._execute({
      maxLabel: maxLabel,
      multipleActions: true
    });
  },

  clickExecute: function(evt, maxLabel) {
    return this._execute({
      maxLabel: maxLabel,
      multipleActions: false,
      evt: evt
    });
  },

  _stopClick: function(action, clickTarget) {
    if (! _.isString(action.noClickEscapeOn))
      return false;
    else
      return $(clickTarget).closest(action.noClickEscapeOn).length > 0;
  },

  _execute: function(options) {
    var maxLabel = options.maxLabel;
    var evt = options.evt || {};
    var multipleActions = options.multipleActions;

    var maxPriority, currentAction;
    var executedAtLeastOne = false;
    if (! maxLabel)
      maxPriority = Infinity;
    else
      maxPriority = this.hierarchy.indexOf(maxLabel);

    for (var i = 0; i < this._actions.length; i++) {
      currentAction = this._actions[i];
      if (currentAction.priority > maxPriority)
        return executedAtLeastOne;

      if (evt.type === 'click' && this._stopClick(currentAction, evt.target))
        return executedAtLeastOne;

      if (currentAction.condition()) {
        currentAction.action(evt);
        executedAtLeastOne = true;
        if (! multipleActions)
          return executedAtLeastOne;
      }
    }
    return executedAtLeastOne;
  }
};

// MouseTrap plugin bindGlobal plugin. Adds a bindGlobal method to Mousetrap
// that allows you to bind specific keyboard shortcuts that will still work
// inside a text input field.
//
// usage:
// Mousetrap.bindGlobal('ctrl+s', _saveChanges);
//
// source:
// https://github.com/ccampbell/mousetrap/tree/master/plugins/global-bind
var _globalCallbacks = {};
var _originalStopCallback = Mousetrap.stopCallback;

Mousetrap.stopCallback = function(e, element, combo, sequence) {
  var self = this;

  if (self.paused) {
    return true;
  }

  if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
    return false;
  }

  return _originalStopCallback.call(self, e, element, combo);
};

Mousetrap.bindGlobal = function(keys, callback, action) {
  var self = this;
  self.bind(keys, callback, action);

  if (keys instanceof Array) {
    for (var i = 0; i < keys.length; i++) {
      _globalCallbacks[keys[i]] = true;
    }
    return;
  }

  _globalCallbacks[keys] = true;
};

// Pressing escape to execute one escape action. We use `bindGloabal` vecause
// the shortcut sould work on textarea and inputs as well.
Mousetrap.bindGlobal('esc', function() {
  EscapeActions.executeLowest();
});

// On a left click on the document, we try to exectute one escape action (eg,
// close the popup). We don't execute any action if the user has clicked on a
// link or a button.
$(document).on('click', function(evt) {
  if (evt.which === 1 &&
    $(evt.target).closest('a,button,.is-editable').length === 0) {
    EscapeActions.clickExecute(evt, 'multiselection');
  }
});
