import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

const TICK_MS = 60000;
const sharedNow = new ReactiveVar(new Date());
let intervalId = null;
let subscriberCount = 0;

function tick() {
  sharedNow.set(new Date());
}

export function subscribeDateNowTicker() {
  subscriberCount += 1;

  if (subscriberCount === 1) {
    tick();
    intervalId = Meteor.setInterval(tick, TICK_MS);
  }

  let subscribed = true;
  return {
    now: sharedNow,
    unsubscribe() {
      if (!subscribed) return;
      subscribed = false;
      subscriberCount -= 1;

      if (subscriberCount === 0 && intervalId !== null) {
        Meteor.clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}
