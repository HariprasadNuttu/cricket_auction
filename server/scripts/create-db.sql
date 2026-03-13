-- Create user and database for Cricket Auction app
-- Run with: psql -U postgres -f scripts/create-db.sql
-- (You'll be prompted for your postgres password)

DO $$ BEGIN CREATE USER auction WITH PASSWORD 'Hsd@8500'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE DATABASE cricket_auction OWNER auction;
GRANT ALL PRIVILEGES ON DATABASE cricket_auction TO auction;
\c cricket_auction
GRANT ALL ON SCHEMA public TO auction;
