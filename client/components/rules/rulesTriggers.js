BlazeComponent.extendComponent({
  onCreated() {
    this.showBoardTrigger = new ReactiveVar(true);
    this.showCardTrigger = new ReactiveVar(false);
    this.showChecklistTrigger = new ReactiveVar(false);
  },

  setBoardTriggers() {
    this.showBoardTrigger.set(true);
    this.showCardTrigger.set(false);
    this.showChecklistTrigger.set(false);
    $('.js-set-card-triggers').removeClass('active');
    $('.js-set-board-triggers').addClass('active');
    $('.js-set-checklist-triggers').removeClass('active');
  },
  setCardTriggers() {
    this.showBoardTrigger.set(false);
    this.showCardTrigger.set(true);
    this.showChecklistTrigger.set(false);
    $('.js-set-card-triggers').addClass('active');
    $('.js-set-board-triggers').removeClass('active');
    $('.js-set-checklist-triggers').removeClass('active');
  },
  setChecklistTriggers() {
    this.showBoardTrigger.set(false);
    this.showCardTrigger.set(false);
    this.showChecklistTrigger.set(true);
    $('.js-set-card-triggers').removeClass('active');
    $('.js-set-board-triggers').removeClass('active');
    $('.js-set-checklist-triggers').addClass('active');
  },

  rules() {
    return Rules.find({});
  },

  name() {
    // console.log(this.data());
  },
  events() {
    return [{
      'click .js-set-board-triggers' (event) {
        this.setBoardTriggers();
      },
      'click .js-set-card-triggers' (event) {
        this.setCardTriggers();
      },
      'click .js-set-checklist-triggers' (event) {
        this.setChecklistTriggers();
      },
    }];
  },
}).register('rulesTriggers');
