BlazeComponent.extendComponent({
  onCreated() {
    this.rulesCurrentTab = new ReactiveVar("rulesList")
    this.ruleName = new ReactiveVar("");
    this.triggerVar = new ReactiveVar();
    this.ruleId = new ReactiveVar();
  },

  setTrigger() {
    this.rulesCurrentTab.set("trigger")
  },

  setRulesList() {
    this.rulesCurrentTab.set("rulesList")
  },

  setAction() {
    this.rulesCurrentTab.set("action")
  },
  setRuleDetails() {
    this.rulesCurrentTab.set("ruleDetails")
  },

  events() {
    return [{'click .js-delete-rule'(event) {
      const rule = this.currentData();
      Rules.remove(rule._id);
      Actions.remove(rule.actionId);
      Triggers.remove(rule.triggerId);

    },
    'click .js-goto-trigger'(event) {
      event.preventDefault();
      const ruleTitle = this.find('#ruleTitle').value;
      this.find('#ruleTitle').value = "";
      this.ruleName.set(ruleTitle)
      this.setTrigger();
    },
    'click .js-goto-action'(event) {
      event.preventDefault();
      this.setAction();
    },
    'click .js-goto-rules'(event) {
      event.preventDefault();
      this.setRulesList();
    },
    'click .js-goto-details'(event) {
      event.preventDefault();
      this.setRuleDetails();
    },


  }];
  },

}).register('rulesMain');








