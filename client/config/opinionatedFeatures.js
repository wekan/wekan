Features = {
  opinions : {
    assignToFocusedUser : true,
    preferHideFilter: true,
    specialCards: true,
    specialLists: {
      done: /done/i,
      now: /today/i
    },
    focus: {
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
