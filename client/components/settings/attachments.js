import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { groupBy } from '/imports/lib/collectionHelpers';
import Attachments from '/models/attachments';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
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
      cfg[field] = el.val();
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
  this.attachmentsSubscription = Meteor.subscribe('attachmentsList');
  this.storageSettingsSubscription = Meteor.subscribe('attachmentStorageSettings');
  this.attachmentStorageSettings = new ReactiveVar(null);
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
  this.compactLoading = new ReactiveVar(false);
  this.compactResult = new ReactiveVar(null);
  this.compactError = new ReactiveVar('');
  this.cloudTestResults = new ReactiveVar({});
  this.cloudTestErrors = new ReactiveVar({});
  this.loading = new ReactiveVar(false);

  this.autorun(() => {
    const ready = this.attachmentsSubscription.ready() && this.storageSettingsSubscription.ready();
    if (ready) {
      refreshAttachmentStorageSettings(this);
      this.loading.set(false);
    } else {
      this.loading.set(true);
    }
  });
});

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
  filesystemPath() {
    return process.env.WRITABLE_PATH || '/data';
  },
  attachmentsPath() {
    const writablePath = process.env.WRITABLE_PATH || '/data';
    return `${writablePath}/attachments`;
  },
  avatarsPath() {
    const writablePath = process.env.WRITABLE_PATH || '/data';
    return `${writablePath}/avatars`;
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
  'click button.js-compact-mongodb-gridfs'(event, tpl) {
    event.preventDefault();
    runCompact(tpl.compactLoading, tpl.compactResult, tpl.compactError);
  },
});

Template.moveAttachments.onCreated(function () {
  this.attachments = null;
  // The bulk move runs as a server-side background job; subscribe to its
  // persisted progress so it keeps running (and stays visible) even if the
  // admin navigates away from or closes this page.
  this.bulkMoveSubscription = Meteor.subscribe('attachmentBulkMoveStatus');
});

function getBulkMoveProgress() {
  const doc = AttachmentBulkMoveStatus.findOne('bulk');
  return doc && doc.running ? doc : null;
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
  getBoardsWithAttachments() {
    const tpl = Template.instance();
    tpl.attachments = ReactiveCache.getAttachments();
    const attachmentsByBoardId = groupBy(tpl.attachments, fileObj => fileObj.meta?.boardId);

    const ret = Object.keys(attachmentsByBoardId)
      .map(boardId => {
        const boardAttachments = attachmentsByBoardId[boardId];

        boardAttachments.forEach(_attachment => {
          _attachment.flatVersion = Object.keys(_attachment.versions || {})
            .map(_versionName => {
              const _version = Object.assign(_attachment.versions[_versionName], {"versionName": _versionName});
              // Read storage directly from the document (set by onAfterUpload on server)
              _version.storageName = _version.storage || (
                (_attachment.meta?.source === 'import' || _version.meta?.gridFsFileId) ? 'gridfs' : 'fs'
              );
              return _version;
            });
        });
        // The board may no longer exist (or not be loaded in the cache) for
        // orphaned attachments. Fall back to a placeholder so the move list
        // still renders these attachments instead of throwing.
        const board = ReactiveCache.getBoard(boardId) || {
          _id: boardId,
          title: boardId ? `(${boardId})` : '(no board)',
        };
        board.attachments = boardAttachments;
        return board;
      })
    return ret;
  },
  getBoardData(boardId) {
    const ret = ReactiveCache.getBoard(boardId);
    return ret;
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

function attachmentVersionMatchesSource(attachment, source) {
  const versions = Object.values(attachment.versions || {});
  return versions.some(v => {
    switch (source) {
      case 'collectionfs':
        return !!(v.meta?.gridFsFileId);
      case 'gridfs':
        return v.storage === 'gridfs' && !v.meta?.gridFsFileId;
      case 'fs':
        return v.storage === 'fs' || (!v.storage && !v.meta?.gridFsFileId);
      case 's3':
        return v.storage === 's3';
      case 'azure':
        return v.storage === 'azure';
      case 'gcs':
        return v.storage === 'gcs';
      default:
        return false;
    }
  });
}

Template.moveAttachments.events({
  'click button.js-move-all-attachments'(event, tpl) {
    if (getBulkMoveProgress()) return;
    const source = tpl.$('.js-move-source-storage').val();
    const dest = tpl.$('.js-move-dest-storage').val();
    if (!source || !dest || source === dest) return;
    // Hand the whole job to the server so the transfer keeps running as a
    // background process even if this page is left or closed.
    Meteor.call('startBulkAttachmentMove', source, dest, (error) => {
      if (error && error.error !== 'bulk-move-already-running') {
        alert(error.reason || error.message);
      }
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

Template.moveBoardAttachments.events({
  'click button.js-move-all-attachments-of-board'(event, tpl) {
    const source = tpl.$('.js-move-board-source-storage').val();
    const dest = tpl.$('.js-move-board-dest-storage').val();
    if (!source || !dest || source === dest) return;
    const destStorage = dest === 'collectionfs' ? 'gridfs' : dest;
    const data = Template.currentData();
    (data.attachments || []).forEach(_attachment => {
      if (attachmentVersionMatchesSource(_attachment, source)) {
        Meteor.call('moveAttachmentToStorage', _attachment._id, destStorage);
      }
    });
  },
});

Template.moveAttachment.helpers({
  fileSize(size) {
    const ret = filesize(size);
    return ret;
  },
});

Template.moveAttachment.events({
  'click button.js-move-storage-fs'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "fs");
  },
  'click button.js-move-storage-gridfs'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "gridfs");
  },
  'click button.js-move-storage-s3'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "s3");
  },
  'click button.js-move-storage-azure'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "azure");
  },
  'click button.js-move-storage-gcs'() {
    const data = Template.currentData();
    Meteor.call('moveAttachmentToStorage', data._id, "gcs");
  },
});
