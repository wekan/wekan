BlazeComponent.extendComponent({
  onCreated() {
    this.currentActions = new ReactiveVar("board");
  },


  setBoardActions(){
    this.currentActions.set("board");
    $('.js-set-card-actions').removeClass('active');
    $('.js-set-board-actions').addClass('active');
    $('.js-set-checklist-actions').removeClass('active');
    $('.js-set-mail-actions').removeClass('active');
  },
  setCardActions(){
    this.currentActions.set("card");
    $('.js-set-card-actions').addClass('active');
    $('.js-set-board-actions').removeClass('active');
    $('.js-set-checklist-actions').removeClass('active');
    $('.js-set-mail-actions').removeClass('active');
  },
  setChecklistActions(){
    this.currentActions.set("checklist");
    $('.js-set-card-actions').removeClass('active');
    $('.js-set-board-actions').removeClass('active');
    $('.js-set-checklist-actions').addClass('active');
    $('.js-set-mail-actions').removeClass('active');
  },
  setMailActions(){
    this.currentActions.set("mail");
    $('.js-set-card-actions').removeClass('active');
    $('.js-set-board-actions').removeClass('active');
    $('.js-set-checklist-actions').removeClass('active');
    $('.js-set-mail-actions').addClass('active');
  },

  rules() {
    return Rules.find({});
  },

  name(){
    console.log(this.data());
  },
  events() {
    return [{'click .js-set-board-actions'(event) {
      this.setBoardActions();
    },
    'click .js-set-card-actions'(event) {
      this.setCardActions();
    },
    'click .js-set-mail-actions'(event) {
      this.setMailActions();
    },
    'click .js-set-checklist-actions'(event) {
      this.setChecklistActions();
    },}];
  },
}).register('rulesActions');