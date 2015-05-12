Template.addlistForm.events({
  submit: function(event, t) {
    event.preventDefault();
    var title = t.find('.list-name-input');
    if ($.trim(title.value)) {
      Lists.insert({
        title: title.value,
        boardId: Session.get('currentBoard'),
        sort: $('.list').length
      });

      Utils.Scroll('.js-lists').left(270, true);
      title.value = '';
    }
  }
});
