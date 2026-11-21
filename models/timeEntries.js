// Time entries (models/lib/timeEntries.js): the time spent on a card, each with
// its day and who logged it. Written only by the server (server/timeEntries.js):
// by its methods, and when a card's spentTime changes. Read through methods.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const TimeEntries = new Mongo.Collection('timeEntries');
TimeEntries.attachSchema(new SimpleSchema({
  cardId: { type: String },
  boardId: { type: String },
  userId: { type: String, optional: true },
  // null for time spent before entries were kept (source 'legacy').
  date: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  // Negative for a correction: a card's spent time lowered by hand.
  hours: { type: Number, min: -10000, max: 10000 },
  note: { type: String, optional: true, max: 500 },
  source: { type: String, allowedValues: ['manual', 'card', 'legacy'] },
  // The invoice the entry is on (server/billing.js); absent while not invoiced.
  invoiceId: { type: String, optional: true },
  // A board admin's decision, when the board approves time before billing it
  // (server/billing.js billingApproveTime): absent while waiting.
  approval: { type: String, optional: true, allowedValues: ['approved', 'rejected'] },
  approvalNote: { type: String, optional: true, max: 200 },
  approvedBy: { type: String, optional: true },
  approvedAt: { type: Date, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

if (Meteor.isServer) {
  TimeEntries.deny({ insert: () => true, update: () => true, remove: () => true });
}

export default TimeEntries;
