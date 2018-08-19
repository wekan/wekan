BlazeComponent.extendComponent({
  onCreated() {
    this.rulesListVar = new ReactiveVar(true);
    this.rulesTriggerVar = new ReactiveVar(false);
    this.rulesActionVar = new ReactiveVar(false);
    this.ruleName = new ReactiveVar("");
    this.triggerVar = new ReactiveVar();
  },

  setTrigger() {
    this.rulesListVar.set(false);
    this.rulesTriggerVar.set(true);
    this.rulesActionVar.set(false);
  },

  setRulesList() {
    this.rulesListVar.set(true);
    this.rulesTriggerVar.set(false);
    this.rulesActionVar.set(false);
  },

  setAction() {
    this.rulesListVar.set(false);
    this.rulesTriggerVar.set(false);
    this.rulesActionVar.set(true);
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


  }];
  },

}).register('rulesMain');








