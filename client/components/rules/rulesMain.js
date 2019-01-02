let rulesMainComponent = BlazeComponent.extendComponent({
  onCreated() {
    this.rulesCurrentTab = new ReactiveVar('rulesList');
    this.ruleName = new ReactiveVar('');
    this.triggerVar = new ReactiveVar();
    this.ruleId = new ReactiveVar();
  },

  setTrigger() {
    this.rulesCurrentTab.set('trigger');
  },
  sanitizeObject(obj){
    Object.keys(obj).forEach(key =>{
      if(obj[key] == "" || obj[key] == undefined){
        obj[key] = "*";
      }}
    );
  },
  setRulesList() {
    this.rulesCurrentTab.set('rulesList');
  },

  setAction() {
    this.rulesCurrentTab.set('action');
  },

  setRuleDetails() {
    this.rulesCurrentTab.set('ruleDetails');
  },

  events() {
    return [{
      'click .js-delete-rule' () {
        const rule = this.currentData();
        Rules.remove(rule._id);
        Actions.remove(rule.actionId);
        Triggers.remove(rule.triggerId);

      },
      'click .js-goto-trigger' (event) {
        event.preventDefault();
        const ruleTitle = this.find('#ruleTitle').value;
        if(ruleTitle !== undefined && ruleTitle !== ''){
          this.find('#ruleTitle').value = '';
          this.ruleName.set(ruleTitle);
          this.setTrigger();
        }
      },
      'click .js-goto-action' (event) {
        event.preventDefault();
        // Add user to the trigger
        const username = $(event.currentTarget.offsetParent).find(".user-name").val();
        let trigger = this.triggerVar.get();
        trigger["userId"] = "*";
        if(username != undefined ){
          const userFound = Users.findOne({"username":username});
          if(userFound != undefined){
            trigger["userId"] = userFound._id;
            this.triggerVar.set(trigger);
          }
        }
        // Sanitize trigger
        trigger = this.triggerVar.get();
        this.sanitizeObject(trigger)
        this.triggerVar.set(trigger);
        this.setAction();
      },
      'click .js-show-user-field' (event) {
        event.preventDefault();
        $(event.currentTarget.offsetParent).find(".user-details").removeClass("hide-element");
      },
      'click .js-goto-rules' (event) {
        event.preventDefault();
        this.setRulesList();
      },
      'click .js-goback' (event) {
        event.preventDefault();
        if(this.rulesCurrentTab.get() === 'trigger' || this.rulesCurrentTab.get() === 'ruleDetails' ){
          this.setRulesList();
        }
        if(this.rulesCurrentTab.get() === 'action'){
          this.setTrigger();
        }
      },
      'click .js-goto-details' (event) {
        event.preventDefault();
        const rule = this.currentData();
        this.ruleId.set(rule._id);
        this.setRuleDetails();
      },

    }];
  },

}).register('rulesMain');



