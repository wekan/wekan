BlazeComponent.extendComponent({
  template: function() {
    return 'boardSidebar';
  },

  mixins: function() {
    return [Mixins.InfiniteScrolling];
  },

  onCreated: function() {
    this._isOpen = new ReactiveVar(! Session.get('currentCard'));
    Sidebar = this;
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
    return this.isOpen() && Filter.isActive();
  },

  events: function() {
    // XXX Hacky, we need some kind of `super`
    var mixinEvents = this.getMixin(Mixins.InfiniteScrolling).events();
    return mixinEvents.concat([{
      'click .js-toogle-sidebar': this.toogle
    }]);
  }
}).register('boardSidebar');
