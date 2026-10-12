'use strict';

// #6762: what an administrator can do about a certificate the LDAP server
// presented and WeKan refused. Node's own text ("if the root CA is installed
// locally, try running Node.js with --use-system-ca") names a Node.js option
// nobody running a snap or a Docker image can pass, so the log said nothing an
// administrator could act on. The secure default stays: no hint suggests
// turning verification off.

const UNTRUSTED_CA = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_UNTRUSTED',
]);

function ldapCertificateHint(error) {
  const code = error && error.code;
  if (UNTRUSTED_CA.has(code)) {
    return 'The LDAP server\'s certificate is not signed by a certificate authority WeKan trusts. '
      + 'Install your CA on the WeKan server (Debian/Ubuntu: copy it to /usr/local/share/ca-certificates/ '
      + 'as a .crt file, run update-ca-certificates, and restart WeKan), or give it to WeKan in '
      + 'LDAP_CA_CERT (snap: snap set wekan ldap-ca-cert="$(cat your-ca.pem)"). '
      + 'If the server sends only its own certificate, its intermediate CA has to be installed too.';
  }
  if (code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
    return 'The LDAP server\'s certificate is for another name than LDAP_HOST. '
      + 'Set LDAP_HOST to a name the certificate lists.';
  }
  if (code === 'CERT_HAS_EXPIRED' || code === 'CERT_NOT_YET_VALID') {
    return 'The LDAP server\'s certificate is outside its validity dates; renew it on the LDAP server, '
      + 'or check the WeKan server\'s clock.';
  }
  return '';
}

module.exports = { ldapCertificateHint };
