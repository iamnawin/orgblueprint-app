param(
  [string]$RepoPath = "C:\Users\Naveen\OneDrive\Desktop\orgblueprint",
  [string]$RemoteUrl = "https://github.com/iamnawin/orgblueprint-app.git",
  [string]$Branch = "work"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $RepoPath)) {
  throw "RepoPath not found: $RepoPath"
}

Set-Location $RepoPath

if (-not (Test-Path ".git")) {
  throw "No .git folder found in $RepoPath"
}

Write-Host "==> Ensuring origin points to OrgBlueprint repo"
$hasOrigin = git remote | Select-String -Pattern "^origin$" -Quiet
if ($hasOrigin) {
  git remote set-url origin $RemoteUrl
} else {
  git remote add origin $RemoteUrl
}

git remote -v

Write-Host "==> Fetching origin"
git fetch origin

Write-Host "==> Creating/switching to local branch: $Branch"
$hasBranch = git branch --list $Branch
if ($hasBranch) {
  git switch $Branch
} else {
  git switch -c $Branch
}

Write-Host "==> Current branch"
git branch --show-current

Write-Host "==> Push branch and set upstream"
git push -u origin $Branch

Write-Host "Done. Remote and branch are configured."
