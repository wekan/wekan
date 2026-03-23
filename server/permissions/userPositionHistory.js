import UserPositionHistory from '/models/userPositionHistory';

UserPositionHistory.allow({
  insert(userId, doc) {
    // Only allow users to create their own history
    return userId && doc.userId === userId;
  },
  update(userId, doc) {
    // Only allow users to update their own history (for checkpoints)
    return userId && doc.userId === userId;
  },
  remove() {
    // Don't allow removal - history is permanent
    return false;
  },
  fetch: ['userId'],
});
