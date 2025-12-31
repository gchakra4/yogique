import sys
import psycopg2

def list_tables(dsn):
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python list_tables.py <postgres-url>')
        sys.exit(1)
    dsn = sys.argv[1]
    try:
        rows = list_tables(dsn)
        for schema, name in rows:
            print(f"{schema}.{name}")
    except Exception as e:
        print('ERROR:', e)
        sys.exit(2)
