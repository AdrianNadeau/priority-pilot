#!/bin/bash
# Run once with: sudo -u postgres bash scripts/setup-db.sh

set -e

psql -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'priority_pilot') THEN
    CREATE USER priority_pilot WITH PASSWORD 'priority_pilot';
  ELSE
    ALTER USER priority_pilot WITH PASSWORD 'priority_pilot';
  END IF;
END \$\$;"

psql -c "SELECT 1 FROM pg_database WHERE datname = 'priority_pilot'" | grep -q 1 || \
  psql -c "CREATE DATABASE priority_pilot OWNER priority_pilot;"

psql -c "GRANT ALL PRIVILEGES ON DATABASE priority_pilot TO priority_pilot;"

psql -d priority_pilot -c "GRANT ALL ON SCHEMA public TO priority_pilot;"

psql -d priority_pilot -c "
CREATE TABLE IF NOT EXISTS \"session\" (
  \"sid\" varchar NOT NULL COLLATE \"default\",
  \"sess\" json NOT NULL,
  \"expire\" timestamp(6) NOT NULL,
  CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\")
) WITH (OIDS=FALSE);
CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
ALTER TABLE \"session\" OWNER TO priority_pilot;
GRANT ALL PRIVILEGES ON TABLE \"session\" TO priority_pilot;
"

echo "Done. priority_pilot DB and user are ready."
