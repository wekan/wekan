import { TAPi18n } from '/imports/i18n';

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
    /** opens the popup
     * @param evt the current event
     * @param options options (dataContextIfCurrentDataIsUndefined use this dataContext if this.currentData() is undefined)
     */
    return function(evt, options) {
      // If a popup is already opened, clicking again on the opener element
      // should close it -- and interrupt the current `open` function.
      if (self.isOpen()) {
        const previousOpenerElement = self._getTopStack().openerElement;
        if (previousOpenerElement === evt.currentTarget) {
          self.close();
          return;
        } else {
          $(previousOpenerElement).removeClass('is-active');
          // Clean up previous popup content to prevent mixing
          self._cleanupPreviousPopupContent();
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
        // For Member Settings sub-popups, always start fresh to avoid content mixing
        if (popupName.includes('changeLanguage') || popupName.includes('changeAvatar') || 
            popupName.includes('editProfile') || popupName.includes('changePassword') ||
            popupName.includes('invitePeople') || popupName.includes('support')) {
          self._stack = [];
        }
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
        dataContext: (this && this.currentData && this.currentData()) || (options && options.dataContextIfCurrentDataIsUndefined) || this,
      });

      const $contentWrapper = $('.content-wrapper')
      if ($contentWrapper.length > 0) {
        const contentWrapper = $contentWrapper[0];
        self._getTopStack().scrollTop = contentWrapper.scrollTop;
        // scroll from e.g. delete comment to the top (where the confirm button is)
        $contentWrapper.scrollTop(0);
      }

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
        if (!Template[popupName]) {
          console.error('Template not found:', popupName);
          return;
        }
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
    this._dep.depend();
    return Boolean(this.current);
  }

  /// In case the popup was opened from a parent popup we can get back to it
  /// with this `Popup.back()` function. You can go back several steps at once
  /// by providing a number to this function, e.g. `Popup.back(2)`. In this case
  /// intermediate popup won't even be rendered on the DOM. If the number of
  /// steps back is greater than the popup stack size, the popup will be closed.
  back(n = 1) {
    if (this._stack.length > n) {
      const $contentWrapper = $('.content-wrapper')
      if ($contentWrapper.length > 0) {
        const contentWrapper = $contentWrapper[0];
        const stack = this._stack[this._stack.length - n];
        // scrollTopMax and scrollLeftMax only available at Firefox (https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTopMax)
        const scrollTopMax = contentWrapper.scrollTopMax || contentWrapper.scrollHeight - contentWrapper.clientHeight;
        if (scrollTopMax && stack.scrollTop > scrollTopMax) {
          // sometimes scrollTopMax is lower than scrollTop, so i need this dirty hack
          setTimeout(() => {
            $contentWrapper.scrollTop(stack.scrollTop);
          }, 6);
        }
        // restore the old popup scroll position
        $contentWrapper.scrollTop(stack.scrollTop);
      }
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

      // Remove 'is-active' class from all opener elements in the stack
      this._stack.forEach(stackItem => {
        if (stackItem && stackItem.openerElement) {
          $(stackItem.openerElement).removeClass('is-active');
        }
      });

      this._stack = [];
      // Clean up popup content when closing
      this._cleanupPreviousPopupContent();
    }
  }

  getOpenerComponent(n=4) {
    const { openerElement } = Template.parentData(n);
    return BlazeComponent.getComponentForElement(openerElement);
  }

  // An utility function that returns the top element of the internal stack
  _getTopStack() {
    return this._stack[this._stack.length - 1];
  }

  _cleanupPreviousPopupContent() {
    // Force a re-render to ensure proper cleanup
    if (this._dep) {
      this._dep.changed();
    }
  }

  // We automatically calculate the popup offset from the reference element
  // position and dimensions. We also reactively use the window dimensions to
  // ensure that the popup is always visible on the screen.
  _getOffset(element) {
    const $element = $(element);
    return () => {
      Utils.windowResizeDep.depend();

      if (Utils.isMiniScreen()) return { left: 0, top: 0 };

      // If the opener element is missing (e.g., programmatic open), fallback to viewport origin
      if (!$element || $element.length === 0) {
        return { left: 10, top: 10, maxHeight: $(window).height() - 20 };
      }

      const offset = $element.offset();
      // Calculate actual popup width based on CSS: min(380px, 55vw)
      const viewportWidth = $(window).width();
      const viewportHeight = $(window).height();
      const popupWidth = Math.min(380, viewportWidth * 0.55) + 15; // Add 15px for margin
      
      // Check if this is an admin panel edit popup
      const isAdminEditPopup = $element.hasClass('edit-user') || 
                              $element.hasClass('edit-org') || 
                              $element.hasClass('edit-team');
      
      if (isAdminEditPopup) {
        // Center the popup horizontally and use full height
        const centeredLeft = (viewportWidth - popupWidth) / 2;
        
        return {
          left: Math.max(10, centeredLeft), // Ensure popup doesn't go off screen
          top: 10, // Start from top with small margin
          maxHeight: viewportHeight - 20, // Use full height minus small margins
        };
      }
      
      // Calculate available height for popup
      const popupTop = offset.top + $element.outerHeight();
      
      // For language popup, don't use dynamic height to avoid overlapping board
      const isLanguagePopup = $element.hasClass('js-change-language');
      let availableHeight, maxPopupHeight;
      
      if (isLanguagePopup) {
        // For language popup, position content area below right vertical scrollbar
        const availableHeight = viewportHeight - popupTop - 20; // 20px margin from bottom (near scrollbar)
        const calculatedHeight = Math.min(availableHeight, viewportHeight * 0.5); // Max 50% of viewport
        
        return {
          left: Math.min(offset.left, viewportWidth - popupWidth),
          top: popupTop,
          maxHeight: Math.max(calculatedHeight, 200), // Minimum 200px height
        };
      } else {
        // For other popups, use the dynamic height calculation
        availableHeight = viewportHeight - popupTop - 20; // 20px margin from bottom
        maxPopupHeight = Math.min(availableHeight, viewportHeight * 0.8); // Max 80% of viewport
        
        return {
          left: Math.min(offset.left, viewportWidth - popupWidth),
          top: popupTop,
          maxHeight: Math.max(maxPopupHeight, 200), // Minimum 200px height
        };
      }
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
      noClickEscapeOn: '.js-pop-over,.js-open-card-title-popup,.js-open-inlined-form,.textcomplete-dropdown',
      enabledOnClick: actionName === 'close',
    },
  );
});
