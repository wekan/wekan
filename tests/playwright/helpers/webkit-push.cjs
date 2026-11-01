'use strict';
// Runs in the page. Playwright's WebKit freezes the page's main thread on
// PushManager.getSubscription(): once it is called not even a timer runs
// again. Member Notification Settings asks it on opening, to show whether
// this device gets browser push (client/lib/webPush.js), so in WebKit every
// spec that opened it hung - Firefox, Chromium and Safari itself answer. Here
// it answers as a device with no subscription does: null. No spec subscribes.
function noPushSubscriptionInWebKit() {
  const ua = navigator.userAgent;
  if (!/AppleWebKit/.test(ua) || /Chrome|Chromium|Edg\//.test(ua)) return;
  if (typeof PushManager === 'undefined') return;
  PushManager.prototype.getSubscription = function getSubscription() { return Promise.resolve(null); };
}

module.exports = { noPushSubscriptionInWebKit };
