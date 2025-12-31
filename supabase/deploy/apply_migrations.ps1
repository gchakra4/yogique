Param(
    [Parameter(Mandatory = $false)]
    [string]$ProdDatabaseUrl = $env:PROD_DATABASE_URL
)

if (-not $ProdDatabaseUrl) {
    Write-Error "Missing production database connection string. Set the PROD_DATABASE_URL environment variable or pass -ProdDatabaseUrl.";
    exit 1
}

$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$backupFile = "prod_backup_$timestamp.dump"

Write-Output "Backing up production DB to $backupFile..."
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($null -eq $pgDump) {
    Write-Warning "pg_dump not found in PATH; skipping backup. Install PostgreSQL client to enable backups.";
}
else {
    & pg_dump --format=custom --file=$backupFile $ProdDatabaseUrl
    if ($LASTEXITCODE -ne 0) { Write-Error "pg_dump failed"; exit 1 }
}

Write-Output "Applying migration files from supabase/migrations in order..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$migrationsPath = Join-Path $scriptDir "..\migrations"
$files = Get-ChildItem -Path $migrationsPath -Filter *.sql | Sort-Object Name
if ($files.Count -eq 0) { Write-Error "No migration files found at $migrationsPath"; exit 1 }

foreach ($f in $files) {
    Write-Output "Applying $($f.Name)..."
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if ($null -eq $psql) { Write-Warning "psql not found; cannot apply migrations. Install PostgreSQL client." ; break }
    & psql $ProdDatabaseUrl -f $f.FullName
    if ($LASTEXITCODE -ne 0) { Write-Error "psql failed on $($f.Name). Stopping."; exit 1 }
}

Write-Output "Migrations applied successfully."
