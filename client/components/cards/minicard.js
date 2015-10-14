// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },

  plugins: function(){
    return Wekan.plugins.map(function(plugin){
      return plugin.minicardTitle;
    });
  },
}).register('minicard');
