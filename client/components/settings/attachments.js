import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { groupBy } from '/imports/lib/collectionHelpers';
import Attachments from '/models/attachments';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { TAPi18n } from '/imports/i18n';
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
  filesystemWrite() {
    const settings = Template.instance().attachmentStorageSettings.get();
    return settings?.storageConfig?.filesystem?.write !== false;
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
  gridfsWrite() {
    const settings = Template.instance().attachmentStorageSettings.get();
    return settings?.storageConfig?.gridfs?.write !== false;
  },
  s3Read() {
    return process.env.S3_ENABLED === 'true';
  },
  s3Write() {
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
  'change input.js-toggle-filesystem-write'(event, tpl) {
    updateStorageConfigField(tpl, 'filesystem', 'write', event.currentTarget.checked, event.currentTarget);
  },
  'change input.js-toggle-gridfs-read'(event, tpl) {
    updateStorageConfigField(tpl, 'gridfs', 'read', event.currentTarget.checked, event.currentTarget);
  },
  'change input.js-toggle-gridfs-write'(event, tpl) {
    updateStorageConfigField(tpl, 'gridfs', 'write', event.currentTarget.checked, event.currentTarget);
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
  this.moveProgressData = new ReactiveVar(null);
  this._moveController = null;
  this.moveCompactLoading = new ReactiveVar(false);
  this.moveCompactResult = new ReactiveVar(null);
  this.moveCompactError = new ReactiveVar('');
});

Template.moveAttachments.helpers({
  moveCompactLoading() {
    return Template.instance().moveCompactLoading.get();
  },
  moveCompactResult() {
    return Template.instance().moveCompactResult.get();
  },
  moveCompactError() {
    return Template.instance().moveCompactError.get();
  },
  moveCompactResultItems() {
    const result = Template.instance().moveCompactResult.get();
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
  moveProgress() {
    return Template.instance().moveProgressData.get();
  },
  moveProgressPaused() {
    return Template.instance().moveProgressData.get()?.paused === true;
  },
  moveProgressBarStyle() {
    const p = Template.instance().moveProgressData.get();
    const pct = p && p.total ? Math.round((p.done / p.total) * 100) : 0;
    return `width: ${pct}%`;
  },
  moveProgressSize() {
    const p = Template.instance().moveProgressData.get();
    return p?.size ? filesize(p.size) : '';
  },
  getBoardsWithAttachments() {
    const tpl = Template.instance();
    tpl.attachments = ReactiveCache.getAttachments();
    const attachmentsByBoardId = groupBy(tpl.attachments, fileObj => fileObj.meta.boardId);

    const ret = Object.keys(attachmentsByBoardId)
      .map(boardId => {
        const boardAttachments = attachmentsByBoardId[boardId];

        boardAttachments.forEach(_attachment => {
          _attachment.flatVersion = Object.keys(_attachment.versions)
            .map(_versionName => {
              const _version = Object.assign(_attachment.versions[_versionName], {"versionName": _versionName});
              // Read storage directly from the document (set by onAfterUpload on server)
              _version.storageName = _version.storage || (
                (_attachment.meta?.source === 'import' || _version.meta?.gridFsFileId) ? 'gridfs' : 'fs'
              );
              return _version;
            });
        });
        const board = ReactiveCache.getBoard(boardId);
        board.attachments = boardAttachments;
        return board;
      })
    return ret;
  },
  getBoardData(boardid) {
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

async function runMoveAll(tpl, attachmentsToMove, destStorage) {
  const total = attachmentsToMove.length;
  const controller = tpl._moveController;

  for (let i = 0; i < total; i++) {
    if (controller.cancelled) break;

    while (controller.paused && !controller.cancelled) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (controller.cancelled) break;

    const att = attachmentsToMove[i];
    tpl.moveProgressData.set({
      total,
      done: i,
      current: i + 1,
      name: att.name || att._id,
      size: att.size || 0,
      paused: false,
    });

    await new Promise(resolve => {
      Meteor.call('moveAttachmentToStorage', att._id, destStorage, () => resolve());
    });
  }

  tpl.moveProgressData.set(null);
  tpl._moveController = null;
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
      default:
        return false;
    }
  });
}

Template.moveAttachments.events({
  'click button.js-move-all-attachments'(event, tpl) {
    if (tpl.moveProgressData.get()) return;
    const source = tpl.$('.js-move-source-storage').val();
    const dest = tpl.$('.js-move-dest-storage').val();
    if (!source || !dest || source === dest) return;
    const destStorage = dest === 'collectionfs' ? 'gridfs' : dest;
    const toMove = (tpl.attachments || []).filter(a => attachmentVersionMatchesSource(a, source));
    if (toMove.length === 0) return;
    tpl._moveController = { paused: false, cancelled: false };
    runMoveAll(tpl, toMove, destStorage);
  },
  'click button.js-pause-move'(event, tpl) {
    if (!tpl._moveController) return;
    tpl._moveController.paused = true;
    const p = tpl.moveProgressData.get();
    if (p) tpl.moveProgressData.set({ ...p, paused: true });
  },
  'click button.js-resume-move'(event, tpl) {
    if (!tpl._moveController) return;
    tpl._moveController.paused = false;
    const p = tpl.moveProgressData.get();
    if (p) tpl.moveProgressData.set({ ...p, paused: false });
  },
  'click button.js-cancel-move'(event, tpl) {
    if (tpl._moveController) {
      tpl._moveController.cancelled = true;
      tpl._moveController.paused = false;
    }
    tpl.moveProgressData.set(null);
    tpl._moveController = null;
  },
  'click button.js-compact-mongodb-move'(event, tpl) {
    event.preventDefault();
    runCompact(tpl.moveCompactLoading, tpl.moveCompactResult, tpl.moveCompactError);
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
});
