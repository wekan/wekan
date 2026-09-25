import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ServiceConfiguration } from 'meteor/service-configuration';
import Settings from '/models/settings';
const { cleanSamlOverrides, resolveSamlConfig, validateSamlConfig } = require('/models/lib/samlConfig');

export async function samlConfiguration() {
  const setting = await Settings.findOneAsync({});
  return resolveSamlConfig(setting?.saml || {});
}

export async function reconfigureSaml() {
  const { config } = await samlConfiguration();
  if (!config.enabled) {
    await ServiceConfiguration.configurations.removeAsync({ service: 'saml' });
    return;
  }
  validateSamlConfig(config);
  await ServiceConfiguration.configurations.upsertAsync({ service: 'saml' }, { $set: config });
}

Meteor.startup(async () => {
  await reconfigureSaml();
});

Meteor.methods({
  async getSamlConfigSources() {
    const user = await Meteor.userAsync();
    if (user?.isAdmin !== true) throw new Meteor.Error('error-notAuthorized');
    const setting = await Settings.findOneAsync({});
    const { config, sources } = resolveSamlConfig(setting?.saml || {});
    return {
      overrides: setting?.saml || {}, sources,
      urls: {
        service: Meteor.absoluteUrl(`_saml/validate/${config.provider}`),
        logout: Meteor.absoluteUrl(`_saml/logout/${config.provider}`),
        metadata: Meteor.absoluteUrl(`_saml/config/${config.provider}`),
      },
    };
  },
  async saveSamlSettings(input) {
    check(input, Object);
    const user = await Meteor.userAsync();
    if (user?.isAdmin !== true) throw new Meteor.Error('error-notAuthorized');
    const clean = cleanSamlOverrides(input);
    validateSamlConfig(resolveSamlConfig(clean).config);
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { saml: clean } });
    await reconfigureSaml();
    return true;
  },
});
