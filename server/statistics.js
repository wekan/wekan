import { MongoInternals } from 'meteor/mongo';

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

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
        // Start: Show Nodejs heap stats at Standalone WeKan.
        //
        // Not shown at Sandstorm WeKan, because there's a bunch of machine performance data
        // Sandstorm doesn't expose to apps to prevent side channel attacks.
        if (!isSandstorm) {
          const v8 = require('v8'); // Import the v8 module
          statistics.nodeHeapStats = {
            totalHeapSize: v8.getHeapStatistics().total_heap_size,
            totalHeapSizeExecutable: v8.getHeapStatistics().total_heap_size_executable,
            totalPhysicalSize: v8.getHeapStatistics().total_physical_size,
            totalAvailableSize: v8.getHeapStatistics().total_available_size,
            usedHeapSize: v8.getHeapStatistics().used_heap_size,
            heapSizeLimit: v8.getHeapStatistics().heap_size_limit,
            mallocedMemory: v8.getHeapStatistics().malloced_memory,
            peakMallocedMemory: v8.getHeapStatistics().peak_malloced_memory,
            doesZapGarbage: v8.getHeapStatistics().does_zap_garbage,
            numberOfNativeContexts: v8.getHeapStatistics().number_of_native_contexts,
            numberOfDetachedContexts: v8.getHeapStatistics().number_of_detached_contexts,
          };
          let memoryUsage = process.memoryUsage();
          statistics.nodeMemoryUsage = {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
          };
        }
        // End: Show Nodejs heap stats at Standalone WeKan.
        //
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
            const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
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
        const client = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.client;
        const sessionsCount = client?.s?.activeSessions?.size;
        statistics.session = {
          sessionsCount: sessionsCount,
        };
        return statistics;
      } else {
        return false;
      }
    },
  });
}
