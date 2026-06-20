// Pure, Meteor-free permission helper for archiving a card.
//
// A board member with the comment-only role must not be able to archive a
// card (issue #5810). The client archive handler already knows whether the
// current user can modify the card via Utils.canModifyCard() (which is false
// for comment-only / read-only / worker users), so archiving is allowed only
// when the card can be modified.
//
// Kept free of Meteor imports so it can be unit tested in isolation.
export function canArchiveCard({ canModifyCard } = {}) {
  return !!canModifyCard;
}
