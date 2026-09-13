import path from 'node:path';
import { createHash } from 'node:crypto';
import { forges } from './mirror-settings.mjs';
import { organizationName, namespace } from './mirror-organizations.mjs';
export const organization = organizationName(process.env.WEKAN_MIRROR_ORGANIZATION || 'wekan');
export const destinationNamespaces = Object.fromEntries(['gitlab','codeberg','sourceforge'].map(k=>[k,namespace(process.env[`WEKAN_MIRROR_${k.toUpperCase()}_NAMESPACE`] || organization)]));

export function validateRepository(name) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9_.-]{1,100}$/.test(name) || ['.', '..'].includes(name)) throw new Error('Invalid WeKan repository name');
  return name;
}
export const repository = validateRepository(process.env.WEKAN_MIRROR_REPOSITORY || 'wekan');
export function repositorySegment(name) {
  validateRepository(name);
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name) || name.endsWith('.')) return `repo-${name.replace(/\.+$/, '')}-${createHash('sha256').update(name).digest('hex').slice(0, 8)}`;
  return name;
}
export function sourceForgeMount(name, suffix = '') {
  validateRepository(name);
  const value = `${name}${suffix}`;
  return `repo-${value.replace(/[^A-Za-z0-9-]/g, '-').slice(0, 60)}-${createHash('sha256').update(value).digest('hex').slice(0, 8)}`;
}
export function repositoryForges(name, owner = organization, destinations = destinationNamespaces) {
  validateRepository(name);
  organizationName(owner);
  for (const k of ['gitlab','codeberg','sourceforge']) namespace(destinations[k]);
  if(name==='wekan' && owner==='wekan' && Object.values(destinations).every(n=>n==='wekan')) return forges;
  return {
    github: { name: 'GitHub', url: `https://github.com/${owner}/${name}`, git: `https://github.com/${owner}/${name}.git`, push: `git@github.com:${owner}/${name}.git` },
    gitlab: { name: 'GitLab', url: `https://gitlab.com/${destinations.gitlab}/${name}`, git: `https://gitlab.com/${destinations.gitlab}/${name}.git`, push: `git@gitlab.com:${destinations.gitlab}/${name}.git` },
    codeberg: { name: 'Codeberg', url: `https://codeberg.org/${destinations.codeberg}/${name}`, git: `https://codeberg.org/${destinations.codeberg}/${name}.git`, push: `git@codeberg.org:${destinations.codeberg}/${name}.git` },
    sourceforge: { name: 'SourceForge', url: `https://sourceforge.net/projects/${destinations.sourceforge}/`, git: `https://git.code.sf.net/p/${destinations.sourceforge}/${name === 'wekan' && destinations.sourceforge === 'wekan' ? 'code' : sourceForgeMount(name)}`, push: `ssh://${destinations.sourceforge}@git.code.sf.net/p/${destinations.sourceforge}/${name === 'wekan' && destinations.sourceforge === 'wekan' ? 'code' : sourceForgeMount(name)}` },
  };
}
export function repositoryArchive(root, name = 'wekan', owner = organization, host = 'github.com') {
  namespace(owner);
  if (!['github.com','gitlab.com','codeberg.org','sourceforge.net'].includes(host)) throw new Error('Unknown archive host');
  return path.join(root,'.tools/mirror',host,...owner.split('/'),repositorySegment(name));
}
