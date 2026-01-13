Template.settingHeaderBar.helpers({
  isSettingsActive() {
    return FlowRouter.getRouteName() === 'setting' ? 'active' : '';
  },
  isPeopleActive() {
    return FlowRouter.getRouteName() === 'people' ? 'active' : '';
  },
  isAdminReportsActive() {
    return FlowRouter.getRouteName() === 'admin-reports' ? 'active' : '';
  },
  isAttachmentsActive() {
    return FlowRouter.getRouteName() === 'attachments' ? 'active' : '';
  },
  isTranslationActive() {
    return FlowRouter.getRouteName() === 'translation' ? 'active' : '';
  },
  isInformationActive() {
    return FlowRouter.getRouteName() === 'information' ? 'active' : '';
  },
});
