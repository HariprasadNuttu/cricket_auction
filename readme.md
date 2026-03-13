# Cricket Auction System

## Local Setup

### 1. Database (one-time)

Create the database and user (run from `server/`):

```bash
psql -U postgres -f scripts/create-db.sql
```

This creates user `auction` with password `auction123` and database `auction_db`.

`server/.env` is already configured with these credentials.

### 2. Server

```bash
cd server
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### 3. Client

```bash
cd client
npm install
ng serve
```

App: http://localhost:4200  
API: http://localhost:3000
