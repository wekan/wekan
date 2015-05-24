Mixins.PerfectScrollbar = BlazeComponent.extendComponent({
  onRendered: function() {
    var component = this.mixinParent();
    Ps.initialize(component.find('.js-perfect-scrollbar'));
  }
});
