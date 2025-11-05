import { ReactiveCache } from '/imports/reactiveCache';

BoardMultiSelection = {
  _selectedBoards: new ReactiveVar([]),

  _isActive: new ReactiveVar(false),

  reset() {
    this._selectedBoards.set([]);
  },

  isActive() {
    return this._isActive.get();
  },

  count() {
    return this._selectedBoards.get().length;
  },

  isEmpty() {
    return this.count() === 0;
  },

  getSelectedBoardIds() {
    return this._selectedBoards.get();
  },

  activate() {
    if (!this.isActive()) {
      this._isActive.set(true);
      Tracker.flush();
    }
  },

  disable() {
    if (this.isActive()) {
      this._isActive.set(false);
      this.reset();
    }
  },

  add(boardIds) {
    return this.toggle(boardIds, { add: true, remove: false });
  },

  remove(boardIds) {
    return this.toggle(boardIds, { add: false, remove: true });
  },

  toogle(boardIds) {
    return this.toggle(boardIds, { add: true, remove: true });
  },

  toggle(boardIds, { add, remove } = {}) {
    boardIds = _.isString(boardIds) ? [boardIds] : boardIds;
    let selectedBoards = this._selectedBoards.get();

    boardIds.forEach(boardId => {
      const index = selectedBoards.indexOf(boardId);
      if (index > -1 && remove) {
        selectedBoards = selectedBoards.filter(id => id !== boardId);
      } else if (index === -1 && add) {
        selectedBoards.push(boardId);
      }
    });

    this._selectedBoards.set(selectedBoards);
  },

  isSelected(boardId) {
    return this._selectedBoards.get().includes(boardId);
  },
};
