# Wireframe Component Specifications

Detailed specifications for each UI component used in the auction dashboard.

---

## 📦 COMPONENT LIBRARY

### 1. Admin Controls Panel

**Component Name:** `admin-controls-panel`  
**Role:** ADMIN only  
**Location:** Top of dashboard, full width

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Admin Controls                    [Start Next Random]   │ ← Header (Red BG, White Text)
├─────────────────────────────────────────────────────────┤
│ Quick Stats:                                             │
│ [Active: 45] [Sold: 12] [Unsold: 3]                     │ ← Badges (Blue, Green, Gray)
│                                    Total Players: 60     │ ← Right-aligned text
└─────────────────────────────────────────────────────────┘
```

**Props:**
- `activeCount: number`
- `soldCount: number`
- `unsoldCount: number`
- `totalPlayers: number`
- `isAuctionLive: boolean`
- `onStartRandom: () => void`

**States:**
- Button disabled: `isAuctionLive || activeCount === 0`

---

### 2. Current Player Card

**Component Name:** `current-player-card`  
**Role:** All roles (with variations)  
**Location:** Left column (4 cols desktop, full width mobile)

**Structure:**
```
┌─────────────────────────────────────┐
│ Current Player                      │ ← Header (Blue BG)
├─────────────────────────────────────┤
│         [Player Name]              │ ← Large, centered
│      [Category Badge]               │ ← Badge
│    Base Price: ₹X                  │ ← Text
│  ────────────────────────────────  │ ← Divider
│    Current Bid: ₹X                 │ ← Large, green
│  [Current Bidder Badge]             │ ← Info badge
│  [Status Badge]                     │ ← Warning badge (if paused)
│  Timer: MM:SS                       │ ← Timer display
│  Ends: HH:MM:SS AM/PM              │ ← Time display
│                                     │
│  [Admin Controls] ← Admin only      │
│                                     │
│  [Bid History] ← All roles         │
│                                     │
│  [Owner Bid Controls] ← Owner only  │
└─────────────────────────────────────┘
```

**Props:**
- `player: Player | null`
- `auctionState: AuctionState`
- `bidHistory: Bid[]`
- `userRole: 'ADMIN' | 'OWNER' | 'VIEWER'`
- `onPause: () => void` (Admin)
- `onResume: () => void` (Admin)
- `onSell: () => void` (Admin)
- `onUndo: () => void` (Admin)
- `onBid: (amount: number) => void` (Owner)

**Variants:**
- **Admin:** Includes admin controls section
- **Owner:** Includes owner bid controls in footer
- **Viewer:** Read-only, no controls

---

### 3. Admin Controls Section

**Component Name:** `admin-auction-controls`  
**Role:** ADMIN only  
**Location:** Inside Current Player Card

**Structure:**
```
┌─────────────────────────────────────┐
│ [⏸ Pause] [✅ Sold] [↶ Undo]     │ ← Button group (LIVE state)
│ [▶ Resume] [✅ Sold] [↶ Undo]      │ ← Button group (PAUSED state)
└─────────────────────────────────────┘
```

**Props:**
- `auctionStatus: 'LIVE' | 'PAUSED'`
- `hasCurrentBidder: boolean`
- `onPause: () => void`
- `onResume: () => void`
- `onSell: () => void`
- `onUndo: () => void`

**Button States:**
- Sold/Undo disabled: `!hasCurrentBidder`

---

### 4. Team Bid Tiles

**Component Name:** `team-bid-tiles`  
**Role:** ADMIN only  
**Location:** Below Current Player Card

**Structure:**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Team 1   │ │ Team 2   │ │ Team 3   │ │ Team 4   │ ← 4 tiles per row
│ Budget   │ │ Budget   │ │ Budget   │ │ Budget   │
├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│ [+5]     │ │ [+5]     │ │ [+5]     │ │ [+5]     │
│ [+10]    │ │ [+10]    │ │ [+10]    │ │ [+10]    │
│ [+20]    │ │ [+20]    │ │ [+20]    │ │ [+20]    │
│ [+30]    │ │ [+30]    │ │ [+30]    │ │ [+30]    │
│ [+50]    │ │ [+50]    │ │ [+50]    │ │ [+50]    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Component Name:** `team-bid-tile` (Individual tile)

**Props:**
- `team: Team`
- `currentPrice: number`
- `isCurrentBidder: boolean`
- `onBid: (amount: number, teamId: number) => void`

**Visual States:**
- Normal: White background, gray border
- Current Bidder: Green border highlight
- Button disabled: `!canBid(teamId, amount)`

---

### 5. Teams Leaderboard Table

**Component Name:** `teams-leaderboard`  
**Role:** All roles  
**Location:** Right column (8 cols desktop, full width mobile)

**Structure:**
```
┌─────────────────────────────────────┐
│ Teams                               │ ← Header
├─────────────────────────────────────┤
│ Team          Budget    Players    │ ← Table header
├─────────────────────────────────────┤
│ Mumbai        1,250      8         │ ← Table row
│ Chennai       1,180     10         │
│ Royal         1,450      7         │
│ Delhi         1,320      9         │
└─────────────────────────────────────┘
```

**Props:**
- `teams: Team[]`

**Table Columns:**
1. Team name (bold)
2. Budget (badge, blue)
3. Players (badge, gray)

---

### 6. Owner Bid Controls

**Component Name:** `owner-bid-controls`  
**Role:** OWNER only  
**Location:** Footer of Current Player Card

**Structure:**
```
┌─────────────────────────────────────┐
│ Place Your Bid                      │ ← Title
│                                     │
│ [Bid +10]                           │ ← Full-width button (green)
│                                     │
│ [Amount:____] [Bid]                 │ ← Input group
│                                     │
│ Minimum bid: ₹X                     │ ← Helper text (gray, small)
└─────────────────────────────────────┘
```

**Props:**
- `currentPrice: number`
- `isAuctionLive: boolean`
- `onBid: (amount: number) => void`

**Validation:**
- Input min: `currentPrice + 1`
- Button disabled: `!isAuctionLive || amount <= currentPrice`

---

### 7. Bid History List

**Component Name:** `bid-history-list`  
**Role:** All roles  
**Location:** Inside Current Player Card

**Structure:**
```
┌─────────────────────────────────────┐
│ Bid History:                        │ ← Title
│ ┌─────────────────────────────────┐ │
│ │ Mumbai    ₹150   3:44 PM       │ │ ← Bid item
│ │ Chennai   ₹140   3:43 PM       │ │
│ │ Mumbai    ₹130   3:42 PM       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Component Name:** `bid-history-item` (Individual item)

**Props:**
- `bid: Bid`

**Structure:**
- Team name (bold)
- Amount (badge, green)
- Timestamp (small, gray, right-aligned)

**Scrollable:** Max height 200px, vertical scroll

---

### 8. Players List Table

**Component Name:** `players-list-table`  
**Role:** ADMIN only  
**Location:** Bottom of dashboard, full width

**Structure:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Players List                                    [Info Blue Header]   │
├──────────────────────────────────────────────────────────────────────┤
│ # │ Name │ Category │ Price │ Status │ Sold │ Team │ Actions       │
├───┼──────┼──────────┼───────┼────────┼──────┼──────┼───────────────┤
│ 1 │ Virat│ BATSMAN  │  20   │ ACTIVE │  -   │ -    │               │
│ 2 │ MS   │ WICKET   │  20   │ SOLD   │ 150  │ Mum  │ [🔄 Reopen]   │
└──────────────────────────────────────────────────────────────────────┘
```

**Props:**
- `players: Player[]`
- `currentPlayerId: number | null`
- `onReopen: (playerId: number) => void`

**Row Highlighting:**
- Current player: Green background
- Sold: Yellow background
- Unsold: Gray background

**Actions Column:**
- Reopen button: Only for SOLD/UNSOLD players

---

### 9. Timer Display

**Component Name:** `timer-display`  
**Role:** All roles  
**Location:** Inside Current Player Card

**Structure:**
```
Timer: MM:SS                    ← Large, bold, yellow badge
Ends: HH:MM:SS AM/PM            ← Small, gray text below
```

**Props:**
- `timerEndsAt: Date | null`
- `status: 'LIVE' | 'PAUSED' | 'READY'`

**States:**
- LIVE: Shows countdown (MM:SS)
- PAUSED: Shows "PAUSED" text
- READY: Shows "00:00"

**Update Frequency:** Every 1 second

---

### 10. Status Badge

**Component Name:** `status-badge`  
**Role:** All roles  
**Location:** Various locations

**Variants:**
- **Auction Paused:** Yellow badge with dark text
- **Auction Live:** Green badge (optional)
- **Player Status:**
  - ACTIVE: Blue badge
  - SOLD: Green badge
  - UNSOLD: Red badge

**Props:**
- `status: string`
- `variant: 'auction' | 'player'`

---

## 🎨 DESIGN TOKENS

### Colors
```css
--primary: #0d6efd (Blue)
--success: #198754 (Green)
--warning: #ffc107 (Yellow)
--danger: #dc3545 (Red)
--secondary: #6c757d (Gray)
--info: #0dcaf0 (Cyan)
```

### Spacing
```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

### Typography
```css
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-md: 16px
--font-size-lg: 18px
--font-size-xl: 24px
--font-size-xxl: 32px
```

### Border Radius
```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
```

---

## 📱 RESPONSIVE BREAKPOINTS

```css
--breakpoint-sm: 576px   /* Mobile */
--breakpoint-md: 768px   /* Tablet */
--breakpoint-lg: 992px   /* Desktop */
--breakpoint-xl: 1200px  /* Large Desktop */
```

### Grid System
- **Desktop (≥992px):** 12-column grid
  - Current Player: 4 cols
  - Teams Table: 8 cols
  - Team Tiles: 3 cols each (4 per row)
  
- **Tablet (768-991px):** 12-column grid
  - Current Player: 6 cols
  - Teams Table: 6 cols
  - Team Tiles: 6 cols each (2 per row)
  
- **Mobile (<768px):** Stacked
  - All sections: 12 cols (full width)
  - Team Tiles: Stacked vertically

---

## 🔄 STATE MANAGEMENT

### Auction States
- **READY:** No active auction
- **LIVE:** Auction in progress
- **PAUSED:** Auction paused
- **COMPLETED:** Auction finished

### Component States
- **Loading:** Fetching data
- **Error:** API error occurred
- **Success:** Data loaded
- **Empty:** No data available

---

## 🎯 INTERACTION PATTERNS

### Button Interactions
1. **Hover:** Slight scale/color change
2. **Active:** Pressed state
3. **Disabled:** Grayed out, no interaction
4. **Loading:** Spinner overlay

### Form Interactions
1. **Focus:** Border highlight
2. **Error:** Red border + error message
3. **Success:** Green border (optional)
4. **Validation:** Real-time feedback

### Real-time Updates
1. **WebSocket:** Auto-update on events
2. **Polling:** Fallback if WebSocket fails
3. **Optimistic Updates:** Immediate UI feedback
4. **Error Recovery:** Retry mechanism

---

This component specification provides all the details needed to implement each UI component consistently across the application.
