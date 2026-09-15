// A site logo is public only while the setting names that exact uploaded file.
const LOGO_FIELDS = {
  login: 'customLoginLogoImageUrl',
  header: 'customTopLeftCornerLogoImageUrl',
};

function siteLogoField(kind) {
  return LOGO_FIELDS[kind];
}

function siteLogoImageType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return ['image/png', '.png'];
  if (bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) return ['image/jpeg', '.jpg'];
  if (bytes.subarray(0, 6).toString() === 'GIF87a' || bytes.subarray(0, 6).toString() === 'GIF89a') return ['image/gif', '.gif'];
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return ['image/webp', '.webp'];
  return null;
}

function isActiveSiteLogo(attachment, setting, fileId) {
  if (!attachment || !setting || attachment._id !== fileId || attachment.meta?.source !== 'site-logo') return false;
  if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(attachment.type)) return false;
  return Object.values(LOGO_FIELDS).some(field => {
    const value = setting[field];
    return typeof value === 'string' && value.split('?')[0].endsWith(`/cdn/storage/attachments/${encodeURIComponent(fileId)}`);
  });
}

module.exports = {siteLogoField, siteLogoImageType, isActiveSiteLogo};
