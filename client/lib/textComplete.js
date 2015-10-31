// We “inherit” the jquery-textcomplete plugin to integrate with our
// EscapeActions system. You should always use `escapeableTextComplete` instead
// of the vanilla `textcomplete`.
let dropdownMenuIsOpened = false;

$.fn.escapeableTextComplete = function(strategies, options, ...otherArgs) {
  // When the autocomplete menu is shown we want both a press of both `Tab`
  // or `Enter` to validation the auto-completion. We also need to stop the
  // event propagation to prevent EscapeActions side effect, for instance the
  // minicard submission (on `Enter`) or going on the next column (on `Tab`).
  options = {
    onKeydown(evt, commands) {
      if (evt.keyCode === 9 || evt.keyCode === 13) {
        evt.stopPropagation();
        return commands.KEY_ENTER;
      }
    },
    ...options,
  };

  // Proxy to the vanilla jQuery component
  this.textcomplete(strategies, options, ...otherArgs);

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
        // XXX Hack. We unfortunately need to set a setTimeout here to make the
        // `noClickEscapeOn` work bellow, otherwise clicking on a autocomplete
        // item will close both the autocomplete menu (as expected) but also the
        // next item in the stack (for example the minicard editor) which we
        // don't want.
        setTimeout(() => {
          dropdownMenuIsOpened = false;
        }, 100);
      });
    },
  });
};

EscapeActions.register('textcomplete',
  () => {},
  () => dropdownMenuIsOpened, {
    noClickEscapeOn: '.textcomplete-dropdown',
  }
);
