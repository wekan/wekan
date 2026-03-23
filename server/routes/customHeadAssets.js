import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import path from 'path';
import Settings from '/models/settings';

const shouldServeContent = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const getDefaultFileContent = (filename) => {
  try {
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      return null;
    }

    if (typeof Meteor.absolutePath !== 'string' || Meteor.absolutePath.trim().length === 0) {
      return null;
    }

    const filePath = path.join(Meteor.absolutePath, 'public', filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (e) {
    console.error(`Error reading default file ${filename}:`, e);
  }
  return null;
};

const respondWithText = (res, contentType, body) => {
  res.writeHead(200, {
    'Content-Type': `${contentType}; charset=utf-8`,
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
};

WebApp.handlers.use('/site.webmanifest', async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const setting = await Settings.findOneAsync(
    {},
    {
      fields: {
        customHeadEnabled: 1,
        customManifestEnabled: 1,
        customManifestContent: 1,
      },
    },
  );

  // Serve custom content if enabled
  if (setting && setting.customHeadEnabled && setting.customManifestEnabled && shouldServeContent(setting.customManifestContent)) {
    return respondWithText(res, 'application/manifest+json', setting.customManifestContent);
  }

  // Fallback to default manifest file
  const defaultContent = getDefaultFileContent('site.webmanifest.default');
  if (defaultContent) {
    return respondWithText(res, 'application/manifest+json', defaultContent);
  }

  return next();
});

WebApp.handlers.use('/.well-known/assetlinks.json', async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const setting = await Settings.findOneAsync(
    {},
    {
      fields: {
        customAssetLinksEnabled: 1,
        customAssetLinksContent: 1,
      },
    },
  );

  // Serve custom content if enabled
  if (setting && setting.customAssetLinksEnabled && shouldServeContent(setting.customAssetLinksContent)) {
    return respondWithText(res, 'application/json', setting.customAssetLinksContent);
  }

  // Fallback to default assetlinks file
  const defaultContent = getDefaultFileContent('.well-known/assetlinks.json.default');
  if (defaultContent) {
    return respondWithText(res, 'application/json', defaultContent);
  }

  return next();
});
