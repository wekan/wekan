const schemaPackage = require('meteor/aldeed:simple-schema');

const SimpleSchema =
  schemaPackage.default || schemaPackage.SimpleSchema || schemaPackage;

if (!SimpleSchema._wekanExtendedOptions) {
  SimpleSchema.extendOptions(['index', 'unique']);
  SimpleSchema._wekanExtendedOptions = true;
}

module.exports = { SimpleSchema };
