# JSON Parse Error Fix

## Problem
The restore script was failing with:
```
jq: parse error: Expected value before ',' at line 4, column 21
```

## Root Cause
In `backup_supabase.sh`, when the project lookup returned empty results, the `PROJECT_INFO` variable would be empty, creating invalid JSON:

```json
{
  "source_project": ,  // <-- Invalid: empty value before comma
  "project_ref": "..."
}
```

## Fix Applied

### 1. Fixed `backup_supabase.sh` (line ~462)
**Before:**
```bash
PROJECT_INFO=$(supabase projects list --output json 2>/dev/null | jq --arg ref "$PROJECT_REF" '.[] | select(.reference_id == $ref)' || echo "{}")
```

**After:**
```bash
PROJECT_INFO=$(supabase projects list --output json 2>/dev/null | jq --arg ref "$PROJECT_REF" '.[] | select(.reference_id == $ref)' 2>/dev/null || echo "")
if [ -z "$PROJECT_INFO" ]; then
    PROJECT_INFO="{}"
fi
```

### 2. Fixed jq quoting issues (for PowerShell compatibility)

All jq commands that used unescaped strings or embedded variables were updated to use `--arg`:

**restore_supabase.sh:**
- Line ~183: `.project_ref // "unknown"` → `.project_ref // $d` with `--arg d "unknown"`
- Line ~184: `.timestamp // "unknown"` → `.timestamp // $d` with `--arg d "unknown"`

**verify_restore.sh:**
- Line ~206-207: Project selection now uses `--arg ref "$NEW_PROJECT_REF"`

**backup_supabase.sh:**
- Line ~462: Project selection now uses `--arg ref "$PROJECT_REF"`

## Verification

The existing backup at `backups/backup-iddvvefpwgwmgpyelzcv-20251230_221159/project-config.json` is valid JSON and jq can parse it successfully:

```bash
jq -r --arg d "unknown" '.project_ref // $d' "backups/backup-iddvvefpwgwmgpyelzcv-20251230_221159/project-config.json"
# Output: iddvvefpwgwmgpyelzcv
```

## How to Test

Run the restore script in dry-run mode:

```bash
# Using Git Bash or WSL
bash scripts/supabase-backup/restore_supabase.sh --dry-run

# Or if WSL is configured
wsl bash scripts/supabase-backup/restore_supabase.sh --dry-run
```

Expected output should now successfully parse the JSON and display the restore plan without errors.

## Next Steps

1. ✅ JSON parsing is fixed
2. Test the restore script dry-run to verify
3. If dry-run succeeds, run actual restore with `--yes` flag
4. Run verification: `./scripts/supabase-backup/verify_restore.sh`
