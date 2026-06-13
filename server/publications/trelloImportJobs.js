import TrelloImportJobs from '/models/trelloImportJobs';

// Publish the current user's recent Trello import jobs so the import page can
// reactively show progress, results and errors even after navigating away.
Meteor.publish('trelloImportJobs', function () {
  if (!this.userId) {
    return this.ready();
  }
  return TrelloImportJobs.find(
    { userId: this.userId },
    { sort: { createdAt: -1 }, limit: 5 },
  );
});
