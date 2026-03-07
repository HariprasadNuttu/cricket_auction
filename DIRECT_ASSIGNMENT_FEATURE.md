# Direct Assignment / Pre-Auction Assignment Feature

## Overview

This feature allows admins to directly assign players to teams with a fixed amount (or ₹0) without going through the auction process. This is commonly used for retained players, drafted players, or pre-auction assignments.

---

## Database Changes

### New Enum: `SoldType`
```prisma
enum SoldType {
  AUCTION
  DIRECT_ASSIGN
  TRADE
}
```

### Updated Model: `SeasonPlayer`
Added fields:
- `soldType: SoldType?` - How the player was sold/assigned
- `soldAt: DateTime?` - When the player was sold/assigned

---

## API Endpoints

### 1. Direct Assign Single Player
**Endpoint:** `POST /api/seasons/:seasonId/direct-assign`

**Request Body:**
```json
{
  "seasonPlayerId": 1,
  "teamId": 2,
  "amount": 5000
}
```

**Response:**
```json
{
  "message": "Player assigned successfully",
  "seasonPlayerId": 1,
  "teamId": 2,
  "amount": 5000
}
```

**Validations:**
- Player must be ACTIVE
- Team squad not full (max 15 players)
- Budget sufficient if amount > 0
- Player and team belong to the season

---

### 2. Bulk Direct Assign via CSV
**Endpoint:** `POST /api/seasons/:seasonId/direct-assign/bulk`

**Request:** Multipart form data with CSV file

**CSV Format:**
```csv
player_name,team_name,price
Rohit Sharma,Mumbai Indians,0
Virat Kohli,Chennai Super Kings,5000
Hardik Pandya,Royal Challengers,3000
```

**Response:**
```json
{
  "message": "Processed 3 assignments",
  "success": 2,
  "errors": 1,
  "details": {
    "success": [...],
    "errors": [...]
  }
}
```

---

### 3. Remove Direct Assignment
**Endpoint:** `POST /api/seasons/:seasonId/direct-assign/remove`

**Request Body:**
```json
{
  "seasonPlayerId": 1
}
```

**Response:**
```json
{
  "message": "Direct assignment removed successfully",
  "seasonPlayerId": 1
}
```

**What it does:**
- Reverts player status to ACTIVE
- Returns budget to team (if amount > 0)
- Decrements team player count
- Clears soldType and soldAt

---

## Business Logic

### When Assigning Player:

1. **Check Player Status:**
   - Must be `ACTIVE`
   - Cannot assign if already `SOLD`

2. **Check Team Squad:**
   - Max 15 players per team
   - Reject if team already has 15 players

3. **Check Budget:**
   - If `amount > 0`: Team must have sufficient budget
   - If `amount = 0`: No budget check needed

4. **Update Records:**
   - Set `status = SOLD`
   - Set `soldPrice = amount`
   - Set `soldType = DIRECT_ASSIGN`
   - Set `soldAt = current timestamp`
   - Set `teamId = teamId`

5. **Update Team:**
   - If `amount > 0`: Deduct from `remainingBudget`
   - Increment `totalPlayers` (always)

6. **Create Audit Log:**
   - Event type: `player_direct_assign`
   - Logs: player, team, amount, admin

---

## Auction Integration

### Updated Auction Logic:

1. **Random Player Selection:**
   - Only selects players with `status = ACTIVE` AND `soldType = null`
   - Directly assigned players are excluded

2. **Auction Completion:**
   - Sets `soldType = AUCTION` when player is sold via auction

3. **Reopen Player:**
   - Clears `soldType` when reopening player

---

## UI Features Needed

### Admin Dashboard:

1. **Players Table:**
   - Add "Sold Type" column
   - Show: `AUCTION`, `DIRECT_ASSIGN`, `TRADE`, or `-`
   - Highlight directly assigned players

2. **Quick Assign Button:**
   - Button: `[Assign]` next to each ACTIVE player
   - Opens modal with:
     - Team selector dropdown
     - Amount input (default: 0)
     - Assign button

3. **Bulk Assign Section:**
   - Upload CSV button
   - Download CSV template
   - Show assignment results

4. **Direct Assignment List:**
   - Filter: Show only directly assigned players
   - Option to remove assignment

---

## Example Workflow

### Scenario: Pre-Auction Retentions

```
1. Admin creates Group: "Bhimavaram Premier League"
2. Admin creates Season: "2026 Season"
3. Admin uploads 60 players
4. Admin creates 4 teams
5. Admin directly assigns retained players:
   - Rohit → Mumbai → ₹0
   - Virat → Chennai → ₹5000
   - Hardik → Royal → ₹3000
6. Admin starts auction
7. Auction runs for remaining 57 players
```

---

## CSV Template

**File:** `direct-assign-template.csv`

```csv
player_name,team_name,price
Rohit Sharma,Mumbai Indians,0
Virat Kohli,Chennai Super Kings,5000
Hardik Pandya,Royal Challengers,3000
MS Dhoni,Delhi Capitals,4000
```

**Notes:**
- `player_name` must match exactly (case-insensitive)
- `team_name` must match exactly (case-insensitive)
- `price` can be 0 or any positive number

---

## Edge Cases Handled

1. **Player Already Sold:**
   - Error: "Player is already SOLD. Cannot assign."

2. **Team Squad Full:**
   - Error: "Team squad is full (15 players). Cannot assign more players."

3. **Insufficient Budget:**
   - Error: "Insufficient budget. Remaining: X, Required: Y"

4. **Player Not in Season:**
   - Error: "Player not found in season"

5. **Team Not in Season:**
   - Error: "Team not found in season"

6. **Duplicate Assignment:**
   - Prevented by status check

---

## Audit Trail

All direct assignments are logged in `AuctionLog`:

```json
{
  "eventType": "player_direct_assign",
  "seasonId": 1,
  "playerId": 5,
  "teamId": 2,
  "amount": 5000,
  "userId": 1,
  "details": {
    "soldType": "DIRECT_ASSIGN",
    "teamName": "Mumbai Indians",
    "playerName": "Rohit Sharma"
  }
}
```

---

## API Examples

### Assign Player with Amount
```bash
curl -X POST http://localhost:3000/api/seasons/1/direct-assign \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seasonPlayerId": 5,
    "teamId": 2,
    "amount": 5000
  }'
```

### Assign Player for Free (₹0)
```bash
curl -X POST http://localhost:3000/api/seasons/1/direct-assign \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seasonPlayerId": 5,
    "teamId": 2,
    "amount": 0
  }'
```

### Bulk Assign via CSV
```bash
curl -X POST http://localhost:3000/api/seasons/1/direct-assign/bulk \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@assignments.csv"
```

### Remove Assignment
```bash
curl -X POST http://localhost:3000/api/seasons/1/direct-assign/remove \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seasonPlayerId": 5
  }'
```

---

## Database Queries

### Get All Directly Assigned Players
```typescript
const directAssignments = await prisma.seasonPlayer.findMany({
  where: {
    seasonId: 1,
    soldType: 'DIRECT_ASSIGN'
  },
  include: {
    player: true,
    team: true
  }
});
```

### Get Available Players for Auction
```typescript
const availablePlayers = await prisma.seasonPlayer.findMany({
  where: {
    seasonId: 1,
    status: 'ACTIVE',
    soldType: null // Not directly assigned
  }
});
```

---

## Frontend Integration Points

### 1. Players Table Column
Add "Sold Type" column showing:
- `AUCTION` - Sold via auction
- `DIRECT_ASSIGN` - Directly assigned
- `TRADE` - Traded (future feature)
- `-` - Not sold

### 2. Assign Button
```html
<button *ngIf="player.status === 'ACTIVE'" 
        (click)="openAssignModal(player)">
  Assign
</button>
```

### 3. Assign Modal
```html
<div class="modal">
  <h5>Assign Player: {{ player.name }}</h5>
  <select [(ngModel)]="selectedTeamId">
    <option *ngFor="let team of teams" [value]="team.id">
      {{ team.name }}
    </option>
  </select>
  <input type="number" [(ngModel)]="assignAmount" min="0" placeholder="Amount (0 for free)">
  <button (click)="assignPlayer()">Assign</button>
</div>
```

---

## Testing Checklist

- [ ] Assign player with amount > 0
- [ ] Assign player with amount = 0
- [ ] Try to assign already sold player (should fail)
- [ ] Try to assign to full team (should fail)
- [ ] Try to assign with insufficient budget (should fail)
- [ ] Bulk assign via CSV
- [ ] Remove direct assignment
- [ ] Verify auction excludes directly assigned players
- [ ] Verify audit logs created
- [ ] Verify team budget updated correctly
- [ ] Verify team player count updated correctly

---

## Future Enhancements

1. **Trade Feature:**
   - Transfer players between teams
   - Set `soldType = TRADE`

2. **Retention Rules:**
   - Auto-retain X players per team
   - Set retention amount automatically

3. **Assignment History:**
   - View all direct assignments
   - Filter by team/player

4. **Bulk Operations:**
   - Assign multiple players to same team
   - Set same amount for multiple players

---

Feature implementation complete! ✅
