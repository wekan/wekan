'use strict';

// CodeQL alerts #439 and #440: translation maintenance scripts must pass Git
// revisions and paths as argv, never interpolate repository filenames into a
// shell command. A contributor-controlled locale filename can contain shell
// metacharacters even though ordinary locale names do not.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const scripts = [
  'merge-translations.mjs',
  'report-english-regressions.mjs',
];

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify({ board: value }, null, 2)}\n`);
}

for (const script of scripts) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-i18n-git-'));
  try {
    const data = path.join(temp, 'imports/i18n/data');
    const scriptDir = path.join(temp, 'releases/translations');
    fs.mkdirSync(data, { recursive: true });
    fs.mkdirSync(scriptDir, { recursive: true });
    fs.copyFileSync(path.join(root, 'releases/translations', script), path.join(scriptDir, script));

    const injectedMarker = path.join(temp, 'CODEQL_INJECTION_RAN');
    const hostileName = 'zz;touch CODEQL_INJECTION_RAN;.i18n.json';
    const hostileFile = path.join(data, hostileName);
    writeJson(path.join(data, 'en.i18n.json'), 'Board');
    writeJson(hostileFile, 'Taulu');

    git(temp, ['init', '-q']);
    git(temp, ['config', 'user.name', 'Translation Test']);
    git(temp, ['config', 'user.email', 'translation-test@example.invalid']);
    git(temp, ['add', '--', 'imports/i18n/data']);
    git(temp, ['commit', '-q', '-m', 'fixture']);
    writeJson(hostileFile, 'Board');

    const run = spawnSync(process.execPath, [path.join(scriptDir, script)], {
      cwd: temp,
      encoding: 'utf8',
    });
    assert.ok([0, 2].includes(run.status), `${script}: ${run.stderr}`);
    assert.equal(fs.existsSync(injectedMarker), false,
      `${script} executed shell syntax from a locale filename`);

    if (script === 'merge-translations.mjs') {
      assert.equal(JSON.parse(fs.readFileSync(hostileFile, 'utf8')).board, 'Taulu',
        'the normal git-show merge still restores the committed translation');
    } else {
      assert.match(run.stdout, /board/,
        'the normal regression report still finds the reverted translation');
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

console.log(`translationGitShowInjection: ${scripts.length} scripts passed`);
