Meteor.startup(() => {
  if (process.env.HEADER_LOGIN_ID) {
    Meteor.settings.public.attachmentsUploadMaxSize   = process.env.ATTACHMENTS_UPLOAD_MAX_SIZE;
    Meteor.settings.public.attachmentsUploadMimeTypes = process.env.ATTACHMENTS_UPLOAD_MIME_TYPES;
    Meteor.settings.public.avatarsUploadMaxSize       = process.env.AVATARS_UPLOAD_MAX_SIZE;
    Meteor.settings.public.avatarsUploadMimeTypes     = process.env.AVATARS_UPLOAD_MIME_TYPES;
  }
});
