import { Meteor } from 'meteor/meteor';
import os from 'os';
import { ReactiveCache } from '/imports/reactiveCache';
import {
  getProblemsOverview,
  getInProgress,
  getLoginProblems,
} from '/server/lib/systemStatus';

// Admin-gated methods behind the Admin Panel / Problems "Status" overview. The
// same data is available without the Admin Panel via `snap run wekan.problems`.

async function requireAdmin() {
  const user = await ReactiveCache.getCurrentUser();
  if (!user || !user.isAdmin) {
    throw new Meteor.Error('not-authorized', 'Admin only');
  }
  return user;
}

// Problem-specific detail, mirroring the `snap run wekan.problems <area>`
// sub-commands. Kept in one place so the Admin Panel and the snap command agree.
function cpuDetail() {
  const cpus = os.cpus() || [];
  const mem = process.memoryUsage();
  return {
    area: 'cpu',
    title: 'CPU usage',
    loadAverage: os.loadavg(), // 1 / 5 / 15 min
    cpuCount: cpus.length,
    cpuModel: cpus.length ? cpus[0].model : '',
    uptimeSeconds: Math.round(process.uptime()),
    rssBytes: mem.rss,
    heapUsedBytes: mem.heapUsed,
    note: 'Load average is machine-wide (1/5/15 min). rss/heap are the WeKan server process. Sustained load near or above the CPU count means the machine is saturated. If `top` shows the ferretdb process pegged near 100%/200% for a long time, the FerretDB v1 (SQLite) backend is saturated under WeKan\'s poll load (symptoms: pages take minutes, counts stuck at 0, raw i18n keys). Mitigation: run on MongoDB (snap: `snap set wekan database=mongodb`) or migrate text data across, and check for a migration/repair still running.',
  };
}

Meteor.methods({
  // The full Problems "Status" overview: everything in progress + problems found.
  async systemStatusReport() {
    await requireAdmin();
    const [overview, loginProblems] = await Promise.all([
      getProblemsOverview(),
      getLoginProblems(),
    ]);
    return { overview, loginProblems };
  },

  // Just the in-progress migrations/repairs (cheap; polled by the Status page).
  async migrationsInProgress() {
    await requireAdmin();
    return getInProgress();
  },

  // Detail for one problem area (currently 'cpu'); mirrors the snap sub-command.
  async problemDetailReport(area) {
    await requireAdmin();
    if (area === 'cpu') return cpuDetail();
    if (area === 'login') return { area: 'login', checks: await getLoginProblems() };
    if (area === 'status' || !area) return getProblemsOverview();
    throw new Meteor.Error('unknown-area', `Unknown problem area: ${area}`);
  },
});
