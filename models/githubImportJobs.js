import { Mongo } from 'meteor/mongo';

// Background GitHub organization imports (server/githubOrgImport.js): every
// repository of an organization or user as a board, with its issues,
// releases, Actions workflows as Rules and its wiki. Like the Trello import's
// jobs, the document holds the queue, progress, per-repository results and
// an error log, so the import page can show progress after navigating away.
//
// SECURITY: the GitHub token is NEVER stored here. It is kept only in server
// memory for the running loop; a job interrupted by a restart is paused and
// is started again with the token.
//
// No SimpleSchema on purpose: internal bookkeeping, written only by the
// server and published only to its owner.
const GithubImportJobs = new Mongo.Collection('github_import_jobs');

if (Meteor.isServer) {
  GithubImportJobs.deny({ insert: () => true, update: () => true, remove: () => true });
}

export default GithubImportJobs;
