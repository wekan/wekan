import PopupComponent from '/client/components/main/popup';
import { TAPi18n } from '/imports/i18n';

window.Popup = new (class {
  /// This function returns a callback that can be used in an event map:
  ///   Template.tplName.events({
  ///     'click .elementClass': Popup.open("popupName"),
  ///   });
  /// The popup inherit the data context of its parent.
  open(name, args) {
    const self = this;
    return function(evt, options) {
      const popupName = `${name}Popup`;
      const openerElement = evt.target;
      let classicArgs = { openerElement: openerElement, name: popupName, title: self._getTitle(popupName), miscOptions: options };
      if (typeof(args) === "object") {
        classicArgs = Object.assign(classicArgs, args);
      }
      PopupComponent.open(classicArgs);
      evt.preventDefault();
      // important so that one click does not opens multiple, stacked popups
      evt.stopPropagation();
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
      tpl ??= {};
      tpl.afterConfirm = action;
      // Just a wrapper of open which will call `action` on some events
      // see PopupDetachedComponent; for now this is hardcoded
      self.open(name)(evt, tpl);
      evt.preventDefault();
    };
  }

  /// In case the popup was opened from a parent popup we can get back to it
  /// with this `Popup.back()` function. You can go back several steps at once
  /// by providing a number to this function, e.g. `Popup.back(2)`. In this case
  /// intermediate popup won't even be rendered on the DOM. If the number of
  /// steps back is greater than the popup stack size, the popup will be closed.
  back(n = 1) {
    _.times(n, () => PopupComponent.destroy());
  }

  /// Close the current opened popup.
  close() {
    this.back();
  }


  getOpenerComponent(n=4) {
    const { openerElement } = Template.parentData(n);
    return BlazeComponent.getComponentForElement(openerElement);
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
    () => PopupComponent.stack.length > 0,
    {
      // will maybe need something more robust, but for now it enables multiple cards opened without closing each other when clicking on common UI elements
      noClickEscapeOn: '.js-pop-over,.js-open-card-title-popup,.js-open-inlined-form,.textcomplete-dropdown,.js-card-details,.board-sidebar,#header,.add-comment-reaction',
      enabledOnClick: actionName === 'close',
    },
  );
});