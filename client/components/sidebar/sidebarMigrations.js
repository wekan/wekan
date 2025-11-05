import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

BlazeComponent.extendComponent({
  onCreated() {
    this.migrationStatuses = new ReactiveVar({});
    this.loadMigrationStatuses();
  },

  loadMigrationStatuses() {
    const boardId = Session.get('currentBoard');
    if (!boardId) return;

    // Check comprehensive migration
    Meteor.call('comprehensiveBoardMigration.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.comprehensive = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check fix missing lists migration
    Meteor.call('fixMissingListsMigration.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.fixMissingLists = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check fix avatar URLs migration (global)
    Meteor.call('fixAvatarUrls.needsMigration', (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.fixAvatarUrls = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check fix all file URLs migration (global)
    Meteor.call('fixAllFileUrls.needsMigration', (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.fixAllFileUrls = res;
        this.migrationStatuses.set(statuses);
      }
    });
  },

  comprehensiveMigrationNeeded() {
    return this.migrationStatuses.get().comprehensive === true;
  },

  fixMissingListsNeeded() {
    return this.migrationStatuses.get().fixMissingLists === true;
  },

  fixAvatarUrlsNeeded() {
    return this.migrationStatuses.get().fixAvatarUrls === true;
  },

  fixAllFileUrlsNeeded() {
    return this.migrationStatuses.get().fixAllFileUrls === true;
  },

  runMigration(migrationType) {
    const boardId = Session.get('currentBoard');
    
    let methodName;
    let methodArgs = [];
    
    switch (migrationType) {
      case 'comprehensive':
        methodName = 'comprehensiveBoardMigration.execute';
        methodArgs = [boardId];
        break;
      
      case 'fixMissingLists':
        methodName = 'fixMissingListsMigration.execute';
        methodArgs = [boardId];
        break;
      
      case 'fixAvatarUrls':
        methodName = 'fixAvatarUrls.execute';
        break;
      
      case 'fixAllFileUrls':
        methodName = 'fixAllFileUrls.execute';
        break;
    }
    
    if (methodName) {
      Meteor.call(methodName, ...methodArgs, (err, result) => {
        if (err) {
          console.error('Migration failed:', err);
          // Show error notification
          Alert.error(TAPi18n.__('migration-failed') + ': ' + (err.message || err.reason));
        } else {
          console.log('Migration completed:', result);
          // Show success notification
          Alert.success(TAPi18n.__('migration-successful'));
          
          // Reload migration statuses
          Meteor.setTimeout(() => {
            this.loadMigrationStatuses();
          }, 1000);
        }
      });
    }
  },

  events() {
    return [
      {
        'click .js-run-migration[data-migration="comprehensive"]': Popup.afterConfirm('runComprehensiveMigration', function() {
          const component = BlazeComponent.getComponentForElement(this);
          if (component) {
            component.runMigration('comprehensive');
          }
        }),
        'click .js-run-migration[data-migration="fixMissingLists"]': Popup.afterConfirm('runFixMissingListsMigration', function() {
          const component = BlazeComponent.getComponentForElement(this);
          if (component) {
            component.runMigration('fixMissingLists');
          }
        }),
        'click .js-run-migration[data-migration="fixAvatarUrls"]': Popup.afterConfirm('runFixAvatarUrlsMigration', function() {
          const component = BlazeComponent.getComponentForElement(this);
          if (component) {
            component.runMigration('fixAvatarUrls');
          }
        }),
        'click .js-run-migration[data-migration="fixAllFileUrls"]': Popup.afterConfirm('runFixAllFileUrlsMigration', function() {
          const component = BlazeComponent.getComponentForElement(this);
          if (component) {
            component.runMigration('fixAllFileUrls');
          }
        }),
      },
    ];
  },
}).register('migrationsSidebar');
