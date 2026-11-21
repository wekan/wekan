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
  // An hour's cost to the company, for the margin; never invoiced.
  costRateMinor: { type: Number, optional: true, min: 0 },
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
  status: { type: String, allowedValues: ['draft', 'sent', 'paid', 'void', 'credited'] },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  customer: { type: String, optional: true, max: 500 },
  reference: { type: String, optional: true, max: 100 },
  notes: { type: String, optional: true, max: 2000 },
  issueDate: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  dueDate: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  lines: { type: Array },
  'lines.$': { type: Object },
  // A line is time (hours at a rate), a fixed fee or an expense.
  'lines.$.kind': { type: String, optional: true, allowedValues: ['time', 'fee', 'expense'] },
  'lines.$.cardId': { type: String, optional: true },
  'lines.$.title': { type: String, optional: true, max: 500 },
  'lines.$.userId': { type: String, optional: true },
  'lines.$.hours': { type: Number, optional: true, min: 0 },
  'lines.$.rateMinor': { type: Number, optional: true, min: 0 },
  'lines.$.amountMinor': { type: Number, min: 0 },
  'lines.$.firstDate': { type: String, optional: true },
  'lines.$.lastDate': { type: String, optional: true },
  'lines.$.feeId': { type: String, optional: true },
  'lines.$.feeKey': { type: String, optional: true },
  'lines.$.expenseId': { type: String, optional: true },
  'lines.$.category': { type: String, optional: true },
  // An invoice, or a credit note of one (creditOf / creditOfNumber).
  kind: { type: String, optional: true, allowedValues: ['invoice', 'credit'] },
  creditOf: { type: String, optional: true },
  creditOfNumber: { type: String, optional: true },
  creditedBy: { type: String, optional: true },
  customerCountry: { type: String, optional: true },
  customerVatId: { type: String, optional: true, max: 50 },
  periodStart: { type: String, optional: true },
  periodEnd: { type: String, optional: true },
  includeUndated: { type: Boolean, optional: true },
  paymentReference: { type: String, optional: true },
  reverseCharge: { type: Boolean, optional: true },
  netMinor: { type: Number, min: 0 },
  vatPercent: { type: Number, min: 0, max: 100 },
  vatMinor: { type: Number, min: 0 },
  totalMinor: { type: Number, min: 0 },
  totalHours: { type: Number, min: 0 },
  // Payments received.
  payments: { type: Array, optional: true },
  'payments.$': { type: Object },
  'payments.$.id': { type: String },
  'payments.$.date': { type: String },
  'payments.$.amountMinor': { type: Number, min: 1 },
  'payments.$.method': { type: String, optional: true },
  'payments.$.note': { type: String, optional: true },
  // The issuer as it was when the invoice was made: an invoice is a record.
  issuer: { type: Object, optional: true, blackbox: true },
  createdBy: { type: String, optional: true },
  statusChangedAt: { type: Date, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Who sends a board's invoices and how they are paid (models/lib/billing.js
// normalizeProfile): issuer details, VAT, payment terms, payment methods.
export const BillingProfiles = new Mongo.Collection('billingProfiles');
BillingProfiles.attachSchema(new SimpleSchema({
  boardId: { type: String },
  profile: { type: Object, blackbox: true },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Expenses of a board's work: travel, materials, a subcontractor
// (models/lib/billing.js normalizeExpense). Marked with the invoice that
// billed them, like time entries.
export const BillingExpenses = new Mongo.Collection('billingExpenses');
BillingExpenses.attachSchema(new SimpleSchema({
  boardId: { type: String },
  cardId: { type: String, optional: true },
  userId: { type: String, optional: true },
  date: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  amountMinor: { type: Number, min: 1 },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  category: { type: String, allowedValues: ['travel', 'accommodation', 'meals', 'materials', 'subcontracting', 'software', 'other'] },
  description: { type: String, optional: true, max: 200 },
  billable: { type: Boolean },
  markupPercent: { type: Number, min: 0, max: 100 },
  invoiceId: { type: String, optional: true },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Fixed fees: a milestone or fixed price billed once, or a monthly retainer
// (normalizeFee). Which occurrences are billed is read from the invoices'
// lines, so a voided or credited invoice frees them by itself.
export const BillingFees = new Mongo.Collection('billingFees');
BillingFees.attachSchema(new SimpleSchema({
  boardId: { type: String },
  title: { type: String, max: 200 },
  amountMinor: { type: Number, min: 1 },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  date: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  recurring: { type: String, allowedValues: ['none', 'monthly'] },
  end: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// Quotes: the work still to do, priced, for the customer to accept. A
// record like an invoice, numbered QUO-YYYY-NNNN.
export const BillingQuotes = new Mongo.Collection('billingQuotes');
BillingQuotes.attachSchema(new SimpleSchema({
  boardId: { type: String },
  number: { type: String },
  status: { type: String, allowedValues: ['draft', 'sent', 'accepted', 'declined'] },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  customer: { type: String, optional: true, max: 500 },
  customerCountry: { type: String, optional: true },
  customerVatId: { type: String, optional: true, max: 50 },
  reference: { type: String, optional: true, max: 100 },
  notes: { type: String, optional: true, max: 2000 },
  issueDate: { type: String, regEx: /^\d{4}-\d\d-\d\d$/ },
  validUntil: { type: String, optional: true, regEx: /^\d{4}-\d\d-\d\d$/ },
  lines: { type: Array },
  'lines.$': { type: Object, blackbox: true },
  netMinor: { type: Number, min: 0 },
  vatPercent: { type: Number, min: 0, max: 100 },
  vatMinor: { type: Number, min: 0 },
  totalMinor: { type: Number, min: 0 },
  totalHours: { type: Number, min: 0 },
  reverseCharge: { type: Boolean, optional: true },
  issuer: { type: Object, optional: true, blackbox: true },
  createdBy: { type: String, optional: true },
  statusChangedAt: { type: Date, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// No client writes, to any of them: the methods are the only way in.
if (Meteor.isServer) {
  for (const collection of [BillingBudgets, BillingRates, BillingInvoices, BillingProfiles, BillingExpenses, BillingFees, BillingQuotes]) {
    collection.deny({ insert: () => true, update: () => true, remove: () => true });
  }
}
