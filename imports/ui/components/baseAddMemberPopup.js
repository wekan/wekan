import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { ReactiveVar } from 'meteor/reactive-var';
// SimpleSchema

const BaseAddMemberPopup = BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
  },

  onRendered() {
    this.find('.js-search-member input').focus();
    this.setLoading(false);
  },

  isMember() {
    return this.callFirstWith(this, 'isMember');
  },

  isValidEmail(email) {
    return SimpleSchema.RegEx.Email.test(email);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  inviteUser(idNameEmail) {
    this.callFirstWith(this, 'inviteUser', idNameEmail);
  },

  addMember(userId) {
    this.callFirstWith(this, 'addMember', userId);
  },

  events() {
    return [{
      'keyup input'() {
        this.setError('');
      },
      'click .js-select-member'() {
        const userId = this.currentData()._id;
        this.addMember(userId);
      },
      'click .js-email-invite'() {
        const idNameEmail = $('.js-search-member input').val();
        if (idNameEmail.indexOf('@') < 0 || this.isValidEmail(idNameEmail)) {
          this.inviteUser(idNameEmail);
        } else this.setError('email-invalid');
      },
    }];
  },
});

export {BaseAddMemberPopup};
