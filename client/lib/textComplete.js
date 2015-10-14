// We “inherit” the jquery-textcomplete plugin to integrate with our
// EscapeActions system. You should always use `escapeableTextComplete` instead
// of the vanilla `textcomplete`.
let dropdownMenuIsOpened = false;

$.fn.escapeableTextComplete = function(...args) {
  this.textcomplete(...args);

  // Since commit d474017 jquery-textComplete automatically closes a potential
  // opened dropdown menu when the user press Escape. This behavior conflicts
  // with our EscapeActions system, but it's too complicated and hacky to
  // monkey-pach textComplete to disable it -- I tried. Instead we listen to
  // 'open' and 'hide' events, and create a ghost escapeAction when the dropdown
  // is opened (and rely on textComplete to execute the actual action).
  this.on({
    'textComplete:show'() {
      dropdownMenuIsOpened = true;
    },
    'textComplete:hide'() {
      Tracker.afterFlush(() => {
        dropdownMenuIsOpened = false;
      });
    },
  });
};

EscapeActions.register('textcomplete',
  () => {},
  () => dropdownMenuIsOpened
);
