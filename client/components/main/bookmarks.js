Template.bookmarks.helpers({
  hasStarredBoards() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return false;
    const { starredBoards = [] } = user.profile || {};
    return Array.isArray(starredBoards) && starredBoards.length > 0;
  },
  starredBoards() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return [];
    const { starredBoards = [] } = user.profile || {};
    if (!Array.isArray(starredBoards) || starredBoards.length === 0) return [];
    return Boards.find({ _id: { $in: starredBoards } }, { sort: { sort: 1 } });
  },
});

Template.bookmarks.events({
  async 'click .js-toggle-star'(e) {
    e.preventDefault();
    const boardId = this._id;
    const user = ReactiveCache.getCurrentUser();
    if (user && boardId) {
      await user.toggleBoardStar(boardId);
    }
  },
});

Template.bookmarksPopup.helpers({
  hasStarredBoards() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return false;
    const { starredBoards = [] } = user.profile || {};
    return Array.isArray(starredBoards) && starredBoards.length > 0;
  },
  starredBoards() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return [];
    const { starredBoards = [] } = user.profile || {};
    if (!Array.isArray(starredBoards) || starredBoards.length === 0) return [];
    return Boards.find({ _id: { $in: starredBoards } }, { sort: { sort: 1 } });
  },
});

Template.bookmarksPopup.events({
  async 'click .js-toggle-star'(e) {
    e.preventDefault();
    const boardId = this._id;
    const user = ReactiveCache.getCurrentUser();
    if (user && boardId) {
      await user.toggleBoardStar(boardId);
    }
  },
});


