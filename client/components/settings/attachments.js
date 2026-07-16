import { Meteor } from 'meteor/meteor';
import AttachmentBulkMoveStatus from '/models/attachmentBulkMoveStatus';
import { TAPi18n } from '/imports/i18n';

// DOM field ids per cloud provider, used to read the admin form on save/test.
const CLOUD_FIELD_IDS = {
  s3: {
    enabled: '#s3-enabled',
    read: '#s3-read',
    endpoint: '#s3-endpoint',
    region: '#s3-region',
    bucket: '#s3-bucket',
    accessKeyId: '#s3-access-key',
    secretAccessKey: '#s3-secret-key',
    forcePathStyle: '#s3-force-path-style',
  },
  azure: {
    enabled: '#azure-enabled',
    read: '#azure-read',
    accountName: '#azure-account-name',
    accountKey: '#azure-account-key',
    connectionString: '#azure-connection-string',
    bucket: '#azure-bucket',
  },
  gcs: {
    enabled: '#gcs-enabled',
    read: '#gcs-read',
    projectId: '#gcs-project-id',
    bucket: '#gcs-bucket',
    keyFilename: '#gcs-key-filename',
    credentials: '#gcs-credentials',
  },
};

const CLOUD_PROVIDERS = ['s3', 'azure', 'gcs'];

function gatherCloudConfig(tpl, provider) {
  const ids = CLOUD_FIELD_IDS[provider] || {};
  const cfg = {};
  Object.keys(ids).forEach(field => {
    const el = tpl.$(ids[field]);
    if (!el || !el.length) return;
    if (el.attr('type') === 'checkbox') {
      cfg[field] = el.prop('checked');
    } else {
      // Trim so stray whitespace/newlines from copy-paste (e.g. an account name
      // or endpoint) do not produce an invalid URL in the storage adapter.
      const value = el.val();
      cfg[field] = typeof value === 'string' ? value.trim() : value;
    }
  });
  return cfg;
}

function cloudConfigFromSettings(tpl, provider) {
  const settings = tpl.attachmentStorageSettings.get();
  return (settings && settings.storageConfig && settings.storageConfig[provider]) || {};
}
const { filesize } = require('filesize');

const LIMIT_UNIT_FACTORS = {
  bytes: 1,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
};

const LIMIT_MODES = {
  UNLIMITED: 'unlimited',
  MAX_SIZE: 'max-size',
  BLOCKED: 'blocked',
};

const LIMIT_BLOCKED_FIELDS = {
  attachmentsUploadMaxBytes: 'attachmentsUploadBlocked',
  attachmentsDownloadMaxBytes: 'attachmentsDownloadBlocked',
  apiUploadMaxBytes: 'apiUploadBlocked',
  apiDownloadMaxBytes: 'apiDownloadBlocked',
};

const DEFAULT_LIMIT_SETTINGS = {
  attachmentsUploadMaxBytes: 0,
  attachmentsDownloadMaxBytes: 0,
  apiUploadMaxBytes: 0,
  apiDownloadMaxBytes: 0,
  avatarsUploadBlocked: false,
};

function toNonNegativeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalizeLimitSettings(settingsDoc) {
  const fromDoc = settingsDoc?.limitSettings || {};
  const legacyUpload = settingsDoc?.uploadSettings?.maxFileSize;

  const attachmentsUploadMaxBytes = Number.isFinite(fromDoc.attachmentsUploadMaxBytes)
    ? toNonNegativeInteger(fromDoc.attachmentsUploadMaxBytes, DEFAULT_LIMIT_SETTINGS.attachmentsUploadMaxBytes)
    : (Number.isFinite(legacyUpload)
      ? toNonNegativeInteger(legacyUpload, DEFAULT_LIMIT_SETTINGS.attachmentsUploadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.attachmentsUploadMaxBytes);

  return {
    attachmentsUploadMaxBytes,
    attachmentsDownloadMaxBytes: Number.isFinite(fromDoc.attachmentsDownloadMaxBytes)
      ? toNonNegativeInteger(fromDoc.attachmentsDownloadMaxBytes, DEFAULT_LIMIT_SETTINGS.attachmentsDownloadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.attachmentsDownloadMaxBytes,
    apiUploadMaxBytes: Number.isFinite(fromDoc.apiUploadMaxBytes)
      ? toNonNegativeInteger(fromDoc.apiUploadMaxBytes, DEFAULT_LIMIT_SETTINGS.apiUploadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.apiUploadMaxBytes,
    apiDownloadMaxBytes: Number.isFinite(fromDoc.apiDownloadMaxBytes)
      ? toNonNegativeInteger(fromDoc.apiDownloadMaxBytes, DEFAULT_LIMIT_SETTINGS.apiDownloadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.apiDownloadMaxBytes,
    attachmentsUploadBlocked: fromDoc.attachmentsUploadBlocked === true,
    avatarsUploadBlocked: fromDoc.avatarsUploadBlocked === true,
    attachmentsDownloadBlocked: fromDoc.attachmentsDownloadBlocked === true,
    apiUploadBlocked: fromDoc.apiUploadBlocked === true,
    apiDownloadBlocked: fromDoc.apiDownloadBlocked === true,
  };
}

function getBlockedFieldName(fieldName) {
  return LIMIT_BLOCKED_FIELDS[fieldName] || null;
}

function pickModeForLimit(fieldName, normalizedLimits) {
  const blockedField = getBlockedFieldName(fieldName);
  if (blockedField && normalizedLimits[blockedField] === true) {
    return LIMIT_MODES.BLOCKED;
  }
  return normalizedLimits[fieldName] > 0 ? LIMIT_MODES.MAX_SIZE : LIMIT_MODES.UNLIMITED;
}

function pickUnitForBytes(bytes) {
  const safeBytes = toNonNegativeInteger(bytes, 0);
  if (safeBytes > 0 && safeBytes % LIMIT_UNIT_FACTORS.gb === 0) {
    return 'gb';
  }
  if (safeBytes > 0 && safeBytes % LIMIT_UNIT_FACTORS.mb === 0) {
    return 'mb';
  }
  return 'bytes';
}

function toDisplayValue(bytes, unit) {
  const safeBytes = toNonNegativeInteger(bytes, 0);
  const factor = LIMIT_UNIT_FACTORS[unit] || LIMIT_UNIT_FACTORS.bytes;
  return safeBytes / factor;
}

function toBytes(value, unit) {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  const factor = LIMIT_UNIT_FACTORS[unit] || LIMIT_UNIT_FACTORS.bytes;
  return Math.round(numericValue * factor);
}

function getLimitUnitOptions(selectedUnit) {
  return [
    { value: 'gb', labelKey: 'attachment-limit-unit-gb', selected: selectedUnit === 'gb' },
    { value: 'mb', labelKey: 'attachment-limit-unit-mb', selected: selectedUnit === 'mb' },
    { value: 'bytes', labelKey: 'attachment-limit-unit-bytes', selected: selectedUnit === 'bytes' },
  ];
}

function getLimitModeOptions(selectedMode) {
  return [
    { value: LIMIT_MODES.UNLIMITED, labelKey: 'attachment-limit-mode-unlimited', selected: selectedMode === LIMIT_MODES.UNLIMITED },
    { value: LIMIT_MODES.MAX_SIZE, labelKey: 'attachment-limit-mode-max-size', selected: selectedMode === LIMIT_MODES.MAX_SIZE },
    { value: LIMIT_MODES.BLOCKED, labelKey: 'attachment-limit-mode-blocked', selected: selectedMode === LIMIT_MODES.BLOCKED },
  ];
}

function updateStorageConfigField(tpl, storageName, field, value, checkboxEl) {
  const currentSettings = tpl.attachmentStorageSettings.get();
  if (!currentSettings) return;
  const nextSettings = {
    ...currentSettings,
    storageConfig: {
      ...(currentSettings.storageConfig || {}),
      [storageName]: {
        ...(currentSettings.storageConfig?.[storageName] || {}),
        [field]: value,
      },
    },
  };
  Meteor.call('updateAttachmentStorageSettings', nextSettings, (error) => {
    if (error) {
      alert(`${TAPi18n.__('attachment-transfer-limits-save-failed')}: ${error.reason || error.message}`);
      if (checkboxEl) checkboxEl.checked = !value;
      return;
    }
    refreshAttachmentStorageSettings(tpl);
  });
}

function refreshAttachmentStorageSettings(tpl) {
  Meteor.call('getAttachmentStorageSettings', (error, settings) => {
    if (error || !settings) {
      if (process.env.DEBUG === 'true') {
        console.warn('Failed to load attachment storage settings:', error);
      }
      return;
    }

    const normalizedLimits = normalizeLimitSettings(settings);
    tpl.attachmentStorageSettings.set({
      ...settings,
      limitSettings: normalizedLimits,
    });

    tpl.attachmentLimitUnits.set({
      attachmentsUploadMaxBytes: pickUnitForBytes(normalizedLimits.attachmentsUploadMaxBytes),
      attachmentsDownloadMaxBytes: pickUnitForBytes(normalizedLimits.attachmentsDownloadMaxBytes),
      apiUploadMaxBytes: pickUnitForBytes(normalizedLimits.apiUploadMaxBytes),
      apiDownloadMaxBytes: pickUnitForBytes(normalizedLimits.apiDownloadMaxBytes),
    });

    tpl.attachmentLimitModes.set({
      attachmentsUploadMaxBytes: pickModeForLimit('attachmentsUploadMaxBytes', normalizedLimits),
      attachmentsDownloadMaxBytes: pickModeForLimit('attachmentsDownloadMaxBytes', normalizedLimits),
      apiUploadMaxBytes: pickModeForLimit('apiUploadMaxBytes', normalizedLimits),
      apiDownloadMaxBytes: pickModeForLimit('apiDownloadMaxBytes', normalizedLimits),
    });
  });
}

Template.attachments.onCreated(function () {
  this.activeSection = new ReactiveVar('move');
  this.storageSettingsSubscription = Meteor.subscribe('attachmentStorageSettings');
  this.attachmentStorageSettings = new ReactiveVar(null);
  // #6473: the real storage paths only exist on the SERVER (WRITABLE_PATH is a
  // server environment variable — process.env in the browser never has it, so
  // computing the path client-side always showed the misleading "/data").
  this.storagePaths = new ReactiveVar(null);
  Meteor.call('getAttachmentStoragePaths', (err, paths) => {
    if (!err && paths) {
      this.storagePaths.set(paths);
    }
  });
  this.attachmentLimitUnits = new ReactiveVar({
    attachmentsUploadMaxBytes: 'mb',
    attachmentsDownloadMaxBytes: 'mb',
    apiUploadMaxBytes: 'mb',
    apiDownloadMaxBytes: 'mb',
  });
  this.attachmentLimitModes = new ReactiveVar({
    attachmentsUploadMaxBytes: LIMIT_MODES.UNLIMITED,
    attachmentsDownloadMaxBytes: LIMIT_MODES.UNLIMITED,
    apiUploadMaxBytes: LIMIT_MODES.UNLIMITED,
    apiDownloadMaxBytes: LIMIT_MODES.UNLIMITED,
  });
  this.gridFsStats = new ReactiveVar(null);
  this.gridFsStatsLoading = new ReactiveVar(false);
  this.gridFsStatsError = new ReactiveVar('');
  this.filesystemStats = new ReactiveVar(null);
  this.filesystemStatsLoading = new ReactiveVar(false);
  this.filesystemStatsError = new ReactiveVar('');
  this.s3Stats = new ReactiveVar(null);
  this.s3StatsLoading = new ReactiveVar(false);
  this.s3StatsError = new ReactiveVar('');
  this.azureStats = new ReactiveVar(null);
  this.azureStatsLoading = new ReactiveVar(false);
  this.azureStatsError = new ReactiveVar('');
  this.gcsStats = new ReactiveVar(null);
  this.gcsStatsLoading = new ReactiveVar(false);
  this.gcsStatsError = new ReactiveVar('');
  this.compactLoading = new ReactiveVar(false);
  this.compactResult = new ReactiveVar(null);
  this.compactError = new ReactiveVar('');
  this.cloudTestResults = new ReactiveVar({});
  this.cloudTestErrors = new ReactiveVar({});
  this.loading = new ReactiveVar(false);
  this.migrateStatus = new ReactiveVar(null);
  this.migratePoll = null;
  this.backupStatus = new ReactiveVar(null);
  this.backupList = new ReactiveVar(null);
  this.backupSchedule = new ReactiveVar(null);
  this.selectedBackup = new ReactiveVar('');
  this.backupPoll = null;
  Meteor.call('getBackupSchedule', (err, s) => { if (!err && s) this.backupSchedule.set(s); });

  // Sandstorm: MongoDB 3 -> FerretDB migration status + raw-MongoDB disk usage.
  this.sandstormStatus = new ReactiveVar(null);
  this.sandstormDeleteResult = new ReactiveVar(null);
  this.sandstormDeleteError = new ReactiveVar('');
  // Fetch (once) when the Sandstorm tab is opened. Migration runs in start.js
  // before the app boots, so the status is static by the time the UI is shown.
  this.autorun(() => {
    if (this.activeSection.get() === 'sandstorm') {
      Meteor.call('sandstormMigrationStatus', (err, res) => {
        if (!err && res) this.sandstormStatus.set(res);
      });
    }
  });

  this.autorun(() => {
    const ready = this.storageSettingsSubscription.ready();
    if (ready) {
      refreshAttachmentStorageSettings(this);
      this.loading.set(false);
    } else {
      this.loading.set(true);
    }
  });
});

Template.attachments.onDestroyed(function () {
  if (this.migratePoll) {
    Meteor.clearTimeout(this.migratePoll);
    this.migratePoll = null;
  }
  if (this.backupPoll) {
    Meteor.clearTimeout(this.backupPoll);
    this.backupPoll = null;
  }
});

// Text-data database migration (MongoDB <-> FerretDB v1 SQLite) helpers.
function pollMigrateStatus(tpl) {
  Meteor.call('migrateTextDatabaseStatus', (err, status) => {
    if (err || !status) return;
    tpl.migrateStatus.set(status);
    if (status.running) {
      tpl.migratePoll = Meteor.setTimeout(() => pollMigrateStatus(tpl), 2000);
    }
  });
}

function startDbMigration(tpl, direction) {
  const which = direction === 'toFerretDB' ? 'FerretDB v1 (SQLite)' : 'MongoDB';
  // eslint-disable-next-line no-alert
  if (!window.confirm(TAPi18n.__('database-migration-confirm', { db: which }))) {
    return;
  }
  tpl.migrateStatus.set({ running: true, phase: 'starting', direction });
  Meteor.call('migrateTextDatabase', direction, error => {
    if (error) {
      tpl.migrateStatus.set({ phase: 'error', error: error.reason || error.message, success: false });
    } else {
      pollMigrateStatus(tpl);
    }
  });
}

function pollBackupStatus(tpl) {
  Meteor.call('backupStatus', (err, status) => {
    if (err || !status) return;
    tpl.backupStatus.set(status);
    if (status.running) {
      tpl.backupPoll = Meteor.setTimeout(() => pollBackupStatus(tpl), 2000);
    }
  });
}

Template.attachments.helpers({
  loading() {
    return Template.instance().loading;
  },
  isLimitsActive() {
    return Template.instance().activeSection.get() === 'limits';
  },
  isMoveActive() {
    return Template.instance().activeSection.get() === 'move';
  },
  isDefaultStorageActive() {
    return Template.instance().activeSection.get() === 'default-save-storage';
  },
  isAzureActive() {
    return Template.instance().activeSection.get() === 'azure';
  },
  isGcsActive() {
    return Template.instance().activeSection.get() === 'gcs';
  },
  isDatabaseMigrationActive() {
    return Template.instance().activeSection.get() === 'database-migration';
  },
  migrateStatus() {
    return Template.instance().migrateStatus.get();
  },
  migrateRunning() {
    const s = Template.instance().migrateStatus.get();
    return !!(s && s.running);
  },
  migrateSuccess() {
    const s = Template.instance().migrateStatus.get();
    return !!(s && s.success === true);
  },
  isBackupActive() {
    return Template.instance().activeSection.get() === 'backup';
  },
  isSandstorm() {
    return !!(
      Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.sandstorm
    );
  },
  isSandstormActive() {
    return Template.instance().activeSection.get() === 'sandstorm';
  },
  sandstormStatus() {
    return Template.instance().sandstormStatus.get();
  },
  rawMongoSize() {
    const s = Template.instance().sandstormStatus.get();
    return s ? filesize(s.rawMongoBytes || 0) : '';
  },
  ferretSize() {
    const s = Template.instance().sandstormStatus.get();
    return s ? filesize(s.ferretBytes || 0) : '';
  },
  attachmentsSize() {
    const s = Template.instance().sandstormStatus.get();
    return s ? filesize(s.attachmentsBytes || 0) : '';
  },
  avatarsSize() {
    const s = Template.instance().sandstormStatus.get();
    return s ? filesize(s.avatarsBytes || 0) : '';
  },
  sandstormDeleteDisabled() {
    const s = Template.instance().sandstormStatus.get();
    // Only allow deleting the raw MongoDB files after a confirmed-successful
    // migration, and only while they still exist.
    return !(s && s.migrationSuccess && s.rawMongoExists);
  },
  sandstormDeleteResult() {
    return Template.instance().sandstormDeleteResult.get();
  },
  sandstormDeleteFreed() {
    const r = Template.instance().sandstormDeleteResult.get();
    return r ? filesize(r.freedBytes || 0) : '';
  },
  sandstormDeleteError() {
    return Template.instance().sandstormDeleteError.get();
  },
  backupStatus() {
    return Template.instance().backupStatus.get();
  },
  backupRunning() {
    const s = Template.instance().backupStatus.get();
    return !!(s && s.running);
  },
  backupSuccess() {
    const s = Template.instance().backupStatus.get();
    return !!(s && s.success === true && s.phase === 'completed');
  },
  backupList() {
    return Template.instance().backupList.get();
  },
  scheduleOff() { const s = Template.instance().backupSchedule.get(); return !s || !s.frequency || s.frequency === 'off'; },
  scheduleDaily() { const s = Template.instance().backupSchedule.get(); return !!(s && s.frequency === 'daily'); },
  scheduleWeekly() { const s = Template.instance().backupSchedule.get(); return !!(s && s.frequency === 'weekly'); },
  scheduleMonthly() { const s = Template.instance().backupSchedule.get(); return !!(s && s.frequency === 'monthly'); },
  scheduleTime() { const s = Template.instance().backupSchedule.get(); return (s && s.time) || '04:00'; },
  scheduleDow() { const s = Template.instance().backupSchedule.get(); return (s && s.dayOfWeek) || 'Sunday'; },
  scheduleDom() { const s = Template.instance().backupSchedule.get(); return (s && s.dayOfMonth) || 1; },
  avatarsUploadBlocked() {
    const settings = Template.instance().attachmentStorageSettings.get();
    return settings?.limitSettings?.avatarsUploadBlocked === true;
  },
  defaultStorageOptions() {
    const settings = Template.instance().attachmentStorageSettings.get();
    const selected = settings?.defaultStorage || 'fs';
    const sc = settings?.storageConfig || {};
    const options = [
      { value: 'fs', labelKey: 'move-storage-fs' },
      { value: 'gridfs', labelKey: 'move-storage-gridfs' },
    ];
    // Only offer a cloud backend as a save target once it is enabled.
    if (sc.s3?.enabled) options.push({ value: 's3', labelKey: 'move-storage-s3' });
    if (sc.azure?.enabled) options.push({ value: 'azure', labelKey: 'move-storage-azure' });
    if (sc.gcs?.enabled) options.push({ value: 'gcs', labelKey: 'move-storage-gcs' });
    return options.map(option => ({
      ...option,
      selected: option.value === selected,
    }));
  },
  cloudEnabled() {
    const tpl = Template.instance();
    const out = {};
    CLOUD_PROVIDERS.forEach(p => { out[p] = cloudConfigFromSettings(tpl, p).enabled === true; });
    return out;
  },
  cloudRead() {
    const tpl = Template.instance();
    const out = {};
    CLOUD_PROVIDERS.forEach(p => { out[p] = cloudConfigFromSettings(tpl, p).read !== false; });
    return out;
  },
  cloudValue() {
    const tpl = Template.instance();
    const s3 = cloudConfigFromSettings(tpl, 's3');
    const azure = cloudConfigFromSettings(tpl, 'azure');
    const gcs = cloudConfigFromSettings(tpl, 'gcs');
    return {
      s3: {
        endpoint: s3.endpoint || '',
        region: s3.region || '',
        bucket: s3.bucket || '',
        accessKeyId: s3.accessKeyId || '',
        forcePathStyle: s3.forcePathStyle !== false,
      },
      azure: {
        accountName: azure.accountName || '',
        bucket: azure.bucket || '',
      },
      gcs: {
        projectId: gcs.projectId || '',
        bucket: gcs.bucket || '',
        keyFilename: gcs.keyFilename || '',
      },
    };
  },
  cloudSecretPlaceholder() {
    const tpl = Template.instance();
    const ph = (cfg, field) => (cfg[`${field}Set`]
      ? TAPi18n.__('cloud-secret-set')
      : TAPi18n.__('cloud-secret-none'));
    const s3 = cloudConfigFromSettings(tpl, 's3');
    const azure = cloudConfigFromSettings(tpl, 'azure');
    const gcs = cloudConfigFromSettings(tpl, 'gcs');
    return {
      s3: { secretAccessKey: ph(s3, 'secretAccessKey') },
      azure: { accountKey: ph(azure, 'accountKey'), connectionString: ph(azure, 'connectionString') },
      gcs: { credentials: ph(gcs, 'credentials') },
    };
  },
  cloudTestResult() {
    return Template.instance().cloudTestResults.get();
  },
  cloudTestError() {
    return Template.instance().cloudTestErrors.get();
  },
  isGridFsActive() {
    return Template.instance().activeSection.get() === 'gridfs';
  },
  isFilesystemActive() {
    return Template.instance().activeSection.get() === 'filesystem';
  },
  isS3Active() {
    return Template.instance().activeSection.get() === 's3';
  },
  // #6473: these paths come from the getAttachmentStoragePaths server method —
  // WRITABLE_PATH is a server-side environment variable, so reading
  // process.env here in the browser always produced the misleading "/data".
  filesystemPath() {
    const paths = Template.instance().storagePaths.get();
    return paths ? paths.writablePath : '';
  },
  attachmentsPath() {
    const paths = Template.instance().storagePaths.get();
    return paths ? paths.attachments : '';
  },
  avatarsPath() {
    const paths = Template.instance().storagePaths.get();
    return paths ? paths.avatars : '';
  },
  filesystemEnabled() {
    const tpl = Template.instance();
    const settings = tpl.attachmentStorageSettings.get();
    if (settings?.storageConfig?.filesystem) {
      return settings.storageConfig.filesystem.enabled !== false;
    }
    return true;
  },
  filesystemRead() {
    const settings = Template.instance().attachmentStorageSettings.get();
    return settings?.storageConfig?.filesystem?.read !== false;
  },
  gridfsEnabled() {
    const tpl = Template.instance();
    const settings = tpl.attachmentStorageSettings.get();
    if (settings?.storageConfig?.gridfs) {
      return settings.storageConfig.gridfs.enabled !== false;
    }
    return process.env.GRIDFS_ENABLED === 'true';
  },
  gridfsRead() {
    const settings = Template.instance().attachmentStorageSettings.get();
    return settings?.storageConfig?.gridfs?.read !== false;
  },
  s3Read() {
    return process.env.S3_ENABLED === 'true';
  },
  compactLoading() {
    return Template.instance().compactLoading.get();
  },
  compactResult() {
    return Template.instance().compactResult.get();
  },
  compactError() {
    return Template.instance().compactError.get();
  },
  compactResultItems() {
    const result = Template.instance().compactResult.get();
    if (!result) return [];
    const items = [];
    for (const [node, nodeData] of Object.entries(result)) {
      if (nodeData && typeof nodeData === 'object') {
        for (const [collName, status] of Object.entries(nodeData)) {
          items.push({ name: `[${node}] ${collName}`, status });
        }
      } else {
        items.push({ name: node, status: String(nodeData) });
      }
    }
    return items;
  },
  hasGridFsStats() {
    return !!Template.instance().gridFsStats.get();
  },
  gridFsStats() {
    return Template.instance().gridFsStats.get();
  },
  gridFsStatsLoading() {
    return Template.instance().gridFsStatsLoading.get();
  },
  gridFsStatsError() {
    return Template.instance().gridFsStatsError.get();
  },
  hasFilesystemStats() {
    return !!Template.instance().filesystemStats.get();
  },
  filesystemStats() {
    return Template.instance().filesystemStats.get();
  },
  filesystemStatsLoading() {
    return Template.instance().filesystemStatsLoading.get();
  },
  filesystemStatsError() {
    return Template.instance().filesystemStatsError.get();
  },
  hasS3Stats() {
    return !!Template.instance().s3Stats.get();
  },
  s3Stats() {
    return Template.instance().s3Stats.get();
  },
  s3StatsLoading() {
    return Template.instance().s3StatsLoading.get();
  },
  s3StatsError() {
    return Template.instance().s3StatsError.get();
  },
  hasAzureStats() {
    return !!Template.instance().azureStats.get();
  },
  azureStats() {
    return Template.instance().azureStats.get();
  },
  azureStatsLoading() {
    return Template.instance().azureStatsLoading.get();
  },
  azureStatsError() {
    return Template.instance().azureStatsError.get();
  },
  hasGcsStats() {
    return !!Template.instance().gcsStats.get();
  },
  gcsStats() {
    return Template.instance().gcsStats.get();
  },
  gcsStatsLoading() {
    return Template.instance().gcsStatsLoading.get();
  },
  gcsStatsError() {
    return Template.instance().gcsStatsError.get();
  },
  s3Enabled() {
    return process.env.S3_ENABLED === 'true';
  },
  s3Endpoint() {
    return process.env.S3_ENDPOINT || '';
  },
  s3Bucket() {
    return process.env.S3_BUCKET || '';
  },
  s3Region() {
    return process.env.S3_REGION || '';
  },
  s3SslEnabled() {
    return process.env.S3_SSL_ENABLED === 'true';
  },
  s3Port() {
    return process.env.S3_PORT || 443;
  },
  attachmentTransferLimitValue(fieldName) {
    const tpl = Template.instance();
    const settingsDoc = tpl.attachmentStorageSettings.get();
    const units = tpl.attachmentLimitUnits.get() || {};
    const limits = normalizeLimitSettings(settingsDoc);
    const unit = units[fieldName] || 'bytes';
    return toDisplayValue(limits[fieldName], unit);
  },
  attachmentTransferLimitUnitOptions(fieldName) {
    const tpl = Template.instance();
    const units = tpl.attachmentLimitUnits.get() || {};
    const selectedUnit = units[fieldName] || 'bytes';
    return getLimitUnitOptions(selectedUnit);
  },
  attachmentTransferLimitModeOptions(fieldName) {
    const tpl = Template.instance();
    const modeMap = tpl.attachmentLimitModes.get() || {};
    return getLimitModeOptions(modeMap[fieldName] || LIMIT_MODES.UNLIMITED);
  },
  isAttachmentLimitMode(fieldName, expectedMode) {
    const tpl = Template.instance();
    const modeMap = tpl.attachmentLimitModes.get() || {};
    return modeMap[fieldName] === expectedMode;
  },
});

Template.attachments.events({
  'click a.js-attachments-menu'(event, tpl) {
    event.preventDefault();
    const target = $(event.currentTarget);
    const targetID = target.data('id');
    if (!targetID) {
      return;
    }

    tpl.activeSection.set(targetID);
  },
  'click .js-sandstorm-delete-raw-mongodb'(event, tpl) {
    event.preventDefault();
    if (!window.confirm(TAPi18n.__('sandstorm-delete-raw-mongodb-confirm'))) {
      return;
    }
    tpl.sandstormDeleteError.set('');
    Meteor.call('sandstormDeleteRawMongo', (error, result) => {
      if (error) {
        tpl.sandstormDeleteError.set(error.reason || error.message);
        return;
      }
      tpl.sandstormDeleteResult.set(result);
      // Refresh disk usage / status after deletion.
      Meteor.call('sandstormMigrationStatus', (err, res) => {
        if (!err && res) tpl.sandstormStatus.set(res);
      });
    });
  },
  'click .js-migrate-to-ferretdb'(event, tpl) {
    event.preventDefault();
    startDbMigration(tpl, 'toFerretDB');
  },
  'click .js-migrate-to-mongodb'(event, tpl) {
    event.preventDefault();
    startDbMigration(tpl, 'toMongoDB');
  },
  'click .js-run-backup'(event, tpl) {
    event.preventDefault();
    const opts = {
      attachments: tpl.$('.js-backup-attachments').is(':checked'),
      avatars: tpl.$('.js-backup-avatars').is(':checked'),
      data: tpl.$('.js-backup-data').is(':checked'),
    };
    const storage = tpl.$('.js-backup-storage').val() || 'filesystem';
    tpl.backupStatus.set({ running: true, phase: 'starting' });
    Meteor.call('runBackup', opts, storage, error => {
      if (error) tpl.backupStatus.set({ phase: 'error', error: error.reason || error.message, success: false });
      else pollBackupStatus(tpl);
    });
  },
  'click .js-save-backup-schedule'(event, tpl) {
    event.preventDefault();
    const schedule = {
      enabled: (tpl.$('.js-backup-frequency').val() || 'off') !== 'off',
      frequency: tpl.$('.js-backup-frequency').val() || 'off',
      time: tpl.$('.js-backup-time').val() || '04:00',
      dayOfWeek: tpl.$('.js-backup-dow').val() || 'Sunday',
      dayOfMonth: parseInt(tpl.$('.js-backup-dom').val(), 10) || 1,
      attachments: tpl.$('.js-backup-attachments').is(':checked'),
      avatars: tpl.$('.js-backup-avatars').is(':checked'),
      data: tpl.$('.js-backup-data').is(':checked'),
      storage: tpl.$('.js-backup-storage').val() || 'filesystem',
    };
    Meteor.call('saveBackupSchedule', schedule, (error, saved) => {
      if (!error && saved) tpl.backupSchedule.set(saved);
    });
  },
  'click .js-list-backups'(event, tpl) {
    event.preventDefault();
    Meteor.call('listBackups', (error, list) => {
      if (!error) tpl.backupList.set(list || []);
    });
  },
  'change .js-backup-select'(event, tpl) {
    tpl.selectedBackup.set($(event.currentTarget).val());
  },
  'click .js-restore-backup'(event, tpl) {
    event.preventDefault();
    const zipPath = tpl.selectedBackup.get();
    if (!zipPath) { window.alert(TAPi18n.__('backup-restore-select-first')); return; }
    const mode = tpl.$('.js-restore-mode').val() || 'add-missing';
    if (!window.confirm(TAPi18n.__('backup-restore-confirm'))) return;
    tpl.backupStatus.set({ running: true, phase: 'restore' });
    Meteor.call('restoreBackup', zipPath, mode, error => {
      if (error) tpl.backupStatus.set({ phase: 'error', error: error.reason || error.message, success: false });
      else pollBackupStatus(tpl);
    });
  },
  'change select.js-attachment-limit-unit'(event, tpl) {
    const fieldName = event.currentTarget.dataset.field;
    const selectedUnit = event.currentTarget.value;
    if (!fieldName || !selectedUnit) {
      return;
    }

    const current = tpl.attachmentLimitUnits.get() || {};
    tpl.attachmentLimitUnits.set({
      ...current,
      [fieldName]: selectedUnit,
    });
  },
  'change select.js-attachment-limit-mode'(event, tpl) {
    const fieldName = event.currentTarget.dataset.field;
    const selectedMode = event.currentTarget.value;
    if (!fieldName) {
      return;
    }

    const current = tpl.attachmentLimitModes.get() || {};
    tpl.attachmentLimitModes.set({
      ...current,
      [fieldName]: selectedMode,
    });
  },
  'click button.js-save-attachment-transfer-limits'(event, tpl) {
    event.preventDefault();

    const currentSettings = tpl.attachmentStorageSettings.get();
    if (!currentSettings) {
      alert(TAPi18n.__('attachment-transfer-limits-save-failed'));
      return;
    }

    const currentUnits = tpl.attachmentLimitUnits.get() || {};
    const modeMap = tpl.attachmentLimitModes.get() || {};
    const fieldConfig = [
      { fieldName: 'attachmentsUploadMaxBytes', inputId: '#attachments-upload-limit-value' },
      { fieldName: 'attachmentsDownloadMaxBytes', inputId: '#attachments-download-limit-value' },
      { fieldName: 'apiUploadMaxBytes', inputId: '#api-upload-limit-value' },
      { fieldName: 'apiDownloadMaxBytes', inputId: '#api-download-limit-value' },
    ];

    const nextLimitSettings = {};
    for (const field of fieldConfig) {
      const selectedMode = modeMap[field.fieldName] || LIMIT_MODES.UNLIMITED;
      const blockedFieldName = getBlockedFieldName(field.fieldName);

      if (selectedMode === LIMIT_MODES.BLOCKED) {
        if (blockedFieldName) {
          nextLimitSettings[blockedFieldName] = true;
        }
        nextLimitSettings[field.fieldName] = 0;
        continue;
      }

      if (blockedFieldName) {
        nextLimitSettings[blockedFieldName] = false;
      }

      if (selectedMode === LIMIT_MODES.UNLIMITED) {
        nextLimitSettings[field.fieldName] = 0;
        continue;
      }

      const unit = currentUnits[field.fieldName] || 'bytes';
      const value = $(field.inputId).val();
      const bytesValue = toBytes(value, unit);
      if (bytesValue === null || bytesValue <= 0) {
        alert(TAPi18n.__('attachment-transfer-limits-invalid-value'));
        return;
      }
      nextLimitSettings[field.fieldName] = bytesValue;
    }

    // Avatar uploads are a simple on/off block (no size mode). Default off so
    // avatars stay enabled unless an admin explicitly blocks them.
    nextLimitSettings.avatarsUploadBlocked = tpl.$('.js-avatars-upload-blocked').is(':checked');

    const nextSettings = {
      ...currentSettings,
      uploadSettings: {
        ...(currentSettings.uploadSettings || {}),
        maxFileSize: nextLimitSettings.attachmentsUploadMaxBytes,
      },
      limitSettings: {
        ...(currentSettings.limitSettings || {}),
        ...nextLimitSettings,
      },
    };

    Meteor.call('updateAttachmentStorageSettings', nextSettings, (error) => {
      if (error) {
        alert(`${TAPi18n.__('attachment-transfer-limits-save-failed')}: ${error.reason || error.message}`);
        return;
      }

      alert(TAPi18n.__('attachment-transfer-limits-saved'));
      refreshAttachmentStorageSettings(tpl);
    });
  },
  'change input.js-toggle-filesystem-read'(event, tpl) {
    updateStorageConfigField(tpl, 'filesystem', 'read', event.currentTarget.checked, event.currentTarget);
  },
  'change input.js-toggle-gridfs-read'(event, tpl) {
    updateStorageConfigField(tpl, 'gridfs', 'read', event.currentTarget.checked, event.currentTarget);
  },
  'click button.js-save-default-storage'(event, tpl) {
    event.preventDefault();
    const storageName = tpl.$('.js-default-save-storage').val();
    if (!storageName) return;
    Meteor.call('setDefaultAttachmentStorage', storageName, (error) => {
      if (error) {
        alert(`${TAPi18n.__('default-save-storage-save-failed')}: ${error.reason || error.message}`);
        return;
      }
      alert(TAPi18n.__('default-save-storage-saved'));
      refreshAttachmentStorageSettings(tpl);
    });
  },
  'click button.js-save-cloud-settings'(event, tpl) {
    event.preventDefault();
    const provider = event.currentTarget.dataset.provider;
    if (!provider) return;
    const cfg = gatherCloudConfig(tpl, provider);
    // Send only this provider's config; the server merges it over the stored
    // settings and preserves secrets left blank as well as the other providers.
    const nextSettings = { storageConfig: { [provider]: cfg } };
    Meteor.call('updateAttachmentStorageSettings', nextSettings, (error) => {
      if (error) {
        alert(`${TAPi18n.__('cloud-settings-save-failed')}: ${error.reason || error.message}`);
        return;
      }
      alert(TAPi18n.__('cloud-settings-saved'));
      refreshAttachmentStorageSettings(tpl);
    });
  },
  'click button.js-test-cloud-connection'(event, tpl) {
    event.preventDefault();
    const provider = event.currentTarget.dataset.provider;
    if (!provider) return;
    const cfg = gatherCloudConfig(tpl, provider);
    Meteor.call('testAttachmentCloudConnection', provider, cfg, (error, result) => {
      const results = { ...tpl.cloudTestResults.get() };
      const errors = { ...tpl.cloudTestErrors.get() };
      if (error) {
        results[provider] = false;
        errors[provider] = error.reason || error.message;
      } else if (result && result.ok) {
        results[provider] = true;
        errors[provider] = '';
      } else {
        results[provider] = false;
        errors[provider] = (result && result.error) || 'failed';
      }
      tpl.cloudTestResults.set(results);
      tpl.cloudTestErrors.set(errors);
    });
  },
  'click button.js-calculate-gridfs-stats'(event, tpl) {
    event.preventDefault();
    tpl.gridFsStatsLoading.set(true);
    tpl.gridFsStatsError.set('');
    Meteor.call('getGridFsStorageStats', (error, result) => {
      tpl.gridFsStatsLoading.set(false);
      if (error) {
        tpl.gridFsStats.set(null);
        tpl.gridFsStatsError.set(error.reason || error.message || 'Failed to calculate counts');
        return;
      }
      tpl.gridFsStats.set(result || null);
    });
  },
  'click button.js-calculate-filesystem-stats'(event, tpl) {
    event.preventDefault();
    tpl.filesystemStatsLoading.set(true);
    tpl.filesystemStatsError.set('');
    Meteor.call('getFilesystemStorageStats', (error, result) => {
      tpl.filesystemStatsLoading.set(false);
      if (error) {
        tpl.filesystemStats.set(null);
        tpl.filesystemStatsError.set(error.reason || error.message || 'Failed to calculate counts');
        return;
      }
      tpl.filesystemStats.set(result || null);
    });
  },
  'click button.js-calculate-s3-stats'(event, tpl) {
    event.preventDefault();
    tpl.s3StatsLoading.set(true);
    tpl.s3StatsError.set('');
    Meteor.call('getS3StorageStats', (error, result) => {
      tpl.s3StatsLoading.set(false);
      if (error) {
        tpl.s3Stats.set(null);
        tpl.s3StatsError.set(error.reason || error.message || 'Failed to calculate counts');
        return;
      }
      tpl.s3Stats.set(result || null);
    });
  },
  'click button.js-calculate-azure-stats'(event, tpl) {
    event.preventDefault();
    tpl.azureStatsLoading.set(true);
    tpl.azureStatsError.set('');
    Meteor.call('getAzureStorageStats', (error, result) => {
      tpl.azureStatsLoading.set(false);
      if (error) {
        tpl.azureStats.set(null);
        tpl.azureStatsError.set(error.reason || error.message || 'Failed to calculate counts');
        return;
      }
      tpl.azureStats.set(result || null);
    });
  },
  'click button.js-calculate-gcs-stats'(event, tpl) {
    event.preventDefault();
    tpl.gcsStatsLoading.set(true);
    tpl.gcsStatsError.set('');
    Meteor.call('getGcsStorageStats', (error, result) => {
      tpl.gcsStatsLoading.set(false);
      if (error) {
        tpl.gcsStats.set(null);
        tpl.gcsStatsError.set(error.reason || error.message || 'Failed to calculate counts');
        return;
      }
      tpl.gcsStats.set(result || null);
    });
  },
  'click button.js-compact-mongodb-gridfs'(event, tpl) {
    event.preventDefault();
    runCompact(tpl.compactLoading, tpl.compactResult, tpl.compactError);
  },
});

Template.moveAttachments.onCreated(function () {
  // The bulk move runs as a server-side background job; subscribe to its
  // persisted progress so it keeps running (and stays visible) even if the
  // admin navigates away from or closes this page.
  this.bulkMoveSubscription = Meteor.subscribe('attachmentBulkMoveStatus');
  this.repairLoading = new ReactiveVar(false);
  this.repairResult = new ReactiveVar(null);
  this.repairError = new ReactiveVar('');
});

function getBulkMoveProgress() {
  const doc = AttachmentBulkMoveStatus.findOne('bulk');
  return doc && doc.running ? doc : null;
}

function getLastMove() {
  const doc = AttachmentBulkMoveStatus.findOne('bulk');
  // Don't show the "last move" line while a move is actively running.
  if (!doc || doc.running || !doc.lastMove) return null;
  return doc.lastMove;
}

function storageLabel(value) {
  return value ? TAPi18n.__(`move-storage-${value}`) : '';
}

function scopeLabel(value) {
  return value ? TAPi18n.__(`move-scope-${value}`) : '';
}

// Format a Date (or value) as YYYY-MM-DD HH:MM:SS in local time.
function formatDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '';
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

Template.moveAttachments.helpers({
  moveProgress() {
    return getBulkMoveProgress();
  },
  moveProgressPaused() {
    return getBulkMoveProgress()?.paused === true;
  },
  moveProgressBarStyle() {
    const p = getBulkMoveProgress();
    const pct = p && p.total ? Math.round((p.done / p.total) * 100) : 0;
    return `width: ${pct}%`;
  },
  moveProgressSize() {
    const p = getBulkMoveProgress();
    return p?.size ? filesize(p.size) : '';
  },
  lastMove() {
    return getLastMove();
  },
  lastMoveText() {
    const lm = getLastMove();
    if (!lm) return '';
    const cancelled = lm.cancelled ? ` (${TAPi18n.__('move-progress-cancel')})` : '';
    return `${storageLabel(lm.source)} → ${storageLabel(lm.dest)} ` +
      `(${scopeLabel(lm.scope)}) ${formatDateTime(lm.at)}${cancelled}`;
  },
  repairLoading() {
    return Template.instance().repairLoading.get();
  },
  repairResult() {
    return Template.instance().repairResult.get();
  },
  repairError() {
    return Template.instance().repairError.get();
  },
});

function runCompact(loadingVar, resultVar, errorVar) {
  loadingVar.set(true);
  resultVar.set(null);
  errorVar.set('');
  Meteor.call('compactMongoGridFs', (error, result) => {
    loadingVar.set(false);
    if (error) {
      errorVar.set(error.reason || error.message || 'Compact failed');
      return;
    }
    resultVar.set(result || {});
  });
}

Template.moveAttachments.events({
  'click button.js-move-all-attachments'(event, tpl) {
    if (getBulkMoveProgress()) return;
    const scope = tpl.$('.js-move-scope').val() || 'attachments';
    const source = tpl.$('.js-move-source-storage').val();
    const dest = tpl.$('.js-move-dest-storage').val();
    // 'all' reads from every Read-enabled storage, so it may equal nothing; only
    // a specific source must differ from the destination.
    if (!source || !dest || (source !== 'all' && source === dest)) return;
    // Hand the whole job to the server so the transfer keeps running as a
    // background process even if this page is left or closed.
    Meteor.call('startBulkAttachmentMove', source, dest, scope, (error, result) => {
      if (error) {
        if (error.error !== 'bulk-move-already-running') {
          alert(error.reason || error.message);
        }
        return;
      }
      // No progress bar appears when nothing matches the source, so tell the
      // admin instead of silently doing nothing.
      if (result && result.total === 0) {
        alert(TAPi18n.__('move-attachments-none-found'));
      }
    });
  },
  'click button.js-repair-attachment-locations'(event, tpl) {
    if (tpl.repairLoading.get()) return;
    tpl.repairLoading.set(true);
    tpl.repairResult.set(null);
    tpl.repairError.set('');
    Meteor.call('repairAttachmentStorageLocations', (error, result) => {
      tpl.repairLoading.set(false);
      if (error) {
        tpl.repairError.set(error.reason || error.message || 'Repair failed');
        return;
      }
      tpl.repairResult.set(result || {});
    });
  },
  'click button.js-pause-move'() {
    Meteor.call('pauseBulkAttachmentMove');
  },
  'click button.js-resume-move'() {
    Meteor.call('resumeBulkAttachmentMove');
  },
  'click button.js-cancel-move'() {
    Meteor.call('cancelBulkAttachmentMove');
  },
});
