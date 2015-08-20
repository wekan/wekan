Mixins.PerfectScrollbar = BlazeComponent.extendComponent({
  onRendered: function() {
    var component = this.mixinParent();
    var domElement = component.find('.js-perfect-scrollbar');
    Ps.initialize(domElement);

    // XXX We should create an event map to be consistent with other components
    // but since BlazeComponent doesn't merge Mixins events transparently I
    // prefered to use a jQuery event (which is what an event map ends up doing)
    component.$(domElement).on('mouseenter', function() {
      Ps.update(domElement);
    });
  }
});
