#!/bin/bash
# Crée la base DocuSeal au premier démarrage du volume Postgres.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	SELECT 'CREATE DATABASE docuseal'
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'docuseal')\gexec
EOSQL
