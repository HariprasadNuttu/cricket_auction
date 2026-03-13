-- Run if auction user and cricket_auction database already exist
-- psql -U postgres -d cricket_auction -f scripts/grant-fix.sql

ALTER USER auction WITH PASSWORD 'Hsd@8500';
GRANT ALL ON SCHEMA public TO auction;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auction;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO auction;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO auction;
