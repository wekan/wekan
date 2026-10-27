# sandbox-logon.ps1 - runs INSIDE Windows Sandbox when it starts (the .wsb's
# LogonCommand, written by sandbox.ps1). Sets up the tools and opens VSCodium on
# the mapped WeKan checkout.
#
# Windows Sandbox forgets everything when it is closed, so what has to last is
# kept in the checkout's .tools\, which is the mapped host folder: VSCodium and
# PortableGit are downloaded there once, verified, and reused on every start.
# VSCodium's settings and extensions, git's configuration and temporary files
# are in .tools\ too.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$Tools = Join-Path $Repo '.tools'
$Log = Join-Path $Tools 'sandbox\logon.log'
New-Item -ItemType Directory -Force -Path (Join-Path $Tools 'sandbox'), (Join-Path $Tools 'tmp'), (Join-Path $Tools 'home') | Out-Null
Start-Transcript -Path $Log -Force | Out-Null

# Temporary files in .tools\tmp for everything started from here on, as
# releases\tools-env.bat does for the batch scripts.
$tmp = Join-Path $Tools 'tmp'
foreach ($name in @('TEMP', 'TMP', 'TMPDIR')) {
  [Environment]::SetEnvironmentVariable($name, $tmp, 'User')
  Set-Item -Path "Env:$name" -Value $tmp
}
# git's own configuration lasts in .tools\home. The mapped folder belongs to
# the host's user, not to the sandbox's, so git is told it is safe.
$env:GIT_CONFIG_GLOBAL = Join-Path $Tools 'home\.gitconfig'
[Environment]::SetEnvironmentVariable('GIT_CONFIG_GLOBAL', $env:GIT_CONFIG_GLOBAL, 'User')

$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }

function Get-LatestRelease([string]$repo) {
  Invoke-RestMethod -UseBasicParsing -Headers @{ 'User-Agent' = 'wekan-sandbox' } `
    -Uri "https://api.github.com/repos/$repo/releases/latest"
}
function Test-Sha256([string]$file, [string]$want) {
  $got = (Get-FileHash -Algorithm SHA256 -Path $file).Hash
  if (-not $want -or $got -ne $want.Trim().ToUpper()) {
    throw "SHA256 mismatch for $(Split-Path -Leaf $file): got $got, expected $want"
  }
}

# 1) PortableGit: Git for Windows without an installer, into .tools\PortableGit.
#    Its release notes list each file's SHA-256.
$gitDir = Join-Path $Tools 'PortableGit'
if (-not (Test-Path (Join-Path $gitDir 'cmd\git.exe'))) {
  Write-Host 'Downloading PortableGit ...'
  $release = Get-LatestRelease 'git-for-windows/git'
  $bits = if ($arch -eq 'arm64') { 'arm64' } else { '64-bit' }
  $asset = $release.assets | Where-Object { $_.name -match "^PortableGit-.*-$bits\.7z\.exe$" } | Select-Object -First 1
  if (-not $asset) { throw "No PortableGit for $bits in $($release.tag_name)" }
  $file = Join-Path $tmp $asset.name
  Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile $file
  $line = ($release.body -split "`n") | Where-Object { $_ -match [regex]::Escape($asset.name) } | Select-Object -First 1
  Test-Sha256 $file (([regex]::Match($line, '[0-9a-fA-F]{64}')).Value)
  # Native commands under 'Stop' fail Windows PowerShell 5.1 on any stderr line.
  $ErrorActionPreference = 'Continue'
  & $file "-o$gitDir" -y | Out-Null
  $ErrorActionPreference = 'Stop'
  if (-not (Test-Path (Join-Path $gitDir 'cmd\git.exe'))) { throw "PortableGit did not unpack into $gitDir" }
  Remove-Item $file
}

# 2) VSCodium: the zip build, into .tools\vscodium\app. Each release asset has
#    a .sha256 file beside it.
$codiumDir = Join-Path $Tools 'vscodium\app'
$codium = Join-Path $codiumDir 'VSCodium.exe'
if (-not (Test-Path $codium)) {
  Write-Host 'Downloading VSCodium ...'
  $release = Get-LatestRelease 'VSCodium/vscodium'
  $asset = $release.assets | Where-Object { $_.name -match "^VSCodium-win32-$arch-[0-9.]+\.zip$" } | Select-Object -First 1
  $sum = $release.assets | Where-Object { $_.name -eq "$($asset.name).sha256" } | Select-Object -First 1
  if (-not $asset -or -not $sum) { throw "No VSCodium zip with a .sha256 for $arch in $($release.tag_name)" }
  $file = Join-Path $tmp $asset.name
  Invoke-WebRequest -UseBasicParsing -Uri $asset.browser_download_url -OutFile $file
  $want = ((Invoke-WebRequest -UseBasicParsing -Uri $sum.browser_download_url).Content -split '\s+')[0]
  Test-Sha256 $file $want
  Expand-Archive -Path $file -DestinationPath $codiumDir -Force
  Remove-Item $file
}

# 3) PATH for VSCodium and its terminals: git, and what build.bat installs into
#    .tools\ (Node.js, npm's global installs, Meteor).
$node = Get-ChildItem -Directory -Path $Tools -Filter "node-v*-win-$arch" -ErrorAction SilentlyContinue |
  Sort-Object Name | Select-Object -Last 1
$paths = @((Join-Path $gitDir 'cmd'), (Join-Path $Tools 'bin'), (Join-Path $Tools '.meteor'), (Join-Path $Tools 'npm-global'))
if ($node) { $paths += $node.FullName }
$env:PATH = ($paths -join ';') + ';' + $env:PATH
# The sandbox starts clean each time, so the user PATH is set, not appended to.
[Environment]::SetEnvironmentVariable('PATH', ($paths -join ';'), 'User')
# One value however many times this runs: .tools\home\.gitconfig lasts.
$ErrorActionPreference = 'Continue'
& (Join-Path $gitDir 'cmd\git.exe') config --global --replace-all safe.directory '*'
$ErrorActionPreference = 'Stop'
if (-not $node) {
  Write-Host 'Node.js is not in .tools yet: run build.bat, option 1, in the VSCodium terminal.'
}

# 4) VSCodium on the checkout, its settings and extensions in .tools\vscodium.
Start-Process -FilePath $codium -ArgumentList @(
  '--user-data-dir', "`"$(Join-Path $Tools 'vscodium\user-data')`"",
  '--extensions-dir', "`"$(Join-Path $Tools 'vscodium\extensions')`"",
  "`"$Repo`"")
Stop-Transcript | Out-Null
