function useLdapForRestLogin({ user, ldapEnabled, usernameProvided }) {
  if (!ldapEnabled || !usernameProvided) return false;
  if (!user) return true;
  return user.authenticationMethod === 'ldap';
}

function ldapRestLoginRequest(username, password) {
  return {
    ldap: true,
    username,
    ldapPass: password,
    ldapOptions: {},
  };
}

module.exports = { useLdapForRestLogin, ldapRestLoginRequest };
