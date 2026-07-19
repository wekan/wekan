import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

// Sandstorm context is detected using the METEOR_SETTINGS environment variable
// in the package definition.
const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

Meteor.methods({
  async getStatistics() {
    const currentUser = await ReactiveCache.getCurrentUser();
    if (currentUser?.isAdmin) {
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
      if (!isSandstorm) {
        const v8 = require('v8');
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
      let meteorVersion = Meteor.release;
      meteorVersion = meteorVersion.replace('METEOR@', '');
      statistics.meteor = {
        meteorVersion,
      };
      // Database facts shown in Admin Panel / Version:
      //  - databaseType: MongoDB or FerretDB (WeKan can run on either; FerretDB
      //    v1 speaks the MongoDB wire protocol, so most of this looks the same).
      //  - mongoVersion: the MongoDB-compatible (wire) version. FerretDB reports
      //    one too, so WeKan/Meteor treat it like MongoDB.
      //  - databaseCommit: the server's git commit (buildInfo.gitVersion).
      //  - ferretdbVersion / ferretdbCommit: FerretDB's own version + commit,
      //    only present when the server is FerretDB.
      //  - mongoStorageEngine: WiredTiger for MongoDB; SQLite (or PostgreSQL) for
      //    FerretDB.
      //  - reactivity: how live updates reach clients right now — 'oplog' (Meteor
      //    oplog tailing), 'changeStreams', or 'polling' (poll-and-diff, the
      //    fallback FerretDB uses since it has no replica-set oplog).
      let databaseType = 'MongoDB';
      let mongoVersion = 'unknown';
      let databaseCommit = 'unknown';
      let ferretdbVersion;
      let ferretdbCommit;
      let mongoStorageEngine = 'unknown';
      let mongoOplogEnabled = false;
      let reactivity = 'polling';
      try {
        const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

        // Reactivity driver: Meteor uses oplog tailing when an oplog handle is
        // active, otherwise poll-and-diff. A change-streams driver (if ever used)
        // is detected by its handle name.
        const oplogHandle = mongo._oplogHandle;
        mongoOplogEnabled = Boolean(oplogHandle && oplogHandle.onOplogEntry);
        if (mongoOplogEnabled) {
          const handleName = oplogHandle?.constructor?.name || '';
          reactivity = /changestream/i.test(handleName) ? 'changeStreams' : 'oplog';
        } else {
          reactivity = 'polling';
        }

        // buildInfo carries the version + git commit, and — when the server is
        // FerretDB rather than MongoDB — a `ferretdb` sub-document with FerretDB's
        // own version/commit.
        const buildInfo = await mongo.db.command({ buildInfo: 1 });
        mongoVersion = buildInfo.version || 'unknown';
        databaseCommit = buildInfo.gitVersion || 'unknown';
        // The wekan/FerretDB v1 fork reports a TOP-LEVEL `ferretdbVersion` string
        // (e.g. "v1.24.2-60-gb5523566") plus `ferretdbFeatures`, and puts its own
        // git commit in `gitVersion`. Upstream/other builds may instead use a
        // `ferretdb` sub-document ({version, commit}). Detect either.
        if (buildInfo.ferretdb || buildInfo.ferretdbVersion || buildInfo.ferretdbFeatures) {
          databaseType = 'FerretDB';
          ferretdbVersion =
            buildInfo.ferretdbVersion ||
            (buildInfo.ferretdb && buildInfo.ferretdb.version) ||
            'unknown';
          ferretdbCommit =
            (buildInfo.ferretdb &&
              (buildInfo.ferretdb.commit || buildInfo.ferretdb.gitVersion)) ||
            buildInfo.gitVersion ||
            'unknown';
        }

        // Storage engine: MongoDB reports it in serverStatus. That command needs
        // the cluster-level `clusterMonitor` role, which a per-database WeKan user
        // (readWrite on the wekan db only, as in the FOSS/Docker/Meteor3 docs)
        // does NOT have — so it is rejected and the engine stays 'unknown'.
        try {
          const serverStatus = await mongo.db.command({ serverStatus: 1 });
          if (serverStatus.storageEngine && serverStatus.storageEngine.name) {
            mongoStorageEngine = serverStatus.storageEngine.name;
          }
        } catch (e) {
          // Not authorized (per-db credentials) or FerretDB has no serverStatus.
        }
        // Fallback that works with plain readWrite credentials: $collStats returns
        // storageStats with a `wiredTiger` (or `inMemory`) sub-document naming the
        // engine backing the collection, and requires only the collStats action
        // that the read/readWrite roles already grant. Used when serverStatus was
        // denied, so per-database MongoDB users still see the real engine instead
        // of 'unknown'.
        if (mongoStorageEngine === 'unknown' && databaseType === 'MongoDB') {
          try {
            const cols = await mongo.db
              .listCollections({}, { nameOnly: true })
              .toArray();
            const target = cols
              .map(c => c.name)
              .find(n => n && !n.startsWith('system.'));
            if (target) {
              const stats = await mongo.db
                .collection(target)
                .aggregate([{ $collStats: { storageStats: {} } }])
                .toArray();
              const storageStats = stats[0] && stats[0].storageStats;
              if (storageStats) {
                if (storageStats.wiredTiger) mongoStorageEngine = 'wiredTiger';
                else if (storageStats.inMemory) mongoStorageEngine = 'inMemory';
              }
            }
          } catch (e) {
            // collStats also unavailable — leave 'unknown'.
          }
        }
        if (mongoStorageEngine === 'unknown' && databaseType === 'FerretDB') {
          // WeKan bundles FerretDB with its embedded SQLite backend.
          mongoStorageEngine = 'SQLite';
        }
      } catch (e) {
        // Leave the defaults above (all 'unknown'/false/'polling').
      }
      statistics.mongo = {
        databaseType,
        mongoVersion,
        databaseCommit,
        ferretdbVersion,
        ferretdbCommit,
        mongoStorageEngine,
        mongoOplogEnabled,
        reactivity,
        // Configured environment (what was REQUESTED) shown next to `reactivity`
        // (what is actually LIVE): the driver priority order Meteor tries
        // left-to-right (OpLog only when tailing works, else polling) and the DDP
        // transport. Empty env shows as '(unset)'.
        reactivityOrder:
          process.env.METEOR_REACTIVITY_ORDER ||
          process.env.DEFAULT_METEOR_REACTIVITY_ORDER ||
          '(unset)',
        ddpTransport: process.env.DDP_TRANSPORT || '(unset)',
      };
      const client = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.client;
      const sessionsCount = client?.s?.activeSessions?.size;
      statistics.session = {
        sessionsCount,
      };
      return statistics;
    } else {
      return false;
    }
  },
});
