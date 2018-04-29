
Lens = {

  _focusLevel: null,
  _currentUserId: Meteor.userId(),
  _board: null,

  init(currentBoardId)  {
    this._board = Boards.findOne(currentBoardId);
    this.setFocusLevel("none");

    const labels = this._board.labels;
    if (labels) {
      this._privateLabels = labels
        .filter(v => Features.opinions.focus.labelSelectors.private.test(v.name))
        .map(v => v._id);
      this._sharedLabels = labels
        .filter(v => Features.opinions.focus.labelSelectors.shared.test(v.name))
        .map(v => v._id);
    }
  },

  setFocusLevel(focusLevel) {
    this._focusLevel = focusLevel;
    this._focusStrategy = this._focusStrategies[focusLevel];
  },

  _focusStrategy: null,
  _focusStrategies: {
    none: {
      decorateCard(card, a) {return {};},
    },

    me: {
      decorateCard(card, a) {
        var d = {};
        if (a.atMe && !a.atOthers && !a.waiting) {
          //highlight
        } else if (!a.atMe && (!a.shared || a.private )) {
          d.hidden = true;
        } else {
          d.dimmed = true;
        }
        return d;
      },
    },
    mePlus: {
      decorateCard(card, a) {
        var d = {};
        if (a.waiting || (!a.atMe && a.atOthers )) {
          d.dimmed = true;
        }
        return d;
      }
    }
  },

  decorateCard(card, force) {

    if (!force && card._decorated)
      return;
    card._decorated = true;

    if (this._focusStrategy) {
      const members = card.members|| [];
      const labels = card.labelIds || [];
      const atMe = _.contains(members, this._currentUserId);
      var a = {
        atMe: atMe,
        atOthers: !atMe && members.length > 0 || members.length > 1,
        atNoone: members.length == 0,
        waiting: Features.opinions.focus.cardSelectors.waiting.test(card.title || ""),
        private: _.intersection(labels, this._privateLabels).length > 0,
        shared: _.intersection(labels, this._sharedLabels ).length > 0
      }
      const decoration = this._focusStrategy.decorateCard(card, a);

      //console.debug(`Decorated card: ${card.title} hidden=${decoration.hidden} dimmed=${decoration.dimmed} (a=${JSON.stringify(a)})`);
      return decoration;
    }



  },

  prepareNewCard(card) {
    if (Features.opinions.focus.assignToFocusedUser) {
      if (!card.members.length && this._focusLevel !== "none") {
        card.members = [this._currentUserId];
      }
    }
  }


};

Blaze.registerHelper('Lens', Lens);
