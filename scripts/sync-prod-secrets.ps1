param(
  [string]$EnvFile = ".env.prod",
  [switch]$SkipGitHub,
  [switch]$SkipVercel
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$requiredKeys = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CRON_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_BASIC",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_ENTERPRISE",
  "SENTRY_DSN",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "OPS_ALERT_WEBHOOK_URL"
)

function Read-EnvFile([string]$path) {
  if (!(Test-Path $path)) {
    throw "Arquivo '$path' não encontrado."
  }
  $data = @{}
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (!$line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
    if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
    $data[$key] = $val
  }
  return $data
}

function Assert-RequiredKeys($envMap, $keys) {
  $missing = @()
  foreach ($k in $keys) {
    if (!$envMap.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($envMap[$k])) {
      $missing += $k
    }
  }
  if ($missing.Count -gt 0) {
    throw "Variáveis obrigatórias ausentes em $EnvFile:`n - $($missing -join "`n - ")"
  }
}

function Get-RepoFromRemote() {
  $url = (git remote get-url origin).Trim()
  if ($url -match "github\.com[:/](.+?)(\.git)?$") {
    return $Matches[1]
  }
  throw "Não foi possível extrair owner/repo do remote origin: $url"
}

function Ensure-GhAuth() {
  gh auth status | Out-Null
}

function Ensure-VercelAuth() {
  vercel.cmd whoami | Out-Null
}

function Set-GitHubSecrets($repo, $envMap) {
  foreach ($k in $requiredKeys) {
    $v = [string]$envMap[$k]
    if ([string]::IsNullOrWhiteSpace($v)) { continue }
    $v | gh secret set $k -R $repo
  }
}

function Set-VercelSecrets($envMap) {
  foreach ($k in $requiredKeys) {
    $v = [string]$envMap[$k]
    if ([string]::IsNullOrWhiteSpace($v)) { continue }
    try {
      vercel.cmd env rm $k production --yes 2>$null | Out-Null
    } catch {}
    $v | vercel.cmd env add $k production | Out-Null
  }
}

$envMap = Read-EnvFile $EnvFile
Assert-RequiredKeys $envMap $requiredKeys

if (-not $SkipGitHub) {
  Ensure-GhAuth
  $repo = Get-RepoFromRemote
  Write-Host "Sincronizando segredos no GitHub repo: $repo"
  Set-GitHubSecrets -repo $repo -envMap $envMap
}

if (-not $SkipVercel) {
  Ensure-VercelAuth
  Write-Host "Sincronizando segredos no Vercel (environment: production)"
  Set-VercelSecrets -envMap $envMap
}

Write-Host "Segredos sincronizados com sucesso."
