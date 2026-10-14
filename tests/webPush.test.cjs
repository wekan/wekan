'use strict';

// #2026 / #1377: browser push notifications.
// Run: node tests/webPush.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const w = require('../models/lib/webPush.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const keys = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' };

// Positive: the push services browsers use.
for (const endpoint of ['https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x',
  'https://web.push.apple.com/QGuQ', 'https://db5p.notify.windows.com/w/?token=x']) {
  assert.ok(w.cleanSubscription({ endpoint, keys }), endpoint);
}
assert.deepEqual(JSON.parse(w.pushPayload({ title: 'T', body: 'B', url: '/b/x/y' })), { title: 'T', body: 'B', url: '/b/x/y' });
const after = w.subscriptionsAfterAdd([{ endpoint: 'https://fcm.googleapis.com/a' }], { endpoint: 'https://fcm.googleapis.com/a', keys });
assert.equal(after.length, 1, 'once each');
console.log('  ok - browser push services accepted');

// Negative: the server never POSTs where a member likes.
for (const endpoint of ['http://fcm.googleapis.com/x', 'https://127.0.0.1/x', 'https://localhost/x', 'https://evil.example/x',
  'https://fcm.googleapis.com.evil.example/x', 'https://user:pw@fcm.googleapis.com/x', 'https://fcm.googleapis.com:8443/x',
  'javascript:alert(1)', '']) {
  assert.equal(w.isPushServiceEndpoint(endpoint), false, endpoint);
  assert.equal(w.cleanSubscription({ endpoint, keys }), null, endpoint);
}
assert.equal(w.cleanSubscription({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'x', auth: '<script>' } }), null);
assert.equal(JSON.parse(w.pushPayload({ url: 'https://evil.example/' })).url, '/', 'a click only opens this WeKan');
assert.equal(JSON.parse(w.pushPayload({ url: '//evil.example/' })).url, '/');
assert.equal(w.subscriptionsAfterAdd(Array.from({ length: 30 }, (_, i) => ({ endpoint: `e${i}` })), { endpoint: 'x' }).length, w.MAX_SUBSCRIPTIONS);
console.log('  ok - no other endpoint, no foreign click target, bounded');

const server = read('server/webPush.js');
assert.match(server, /const clean = cleanSubscription\(subscription\);\s*if \(!clean\) throw new Meteor\.Error\('web-push-invalid-subscription'\);/);
assert.match(server, /const clean = cleanSubscription\(sub\);\s*if \(!clean\) continue;/, 'checked again before every send');
assert.match(server, /WebPushKeys\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
assert.match(server, /async webPushPublicKey\(\) \{[\s\S]{0,120}return \(await vapidKeys\(\)\)\.publicKey;/, 'only the public key leaves the server');
assert.match(read('server/models/activities.js'), /require\('\/server\/webPush'\)\.sendActivityToWebPush\(prepared\);/);
assert.equal(JSON.parse(read('package.json')).dependencies['web-push'], '3.6.7', 'pinned');
const sw = read('public/pwa-service-worker.js');
assert.match(sw, /self\.addEventListener\('push'/);
assert.match(sw, /var url = typeof data\.url === 'string' && data\.url\.charAt\(0\) === '\/' \? data\.url : '\/';/);
assert.match(read('client/components/settings/notificationSettingsPopup.jade'), /li\.notification-web-push-settings/);
console.log('  ok - keys stay server-side; the service worker opens only local paths');
console.log('\nwebPush: all tests passed');
