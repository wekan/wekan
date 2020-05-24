window.Popup = new (class {
  constructor() {
    // The template we use to render popups
    this.template = Template.popup;

    // We only want to display one popup at a time and we keep the view object
    // in this `Popup.current` variable. If there is no popup currently opened
    // the value is `null`.
    this.current = null;

    // It's possible to open a sub-popup B from a popup A. In that case we keep
    // the data of popup A so we can return back to it. Every time we open a new
    // popup the stack grows, every time we go back the stack decrease, and if
    // we close the popup the stack is reseted to the empty stack [].
    this._stack = [];

    // We invalidate this internal dependency every time the top of the stack
    // has changed and we want to re-render a popup with the new top-stack data.
    this._dep = new Tracker.Dependency();
  }

  /// This function returns a callback that can be used in an event map:
  ///   Template.tplName.events({
  ///     'click .elementClass': Popup.open("popupName"),
  ///   });
  /// The popup inherit the data context of its parent.
  open(name) {
    const self = this;
    const popupName = `${name}Popup`;
    function clickFromPopup(evt) {
      return $(evt.target).closest('.js-pop-over').length !== 0;
    }
    return function(evt) {
      // If a popup is already opened, clicking again on the opener element
      // should close it -- and interrupt the current `open` function.
      if (self.isOpen()) {
        const previousOpenerElement = self._getTopStack().openerElement;
        if (previousOpenerElement === evt.currentTarget) {
          self.close();
          return;
        } else {
          $(previousOpenerElement).removeClass('is-active');
        }
      }

      // We determine the `openerElement` (the DOM element that is being clicked
      // and the one we take in reference to position the popup) from the event
      // if the popup has no parent, or from the parent `openerElement` if it
      // has one. This allows us to position a sub-popup exactly at the same
      // position than its parent.
      let openerElement;
      if (clickFromPopup(evt) && self._getTopStack()) {
        openerElement = self._getTopStack().openerElement;
      } else {
        self._stack = [];
        openerElement = evt.currentTarget;
      }
      $(openerElement).addClass('is-active');
      evt.preventDefault();

      // We push our popup data to the stack. The top of the stack is always
      // used as the data source for our current popup.
      self._stack.push({
        popupName,
        openerElement,
        hasPopupParent: clickFromPopup(evt),
        title: self._getTitle(popupName),
        depth: self._stack.length,
        offset: self._getOffset(openerElement),
        dataContext: (this && this.currentData && this.currentData()) || this,
      });

      // If there are no popup currently opened we use the Blaze API to render
      // one into the DOM. We use a reactive function as the data parameter that
      // return the complete along with its top element and depends on our
      // internal dependency that is being invalidated every time the top
      // element of the stack has changed and we want to update the popup.
      //
      // Otherwise if there is already a popup open we just need to invalidate
      // our internal dependency, and since we just changed the top element of
      // our internal stack, the popup will be updated with the new data.
      if (!self.isOpen()) {
        self.current = Blaze.renderWithData(
          self.template,
          () => {
            self._dep.depend();
            return { ...self._getTopStack(), stack: self._stack };
          },
          document.body,
        );
      } else {
        self._dep.changed();
      }
    };
  }

  /// This function returns a callback that can be used in an event map:
  ///   Template.tplName.events({
  ///     'click .elementClass': Popup.afterConfirm("popupName", function() {
  ///       // What to do after the user has confirmed the action
  ///     }),
  ///   });
  afterConfirm(name, action) {
    const self = this;

    return function(evt, tpl) {
      const context = (this.currentData && this.currentData()) || this;
      context.__afterConfirmAction = action;
      self.open(name).call(context, evt, tpl);
    };
  }

  /// The public reactive state of the popup.
  isOpen() {
    this._dep.changed();
    return Boolean(this.current);
  }

  /// In case the popup was opened from a parent popup we can get back to it
  /// with this `Popup.back()` function. You can go back several steps at once
  /// by providing a number to this function, e.g. `Popup.back(2)`. In this case
  /// intermediate popup won't even be rendered on the DOM. If the number of
  /// steps back is greater than the popup stack size, the popup will be closed.
  back(n = 1) {
    if (this._stack.length > n) {
      _.times(n, () => this._stack.pop());
      this._dep.changed();
    } else {
      this.close();
    }
  }

  /// Close the current opened popup.
  close() {
    if (this.isOpen()) {
      Blaze.remove(this.current);
      this.current = null;

      const openerElement = this._getTopStack().openerElement;
      $(openerElement).removeClass('is-active');

      this._stack = [];
    }
  }

  getOpenerComponent() {
    const { openerElement } = Template.parentData(4);
    return BlazeComponent.getComponentForElement(openerElement);
  }

  // An utility fonction that returns the top element of the internal stack
  _getTopStack() {
    return this._stack[this._stack.length - 1];
  }

  // We automatically calculate the popup offset from the reference element
  // position and dimensions. We also reactively use the window dimensions to
  // ensure that the popup is always visible on the screen.
  _getOffset(element) {
    const $element = $(element);
    return () => {
      Utils.windowResizeDep.depend();

      if (Utils.isMiniScreen()) return { left: 0, top: 0 };

      const offset = $element.offset();
      const popupWidth = 300 + 15;
      return {
        left: Math.min(offset.left, $(window).width() - popupWidth),
        top: offset.top + $element.outerHeight(),
      };
    };
  }

  // We get the title from the translation files. Instead of returning the
  // result, we return a function that compute the result and since `TAPi18n.__`
  // is a reactive data source, the title will be changed reactively.
  _getTitle(popupName) {
    return () => {
      const translationKey = `${popupName}-title`;

      // XXX There is no public API to check if there is an available
      // translation for a given key. So we try to translate the key and if the
      // translation output equals the key input we deduce that no translation
      // was available and returns `false`. There is a (small) risk a false
      // positives.
      const title = TAPi18n.__(translationKey);
      // when popup showed as full of small screen, we need a default header to clearly see [X] button
      const defaultTitle = Utils.isMiniScreen() ? '' : false;
      return title !== translationKey ? title : defaultTitle;
    };
  }
})();

// We close a potential opened popup on any left click on the document, or go
// one step back by pressing escape.
const escapeActions = ['back', 'close'];
escapeActions.forEach(actionName => {
  EscapeActions.register(
    `popup-${actionName}`,
    () => Popup[actionName](),
    () => Popup.isOpen(),
    {
      noClickEscapeOn: '.js-pop-over,.js-open-card-title-popup',
      enabledOnClick: actionName === 'close',
    },
  );
});
