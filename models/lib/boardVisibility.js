// Transport-neutral read policy for a board. Public boards accept anonymous
// readers; every other board requires an active member.
function canReadBoard(userId, board) {
  return !!(board && typeof board.isVisibleBy === 'function' &&
    board.isVisibleBy(userId ? { _id: userId } : null));
}

export { canReadBoard };
