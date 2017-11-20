BlazeComponent.extendComponent({
  template() {
    return 'editCardSpentTime';
  },
  onCreated() {
    this.error = new ReactiveVar('');
    this.card = this.data();
  },
  toggleOvertime() {
    this.card.isOvertime = !this.card.isOvertime;
    $('#overtime .materialCheckBox').toggleClass('is-checked');

    $('#overtime').toggleClass('is-checked');
  },
  storeTime(spentTime, isOvertime) {
    this.card.setSpentTime(spentTime);
    this.card.setOvertime(isOvertime);
  },
  deleteTime() {
    this.card.unsetSpentTime();
  },
  events() {
    return [{
      //TODO : need checking this portion
      'submit .edit-time'(evt) {
        evt.preventDefault();

        const spentTime = parseFloat(evt.target.time.value);
        const isOvertime = this.card.isOvertime;

        if (spentTime >= 0) {
          this.storeTime(spentTime, isOvertime);
          Popup.close();
        } else {
          this.error.set('invalid-time');
          evt.target.time.focus();
        }
      },
      'click .js-delete-time'(evt) {
        evt.preventDefault();
        this.deleteTime();
        Popup.close();
      },
      'click a.js-toggle-overtime': this.toggleOvertime,
    }];
  },
}).register('editCardSpentTimePopup');

BlazeComponent.extendComponent({
  template() {
    return 'timeBadge';
  },
  onCreated() {
    const self = this;
    self.time = ReactiveVar();
  },
  showTitle() {
    if (this.data().isOvertime) {
      return `${TAPi18n.__('overtime')} ${this.data().spentTime} ${TAPi18n.__('hours')}`;
    } else {
      return `${TAPi18n.__('card-spent')} ${this.data().spentTime} ${TAPi18n.__('hours')}`;
    }
  },
  showTime() {
    return this.data().spentTime;
  },
  isOvertime() {
    return this.data().isOvertime;
  },
  events() {
    return [{
      'click .js-edit-time': Popup.open('editCardSpentTime'),
    }];
  },
}).register('cardSpentTime');

Template.timeBadge.helpers({
  canModifyCard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});
