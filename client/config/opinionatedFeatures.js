Features = {
  opinions : {
    preferHideFilter: true,
    specialCards: true,
    specialLists: {
      done: /done/i,
      now: /today/i
    },
    focus: {
      assignToFocusedUser : true,
      labelSelectors: {
        private: /-/i,
        shared: /\+/i,
      },
      cardSelectors: {
        waiting: /^\.\./i
      }
    }
  },
  queryParamExtensions : {
    focus: true
  }
};
