import { TAPi18n } from '/imports/i18n';

BlazeComponent.extendComponent({
  template() {
    return 'editCardSpentTime';
  },
  onCreated() {
    this.error = new ReactiveVar('');
    this.card = this.data();
  },
  toggleOvertime() {
    this.card.setIsOvertime(!this.card.getIsOvertime());
    $('#overtime .materialCheckBox').toggleClass('is-checked');
    $('#overtime').toggleClass('is-checked');
  },
  storeTime(spentTime, isOvertime) {
    this.card.setSpentTime(spentTime);
    this.card.setIsOvertime(isOvertime);
  },
  deleteTime() {
    this.card.setSpentTime(null);
    this.card.setIsOvertime(false);
  },
  events() {
    return [
      {
        //TODO : need checking this portion
        'submit .edit-time'(evt) {
          evt.preventDefault();

          const spentTime = parseFloat(evt.target.time.value);
          //const isOvertime = this.card.getIsOvertime();
          let isOvertime = false;
          if ($('#overtime').attr('class').indexOf('is-checked') >= 0) {
            isOvertime = true;
          }
          if (spentTime >= 0) {
            this.storeTime(spentTime, isOvertime);
            Popup.back();
          } else {
            this.error.set('invalid-time');
            evt.target.time.focus();
          }
        },
        'click .js-delete-time'(evt) {
          evt.preventDefault();
          this.deleteTime();
          Popup.back();
        },
        'click a.js-toggle-overtime': this.toggleOvertime,
      },
    ];
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
    if (this.data().getIsOvertime()) {
      return `${TAPi18n.__(
        'overtime',
      )} ${this.data().getSpentTime()} ${TAPi18n.__('hours')}`;
    } else {
      return `${TAPi18n.__(
        'card-spent',
      )} ${this.data().getSpentTime()} ${TAPi18n.__('hours')}`;
    }
  },
  showTime() {
    return this.data().getSpentTime();
  },
  events() {
    return [
      {
        'click .js-edit-time': Popup.open('editCardSpentTime'),
      },
    ];
  },
}).register('cardSpentTime');
