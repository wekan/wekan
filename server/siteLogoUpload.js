import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ObjectId } from 'bson';
import Attachments from '/models/attachments';
import Settings from '/models/settings';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
const {siteLogoField, siteLogoImageType} = require('/models/lib/siteLogo');

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
Meteor.methods({
  async uploadSiteLogo(kind, base64) {
    check(kind, String);
    check(base64, String);
    const field = siteLogoField(kind);
    if (!field) throw new Meteor.Error('invalid-logo-kind');
    const user = this.userId && await Meteor.users.findOneAsync(this.userId);
    if (!user?.isAdmin) throw new Meteor.Error('not-authorized');
    if (!base64 || base64.length > Math.ceil(MAX_LOGO_BYTES * 4 / 3) + 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) throw new Meteor.Error('invalid-logo-data');
    const bytes = Buffer.from(base64, 'base64');
    const type = siteLogoImageType(bytes);
    if (!type || bytes.length > MAX_LOGO_BYTES) throw new Meteor.Error('invalid-logo-image', 'Upload a PNG, JPEG, GIF or WebP image smaller than 2 MB');
    const setting = await Settings.findOneAsync();
    if (!setting) throw new Meteor.Error('setting-not-found');
    const storageSetting = await AttachmentStorageSettings.findOneAsync({});
    if (storageSetting?.limitSettings?.attachmentsUploadBlocked === true) throw new Meteor.Error('uploads-disabled');
    // Attachments.onAfterUpload validates the bytes and moves the file to the
    // administrator's Default Storage, just as it does for board backgrounds.
    const file = new File([bytes], `site-${kind}-logo${type[1]}`, {type:type[0]});
    const uploader = await Attachments.insertAsync({file, meta:{source:'site-logo', fileId:new ObjectId().toString()}, isBase64:false, transport:'http'});
    if (!uploader?._id) throw new Meteor.Error('upload-failed');
    const prefix = new URL(Meteor.absoluteUrl()).pathname.replace(/\/$/, '');
    const url = `${prefix}/cdn/storage/attachments/${encodeURIComponent(uploader._id)}`;
    await Settings.updateAsync(setting._id, {$set:{[field]:url}});
    return url;
  },
});
