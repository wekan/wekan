import GithubImportJobs from '/models/githubImportJobs';

// The current user's recent GitHub organization imports, for the import page.
Meteor.publish('githubImportJobs', function () {
  if (!this.userId) return this.ready();
  return GithubImportJobs.find({ userId: this.userId }, { sort: { createdAt: -1 }, limit: 5 });
});
