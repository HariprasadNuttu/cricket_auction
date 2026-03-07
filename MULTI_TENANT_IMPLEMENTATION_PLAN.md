# Multi-Tenant Auction System - Implementation Plan

## Architecture Overview

```
Group (Cricket League)
  ↓
Season (2026 Season, Summer Cup, etc.)
  ↓
Players (Group-level, reused across seasons)
  ↓
SeasonPlayers (Links players to season with status)
  ↓
Teams (Season-level)
  ↓
Auction (One per season)
  ↓
Bids
```

## Database Schema Changes

### New Models:
1. **Group** - Top-level cricket league
2. **Season** - Season within a group
3. **SeasonPlayer** - Links players to seasons with season-specific data

### Updated Models:
1. **Player** - Now belongs to Group (not directly to season)
2. **Team** - Now belongs to Season (not directly to group)
3. **AuctionState** - Now belongs to Season
4. **BidLog** - Now includes seasonId
5. **AuctionLog** - Now includes seasonId

## Implementation Steps

### Phase 1: Database Schema ✅
- [x] Create Group model
- [x] Create Season model
- [x] Update Player model (groupId)
- [x] Create SeasonPlayer model
- [x] Update Team model (seasonId)
- [x] Update AuctionState (seasonId)
- [x] Update BidLog (seasonId)
- [x] Update AuctionLog (seasonId)

### Phase 2: Backend APIs

#### Group APIs
- [ ] `POST /api/groups` - Create group
- [ ] `GET /api/groups` - List all groups
- [ ] `GET /api/groups/:id` - Get group details
- [ ] `PUT /api/groups/:id` - Update group
- [ ] `DELETE /api/groups/:id` - Delete group

#### Season APIs
- [ ] `POST /api/groups/:groupId/seasons` - Create season
- [ ] `GET /api/groups/:groupId/seasons` - List seasons in group
- [ ] `GET /api/seasons/:id` - Get season details
- [ ] `PUT /api/seasons/:id` - Update season
- [ ] `DELETE /api/seasons/:id` - Delete season
- [ ] `POST /api/seasons/:id/clone` - Clone season

#### Player APIs
- [ ] `POST /api/groups/:groupId/players` - Add player to group
- [ ] `POST /api/groups/:groupId/players/upload` - Upload players via CSV
- [ ] `GET /api/groups/:groupId/players` - List players in group
- [ ] `PUT /api/players/:id` - Update player
- [ ] `DELETE /api/players/:id` - Delete player

#### Season Player APIs
- [ ] `POST /api/seasons/:seasonId/players` - Add player to season
- [ ] `POST /api/seasons/:seasonId/players/bulk` - Add multiple players
- [ ] `GET /api/seasons/:seasonId/players` - List players in season
- [ ] `PUT /api/season-players/:id` - Update season player

#### Team APIs
- [ ] `POST /api/seasons/:seasonId/teams` - Create team
- [ ] `GET /api/seasons/:seasonId/teams` - List teams in season
- [ ] `PUT /api/teams/:id` - Update team
- [ ] `DELETE /api/teams/:id` - Delete team
- [ ] `POST /api/teams/:id/assign-owner` - Assign owner to team

#### Auction APIs (Updated)
- [ ] `GET /api/seasons/:seasonId/auction/state` - Get auction state
- [ ] `POST /api/seasons/:seasonId/auction/start` - Start auction
- [ ] `POST /api/seasons/:seasonId/auction/start-random` - Start random player
- [ ] `POST /api/seasons/:seasonId/auction/complete` - Complete auction
- [ ] `POST /api/seasons/:seasonId/auction/pause` - Pause auction
- [ ] `POST /api/seasons/:seasonId/auction/resume` - Resume auction
- [ ] `POST /api/seasons/:seasonId/auction/undo-bid` - Undo last bid
- [ ] `POST /api/seasons/:seasonId/auction/reopen-player` - Reopen player

### Phase 3: Frontend Components

#### Admin Components
- [ ] `GroupsComponent` - List/create/edit groups
- [ ] `SeasonsComponent` - List/create/edit seasons
- [ ] `PlayersComponent` - Manage players (upload CSV, add/edit)
- [ ] `SeasonPlayersComponent` - Add players to season
- [ ] `TeamsComponent` - Manage teams in season
- [ ] `AuctionDashboardComponent` - Updated to work with seasons

#### Shared Components
- [ ] `GroupSelectorComponent` - Select active group
- [ ] `SeasonSelectorComponent` - Select active season
- [ ] `BreadcrumbComponent` - Show Group > Season navigation

### Phase 4: Migration Strategy

1. **Create migration script** to:
   - Create new tables (Group, Season, SeasonPlayer)
   - Migrate existing data:
     - Create default Group
     - Create default Season
     - Link existing players to Group
     - Create SeasonPlayer entries
     - Link existing teams to Season
     - Update AuctionState with seasonId
     - Update BidLog with seasonId
     - Update AuctionLog with seasonId

2. **Backward compatibility**:
   - Keep old endpoints working temporarily
   - Add new endpoints alongside old ones
   - Migrate frontend gradually

## Key Features to Implement

### 1. Group Management
- Create/edit/delete groups
- View all groups
- Group-level statistics

### 2. Season Management
- Create season within group
- Clone season (copy players, teams, settings)
- Season status (DRAFT, ACTIVE, COMPLETED)
- Activate/deactivate seasons

### 3. Player Management
- Add players to group (can be reused)
- Upload players via CSV:
  ```csv
  name,category,basePrice,country
  Virat Kohli,BATSMAN,5000,India
  Rohit Sharma,BATSMAN,5000,India
  ```
- Add players to season (from group players)
- Bulk add players to season

### 4. Team Management
- Create teams in season
- Assign owners to teams
- Set team budgets
- View team rosters

### 5. Auction Flow
- Select group → Select season → Start auction
- All existing auction features work per season
- Real-time updates scoped to season

## Admin Workflow

```
1. Admin logs in
2. Creates Group: "Bhimavaram Cricket League"
3. Creates Season: "2026 Season" in that group
4. Uploads players CSV (adds to group)
5. Adds players to season (from group players)
6. Creates teams in season
7. Assigns owners to teams
8. Starts auction for season
9. Auction proceeds as before
```

## Owner/Viewer Workflow

```
1. User logs in
2. Selects Group (if multiple)
3. Selects Season (if multiple)
4. Views auction dashboard for that season
5. Places bids (if owner)
```

## API Examples

### Create Group
```bash
POST /api/groups
{
  "name": "Bhimavaram Cricket League",
  "description": "Local cricket league"
}
```

### Create Season
```bash
POST /api/groups/1/seasons
{
  "name": "2026 Season",
  "year": 2026
}
```

### Upload Players CSV
```bash
POST /api/groups/1/players/upload
Content-Type: multipart/form-data
file: players.csv
```

### Add Players to Season
```bash
POST /api/seasons/1/players/bulk
{
  "playerIds": [1, 2, 3, 4, 5]
}
```

### Create Team
```bash
POST /api/seasons/1/teams
{
  "name": "Team A",
  "ownerId": 5,
  "totalBudget": 2000
}
```

### Start Auction
```bash
POST /api/seasons/1/auction/start-random
```

## Frontend Route Structure

```
/admin
  /groups              - Manage groups
  /groups/:id/seasons  - Manage seasons in group
  /seasons/:id/players - Manage season players
  /seasons/:id/teams   - Manage teams
  /seasons/:id/auction - Auction dashboard

/dashboard
  /:groupId/:seasonId - User dashboard (with group/season selector)
```

## Next Steps

1. ✅ Create new Prisma schema
2. ⏳ Run database migration
3. ⏳ Create Group controller and routes
4. ⏳ Create Season controller and routes
5. ⏳ Update Player controller
6. ⏳ Create SeasonPlayer controller
7. ⏳ Update Team controller
8. ⏳ Update Auction controller
9. ⏳ Create migration script
10. ⏳ Update frontend components
