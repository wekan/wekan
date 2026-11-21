// Cloud Panel (docs/Features/Admin-Panel/Cloud-Panel.md): the collections of
// the hosting operator's panel. Every write goes through a method in
// server/cloudPanel.js and nothing here is published: a database password or a
// Cloudflare token must never reach a browser, and a customer sees only their
// own invoices and chat, through those methods.
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const day = /^\d{4}-\d\d-\d\d$/;

// One document, _id 'cloud': the panel's domain and Cloud Admins, Cloudflare
// and Caddy (models/lib/cloudPanel.js normalizeCloudSettings, normalizeCloudflare,
// normalizeCaddy).
export const CloudSettings = new Mongo.Collection('cloudSettings');
CloudSettings.attachSchema(new SimpleSchema({
  settings: { type: Object, optional: true, blackbox: true },
  cloudflare: { type: Object, optional: true, blackbox: true },
  caddy: { type: Object, optional: true, blackbox: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// The customer domains: each with its own database and container, or shared
// with this WeKan as an Organization.
export const CloudDomains = new Mongo.Collection('cloudDomains');
CloudDomains.attachSchema(new SimpleSchema({
  domain: { type: String, max: 253 },
  customerName: { type: String, optional: true, max: 200 },
  // As Weddy's Domains table has them: who the customer is, where their
  // invoices go, and the hosting's first and last day.
  customerEmail: { type: String, optional: true, max: 254 },
  billingEmail: { type: String, optional: true, max: 254 },
  startDate: { type: String, optional: true, regEx: day },
  endDate: { type: String, optional: true, regEx: day },
  mode: { type: String, allowedValues: ['own', 'shared'] },
  upstream: { type: String, optional: true, max: 260 },
  database: { type: Object, optional: true, blackbox: true },
  customerUsernames: { type: Array, optional: true },
  'customerUsernames.$': { type: String, max: 100 },
  notes: { type: String, optional: true, max: 2000 },
  cloudflare: { type: Boolean, optional: true },
  // The Organization a shared domain is (models/org.js), and the last import.
  orgId: { type: String, optional: true },
  importedAt: { type: Date, optional: true },
  importReport: { type: Object, optional: true, blackbox: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// The hosting invoices of a domain's customer, kept here - also the ones from
// before the panel, recorded by a Cloud Admin.
export const CloudInvoices = new Mongo.Collection('cloudInvoices');
CloudInvoices.attachSchema(new SimpleSchema({
  domainId: { type: String },
  number: { type: String, max: 50 },
  issueDate: { type: String, regEx: day },
  dueDate: { type: String, optional: true, regEx: day },
  amountMinor: { type: Number, min: 0 },
  currency: { type: String, regEx: /^[A-Z]{3}$/ },
  status: { type: String, allowedValues: ['open', 'paid', 'void'] },
  paidDate: { type: String, optional: true, regEx: day },
  description: { type: String, optional: true, max: 1000 },
  link: { type: String, optional: true, max: 500 },
  createdBy: { type: String, optional: true },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
  modifiedAt: { type: Date, optional: true, autoValue: modifiedAtAutoValue },
}));

// The chat of a domain's customer with the Cloud Admins, and the Rocket.Chat
// and SandChat conversations imported into it.
export const CloudChatMessages = new Mongo.Collection('cloudChatMessages');
CloudChatMessages.attachSchema(new SimpleSchema({
  domainId: { type: String },
  userId: { type: String, optional: true },
  authorName: { type: String, optional: true, max: 200 },
  text: { type: String, max: 20000 },
  // Where an imported message came from, and its room there.
  source: { type: String, optional: true, allowedValues: ['rocketchat', 'sandchat'] },
  room: { type: String, optional: true, max: 200 },
  at: { type: Date },
  createdAt: { type: Date, optional: true, autoValue: createdAtAutoValue },
}));

// No client writes, to any of them: the methods are the only way in.
if (Meteor.isServer) {
  for (const collection of [CloudSettings, CloudDomains, CloudInvoices, CloudChatMessages]) {
    collection.deny({ insert: () => true, update: () => true, remove: () => true });
  }
}
