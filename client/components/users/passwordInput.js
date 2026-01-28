import { TAPi18n } from '/imports/i18n';

Template.passwordInput.onRendered(function() {
  const template = this;
  const input = template.find('input.password-field');
  const label = template.find('label');
  
  // Set the dynamic id and name based on the field _id
  if (template.data && template.data._id) {
    const fieldId = `at-field-${template.data._id}`;
    input.id = fieldId;
    input.name = fieldId;
    label.setAttribute('for', fieldId);
    
    // Ensure the input starts as password type for password fields
    input.type = 'password';
    
    // Initially show eye icon (password is hidden) and hide eye-slash icon
    const eyeIcon = template.find('.eye-icon');
    const eyeSlashIcon = template.find('.eye-slash-icon');
    if (eyeIcon) {
      eyeIcon.style.display = 'inline-block';
    }
    if (eyeSlashIcon) {
      eyeSlashIcon.style.display = 'none';
    }
  }
});

Template.passwordInput.events({
  'click .password-toggle-btn'(event, template) {
    event.preventDefault();
    const input = template.find('input.password-field');
    const eyeIcon = template.find('.eye-icon');
    const eyeSlashIcon = template.find('.eye-slash-icon');
    
    if (input.type === 'password') {
      input.type = 'text';
      // Show eye-slash icon when password is visible
      if (eyeIcon) {
        eyeIcon.style.display = 'none';
      }
      if (eyeSlashIcon) {
        eyeSlashIcon.style.display = 'inline-block';
      }
    } else {
      input.type = 'password';
      // Show eye icon when password is hidden
      if (eyeIcon) {
        eyeIcon.style.display = 'inline-block';
      }
      if (eyeSlashIcon) {
        eyeSlashIcon.style.display = 'none';
      }
    }
  },
});