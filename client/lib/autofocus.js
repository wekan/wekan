// Native replacement for mquandalle:autofocus package
// Handles autofocus attribute in dynamically rendered Blaze templates
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

Template.onRendered(function() {
  Tracker.afterFlush(() => {
    const el = this.find('[autofocus]');
    if (el && typeof el.focus === 'function') {
      el.focus();
    }
  });
});
