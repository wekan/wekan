BlazeComponent.extendComponent({
  onCreated() {
    this.info = new ReactiveVar({});
    Meteor.call('getStatistics', (error, ret) => {
      if (!error && ret) {
        this.info.set(ret);
      }
    });
  },

  statistics() {
    return this.info.get();
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

  bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
      return '0 Byte';
    }
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${Math.round(bytes / Math.pow(1024, i), 2)}  ${sizes[i]}`;
  },
}).register('statistics');
