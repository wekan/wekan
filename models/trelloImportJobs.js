import { Mongo } from 'meteor/mongo';

// Background Trello-import jobs.
//
// Importing whole Trello workspaces (many boards + attachments) can take a
// while, so it runs server-side as a persisted job instead of blocking the
// client call. The job document holds the queue, progress, per-board results
// and an error log, so the user can navigate away and return to the Trello
// import page to watch progress, resume after a fatal API error, or cancel and
// delete the imported boards to start over.
//
// SECURITY: the Trello API key/token are NEVER stored in this document. They
// are kept only in server memory for the running loop and must be re-supplied
// by the client when resuming (e.g. after a server restart).
//
// No SimpleSchema is attached on purpose: the job is internal bookkeeping
// updated with frequent $set/$push, and it is only ever published to its owner.
const TrelloImportJobs = new Mongo.Collection('trello_import_jobs');

export default TrelloImportJobs;
