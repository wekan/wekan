Meteor.methods({
  getStatistics() {
    const os = require('os');
    const pjson = require('/package.json');
    const statistics = {};
    statistics.version = pjson.version;
    statistics.os = {
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      cpus: os.cpus(),
    };
    statistics.process = {
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime(),
    };

    return statistics;
  },
});
