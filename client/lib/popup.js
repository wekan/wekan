// A simple tracker dependency that we invalidate every time the window is
// resized. This is used to reactively re-calculate the popup position in case
// of a window resize.
var windowResizeDep = new Tracker.Dependency();
$(window).on('resize', function() { windowResizeDep.changed(); });

Popup = {
  /// This function returns a callback that can be used in an event map:
  ///
  ///   Template.tplName.events({
  ///     'click .elementClass': Popup.open("popupName")
  ///   });
  ///
  /// The popup inherit the data context of its parent.
  open: function(name) {
    var self = this;
    var popupName = name + 'Popup';

    return function(evt) {
      // If a popup is already openened, clicking again on the opener element
      // should close it -- and interupt the current `open` function.
      if (self.isOpen()) {
        var previousOpenerElement = self._getTopStack().openerElement;
        if (previousOpenerElement === evt.currentTarget) {
          return self.close();
        } else {
          $(previousOpenerElement).removeClass('is-active');
        }
      }

      // We determine the `openerElement` (the DOM element that is being clicked
      // and the one we take in reference to position the popup) from the event
      // if the popup has no parent, or from the parent `openerElement` if it
      // has one. This allows us to position a sub-popup exactly at the same
      // position than its parent.
      var openerElement;
      if (self._hasPopupParent()) {
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
        __isPopup: true,
        popupName: popupName,
        hasPopupParent: self._hasPopupParent(),
        title: self._getTitle(popupName),
        openerElement: openerElement,
        offset: self._getOffset(openerElement),
        dataContext: this.currentData && this.currentData() || this
      });

      // If there are no popup currently opened we use the Blaze API to render
      // one into the DOM. We use a reactive function as the data parameter that
      // return the the complete along with its top element and depends on our
      // internal dependency that is being invalidated every time the top
      // element of the stack has changed and we want to update the popup.
      //
      // Otherwise if there is already a popup open we just need to invalidate
      // our internal dependency, and since we just changed the top element of
      // our internal stack, the popup will be updated with the new data.
      if (! self.isOpen()) {
        self.current = Blaze.renderWithData(self.template, function() {
          self._dep.depend();
          return _.extend(self._stack[self._stack.length - 1], {
            stack: self._stack,
            containerTranslation: (self._stack.length - 1) * -300
          });
        }, document.body);

      } else {
        self._dep.changed();
      }
    };
  },

  /// This function returns a callback that can be used in an event map:
  ///
  ///   Template.tplName.events({
  ///     'click .elementClass': Popup.afterConfirm("popupName", function() {
  ///       // What to do after the user has confirmed the action
  ///     })
  ///   });
  afterConfirm: function(name, action) {
    var self = this;

    return function(evt, tpl) {
      var context = this.currentData && this.currentData() || this;
      context.__afterConfirmAction = action;
      self.open(name).call(context, evt, tpl);
    };
  },

  /// The public reactive state of the popup.
  isOpen: function() {
    this._dep.changed();
    return !! this.current;
  },

  /// In case the popup was opened from a parent popup we can get back to it
  /// with this `Popup.back()` function. You can go back several steps at once
  /// by providing a number to this function, e.g. `Popup.back(2)`. In this case
  /// intermediate popup won't even be rendered on the DOM. If the number of
  /// steps back is greater than the popup stack size, the popup will be closed.
  back: function(n) {
    n = n || 1;
    var self = this;
    if (self._stack.length > n) {
      _.times(n, function() { self._stack.pop(); });
      self._dep.changed();
    } else {
      self.close();
    }
  },

  /// Close the current opened popup.
  close: function() {
    if (this.isOpen()) {
      Blaze.remove(this.current);
      this.current = null;

      var openerElement = this._getTopStack().openerElement;
      $(openerElement).removeClass('is-active');

      this._stack = [];
    }
  },

  // The template we use for every popup
  template: Template.popup,

  // We only want to display one popup at a time and we keep the view object in
  // this `Popup._current` variable. If there is no popup currently opened the
  // value is `null`.
  _current: null,

  // It's possible to open a sub-popup B from a popup A. In that case we keep
  // the data of popup A so we can return back to it. Every time we open a new
  // popup the stack grows, every time we go back the stack decrease, and if we
  // close the popup the stack is reseted to the empty stack [].
  _stack: [],

  // We invalidate this internal dependency every time the top of the stack has
  // changed and we want to render a popup with the new top-stack data.
  _dep: new Tracker.Dependency(),

  // An utility fonction that returns the top element of the internal stack
  _getTopStack: function() {
    return this._stack[this._stack.length - 1];
  },

  // We use the blaze API to determine if the current popup has been opened from
  // a parent popup. The number we give to the `Template.parentData` has been
  // determined experimentally and is susceptible to change if you modify the
  // `Popup.template`
  _hasPopupParent: function() {
    var tryParentData = Template.parentData(3);
    return !! (tryParentData && tryParentData.__isPopup);
  },

  // We automatically calculate the popup offset from the reference element
  // position and dimensions. We also reactively use the window dimensions to
  // ensure that the popup is always visible on the screen.
  _getOffset: function(element) {
    var $element = $(element);
    return function() {
      windowResizeDep.depend();
      var offset = $element.offset();
      var popupWidth = 300 + 15;
      return {
        left: Math.min(offset.left, $(window).width() - popupWidth),
        top: offset.top + $element.outerHeight()
      };
    };
  },

  // We get the title from the translation files. Instead of returning the
  // result, we return a function that compute the result and since `TAPi18n.__`
  // is a reactive data source, the title will be changed reactively.
  _getTitle: function(popupName) {
    return function() {
      var translationKey = popupName + '-title';

      // XXX There is no public API to check if there is an available
      // translation for a given key. So we try to translate the key and if the
      // translation output equals the key input we deduce that no translation
      // was available and returns `false`. There is a (small) risk a false
      // positives.
      var title = TAPi18n.__(translationKey);
      return title !== translationKey ? title : false;
    };
  }
};

// We close a potential opened popup on any left click on the document, or go
// one step back by pressing escape.
EscapeActions.register('popup',
  function(evt) { Popup[evt.type === 'click' ? 'close' : 'back'](); },
  _.bind(Popup.isOpen, Popup), {
    noClickEscapeOn: '.js-pop-over'
  }
);
