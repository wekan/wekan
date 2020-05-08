import { MongoInternals } from 'meteor/mongo';

if (Meteor.isServer) {
  Meteor.methods({
    getStatistics() {
      if (Meteor.user() && Meteor.user().isAdmin) {
        const os = require('os');
        const pjson = require('/package.json');
        const statistics = {};
        let wekanVersion = pjson.version;
        wekanVersion = wekanVersion.replace('v', '');
        statistics.version = wekanVersion;
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
        let nodeVersion = process.version;
        nodeVersion = nodeVersion.replace('v', '');
        statistics.process = {
          nodeVersion,
          pid: process.pid,
          uptime: process.uptime(),
        };
        // Remove beginning of Meteor release text METEOR@
        let meteorVersion = Meteor.release;
        meteorVersion = meteorVersion.replace('METEOR@', '');
        statistics.meteor = {
          meteorVersion,
        };
        // Thanks to RocketChat for MongoDB version detection !
        // https://github.com/RocketChat/Rocket.Chat/blob/develop/app/utils/server/functions/getMongoInfo.js
        let mongoVersion;
        let mongoStorageEngine;
        let mongoOplogEnabled;
        try {
          const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
          oplogEnabled = Boolean(
            mongo._oplogHandle && mongo._oplogHandle.onOplogEntry,
          );
          const { version, storageEngine } = Promise.await(
            mongo.db.command({ serverStatus: 1 }),
          );
          mongoVersion = version;
          mongoStorageEngine = storageEngine.name;
          mongoOplogEnabled = oplogEnabled;
        } catch (e) {
          try {
            const { version } = Promise.await(
              mongo.db.command({ buildinfo: 1 }),
            );
            mongoVersion = version;
            mongoStorageEngine = 'unknown';
          } catch (e) {
            mongoVersion = 'unknown';
            mongoStorageEngine = 'unknown';
          }
        }
        statistics.mongo = {
          mongoVersion,
          mongoStorageEngine,
          mongoOplogEnabled,
        };
        return statistics;
      } else {
        return false;
      }
    },
  });
}
