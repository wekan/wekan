// Pure, dependency-free guards for the `versions` metadata of a stored file
// (ostrio:files: `versions.<name>.path` / `.storage`), so both the attachment
// and the avatar permission rules can use the SAME rule and cannot drift apart.
//
// GHSA-4mxf-m8pq-xc9p: attachments blocked client-supplied `versions.*.path`,
// avatars did not - their allow rule was `update: isOwner` with no field
// restriction at all. An avatar owner could therefore point
// `versions.original.path` at any file the WeKan process can read (/etc/passwd,
// anything under WRITABLE_PATH) and then export a board they are a member of:
// the exporter reads that path from disk and embeds the bytes as base64 in
// `profile.avatarFile`. That is an arbitrary file read for any authenticated
// user, so the rule now lives in ONE place and is applied to both collections.
//
// `path` and `storage` are server-managed: they say WHERE on disk the bytes
// are. A client never has a reason to set or change them, on any collection.

const SERVER_MANAGED_VERSION_FIELDS = ['path', 'storage'];

/**
 * True when a document a client is trying to INSERT carries server-managed
 * version metadata (`versions.<any>.path` or `.storage`).
 * @param {object} fileObj the document as the client sent it
 * @return {boolean}
 */
function hasUnsafeClientVersionFields(fileObj) {
  const versions = fileObj && fileObj.versions;
  if (!versions || typeof versions !== 'object') {
    return false;
  }

  return Object.values(versions).some((version) => {
    if (!version || typeof version !== 'object') {
      return false;
    }
    return SERVER_MANAGED_VERSION_FIELDS.some((field) =>
      Object.prototype.hasOwnProperty.call(version, field),
    );
  });
}

/**
 * True when an UPDATE touches the `versions` subtree at all. Deliberately
 * broader than hasUnsafeClientVersionFields: an update arrives as a list of
 * modified field names, and `versions.original` (the whole sub-object, path
 * included) is as dangerous as `versions.original.path` spelled out.
 * @param {string[]} fields the modified field names Meteor passes to allow()
 * @return {boolean}
 */
function touchesVersionFields(fields) {
  if (!Array.isArray(fields)) {
    return false;
  }
  return fields.some(
    (field) =>
      typeof field === 'string' &&
      (field === 'versions' || field.startsWith('versions.')),
  );
}

/**
 * True when every modified field name is in `allowedFields` (comparing the
 * part before the first dot, so `meta.boardId` is allowed by `meta`).
 * @param {string[]} fields the modified field names
 * @param {string[]} allowedFields the whitelist
 * @return {boolean}
 */
function onlyTouchesAllowedFields(fields, allowedFields) {
  if (!Array.isArray(fields)) {
    return false;
  }
  return fields.every((field) => {
    if (typeof field !== 'string') return false;
    return allowedFields.includes(field.split('.')[0]);
  });
}

module.exports = {
  SERVER_MANAGED_VERSION_FIELDS,
  hasUnsafeClientVersionFields,
  touchesVersionFields,
  onlyTouchesAllowedFields,
};
