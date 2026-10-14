// #5847: passkeys in the browser (models/lib/passkeys.js converts; the
// server verifies, server/passkeys.js).
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

const { creationOptionsForBrowser, requestOptionsForBrowser, credentialToJSON } = require('/models/lib/passkeys');

export function passkeysSupported() {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials
    && !Meteor.settings?.public?.sandstorm;
}

// Makes a passkey on this device and saves it to the signed-in account.
export async function addPasskey(name) {
  const { challengeId, options } = await Meteor.callAsync('passkeyRegistrationOptions');
  const credential = await navigator.credentials.create({ publicKey: creationOptionsForBrowser(options) });
  if (!credential) throw new Meteor.Error('passkey-cancelled');
  return Meteor.callAsync('passkeyRegister', challengeId, credentialToJSON(credential), name || '');
}

// Signs in with a passkey the browser offers; resolves when signed in.
export async function signInWithPasskey() {
  const { challengeId, options } = await Meteor.callAsync('passkeyLoginOptions');
  const credential = await navigator.credentials.get({ publicKey: requestOptionsForBrowser(options) });
  if (!credential) throw new Meteor.Error('passkey-cancelled');
  const response = credentialToJSON(credential);
  return new Promise((resolve, reject) => {
    Accounts.callLoginMethod({
      methodArguments: [{ passkey: { challengeId, response } }],
      userCallback: error => (error ? reject(error) : resolve()),
    });
  });
}
