'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pwsh = process.env.WEKAN_PWSH_BIN;
if (!pwsh) { console.log('forgeWindowsInstaller: SKIP (set WEKAN_PWSH_BIN for offline PowerShell execution)'); process.exit(0); }
const temp = fs.mkdtempSync(path.join(root, '.tools/tmp/forge-windows-test-'));
try {
  const source = fs.readFileSync(path.join(root, 'tools/install-forge-tools.ps1'), 'utf8');
  const mocks = `
$global:available = @{winget=$true}
$env:SystemRoot = $env:WEKAN_TEST_ROOT
function Get-Command {
  [CmdletBinding()] param([string]$Name, [object]$CommandType)
  if ($global:available[$Name]) { [pscustomobject]@{Source="/mock/git/cmd/$Name.exe"} }
}
function winget {
  $ids = @{'Git.Git'='git'; 'cURL.cURL'='curl'; 'jqlang.jq'='jq';
    'OpenJS.NodeJS.LTS'='node'; 'GoLang.Go'='go'; 'GitHub.cli'='gh'; 'GLab.GLab'='glab'}
  $name = $ids[$args[2]]
  if (!$name) { throw 'Unexpected winget package' }
  Write-Host "MOCK PACKAGE $name"
  $global:available[$name]=$true
  $global:LASTEXITCODE=0
}
function Add-WindowsCapability {
  $global:available['ssh']=$true; $global:available['scp']=$true; $global:available['sftp']=$true
  Write-Host 'MOCK OPENSSH'
}
function go {
  Write-Host "MOCK GO $args"
  $name = ($args[1] -split '/')[-1] -replace '@latest$', ''
  if ($name -eq $env:WEKAN_TEST_FAIL) { $global:LASTEXITCODE=1; return }
  $global:available[$name]=$true
  $global:LASTEXITCODE=0
}
`;
  // Keep param/CmdletBinding first, then replace platform entry paths for isolation.
  const position = source.indexOf("$ErrorActionPreference");
  const script = source.slice(0, position) + mocks + source.slice(position)
    .replace("$repo = Split-Path $PSScriptRoot -Parent", '$repo = $env:WEKAN_TEST_ROOT');
  const file = path.join(temp, 'installer.ps1');
  fs.writeFileSync(file, script);
  for (const fail of ['', 'tea', 'forge']) {
    const result = cp.spawnSync(pwsh, ['-NoProfile', '-File', file], {encoding: 'utf8',
      env: {...process.env, WEKAN_TEST_ROOT: temp, WEKAN_TEST_FAIL: fail}});
    assert.equal(result.status, fail ? 1 : 0, result.stdout + result.stderr);
    assert.match(result.stdout, /MOCK OPENSSH/);
    assert.match(result.stdout, /MOCK GO install gitea.dev\/tea@latest/);
    assert.match(result.stdout, /MOCK GO install github.com\/git-pkgs\/forge\/cmd\/forge@latest/);
    if (fail) assert.ok(result.stdout.includes(`MISSING ${fail}`));
    else assert.doesNotMatch(result.stdout, /MISSING/);
  }
  console.log('forgeWindowsInstaller: actual PowerShell offline package/SSH/Go workflow, failure reporting and continuation passed');
} finally { fs.rmSync(temp, {recursive: true, force: true}); }
