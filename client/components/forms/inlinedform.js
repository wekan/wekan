// A inlined form is used to provide a quick edition of single field for a given
// document. Clicking on a edit button should display the form to edit the field
// value. The form can then be submited, or just closed.
//
// When the form is closed we save non-submitted values in memory to avoid any
// data loss.
//
// Usage:
//
//   +inlineForm
//     // the content when the form is open
//   else
//     // the content when the form is close (optional)

// We can only have one inlined form element opened at a time
// XXX Could we avoid using a global here ? This is used in Mousetrap
// keyboard.js
var currentlyOpenedForm = new ReactiveVar(null);

BlazeComponent.extendComponent({
  template: function() {
    return 'inlinedForm';
  },

  mixins: function() {
    return [Mixins.CachedValue];
  },

  onCreated: function() {
    this.isOpen = new ReactiveVar(false);
  },

  onDestroyed: function() {
    currentlyOpenedForm.set(null);
  },

  open: function() {
    // Close currently opened form, if any
    EscapeActions.executeLowerThan('inlinedForm');
    this.isOpen.set(true);
    currentlyOpenedForm.set(this);
  },

  close: function() {
    this.saveValue();
    this.isOpen.set(false);
    currentlyOpenedForm.set(null);
  },

  getValue: function() {
    var input = this.find('textarea,input[type=text]');
    return this.isOpen.get() && input && input.value;
  },

  saveValue: function() {
    this.callFirstWith(this, 'setCache', this.getValue());
  },

  events: function() {
    return [{
      'click .js-close-inlined-form': this.close,
      'click .js-open-inlined-form': this.open,

      // Close the inlined form by pressing escape.
      //
      // Keydown (and not keypress) in necessary here because the `keyCode`
      // property is consistent in all browsers, (there is not keyCode for the
      // `keypress` event in firefox)
      'keydown form input, keydown form textarea': function(evt) {
        if (evt.keyCode === 27) {
          evt.preventDefault();
          EscapeActions.executeLowest();
        }
      },

      // Pressing Ctrl+Enter should submit the form
      'keydown form textarea': function(evt) {
        if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
          $(evt.currentTarget).parents('form:first').submit();
        }
      },

      // Close the inlined form when after its submission
      submit: function() {
        var self = this;
        // XXX Swith to an arrow function here when we'll have ES6
        if (this.currentData().autoclose !== false) {
          Tracker.afterFlush(function() {
            self.close();
            self.callFirstWith(self, 'resetCache');
          });
        }
      }
    }];
  }
}).register('inlinedForm');

// Press escape to close the currently opened inlinedForm
EscapeActions.register('inlinedForm',
  function() { return currentlyOpenedForm.get() !== null; },
  function() { currentlyOpenedForm.get().close(); }
);
