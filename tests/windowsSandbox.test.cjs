'use strict';

// docs/Security/Sandboxes/Windows starts VSCodium in Windows Sandbox, a
// disposable Hyper-V virtual machine that sees only this checkout - the Windows
// counterpart of the Linux Flatpak and the macOS sandbox-exec sandboxes.
// PowerShell does not run here, so these read the scripts.
// Run: node tests/windowsSandbox.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'docs/Security/Sandboxes/Windows');
const host = fs.readFileSync(path.join(dir, 'sandbox.ps1'), 'utf8');
const logon = fs.readFileSync(path.join(dir, 'sandbox-logon.ps1'), 'utf8');
const bat = fs.readFileSync(path.join(dir, 'sandbox.bat'), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('the checkout is the one mapped folder, read-write, at the same path inside', () => {
  assert.strictEqual((host.match(/<MappedFolder>/g) || []).length, 1, 'nothing else of the host');
  assert.match(host, /<HostFolder>\$\(ConvertTo-XmlText \$Repo\)<\/HostFolder>/);
  assert.match(host, /\$Inside = 'C:\\Users\\WDAGUtilityAccount\\Downloads\\repos\\wekan'/);
  assert.match(host, /<ReadOnly>false<\/ReadOnly>/);
  for (const off of ['AudioInput', 'VideoInput', 'PrinterRedirection']) {
    assert.match(host, new RegExp(`<${off}>Disable</${off}>`), off);
  }
});

test('what lasts is in .tools: VSCodium, PortableGit, settings, git config, temporary files', () => {
  assert.match(logon, /\$codiumDir = Join-Path \$Tools 'vscodium\\app'/);
  assert.match(logon, /\$gitDir = Join-Path \$Tools 'PortableGit'/);
  assert.match(logon, /'--user-data-dir', .*vscodium\\user-data/);
  assert.match(logon, /'--extensions-dir', .*vscodium\\extensions/);
  assert.match(logon, /\$env:GIT_CONFIG_GLOBAL = Join-Path \$Tools 'home\\\.gitconfig'/);
  assert.match(logon, /foreach \(\$name in @\('TEMP', 'TMP', 'TMPDIR'\)\)/);
});

test('every download is verified before it is unpacked (negative: a mismatch throws)', () => {
  assert.match(logon, /function Test-Sha256[\s\S]*?throw "SHA256 mismatch/);
  const vscodium = logon.indexOf("Expand-Archive -Path $file");
  const git = logon.indexOf('& $file "-o$gitDir" -y');
  assert.ok(logon.lastIndexOf('Test-Sha256 $file', vscodium) > logon.indexOf('Downloading VSCodium'), 'VSCodium checked first');
  assert.ok(logon.lastIndexOf('Test-Sha256 $file', git) > logon.indexOf('Downloading PortableGit'), 'PortableGit checked first');
});

test('the host only changes Windows after asking, and the launcher calls the script', () => {
  assert.match(host, /Read-Host 'Turn it on now\?/);
  assert.match(host, /-FeatureName Containers-DisposableClientVM/);
  assert.match(bat, /-File "%~dp0sandbox\.ps1" %\*/);
});

test('native commands do not stop Windows PowerShell 5.1 on a stderr line', () => {
  // Under $ErrorActionPreference = 'Stop', 5.1 turns a native command's
  // stderr into a terminating error; each native call sets Continue first.
  for (const [name, src, call] of [['sandbox.ps1', host, '& git -C $Repo config --local --get'],
    ['sandbox-logon.ps1', logon, '& $file "-o$gitDir" -y']]) {
    const at = src.indexOf(call);
    assert.ok(src.lastIndexOf("$ErrorActionPreference = 'Continue'", at) > src.lastIndexOf("$ErrorActionPreference = 'Stop'", at), name);
  }
});

console.log(`\nwindowsSandbox: ${passed} passed`);
