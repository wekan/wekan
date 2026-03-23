import UnsavedEditCollection from '/models/unsavedEdits';

function isAuthor(userId, doc, fieldNames = []) {
  return userId === doc.userId && fieldNames.indexOf('userId') === -1;
}

UnsavedEditCollection.allow({
  insert: isAuthor,
  update: isAuthor,
  remove: isAuthor,
  fetch: ['userId'],
});
