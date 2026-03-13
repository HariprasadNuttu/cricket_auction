-- Create user and database for Cricket Auction app
-- Run with: psql -U postgres -f scripts/create-db.sql
-- (You'll be prompted for your postgres password)

CREATE USER auction WITH PASSWORD 'auction123';
CREATE DATABASE auction_db OWNER auction;
GRANT ALL PRIVILEGES ON DATABASE auction_db TO auction;
\c auction_db
GRANT ALL ON SCHEMA public TO auction;
