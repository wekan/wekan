'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = fs.readFileSync('.github/workflows/windows.yml', 'utf8');
const release = fs.readFileSync('.github/workflows/release-all.yml', 'utf8');
const missing = fs.readFileSync('.github/workflows/release-all-missing.yml', 'utf8');
const expected = fs.readFileSync('releases/expected-assets.sh', 'utf8');
const launcher = fs.readFileSync('releases/windows-single-exe-launcher.c', 'utf8');
const batch = fs.readFileSync('releases/ferretdb/start-wekan.bat', 'utf8');

assert.match(workflow, /github\.com\/wekan\/wekan\/releases\/download\/v11\.25\/enigmavb\.exe/,
  'the workflow downloads the reviewed Enigma Virtual Box installer archived in v11.25');
assert.doesNotMatch(workflow, /enigmaprotector\.com\/assets\/files\/enigmavb\.exe/,
  'a vendor update must not silently replace the reviewed build tool');
assert.match(workflow, /ab743f5e3dd927a288e126bbb053d367f270592e89378c9a06b7f3b15fa1ee35/,
  'the downloaded executable must be pinned to its reviewed SHA256');
assert.doesNotMatch(workflow, /assets\/files\/enigma(?:32|64)\.exe/i,
  'the commercial demo with its startup nag must not be packaged');
assert.match(workflow, /evbOptions\.shareVirtualSystem True/,
  'Node.js and FerretDB child processes must see the embedded files');
assert.match(workflow, /evbOptions\.allowRunningOfVirtualExeFiles True/,
  'the embedded Node.js and FerretDB executables must be runnable');
assert.match(workflow, /['"]ferretdb\.exe['"]/,
  'the input bundle must contain FerretDB');
assert.match(workflow, /localhost:8080\/sign-in/,
  'the final single EXE must pass an HTTP startup smoke test');
assert.match(launcher, /start-wekan\.bat/,
  'the native PE entry point must invoke the ordinary Windows launcher');
assert.match(launcher, /SetEnvironmentVariableW\(L"WRITABLE_PATH", data\)/,
  'the launcher must provide the real directory beside the EXE to start-wekan.bat');
assert.match(launcher,
  /SetEnvironmentVariableW\(L"NODE_SKIP_PLATFORM_CHECK", L"1"\)/,
  'the Enigma launcher must bypass its false legacy-Windows result for Node');
assert.match(launcher,
  /GetEnvironmentVariableW\(L"NODE_SKIP_PLATFORM_CHECK", data, MAX_PATH\)/,
  'an explicit NODE_SKIP_PLATFORM_CHECK value must remain authoritative');
assert.match(launcher, /wcscat_s\(data, MAX_PATH, L"\\\\wekan-files"\)/,
  'the portable data directory must be named wekan-files');
assert.match(batch, /"%%~nxI"=="wekan-files" set "FILES=%WRITABLE_PATH%"/,
  'start-wekan.bat must not turn wekan-files into wekan-files\\files');
assert.match(release, /uses: \.\/\.github\/workflows\/windows\.yml/,
  'a full release must invoke the reusable Windows workflow');
assert.match(release, /needs: \[prepare, release, build-win64\]/,
  'packing must wait until the win64 ZIP is published');
assert.match(missing, /uses: \.\/\.github\/workflows\/windows\.yml/,
  'the missing-assets workflow must be able to rebuild the EXE');
assert.match(expected, /windows win64 WeKan-\$\{v\}-win64\.exe sums/,
  'release completeness must include the EXE and its checksum');

console.log('windowsSingleExe: 18 assertions passed');
