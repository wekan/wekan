# Native Windows installation only; no authentication or mirror operations.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$toolBin = Join-Path $repo '.tools\bin'
$toolTemp = Join-Path $repo '.tools\tmp'
New-Item -ItemType Directory -Force -Path $toolBin, $toolTemp | Out-Null
$env:TEMP = $toolTemp
$env:TMP = $toolTemp
$env:PATH = "$toolBin;$env:PATH"

function Refresh-ToolPath {
    # Newly installed MSI/winget tools are otherwise invisible in this process.
    $env:PATH = "$toolBin;" + [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
        [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:PATH
    # Git for Windows includes SSH/SCP/SFTP on CPUs supported by its installer.
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $gitRoot = Split-Path (Split-Path $git.Source -Parent) -Parent
        $gitSsh = Join-Path $gitRoot 'usr\bin'
        if (Test-Path (Join-Path $gitSsh 'ssh.exe')) { $env:PATH = "$gitSsh;$env:PATH" }
    }
    $windowsSsh = Join-Path $env:SystemRoot 'System32\OpenSSH'
    if (Test-Path $windowsSsh) { $env:PATH = "$windowsSsh;$env:PATH" }
}
function Has-Tool([string]$Name) {
    return [bool](Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue)
}
function Install-PackageTool([string]$Name, [string]$WingetId, [string]$ChocoId) {
    if (Has-Tool $Name) { return }
    try {
        if (Has-Tool 'winget') {
            & winget install --id $WingetId --exact --source winget --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -ne 0) { Write-Warning "$Name winget installation failed ($LASTEXITCODE)." }
        } elseif (Has-Tool 'choco') {
            & choco install $ChocoId --yes
            if ($LASTEXITCODE -ne 0) { Write-Warning "$Name Chocolatey installation failed ($LASTEXITCODE)." }
        } else {
            Write-Warning "Install ${Name}: neither winget nor Chocolatey is available."
        }
    } catch { Write-Warning "$Name package installation failed: $_" }
    Refresh-ToolPath
}

Refresh-ToolPath
Write-Host 'Installing native tools for GitHub, GitLab, Codeberg and SourceForge mirrors.'
Install-PackageTool git Git.Git git
Install-PackageTool curl cURL.cURL curl
Install-PackageTool jq jqlang.jq jq
Install-PackageTool node OpenJS.NodeJS.LTS nodejs-lts
Install-PackageTool go GoLang.Go golang
Install-PackageTool gh GitHub.cli gh
Install-PackageTool glab GLab.GLab glab

# Windows has an architecture-neutral OpenSSH client capability. No server needed.
if (!(Has-Tool ssh) -or !(Has-Tool scp) -or !(Has-Tool sftp)) {
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0 | Out-Null
    } catch { Write-Warning "OpenSSH client installation needs Administrator privileges: $_" }
    Refresh-ToolPath
}

$modules = [ordered]@{
    gh = 'github.com/cli/cli/v2/cmd/gh'
    glab = 'gitlab.com/gitlab-org/cli/cmd/glab'
    tea = 'gitea.dev/tea'
    'git-bug' = 'github.com/git-bug/git-bug'
    forge = 'github.com/git-pkgs/forge/cmd/forge'
}
$previousGoBin = $env:GOBIN
try {
    if ($env:GOBIN) {
        $toolBin = $env:GOBIN
        New-Item -ItemType Directory -Force -Path $toolBin | Out-Null
        $env:PATH = "$toolBin;$env:PATH"
    } else { $env:GOBIN = $toolBin }
    foreach ($name in $modules.Keys) {
        if (Has-Tool $name) { Write-Host "OK: $name present"; continue }
        if (!(Has-Tool go)) { Write-Warning "Cannot build ${name}: Go installation failed."; continue }
        try {
            & go install "$($modules[$name])@latest"
            if ($LASTEXITCODE -ne 0) { Write-Warning "$name Go installation failed; check Go version and CPU support." }
        } catch { Write-Warning "$name Go installation failed: $_" }
    }
} finally { $env:GOBIN = $previousGoBin }

$missing = @()
Write-Host 'Mirror tool status:'
foreach ($name in @('git', 'ssh', 'scp', 'sftp', 'curl', 'jq', 'node', 'go', 'gh', 'glab', 'tea', 'git-bug', 'forge')) {
    if (Has-Tool $name) { Write-Host "  OK ${name}: $((Get-Command $name -CommandType Application).Source)" }
    else { Write-Host "  MISSING $name"; $missing += $name }
}
Write-Host "Go CLI directory: $toolBin"
Write-Host 'Authenticate separately: gh auth login; glab auth login; tea login add.'
Write-Host 'SourceForge uses SSH/SFTP release transfers and its HTTP API.'
if ($missing.Count) { exit 1 }
exit 0
