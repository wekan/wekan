import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

// Template helpers for attachmentSettings
Template.attachmentSettings.helpers({
  loading() {
    const instance = Template.instance();
    if (instance && instance.loading) {
      return instance.loading.get();
    }
    return attachmentSettings.loading.get();
  },
  showStorageSettings() {
    const instance = Template.instance();
    if (instance && instance.showStorageSettings) {
      return instance.showStorageSettings.get();
    }
    return attachmentSettings.showStorageSettings.get();
  },
  showMigration() {
    const instance = Template.instance();
    if (instance && instance.showMigration) {
      return instance.showMigration.get();
    }
    return attachmentSettings.showMigration.get();
  },
  showMonitoring() {
    const instance = Template.instance();
    if (instance && instance.showMonitoring) {
      return instance.showMonitoring.get();
    }
    return attachmentSettings.showMonitoring.get();
  }
});
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { Chart } from 'chart.js';

// Global reactive variables for attachment settings
const attachmentSettings = {
  loading: new ReactiveVar(false),
  showStorageSettings: new ReactiveVar(false),
  showMigration: new ReactiveVar(false),
  showMonitoring: new ReactiveVar(false),
  
  // Storage configuration
  filesystemPath: new ReactiveVar(''),
  attachmentsPath: new ReactiveVar(''),
  avatarsPath: new ReactiveVar(''),
  gridfsEnabled: new ReactiveVar(false),
  s3Enabled: new ReactiveVar(false),
  s3Endpoint: new ReactiveVar(''),
  s3Bucket: new ReactiveVar(''),
  s3Region: new ReactiveVar(''),
  s3SslEnabled: new ReactiveVar(false),
  s3Port: new ReactiveVar(443),
  
  // Migration settings
  migrationBatchSize: new ReactiveVar(10),
  migrationDelayMs: new ReactiveVar(1000),
  migrationCpuThreshold: new ReactiveVar(70),
  migrationProgress: new ReactiveVar(0),
  migrationStatus: new ReactiveVar('idle'),
  migrationLog: new ReactiveVar(''),
  
  // Monitoring data
  totalAttachments: new ReactiveVar(0),
  filesystemAttachments: new ReactiveVar(0),
  gridfsAttachments: new ReactiveVar(0),
  s3Attachments: new ReactiveVar(0),
  totalSize: new ReactiveVar(0),
  filesystemSize: new ReactiveVar(0),
  gridfsSize: new ReactiveVar(0),
  s3Size: new ReactiveVar(0),
  
  // Migration state
  isMigrationRunning: new ReactiveVar(false),
  isMigrationPaused: new ReactiveVar(false),
  migrationQueue: new ReactiveVar([]),
  currentMigration: new ReactiveVar(null)
};

// Main attachment settings component
BlazeComponent.extendComponent({
  onCreated() {
    this.loading = attachmentSettings.loading;
    this.showStorageSettings = attachmentSettings.showStorageSettings;
    this.showMigration = attachmentSettings.showMigration;
    this.showMonitoring = attachmentSettings.showMonitoring;
    
    // Set default sub-menu state
    this.showStorageSettings.set(true);
    this.showMigration.set(false);
    this.showMonitoring.set(false);
    
    // Load initial data
    this.loadStorageConfiguration();
    this.loadMigrationSettings();
    this.loadMonitoringData();
  },

  events() {
    return [
      {
        'click a.js-attachment-storage-settings': this.switchToStorageSettings,
        'click a.js-attachment-migration': this.switchToMigration,
        'click a.js-attachment-monitoring': this.switchToMonitoring,
      }
    ];
  },

  switchToStorageSettings(event) {
    this.switchMenu(event, 'storage-settings');
    this.showStorageSettings.set(true);
    this.showMigration.set(false);
    this.showMonitoring.set(false);
  },

  switchToMigration(event) {
    this.switchMenu(event, 'attachment-migration');
    this.showStorageSettings.set(false);
    this.showMigration.set(true);
    this.showMonitoring.set(false);
  },

  switchToMonitoring(event) {
    this.switchMenu(event, 'attachment-monitoring');
    this.showStorageSettings.set(false);
    this.showMigration.set(false);
    this.showMonitoring.set(true);
  },

  switchMenu(event, targetId) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      this.loading.set(true);
      
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      
      // Load data based on target
      if (targetId === 'storage-settings') {
        this.loadStorageConfiguration();
      } else if (targetId === 'attachment-migration') {
        this.loadMigrationSettings();
      } else if (targetId === 'attachment-monitoring') {
        this.loadMonitoringData();
      }
      
      this.loading.set(false);
    }
  },

  loadStorageConfiguration() {
    Meteor.call('getAttachmentStorageConfiguration', (error, result) => {
      if (!error && result) {
        attachmentSettings.filesystemPath.set(result.filesystemPath || '');
        attachmentSettings.attachmentsPath.set(result.attachmentsPath || '');
        attachmentSettings.avatarsPath.set(result.avatarsPath || '');
        attachmentSettings.gridfsEnabled.set(result.gridfsEnabled || false);
        attachmentSettings.s3Enabled.set(result.s3Enabled || false);
        attachmentSettings.s3Endpoint.set(result.s3Endpoint || '');
        attachmentSettings.s3Bucket.set(result.s3Bucket || '');
        attachmentSettings.s3Region.set(result.s3Region || '');
        attachmentSettings.s3SslEnabled.set(result.s3SslEnabled || false);
        attachmentSettings.s3Port.set(result.s3Port || 443);
      }
    });
  },

  loadMigrationSettings() {
    Meteor.call('getAttachmentMigrationSettings', (error, result) => {
      if (!error && result) {
        attachmentSettings.migrationBatchSize.set(result.batchSize || 10);
        attachmentSettings.migrationDelayMs.set(result.delayMs || 1000);
        attachmentSettings.migrationCpuThreshold.set(result.cpuThreshold || 70);
        attachmentSettings.migrationStatus.set(result.status || 'idle');
        attachmentSettings.migrationProgress.set(result.progress || 0);
      }
    });
  },

  loadMonitoringData() {
    Meteor.call('getAttachmentMonitoringData', (error, result) => {
      if (!error && result) {
        attachmentSettings.totalAttachments.set(result.totalAttachments || 0);
        attachmentSettings.filesystemAttachments.set(result.filesystemAttachments || 0);
        attachmentSettings.gridfsAttachments.set(result.gridfsAttachments || 0);
        attachmentSettings.s3Attachments.set(result.s3Attachments || 0);
        attachmentSettings.totalSize.set(result.totalSize || 0);
        attachmentSettings.filesystemSize.set(result.filesystemSize || 0);
        attachmentSettings.gridfsSize.set(result.gridfsSize || 0);
        attachmentSettings.s3Size.set(result.s3Size || 0);
      }
    });
  }
}).register('attachmentSettings');

// Storage settings component
BlazeComponent.extendComponent({
  onCreated() {
    this.filesystemPath = attachmentSettings.filesystemPath;
    this.attachmentsPath = attachmentSettings.attachmentsPath;
    this.avatarsPath = attachmentSettings.avatarsPath;
    this.gridfsEnabled = attachmentSettings.gridfsEnabled;
    this.s3Enabled = attachmentSettings.s3Enabled;
    this.s3Endpoint = attachmentSettings.s3Endpoint;
    this.s3Bucket = attachmentSettings.s3Bucket;
    this.s3Region = attachmentSettings.s3Region;
    this.s3SslEnabled = attachmentSettings.s3SslEnabled;
    this.s3Port = attachmentSettings.s3Port;
  },

  events() {
    return [
      {
        'click button.js-test-s3-connection': this.testS3Connection,
        'click button.js-save-s3-settings': this.saveS3Settings,
        'change input#s3-secret-key': this.updateS3SecretKey
      }
    ];
  },

  testS3Connection() {
    const secretKey = $('#s3-secret-key').val();
    if (!secretKey) {
      alert(TAPi18n.__('s3-secret-key-required'));
      return;
    }

    Meteor.call('testS3Connection', { secretKey }, (error, result) => {
      if (error) {
        alert(TAPi18n.__('s3-connection-failed') + ': ' + error.reason);
      } else {
        alert(TAPi18n.__('s3-connection-success'));
      }
    });
  },

  saveS3Settings() {
    const secretKey = $('#s3-secret-key').val();
    if (!secretKey) {
      alert(TAPi18n.__('s3-secret-key-required'));
      return;
    }

    Meteor.call('saveS3Settings', { secretKey }, (error, result) => {
      if (error) {
        alert(TAPi18n.__('s3-settings-save-failed') + ': ' + error.reason);
      } else {
        alert(TAPi18n.__('s3-settings-saved'));
        $('#s3-secret-key').val(''); // Clear the password field
      }
    });
  },

  updateS3SecretKey(event) {
    // This method can be used to validate the secret key format
    const secretKey = event.target.value;
    // Add validation logic here if needed
  }
}).register('storageSettings');

// Migration component
BlazeComponent.extendComponent({
  onCreated() {
    this.migrationBatchSize = attachmentSettings.migrationBatchSize;
    this.migrationDelayMs = attachmentSettings.migrationDelayMs;
    this.migrationCpuThreshold = attachmentSettings.migrationCpuThreshold;
    this.migrationProgress = attachmentSettings.migrationProgress;
    this.migrationStatus = attachmentSettings.migrationStatus;
    this.migrationLog = attachmentSettings.migrationLog;
    this.isMigrationRunning = attachmentSettings.isMigrationRunning;
    this.isMigrationPaused = attachmentSettings.isMigrationPaused;
    
    // Subscribe to migration updates
    this.subscription = Meteor.subscribe('attachmentMigrationStatus');
    
    // Set up reactive updates
    this.autorun(() => {
      const status = attachmentSettings.migrationStatus.get();
      if (status === 'running') {
        this.isMigrationRunning.set(true);
      } else {
        this.isMigrationRunning.set(false);
      }
    });
  },

  onDestroyed() {
    if (this.subscription) {
      this.subscription.stop();
    }
  },

  events() {
    return [
      {
        'click button.js-migrate-all-to-filesystem': () => this.startMigration('filesystem'),
        'click button.js-migrate-all-to-gridfs': () => this.startMigration('gridfs'),
        'click button.js-migrate-all-to-s3': () => this.startMigration('s3'),
        'click button.js-pause-migration': this.pauseMigration,
        'click button.js-resume-migration': this.resumeMigration,
        'click button.js-stop-migration': this.stopMigration,
        'change input#migration-batch-size': this.updateBatchSize,
        'change input#migration-delay-ms': this.updateDelayMs,
        'change input#migration-cpu-threshold': this.updateCpuThreshold
      }
    ];
  },

  startMigration(targetStorage) {
    const batchSize = parseInt($('#migration-batch-size').val()) || 10;
    const delayMs = parseInt($('#migration-delay-ms').val()) || 1000;
    const cpuThreshold = parseInt($('#migration-cpu-threshold').val()) || 70;

    Meteor.call('startAttachmentMigration', {
      targetStorage,
      batchSize,
      delayMs,
      cpuThreshold
    }, (error, result) => {
      if (error) {
        alert(TAPi18n.__('migration-start-failed') + ': ' + error.reason);
      } else {
        this.addToLog(TAPi18n.__('migration-started') + ': ' + targetStorage);
      }
    });
  },

  pauseMigration() {
    Meteor.call('pauseAttachmentMigration', (error, result) => {
      if (error) {
        alert(TAPi18n.__('migration-pause-failed') + ': ' + error.reason);
      } else {
        this.addToLog(TAPi18n.__('migration-paused'));
      }
    });
  },

  resumeMigration() {
    Meteor.call('resumeAttachmentMigration', (error, result) => {
      if (error) {
        alert(TAPi18n.__('migration-resume-failed') + ': ' + error.reason);
      } else {
        this.addToLog(TAPi18n.__('migration-resumed'));
      }
    });
  },

  stopMigration() {
    if (confirm(TAPi18n.__('migration-stop-confirm'))) {
      Meteor.call('stopAttachmentMigration', (error, result) => {
        if (error) {
          alert(TAPi18n.__('migration-stop-failed') + ': ' + error.reason);
        } else {
          this.addToLog(TAPi18n.__('migration-stopped'));
        }
      });
    }
  },

  updateBatchSize(event) {
    const value = parseInt(event.target.value);
    if (value >= 1 && value <= 100) {
      attachmentSettings.migrationBatchSize.set(value);
    }
  },

  updateDelayMs(event) {
    const value = parseInt(event.target.value);
    if (value >= 100 && value <= 10000) {
      attachmentSettings.migrationDelayMs.set(value);
    }
  },

  updateCpuThreshold(event) {
    const value = parseInt(event.target.value);
    if (value >= 10 && value <= 90) {
      attachmentSettings.migrationCpuThreshold.set(value);
    }
  },

  addToLog(message) {
    const timestamp = new Date().toISOString();
    const currentLog = attachmentSettings.migrationLog.get();
    const newLog = `[${timestamp}] ${message}\n${currentLog}`;
    attachmentSettings.migrationLog.set(newLog);
  }
}).register('attachmentMigration');

// Monitoring component
BlazeComponent.extendComponent({
  onCreated() {
    this.totalAttachments = attachmentSettings.totalAttachments;
    this.filesystemAttachments = attachmentSettings.filesystemAttachments;
    this.gridfsAttachments = attachmentSettings.gridfsAttachments;
    this.s3Attachments = attachmentSettings.s3Attachments;
    this.totalSize = attachmentSettings.totalSize;
    this.filesystemSize = attachmentSettings.filesystemSize;
    this.gridfsSize = attachmentSettings.gridfsSize;
    this.s3Size = attachmentSettings.s3Size;
    
    // Subscribe to monitoring updates
    this.subscription = Meteor.subscribe('attachmentMonitoringData');
    
    // Set up chart
    this.autorun(() => {
      this.updateChart();
    });
  },

  onDestroyed() {
    if (this.subscription) {
      this.subscription.stop();
    }
  },

  events() {
    return [
      {
        'click button.js-refresh-monitoring': this.refreshMonitoring,
        'click button.js-export-monitoring': this.exportMonitoring
      }
    ];
  },

  refreshMonitoring() {
    Meteor.call('refreshAttachmentMonitoringData', (error, result) => {
      if (error) {
        alert(TAPi18n.__('monitoring-refresh-failed') + ': ' + error.reason);
      }
    });
  },

  exportMonitoring() {
    Meteor.call('exportAttachmentMonitoringData', (error, result) => {
      if (error) {
        alert(TAPi18n.__('monitoring-export-failed') + ': ' + error.reason);
      } else {
        // Download the exported data
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wekan-attachment-monitoring.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  },

  updateChart() {
    const ctx = document.getElementById('storage-distribution-chart');
    if (!ctx) return;

    const filesystemCount = this.filesystemAttachments.get();
    const gridfsCount = this.gridfsAttachments.get();
    const s3Count = this.s3Attachments.get();

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          TAPi18n.__('filesystem-storage'),
          TAPi18n.__('gridfs-storage'),
          TAPi18n.__('s3-storage')
        ],
        datasets: [{
          data: [filesystemCount, gridfsCount, s3Count],
          backgroundColor: [
            '#28a745',
            '#007bff',
            '#ffc107'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}).register('attachmentMonitoring');

// Export the attachment settings for use in other components
export { attachmentSettings };
