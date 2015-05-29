Sidebar = null;

var defaultView = 'home';

var viewTitles = {
  filter: 'filter-cards',
  multiselection: 'multi-selection'
};

BlazeComponent.extendComponent({
  template: function() {
    return 'sidebar';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  onCreated: function() {
    this._isOpen = new ReactiveVar(! Session.get('currentCard'));
    this._view = new ReactiveVar(defaultView);
    Sidebar = this;
  },

  onDestroyed: function() {
    Sidebar = null;
  },

  isOpen: function() {
    return this._isOpen.get();
  },

  open: function() {
    if (! this._isOpen.get()) {
      this._isOpen.set(true);
    }
  },

  hide: function() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  },

  toogle: function() {
    this._isOpen.set(! this._isOpen.get());
  },

  calculateNextPeak: function() {
    var altitude = this.find('.js-board-sidebar-content').scrollHeight;
    this.callFirstWith(this, 'setNextPeak', altitude);
  },

  reachNextPeak: function() {
    var activitiesComponent = this.componentChildren('activities')[0];
    activitiesComponent.loadNextPage();
  },

  isTongueHidden: function() {
    return this.isOpen() && this.getView() !== defaultView;
  },

  getView: function() {
    return this._view.get();
  },

  setView: function(view) {
    view = _.isString(view) ? view : defaultView;
    this._view.set(view);
    this.open();
  },

  isDefaultView: function() {
    return this.getView() === defaultView;
  },

  getViewTemplate: function() {
    return this.getView() + 'Sidebar';
  },

  getViewTitle: function() {
    return TAPi18n.__(viewTitles[this.getView()]);
  },

  // Board members can assign people or labels by drag-dropping elements from
  // the sidebar to the cards on the board. In order to re-initialize the
  // jquery-ui plugin any time a draggable member or label is modified or
  // removed we use a autorun function and register a dependency on the both
  // members and labels fields of the current board document.
  onRendered: function() {
    var self = this;
    if (! Meteor.userId() || ! Meteor.user().isBoardMember())
      return;

    self.autorun(function() {
      var currentBoardId = Tracker.nonreactive(function() {
        return Session.get('currentBoard');
      });
      Boards.findOne(currentBoardId, {
        fields: {
          members: 1,
          labels: 1
        }
      });
      Tracker.afterFlush(function() {
        self.$('.js-member,.js-label').draggable({
          appendTo: 'body',
          helper: 'clone',
          revert: 'invalid',
          revertDuration: 150,
          snap: false,
          snapMode: 'both',
          start: function() {
            EscapeActions.executeLowerThan('popup');
          }
        });
      });
    });
  },

  events: function() {
    // XXX Hacky, we need some kind of `super`
    var mixinEvents = this.getMixin(Mixins.InfiniteScrolling).events();
    return mixinEvents.concat([{
      'click .js-toogle-sidebar': this.toogle,
      'click .js-back-home': this.setView
    }]);
  }
}).register('sidebar');

EscapeActions.register('sidebarView',
  function() { Sidebar.setView(defaultView); },
  function() { return Sidebar && Sidebar.getView() !== defaultView; }
);
