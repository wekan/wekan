BlazeComponent.extendComponent({
  onCreated() {
    this.rulesListVar = new ReactiveVar(true);
    this.rulesTriggerVar = new ReactiveVar(false);
    this.ruleName = new ReactiveVar("");
  },

  setTrigger() {
    this.rulesListVar.set(false);
    this.rulesTriggerVar.set(true);
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
          this.ruleName.set(ruleTitle)
          this.setTrigger();

        }}];
  },

}).register('rules');


BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('allRules');
  },

  rules() {
    return Rules.find({});
  },
  events() {
    return [{}];
      },
}).register('rulesList');


