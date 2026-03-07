# Visual Wireframe Mockups - Auction Dashboard

## 🎨 ADMIN DASHBOARD WIREFRAME

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          ADMIN CONTROLS PANEL                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │ Admin Controls                                    [Start Next Random]    │ ║
║  ├─────────────────────────────────────────────────────────────────────────┤ ║
║  │ Quick Stats:                                                             │ ║
║  │ [Active: 45] [Sold: 12] [Unsold: 3]        Total Players: 60           │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │   CURRENT PLAYER CARD     │  │         TEAMS LEADERBOARD               │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │  ┌────────────────────────────────────┐ │ │
│  │  │   Current Player     │ │  │  │ Team          Budget    Players   │ │ │
│  │  └──────────────────────┘ │  │  ├────────────────────────────────────┤ │ │
│  │                            │  │  │ Mumbai Indians   1,250      8     │ │ │
│  │      VIRAT KOHLI           │  │  │ Chennai Super   1,180     10     │ │ │
│  │                            │  │  │ Royal Challeng  1,450      7      │ │ │
│  │    [BATSMAN]               │  │  │ Delhi Capitals  1,320      9      │ │ │
│  │                            │  │  └────────────────────────────────────┘ │ │
│  │  Base Price: ₹20           │  │                                         │ │
│  │  ────────────────────────  │  │                                         │ │
│  │                            │  │                                         │ │
│  │  Current Bid: ₹150         │  │                                         │ │
│  │                            │  │                                         │ │
│  │  [Current Bidder: Mumbai]  │  │                                         │ │
│  │                            │  │                                         │ │
│  │  Timer: 00:45              │  │                                         │ │
│  │  Ends: 3:45:30 PM          │  │                                         │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │                                         │ │
│  │  │ ADMIN CONTROLS       │ │  │                                         │ │
│  │  │ [⏸ Pause] [✅ Sold] │ │  │                                         │ │
│  │  │ [↶ Undo]             │ │  │                                         │ │
│  │  └──────────────────────┘ │  │                                         │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │                                         │ │
│  │  │ Bid History:         │ │  │                                         │ │
│  │  │ ┌──────────────────┐ │ │  │                                         │ │
│  │  │ │ Mumbai    ₹150   │ │ │  │                                         │ │
│  │  │ │ Chennai   ₹140   │ │ │  │                                         │ │
│  │  │ │ Mumbai    ₹130   │ │ │  │                                         │ │
│  │  │ │ Delhi     ₹120   │ │ │  │                                         │ │
│  │  │ └──────────────────┘ │ │  │                                         │ │
│  │  └──────────────────────┘ │  │                                         │ │
│  └──────────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                    TEAM BID TILES (4 Tiles in Row)                           │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Mumbai Indians│  │ Chennai Super│  │ Royal Challen│  │ Delhi Capitals│  │
│  │ Budget: 1,250 │  │ Budget: 1,180│  │ Budget: 1,450│  │ Budget: 1,320 │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │ [+5]          │  │ [+5]          │  │ [+5]          │  │ [+5]          │  │
│  │ [+10]         │  │ [+10]         │  │ [+10]         │  │ [+10]         │  │
│  │ [+20]         │  │ [+20]         │  │ [+20]         │  │ [+20]         │  │
│  │ [+30]         │  │ [+30]         │  │ [+30]         │  │ [+30]         │  │
│  │ [+50]         │  │ [+50]         │  │ [+50]         │  │ [+50]         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│  (Green border if current bidder)                                           │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                         PLAYERS LIST TABLE                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ # │ Name        │ Category │ Price │ Status │ Sold │ Team      │ Action│ │
│  ├───┼─────────────┼──────────┼───────┼────────┼──────┼───────────┼───────┤ │
│  │ 1 │ Virat Kohli │ BATSMAN  │  20   │ ACTIVE │  -   │ -         │       │ │
│  │ 2 │ MS Dhoni    │ WICKET   │  20   │ SOLD   │ 150  │ Mumbai    │ [🔄]  │ │
│  │ 3 │ Rohit       │ BATSMAN  │  20   │ UNSOLD │  -   │ -         │ [🔄]  │ │
│  │ 4 │ Bumrah      │ BOWLER   │  20   │ ACTIVE │  -   │ -         │       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  (Green row = Current player | Yellow = Sold | Gray = Unsold)                │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 👤 OWNER DASHBOARD WIREFRAME

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │   CURRENT PLAYER CARD     │  │         TEAMS LEADERBOARD               │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │  ┌────────────────────────────────────┐ │ │
│  │  │   Current Player     │ │  │  │ Team          Budget    Players   │ │ │
│  │  └──────────────────────┘ │  │  ├────────────────────────────────────┤ │ │
│  │                            │  │  │ Mumbai Indians   1,250      8     │ │ │
│  │      VIRAT KOHLI           │  │  │ Chennai Super   1,180     10     │ │ │
│  │                            │  │  │ Royal Challeng  1,450      7      │ │ │
│  │    [BATSMAN]               │  │  │ Delhi Capitals  1,320      9      │ │ │
│  │                            │  │  └────────────────────────────────────┘ │ │
│  │  Base Price: ₹20           │  │                                         │ │
│  │  ────────────────────────  │  │                                         │ │
│  │                            │  │                                         │ │
│  │  Current Bid: ₹150         │  │                                         │ │
│  │                            │  │                                         │ │
│  │  [Current Bidder: Mumbai]   │  │                                         │ │
│  │                            │  │                                         │ │
│  │  Timer: 00:45              │  │                                         │ │
│  │  Ends: 3:45:30 PM          │  │                                         │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │                                         │ │
│  │  │ Bid History:         │ │  │                                         │ │
│  │  │ ┌──────────────────┐ │ │  │                                         │ │
│  │  │ │ Mumbai    ₹150   │ │ │  │                                         │ │
│  │  │ │ Chennai   ₹140   │ │ │  │                                         │ │
│  │  │ │ Mumbai    ₹130   │ │ │  │                                         │ │
│  │  │ │ Delhi     ₹120   │ │ │  │                                         │ │
│  │  │ └──────────────────┘ │ │  │                                         │ │
│  │  └──────────────────────┘ │  │                                         │ │
│  │                            │  │                                         │ │
│  │  ────────────────────────  │  │                                         │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │                                         │ │
│  │  │ Place Your Bid       │ │  │                                         │ │
│  │  │                      │ │  │                                         │ │
│  │  │ [Bid +10]            │ │  │                                         │ │
│  │  │                      │ │  │                                         │ │
│  │  │ [Amount:____] [Bid]  │ │  │                                         │ │
│  │  │                      │ │  │                                         │ │
│  │  │ Minimum bid: ₹151    │ │  │                                         │ │
│  │  └──────────────────────┘ │  │                                         │ │
│  └──────────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

NOTE: Owner sees same layout but:
- NO Admin Controls Panel
- NO Team Bid Tiles
- NO Players List Table
- HAS Owner Bid Controls in card footer
```

---

## 👁️ VIEWER DASHBOARD WIREFRAME

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │   CURRENT PLAYER CARD     │  │         TEAMS LEADERBOARD               │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │  ┌────────────────────────────────────┐ │ │
│  │  │   Current Player     │ │  │  │ Team          Budget    Players   │ │ │
│  │  └──────────────────────┘ │  │  ├────────────────────────────────────┤ │ │
│  │                            │  │  │ Mumbai Indians   1,250      8     │ │ │
│  │      VIRAT KOHLI           │  │  │ Chennai Super   1,180     10     │ │ │
│  │                            │  │  │ Royal Challeng  1,450      7      │ │ │
│  │    [BATSMAN]               │  │  │ Delhi Capitals  1,320      9      │ │ │
│  │                            │  │  └────────────────────────────────────┘ │ │
│  │  Base Price: ₹20           │  │                                         │ │
│  │  ────────────────────────  │  │                                         │ │
│  │                            │  │                                         │ │
│  │  Current Bid: ₹150         │  │                                         │ │
│  │                            │  │                                         │ │
│  │  [Current Bidder: Mumbai]   │  │                                         │ │
│  │                            │  │                                         │ │
│  │  Timer: 00:45              │  │                                         │ │
│  │  Ends: 3:45:30 PM          │  │                                         │ │
│  │                            │  │                                         │ │
│  │  ┌──────────────────────┐ │  │                                         │ │
│  │  │ Bid History:         │ │  │                                         │ │
│  │  │ ┌──────────────────┐ │ │  │                                         │ │
│  │  │ │ Mumbai    ₹150   │ │ │  │                                         │ │
│  │  │ │ Chennai   ₹140   │ │ │  │                                         │ │
│  │  │ │ Mumbai    ₹130   │ │ │  │                                         │ │
│  │  │ │ Delhi     ₹120   │ │ │  │                                         │ │
│  │  │ └──────────────────┘ │ │  │                                         │ │
│  │  └──────────────────────┘ │  │                                         │ │
│  └──────────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

NOTE: Viewer sees:
- NO Admin Controls Panel
- NO Team Bid Tiles
- NO Players List Table
- NO Bid Controls
- ONLY Read-only view of auction progress
```

---

## 📱 MOBILE RESPONSIVE LAYOUT (All Roles)

```
┌─────────────────────────────┐
│                             │
│   ADMIN CONTROLS PANEL       │
│   [Stats] [Start Button]     │
│                             │
├─────────────────────────────┤
│                             │
│   CURRENT PLAYER CARD        │
│   (Full Width)               │
│                             │
│   ┌─────────────────────┐   │
│   │  Player Info        │   │
│   │  Current Bid        │   │
│   │  Timer              │   │
│   │  [Controls]         │   │
│   │  Bid History        │   │
│   │  [Owner Bids]       │   │
│   └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│                             │
│   TEAMS LEADERBOARD          │
│   (Full Width)               │
│                             │
│   ┌─────────────────────┐   │
│   │ Team | Budget | #   │   │
│   │ ─────────────────── │   │
│   │ Mumbai | 1250 | 8  │   │
│   │ Chennai| 1180 | 10  │   │
│   └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│                             │
│   TEAM BID TILES             │
│   (Stacked Vertically)       │
│                             │
│   ┌─────────────────────┐   │
│   │ Mumbai Indians       │   │
│   │ [+5][+10][+20]       │   │
│   │ [+30][+50]           │   │
│   └─────────────────────┘   │
│   ┌─────────────────────┐   │
│   │ Chennai Super       │   │
│   │ [+5][+10][+20]       │   │
│   │ [+30][+50]           │   │
│   └─────────────────────┘   │
│   (Repeat for all teams)     │
│                             │
├─────────────────────────────┤
│                             │
│   PLAYERS LIST TABLE         │
│   (Horizontal Scroll)       │
│                             │
│   [Scroll →]                 │
│   #|Name|Cat|Price|Status... │
│                             │
└─────────────────────────────┘
```

---

## 🎨 COMPONENT DETAILS

### Current Player Card - Detailed Breakdown

```
┌─────────────────────────────────────┐
│  Current Player          [Header]   │
├─────────────────────────────────────┤
│                                     │
│         VIRAT KOHLI                 │
│                                     │
│      [BATSMAN]                      │
│                                     │
│    Base Price: ₹20                  │
│  ─────────────────────────────────  │
│                                     │
│    Current Bid: ₹150                │
│                                     │
│  [Current Bidder: Mumbai Indians]   │
│                                     │
│  [Auction Paused] ← Status Badge    │
│                                     │
│  Timer: 00:45                       │
│  Ends: 3:45:30 PM                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [⏸ Pause] [✅ Sold] [↶ Undo] │ │ ← Admin Only
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Bid History:                 │ │
│  │ ┌───────────────────────────┐ │ │
│  │ │ Mumbai    ₹150   3:44 PM │ │ │
│  │ │ Chennai   ₹140   3:43 PM │ │ │
│  │ │ Mumbai    ₹130   3:42 PM │ │ │
│  │ └───────────────────────────┘ │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐ │ ← Owner Only
│  │ Place Your Bid                │ │
│  │                               │ │
│  │ [Bid +10]                     │ │
│  │                               │ │
│  │ [Amount:____] [Bid]           │ │
│  │                               │ │
│  │ Minimum bid: ₹151             │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Team Bid Tile - Detailed Breakdown

```
┌─────────────────────┐
│ Mumbai Indians      │ ← Header (Light BG)
│ Budget: 1,250       │ ← Small text
├─────────────────────┤
│                     │
│ [+5]                │ ← Button (outline-primary)
│ [+10]               │
│ [+20]               │
│ [+30]               │
│ [+50]               │
│                     │
└─────────────────────┘
(Green border if current bidder)
```

### Players List Table - Detailed Breakdown

```
┌──────────────────────────────────────────────────────────────────────┐
│ Players List                                    [Info Blue Header]   │
├──────────────────────────────────────────────────────────────────────┤
│ # │ Name      │ Category │ Price │ Status │ Sold │ Team    │ Action│
├───┼───────────┼──────────┼───────┼────────┼──────┼─────────┼───────┤
│ 1 │ Virat     │ BATSMAN  │  20   │ ACTIVE │  -   │ -       │       │ ← Green row
│ 2 │ MS Dhoni  │ WICKET   │  20   │ SOLD   │ 150  │ Mumbai  │ [🔄]  │ ← Yellow row
│ 3 │ Rohit     │ BATSMAN  │  20   │ UNSOLD │  -   │ -       │ [🔄]  │ ← Gray row
│ 4 │ Bumrah    │ BOWLER   │  20   │ ACTIVE │  -   │ -       │       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 STATE VARIATIONS

### When Auction is LIVE
- Timer countdown active
- Bid buttons enabled
- "Pause" button visible (Admin)
- Status badge: None (or "LIVE" in green)

### When Auction is PAUSED
- Timer shows "PAUSED"
- Bid buttons disabled
- "Resume" button visible (Admin)
- Status badge: "Auction Paused" (yellow)

### When No Current Player
- Shows "Waiting for auction to start..."
- All bid controls hidden
- Stats still visible (Admin)

### When Timer Expires
- Timer shows "00:00"
- Auto-completes auction
- Shows completion message
- Auto-starts next player (Admin, if available)

---

## 🎯 KEY INTERACTIONS

### Admin Interactions:
1. Click "Start Next Random Player" → Starts auction with random player
2. Click "+5" on team tile → Places bid of currentPrice + 5 for that team
3. Click "⏸ Pause" → Pauses auction timer
4. Click "▶ Resume" → Resumes auction timer
5. Click "✅ Sold" → Marks player as sold to current bidder
6. Click "↶ Undo" → Reverts last bid
7. Click "🔄 Reopen" → Reopens player for re-auction

### Owner Interactions:
1. Click "Bid +10" → Places bid of currentPrice + 10
2. Enter amount + Click "Bid" → Places custom bid amount
3. View bid history → Scrollable list updates in real-time

### Viewer Interactions:
1. Observe auction → Read-only view updates in real-time
2. View bid history → Scrollable list updates automatically

---

## 📐 DIMENSIONS & SPACING

### Card Dimensions:
- Current Player Card: ~400px width (4 columns on desktop)
- Teams Table: ~800px width (8 columns on desktop)
- Team Bid Tiles: ~200px width each (4 per row on desktop)

### Spacing:
- Margin between sections: 20px
- Padding inside cards: 15px
- Gap between buttons: 8px
- Gap between tiles: 15px

### Typography:
- Page Title: 24px, Bold
- Card Header: 18px, Bold
- Player Name: 28px, Bold
- Current Bid: 32px, Bold, Green
- Timer: 20px, Bold, Yellow badge
- Body Text: 14px, Regular
- Small Text: 12px, Gray

---

These wireframes provide a complete visual reference for implementing the auction dashboard interface for all three user roles.
