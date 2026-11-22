// Admin Panel / Settings / Features / Turn off all webhooks
// (models/lib/webhooksSwitch.js) for the interface: while it is on, every
// webhook screen is hidden - not greyed out. The server refuses and sends
// nothing whatever the interface shows (server/webhooksSwitch.js).
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';

const { webhooksDisabled } = require('/models/lib/webhooksSwitch');

export function webhooksOff() {
  return webhooksDisabled(ReactiveCache.getCurrentSetting());
}

// {{#unless webhooksOff}} in a template.
Template.registerHelper('webhooksOff', () => webhooksOff());
