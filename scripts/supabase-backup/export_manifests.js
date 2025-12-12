#!/usr/bin/env node

/**
 * Export Manifests for Supabase Backup
 * 
 * This script generates detailed JSON manifests for:
 * - Edge Functions
 * - Storage buckets and objects
 * - Database tables and row counts
 * 
 * Usage: node export_manifests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// =============================================================================
// Load Environment
// =============================================================================
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (key && value) {
                process.env[key] = value;
            }
        }
    });
}

const PROJECT_REF = process.env.PROJECT_REF;
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const PG_HOST = process.env.PG_HOST || `db.${PROJECT_REF}.supabase.co`;
const PG_PORT = process.env.PG_PORT || '5432';
const PG_DATABASE = process.env.PG_DATABASE || 'postgres';
const PG_USER = process.env.PG_USER || 'postgres';
const PG_PASSWORD = process.env.PG_PASSWORD;

if (!PROJECT_REF) {
    log.error('PROJECT_REF not set in .env or environment');
    process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const outputDir = path.join(BACKUP_DIR, `manifests-${PROJECT_REF}-${timestamp}`);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

log.info(`Exporting manifests to: ${outputDir}`);

// =============================================================================
// Helper Functions
// =============================================================================
function execCommand(command, silent = false) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: silent ? 'pipe' : 'inherit'
        });
        return output;
    } catch (error) {
        if (!silent) {
            log.warn(`Command failed: ${command}`);
            log.warn(error.message);
        }
        return null;
    }
}

function execCommandJson(command) {
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        return JSON.parse(output);
    } catch (error) {
        log.warn(`Failed to execute: ${command}`);
        return null;
    }
}

// =============================================================================
// Export Edge Functions Manifest
// =============================================================================
async function exportFunctionsManifest() {
    log.info('Exporting Edge Functions manifest...');

    const command = `supabase functions list --project-ref ${PROJECT_REF} --output json`;
    const functionsData = execCommandJson(command);

    if (!functionsData) {
        log.warn('No Edge Functions found or unable to list');
        return;
    }

    const manifest = {
        timestamp: new Date().toISOString(),
        project_ref: PROJECT_REF,
        function_count: functionsData.length,
        functions: functionsData.map(func => ({
            name: func.name,
            id: func.id || null,
            version: func.version || null,
            status: func.status || 'unknown',
            created_at: func.created_at || null,
            updated_at: func.updated_at || null
        }))
    };

    const outputPath = path.join(outputDir, 'functions-manifest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    log.success(`Functions manifest exported: ${outputPath}`);
    log.info(`Found ${manifest.function_count} Edge Functions`);
}

// =============================================================================
// Export Storage Manifest
// =============================================================================
async function exportStorageManifest() {
    log.info('Exporting Storage manifest...');

    // Note: Supabase CLI v2.58 has limited storage commands
    // This is a placeholder structure
    const manifest = {
        timestamp: new Date().toISOString(),
        project_ref: PROJECT_REF,
        note: 'Storage manifest requires manual population. Use Supabase Dashboard or rclone.',
        buckets: [],
        total_size_bytes: 0,
        instructions: [
            '1. List buckets via Supabase Dashboard → Storage',
            '2. For each bucket, note: name, public/private, file count',
            '3. Use rclone to get detailed file lists and sizes',
            '4. Update this manifest with actual data'
        ]
    };

    // Try to get bucket list if API is available
    // This would require API calls or CLI commands that may not exist yet

    const outputPath = path.join(outputDir, 'storage-manifest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    log.warn(`Storage manifest template created: ${outputPath}`);
    log.warn('Manual steps required to populate storage data');
}

// =============================================================================
// Export Database Manifest
// =============================================================================
async function exportDatabaseManifest() {
    log.info('Exporting Database manifest...');

    if (!PG_PASSWORD) {
        log.warn('PG_PASSWORD not set, skipping database manifest');
        return;
    }

    // Set password for psql
    process.env.PGPASSWORD = PG_PASSWORD;

    // Get schema list
    const schemaQuery = `
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name;
  `;

    const schemasOutput = execCommand(
        `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -t -c "${schemaQuery}"`,
        true
    );

    const schemas = schemasOutput
        ? schemasOutput.trim().split('\n').map(s => s.trim()).filter(Boolean)
        : [];

    // Get table list with row counts
    const tablesQuery = `
    SELECT 
      schemaname,
      tablename,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY schemaname, tablename;
  `;

    const tablesOutput = execCommand(
        `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -t -c "${tablesQuery}"`,
        true
    );

    const tables = [];
    if (tablesOutput) {
        tablesOutput.trim().split('\n').forEach(line => {
            const parts = line.trim().split('|').map(p => p.trim());
            if (parts.length >= 3) {
                tables.push({
                    schema: parts[0],
                    name: parts[1],
                    row_count: parseInt(parts[2]) || 0
                });
            }
        });
    }

    // Get extension list
    const extensionsQuery = `
    SELECT extname, extversion 
    FROM pg_extension 
    WHERE extname NOT IN ('plpgsql')
    ORDER BY extname;
  `;

    const extensionsOutput = execCommand(
        `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -t -c "${extensionsQuery}"`,
        true
    );

    const extensions = [];
    if (extensionsOutput) {
        extensionsOutput.trim().split('\n').forEach(line => {
            const parts = line.trim().split('|').map(p => p.trim());
            if (parts.length >= 2) {
                extensions.push({
                    name: parts[0],
                    version: parts[1]
                });
            }
        });
    }

    // Get function count
    const functionCountQuery = `
    SELECT COUNT(*) 
    FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  `;

    const functionCountOutput = execCommand(
        `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -t -c "${functionCountQuery}"`,
        true
    );

    const functionCount = functionCountOutput ? parseInt(functionCountOutput.trim()) : 0;

    // Get trigger count
    const triggerCountQuery = `
    SELECT COUNT(*) 
    FROM pg_trigger 
    WHERE tgname NOT LIKE 'RI_ConstraintTrigger%';
  `;

    const triggerCountOutput = execCommand(
        `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -t -c "${triggerCountQuery}"`,
        true
    );

    const triggerCount = triggerCountOutput ? parseInt(triggerCountOutput.trim()) : 0;

    // Get RLS policy count
    const policyCountQuery = `SELECT COUNT(*) FROM pg_policies;`;

    const policyCountOutput = execCommand(
        `psql -h ${PG_HOST} -p ${PG_PORT} -U ${PG_USER} -d ${PG_DATABASE} -t -c "${policyCountQuery}"`,
        true
    );

    const policyCount = policyCountOutput ? parseInt(policyCountOutput.trim()) : 0;

    const totalRows = tables.reduce((sum, table) => sum + table.row_count, 0);

    const manifest = {
        timestamp: new Date().toISOString(),
        project_ref: PROJECT_REF,
        database: PG_DATABASE,
        statistics: {
            schema_count: schemas.length,
            table_count: tables.length,
            total_rows: totalRows,
            function_count: functionCount,
            trigger_count: triggerCount,
            rls_policy_count: policyCount,
            extension_count: extensions.length
        },
        schemas: schemas,
        tables: tables,
        extensions: extensions
    };

    const outputPath = path.join(outputDir, 'database-manifest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    log.success(`Database manifest exported: ${outputPath}`);
    log.info(`Database contains ${tables.length} tables with ${totalRows.toLocaleString()} total rows`);

    delete process.env.PGPASSWORD;
}

// =============================================================================
// Export Project Info
// =============================================================================
async function exportProjectInfo() {
    log.info('Exporting project info...');

    const command = `supabase projects list --output json`;
    const projectsData = execCommandJson(command);

    if (!projectsData) {
        log.warn('Unable to get project info');
        return;
    }

    const projectInfo = projectsData.find(p => p.reference_id === PROJECT_REF);

    if (!projectInfo) {
        log.warn(`Project ${PROJECT_REF} not found in projects list`);
        return;
    }

    const manifest = {
        timestamp: new Date().toISOString(),
        project: projectInfo,
        cli_version: execCommand('supabase --version', true)?.trim() || 'unknown'
    };

    const outputPath = path.join(outputDir, 'project-info.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    log.success(`Project info exported: ${outputPath}`);
}

// =============================================================================
// Main Execution
// =============================================================================
async function main() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              Supabase Manifest Export Tool                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
        await exportProjectInfo();
        await exportFunctionsManifest();
        await exportDatabaseManifest();
        await exportStorageManifest();

        console.log('');
        log.success('All manifests exported successfully!');
        log.info(`Output directory: ${outputDir}`);
        console.log('');

    } catch (error) {
        log.error('Export failed:');
        console.error(error);
        process.exit(1);
    }
}

main();
