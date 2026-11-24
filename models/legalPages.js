import { Mongo } from 'meteor/mongo';

// The legal pages - privacy, terms, cookies, imprint - and the privacy
// contacts (_id 'contacts'), written by a site administrator in Admin Panel /
// Settings / Privacy. Nothing is written from the browser: the methods in
// server/methods/legalPages.js check the caller and shape every write
// (models/lib/legalPages.js), and are in the Audit log.
const LegalPages = new Mongo.Collection('legalPages');
LegalPages.deny({ insert: () => true, update: () => true, remove: () => true });

export default LegalPages;
