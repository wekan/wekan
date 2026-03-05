import { Meteor } from 'meteor/meteor';

Counters = new Mongo.Collection('counters');

// Async version (for future Meteor 3.0 migration)
async function incrementCounterAsync(counterName, amount = 1) {
  const result = await Counters.rawCollection().findOneAndUpdate(
    { _id: counterName },
    { $inc: { next_val: amount } },
    { upsert: true, returnDocument: 'after' },
  );
  return result.value ? result.value.next_val : result.next_val;
}

// Sync version (for Meteor 2.x autoValue compatibility)
const incrementCounter = Meteor.wrapAsync(async (counterName, amount, callback) => {
  try {
    const result = await incrementCounterAsync(counterName, amount);
    callback(null, result);
  } catch (err) {
    callback(err);
  }
});

export { incrementCounter, incrementCounterAsync };
