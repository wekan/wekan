import fs from 'node:fs';
import path from 'node:path';

export const forges = {
  github: { name: 'GitHub', url: 'https://github.com/wekan/wekan', git: 'https://github.com/wekan/wekan.git', push: 'git@github.com:wekan/wekan.git' },
  gitlab: { name: 'GitLab', url: 'https://gitlab.com/wekan/wekan', git: 'https://gitlab.com/wekan/wekan.git', push: 'git@gitlab.com:wekan/wekan' },
  codeberg: { name: 'Codeberg', url: 'https://codeberg.org/wekan/wekan', git: 'https://codeberg.org/wekan/wekan.git', push: 'git@codeberg.org:wekan/wekan' },
  sourceforge: { name: 'SourceForge', url: 'https://sourceforge.net/projects/wekan/', git: 'https://git.code.sf.net/p/wekan/code', push: 'ssh://wekan@git.code.sf.net/p/wekan/code' },
};
export function validateSettings(settings) {
  if (!Object.hasOwn(forges, settings.source) || !Array.isArray(settings.mirrors) || settings.mirrors.some(m => !Object.hasOwn(forges, m) || m === settings.source) || new Set(settings.mirrors).size !== settings.mirrors.length) throw new Error('Invalid mirror settings: select known forges, unique mirrors, and exclude the source');
  return { source: settings.source, mirrors: [...settings.mirrors] };
}
export function parseSettings(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^(version|source|mirrors)=(.*)$/);
    if (!match || Object.hasOwn(values, match[1])) throw new Error('Invalid or duplicate setting in mirror settings.txt');
    values[match[1]] = match[2].trim();
  }
  if (values.version !== '1' || values.source === undefined || values.mirrors === undefined) throw new Error('Incomplete or unsupported mirror settings.txt');
  return validateSettings({ source: values.source, mirrors: values.mirrors ? values.mirrors.split(',').map(s => s.trim()) : [] });
}
export function loadSettings(root, defaults = ['gitlab', 'codeberg', 'sourceforge']) {
  const file = path.join(root, '.tools/mirror/settings.txt');
  return fs.existsSync(file) ? parseSettings(fs.readFileSync(file, 'utf8')) : validateSettings({ source: 'github', mirrors: defaults });
}
export function saveSettings(root, settings) {
  const validated = validateSettings(settings), file = path.join(root, '.tools/mirror/settings.txt');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.incoming-${process.pid}`;
  fs.writeFileSync(temporary, `# WeKan mirror settings; edited by the mirror menu\nversion=1\nsource=${validated.source}\nmirrors=${validated.mirrors.join(',')}\n`);
  fs.renameSync(temporary, file);
}
