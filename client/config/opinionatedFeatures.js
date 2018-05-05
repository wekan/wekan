Features = {
  opinions : {
    preferHideFilter: true,
    specialCards: {
      special: /[-]{3}/,
      listSeparator: /[-]{4}/
    },
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
