const { Client } = require('pg');

const checks = [
    { name: 'message_audit_table', sql: "SELECT to_regclass('public.message_audit') IS NOT NULL AS present;" },
    { name: 'message_audit_idx_provider_message_id', sql: "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='message_audit' AND indexname='idx_message_audit_provider_message_id') AS present;" },
    { name: 'message_audit_idx_class_channel', sql: "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='message_audit' AND indexname='idx_message_audit_class_channel') AS present;" },

    { name: 'class_assignments_whatsapp_email_cols', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='class_assignments' AND column_name='whatsapp_notified') AS whatsapp_notified, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='class_assignments' AND column_name='email_notified') AS email_notified;" },

    { name: 'transactions_user_snapshot_cols', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='user_email') AS user_email_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='user_full_name') AS user_full_name_exists;" },
    { name: 'transactions_with_user_view', sql: "SELECT EXISTS(SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='transactions_with_user') AS present;" },

    { name: 'newsletter_timezone', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='newsletter_subscribers' AND column_name='timezone') AS present;" },

    { name: 'profiles_whatsapp_cols', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='whatsapp_opt_in') AS whatsapp_opt_in_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='whatsapp_opt_in_at') AS whatsapp_opt_in_at_exists;" },

    { name: 'phone_otps_table', sql: "SELECT to_regclass('public.phone_otps') IS NOT NULL AS present;" },

    { name: 'bookings_cancelled_by', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancelled_by') AS present;" },
    { name: 'bookings_cancel_token_cols', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancel_token') AS cancel_token_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancel_token_expires_at') AS cancel_token_expires_at_exists;" },
    { name: 'bookings_user_cancelled_cols', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='user_cancelled') AS user_cancelled_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='cancelled_at') AS cancelled_at_exists;" },

    { name: 'audit_logs_table', sql: "SELECT to_regclass('public.audit_logs') IS NOT NULL AS present;" },
    { name: 'audit_logs_added_cols', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='audit_type') AS audit_type_exists, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='invoice_id') AS invoice_id_exists;" },

    { name: 'invoices_table', sql: "SELECT to_regclass('public.invoices') IS NOT NULL AS present;" },
    { name: 'invoices_unique_index', sql: "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invoices' AND indexname='uniq_invoices_booking_billing_period') AS present;" },
    { name: 'invoices_status_index', sql: "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invoices' AND indexname='idx_invoices_status') AS present;" },
    { name: 'invoice_status_enum', sql: "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname='invoice_status_enum') AS present;" },

    { name: 'payment_link_jobs_table', sql: "SELECT to_regclass('public.payment_link_jobs') IS NOT NULL AS present;" },
    { name: 'payment_link_jobs_next_run_at', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_link_jobs' AND column_name='next_run_at') AS present;" },

    { name: 'transactions_invoice_id', sql: "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='invoice_id') AS present;" }
];

async function main() {
    const client = new Client({
        host: process.env.PGHOST || 'aws-0-ap-south-1.pooler.supabase.com',
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        user: process.env.PGUSER || 'postgres.iddvvefpwgwmgpyelzcv',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
    });

    if (!client.password) {
        console.error('PGPASSWORD environment variable is required');
        process.exit(1);
    }

    await client.connect();

    const out = {};
    for (const c of checks) {
        try {
            const res = await client.query(c.sql);
            out[c.name] = res.rows[0];
        } catch (err) {
            out[c.name] = { error: err.message };
        }
    }

    console.log(JSON.stringify(out, null, 2));
    await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
