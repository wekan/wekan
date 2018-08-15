BlazeComponent.extendComponent({
  onCreated() {
    this.showBoardActions = new ReactiveVar(true);
    this.showCardActions = new ReactiveVar(false);
    this.showChecklistAction = new ReactiveVar(false);
  },


  setBoardTriggers(){
    this.showBoardActions.set(true);
    this.showCardActions.set(false);
    this.showChecklistActionsr.set(false);
    $('.js-set-card-triggers').removeClass('active');
    $('.js-set-board-triggers').addClass('active');
    $('.js-set-checklist-triggers').removeClass('active');
  },
  setCardTriggers(){
    this.showBoardActions.set(false);
    this.showCardActions.set(true);
    this.showChecklistActions.set(false);
    $('.js-set-card-triggers').addClass('active');
    $('.js-set-board-triggers').removeClass('active');
    $('.js-set-checklist-triggers').removeClass('active');
  },
  setChecklistTriggers(){
    this.showBoardActions.set(false);
    this.showCardActions.set(false);
    this.showChecklistActions.set(true);
    $('.js-set-card-triggers').removeClass('active');
    $('.js-set-board-triggers').removeClass('active');
    $('.js-set-checklist-triggers').addClass('active');
  },

  rules() {
    return Rules.find({});
  },

  name(){
    console.log(this.data());
  },
  events() {
    return [{'click .js-set-board-triggers'(event) {
      this.setBoardTriggers();
    },
    'click .js-set-card-triggers'(event) {
      this.setCardTriggers();
    },
    'click .js-set-checklist-triggers'(event) {
      this.setChecklistTriggers();
    },}];
  },
}).register('rulesActions');