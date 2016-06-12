Meteor.subscribe('setting');
Meteor.subscribe('mailServer');

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.generalSetting = new ReactiveVar(true);
    this.emailSetting = new ReactiveVar(false);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  checkField(selector) {
    const value = $(selector).val();
    if(!value || value.trim() === ''){
      $(selector).parents('li.smtp-form').addClass('has-error');
      throw Error('blank field');
    } else {
      return value;
    }
  },

  currentSetting(){
    return Settings.findOne();
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      'members.isAdmin': true,
    }, {
      sort: ['title'],
    });
  },
  toggleStrictMode(){
    this.setLoading(true);
    const isStrictMode = this.currentSetting().strict;
    Settings.update(Settings.findOne()._id, {$set:{strict: !isStrictMode}});
    this.setLoading(false);
    if(isStrictMode){
      $('.invite-people').slideUp();
    }else{
      $('.invite-people').slideDown();
    }
  },

  switchMenu(event){
    const target = $(event.target);
    if(!target.hasClass('active')){
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');
      this.generalSetting.set('general-setting' === targetID);
      this.emailSetting.set('email-setting' === targetID);
    }
  },

  checkBoard(event){
    let target = $(event.target);
    if(!target.hasClass('js-toggle-board-choose')){
      target = target.parent();
    }
    const checkboxId = target.attr('id');
    $(`#${checkboxId} .materialCheckBox`).toggleClass('is-checked');
    $(`#${checkboxId}`).toggleClass('is-checked');
  },

  inviteThroughEmail(){
    this.setLoading(true);
    const emails = $('#email-to-invite').val().trim().split('\n').join(',').split(',');
    const boardsToInvite = [];
    $('.js-toggle-board-choose .materialCheckBox.is-checked').each(function () {
      boardsToInvite.push($(this).data('id'));
    });
    const validEmails = [];
    emails.forEach((email) => {
      if (email && SimpleSchema.RegEx.Email.test(email.trim())) {
        validEmails.push(email.trim());
      }
    });
    Meteor.call('sendInvitation', validEmails, boardsToInvite, () => {
      // if (!err) {
      //   TODO - show more info to user
      // }
      this.setLoading(false);
    });
  },

  saveMailServerInfo(){
    this.setLoading(true);
    $('li').removeClass('has-error');

    try{
      const host = this.checkField('#mail-server-host');
      const port = this.checkField('#mail-server-port');
      const username = this.checkField('#mail-server-username');
      const password = this.checkField('#mail-server-password');
      const from = this.checkField('#mail-server-from');
      Settings.update(Settings.findOne()._id, {$set:{'mailServer.host':host, 'mailServer.port': port, 'mailServer.username': username,
                              'mailServer.password': password, 'mailServer.from': from}});
    } catch (e) {
      return;
    } finally {
      this.setLoading(false);
    }

  },

  events(){
    return [{
      'click a.js-toggle-strict-mode': this.toggleStrictMode,
      'click a.js-setting-menu': this.switchMenu,
      'click a.js-toggle-board-choose': this.checkBoard,
      'click button.js-email-invite': this.inviteThroughEmail,
      'click button.js-save': this.saveMailServerInfo,
    }];
  },
}).register('setting');
