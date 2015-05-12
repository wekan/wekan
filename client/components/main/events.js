Template.editor.events({
  // Pressing Ctrl+Enter should submit the form.
  'keydown textarea': function(event) {
    if (event.keyCode === 13 && (event.metaKey || event.ctrlKey)) {
      $(event.currentTarget).parents('form:first').submit();
    }
  }
});
