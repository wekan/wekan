// #2026 / #1377: turning browser push on and off on this device
// (server/webPush.js). The service worker is public/pwa-service-worker.js.
import { Meteor } from 'meteor/meteor';

const { base64urlToBytes } = require('/models/lib/passkeys');

export function webPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
    && 'Notification' in window && !Meteor.settings?.public?.sandstorm;
}

async function registration() {
  return navigator.serviceWorker.ready;
}

export async function webPushEnabledHere() {
  if (!webPushSupported()) return false;
  const reg = await registration();
  return !!(await reg.pushManager.getSubscription());
}

export async function enableWebPush() {
  if ((await Notification.requestPermission()) !== 'granted') throw new Meteor.Error('web-push-denied');
  const publicKey = await Meteor.callAsync('webPushPublicKey');
  const reg = await registration();
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64urlToBytes(publicKey) });
  await Meteor.callAsync('webPushSubscribe', sub.toJSON());
}

export async function disableWebPush() {
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await Meteor.callAsync('webPushUnsubscribe', sub.endpoint);
  await sub.unsubscribe();
}
