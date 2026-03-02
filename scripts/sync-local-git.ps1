param(
  [string]$RepoPath = "C:\Users\Naveen\OneDrive\Desktop\orgblueprint",
  [string]$BackupPath = "C:\Users\Naveen\OneDrive\Desktop\orgblueprint-backup",
  [string]$CommitMessage = "Sync local + git",
  [switch]$NoPush
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $RepoPath)) {
  throw "RepoPath not found: $RepoPath"
}

$repoFull = (Resolve-Path $RepoPath).Path
Set-Location $repoFull

# Safety: ensure this folder is the actual git worktree root.
$topLevel = (git rev-parse --show-toplevel 2>$null)
if (-not $topLevel) {
  throw "Not a git repository: $repoFull"
}

$topFull = (Resolve-Path $topLevel.Trim()).Path
if ($topFull -ne $repoFull) {
  throw "RepoPath is not the git root. RepoPath=$repoFull, GitRoot=$topFull. Run script from real repo root to avoid adding parent folders."
}

Write-Host "==> Repository root confirmed: $repoFull"
Write-Host "==> Current branch"
git -C $repoFull branch --show-current

Write-Host "==> Mirroring repo to backup (excluding git/build artifacts)"
# Copy only contents of repo root, not parent paths.
robocopy "$repoFull\" "$BackupPath\" /MIR /XD .git node_modules .next dist /XF *.log

if ($LASTEXITCODE -ge 8) {
  throw "robocopy failed with code $LASTEXITCODE"
}

Write-Host "==> Pulling latest changes"
git -C $repoFull pull --rebase

Write-Host "==> Staging tracked/untracked changes under repo root only"
git -C $repoFull add --all -- .

$changes = git -C $repoFull diff --cached --name-only
if (-not $changes) {
  Write-Host "No staged changes; nothing to commit."
  exit 0
}

Write-Host "==> Committing"
git -C $repoFull commit -m $CommitMessage

if (-not $NoPush) {
  Write-Host "==> Pushing"
  git -C $repoFull push
} else {
  Write-Host "==> Skipping push because -NoPush was provided"
}

Write-Host "Done. Local backup and git are synced."
