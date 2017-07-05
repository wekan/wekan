// Pressing `Escape` should close the last opened “element” and only the last
// one. Components can register themselves using a label a condition, and an
// action. This is used by Popup or inlinedForm for instance. When we press
// escape we execute the action which have a valid condition and his the highest
// in the label hierarchy.
EscapeActions = {
  _nextclickPrevented: false,

  _actions: [],

  // Executed in order
  hierarchy: [
    'textcomplete',
    'popup-back',
    'popup-close',
    'modalWindow',
    'inlinedForm',
    'detailsPane',
    'multiselection',
    'sidebarView',
  ],

  register(label, action, condition = () => true, options = {}) {
    const priority = this.hierarchy.indexOf(label);
    if (priority === -1) {
      throw Error('You must define the label in the EscapeActions hierarchy');
    }

    let enabledOnClick = options.enabledOnClick;
    if (_.isUndefined(enabledOnClick)) {
      enabledOnClick = true;
    }

    const noClickEscapeOn = options.noClickEscapeOn;

    this._actions = _.sortBy([...this._actions, {
      priority,
      condition,
      action,
      noClickEscapeOn,
      enabledOnClick,
    }], (action) => action.priority);
  },

  executeLowest() {
    return this._execute({
      multipleActions: false,
    });
  },

  executeAll() {
    return this._execute({
      multipleActions: true,
    });
  },

  executeUpTo(maxLabel) {
    return this._execute({
      maxLabel,
      multipleActions: true,
    });
  },

  clickExecute(target, maxLabel) {
    if (this._nextclickPrevented) {
      this._nextclickPrevented = false;
      return false;
    } else {
      return this._execute({
        maxLabel,
        multipleActions: false,
        isClick: true,
        clickTarget: target,
      });
    }
  },

  preventNextClick() {
    this._nextclickPrevented = true;
  },

  _stopClick(action, clickTarget) {
    if (!_.isString(action.noClickEscapeOn))
      return false;
    else
      return $(clickTarget).closest(action.noClickEscapeOn).length > 0;
  },

  _execute(options) {
    const maxLabel = options.maxLabel;
    const multipleActions = options.multipleActions;
    const isClick = Boolean(options.isClick);
    const clickTarget = options.clickTarget;

    let executedAtLeastOne = false;
    let maxPriority;

    if (!maxLabel)
      maxPriority = Infinity;
    else
      maxPriority = this.hierarchy.indexOf(maxLabel);

    for (const currentAction of this._actions) {
      if (currentAction.priority > maxPriority)
        return executedAtLeastOne;

      if (isClick && this._stopClick(currentAction, clickTarget))
        return executedAtLeastOne;

      const isEnabled = currentAction.enabledOnClick || !isClick;
      if (isEnabled && currentAction.condition()) {
        currentAction.action();
        executedAtLeastOne = true;
        if (!multipleActions)
          return executedAtLeastOne;
      }
    }
    return executedAtLeastOne;
  },
};

// Pressing escape to execute one escape action. We use `bindGloabal` vecause
// the shortcut sould work on textarea and inputs as well.
Mousetrap.bindGlobal('esc', () => {
  EscapeActions.executeLowest();
});

// On a left click on the document, we try to exectute one escape action (eg,
// close the popup). We don't execute any action if the user has clicked on a
// link or a button.
$(document).on('click', (evt) => {
  if (evt.button === 0 &&
    $(evt.target).closest('a,button,.is-editable').length === 0) {
    EscapeActions.clickExecute(evt.target, 'multiselection');
  }
});

$(document).on('click', 'a[href=#]',  (evt) => {
  evt.preventDefault();
});
