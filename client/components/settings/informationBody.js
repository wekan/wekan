import { TAPi18n } from '/imports/i18n';
const { filesize } = require('filesize');

Template.statistics.onCreated(function () {
  this.info = new ReactiveVar({});
  Meteor.call('getStatistics', (error, ret) => {
    if (!error && ret) {
      this.info.set(ret);
    }
  });
});

Template.statistics.helpers({
  statistics() {
    return Template.instance().info.get();
  },

  humanReadableTime(time) {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor(((time % 86400) % 3600) / 60);
    const seconds = Math.floor(((time % 86400) % 3600) % 60);
    let out = '';
    if (days > 0) {
      out += `${days} ${TAPi18n.__('days')}, `;
    }
    if (hours > 0) {
      out += `${hours} ${TAPi18n.__('hours')}, `;
    }
    if (minutes > 0) {
      out += `${minutes} ${TAPi18n.__('minutes')}, `;
    }
    if (seconds > 0) {
      out += `${seconds} ${TAPi18n.__('seconds')}`;
    }
    return out;
  },

  numFormat(number) {
    return parseFloat(number).toFixed(2);
  },

  fileSize(size) {
    let ret = "";
    if (typeof size === 'number') {
      ret = filesize(size);
    }
    return ret;
  },

  formatBoolean(value) {
    return value ? TAPi18n.__('yes') : TAPi18n.__('no');
  },
});
