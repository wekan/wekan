// Budget and billing (docs/Features/Billing/Billing.md): the collections the
// Budget and billing page works with. Every write goes through a method in
// server/billing.js, which allows it only to the board's admins and to site
// administrators, and nothing here is published: money is read through those
// methods, never by subscribing.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

// A board's budget: money (in minor units, e.g. cents) and/or hours.
export const BillingBudgets = new Mongo.Collection('billingBudgets');
BillingBudgets.attachSchema(new SimpleSchema({
  boardId: { type: String },
  name: { type: String, optional: true, max: 100 },
  amountMinor: { type: Number, optional: true, min: 0 },
  currency: { type: String, optional: true, regEx: /^[A-Z]{3}$/ },
  hours: { type: Number, optional: true, min: 0 },
  start: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  end: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Hourly rates on a board: a member's own, or (no userId) the board default.
export const BillingRates = new Mongo.Collection('billingRates');
BillingRates.attachSchema(new SimpleSchema({
  boardId: { type: String },
  userId: { type: String, optional: true },
  hourlyRateMinor: { type: Number, min: 0 },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Invoices: the billable hours of a board's cards, at the rates of the day the
// invoice was made. The lines are a record, kept as they were.
export const BillingInvoices = new Mongo.Collection('billingInvoices');
BillingInvoices.attachSchema(new SimpleSchema({
  boardId: { type: String },
  number: { type: String },
  status: { type: String, allowedValues: ['draft', 'sent', 'paid', 'void'] },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  customer: { type: String, optional: true, max: 500 },
  reference: { type: String, optional: true, max: 100 },
  notes: { type: String, optional: true, max: 2000 },
  issueDate: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  dueDate: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  lines: { type: Array },
  'lines.$': { type: Object },
  'lines.$.cardId': { type: String },
  'lines.$.title': { type: String, optional: true, max: 500 },
  'lines.$.userId': { type: String, optional: true },
  'lines.$.hours': { type: Number, min: 0 },
  'lines.$.rateMinor': { type: Number, min: 0 },
  'lines.$.amountMinor': { type: Number, min: 0 },
  totalMinor: { type: Number, min: 0 },
  totalHours: { type: Number, min: 0 },
  createdBy: { type: String, optional: true },
  statusChangedAt: { type: Date, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// No client writes, to any of them: the methods are the only way in.
if (Meteor.isServer) {
  for (const collection of [BillingBudgets, BillingRates, BillingInvoices]) {
    collection.deny({ insert: () => true, update: () => true, remove: () => true });
  }
}
