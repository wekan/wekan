
BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  rules() {
    return Rules.find({});
  },
  events() {
    return [{'click .js-delete-rule'(event) {
          const rule = this.currentData();
          Rules.remove(rule._id);
          
        },
        'click .js-add-rule'(event) {

          event.preventDefault();
          const ruleTitle = this.find('#ruleTitle').value;
          Rules.insert({title: ruleTitle});
          this.find('#ruleTitle').value = "";
          
        }}];
      },
    }).register('rules');
