var defaultView = 'home';

Sidebar = null;

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
    view = view || defaultView;
    this._view.set(view);
  },

  getViewTemplate: function() {
    return this.getView() + 'Sidebar';
  },

  onRendered: function() {
    var self = this;
    if (! Meteor.userId() || ! Meteor.user().isBoardMember())
      return;

    $(document).on('mouseover', function() {
      self.$('.js-member,.js-label').draggable({
        appendTo: 'body',
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 150,
        snap: false,
        snapMode: 'both',
        start: function() {
          Popup.close();
        }
      });
    });
  },

  events: function() {
    // XXX Hacky, we need some kind of `super`
    var mixinEvents = this.getMixin(Mixins.InfiniteScrolling).events();
    return mixinEvents.concat([{
      'click .js-toogle-sidebar': this.toogle
    }]);
  }
}).register('sidebar');

EscapeActions.register('sidebarView',
  function() { return Sidebar && Sidebar.getView() !== defaultView; },
  function() { Sidebar.setView(defaultView); }
);
