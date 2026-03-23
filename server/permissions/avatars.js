import Avatars from '/models/avatars';

function isOwner(userId, doc) {
  return userId && userId === doc.userId;
}

Avatars.allow({
  insert: isOwner,
  update: isOwner,
  remove: isOwner,
  fetch: ['userId'],
});
