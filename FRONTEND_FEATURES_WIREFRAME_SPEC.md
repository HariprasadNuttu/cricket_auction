# Frontend Features - Wireframe Specification

This document provides a detailed breakdown of all frontend features organized by user role (Admin, Owner, Viewer) for wireframe generation.

---

## 🔐 Authentication Pages (All Roles)

### Login Page (`/login`)
**Components:**
- Email input field
- Password input field
- Login button
- Register link/button
- Error message display (if login fails)

**Features:**
- Form validation
- JWT token storage on successful login
- Redirect to dashboard after login

---

### Register Page (`/register`)
**Components:**
- Full Name input field
- Email input field
- Password input field
- Role dropdown selector:
  - Viewer (default)
  - Team Owner
  - Admin
- Team Name input field (shown only when role = "OWNER")
- Register button
- Error message display

**Features:**
- Conditional team name field based on role selection
- Form validation
- Auto-login after registration

---

## 📊 Dashboard Page (`/dashboard`)

The dashboard is the main auction interface. Features vary by role.

---

## 👑 ADMIN Role Features

### 1. Admin Controls Panel (Top Section)
**Location:** Top of dashboard, full width
**Visibility:** Only visible to ADMIN

**Components:**
- **Card Header:**
  - Title: "Admin Controls"
  - Background: Red/Danger color
  - "Start Next Random Player" button (right-aligned)
    - Disabled when: auction is LIVE OR no active players available

- **Card Body:**
  - **Quick Stats Section (Left):**
    - Badge: "Active: X" (blue)
    - Badge: "Sold: X" (green)
    - Badge: "Unsold: X" (gray)
  - **Total Players (Right):**
    - Text: "Total Players: X"

**Functionality:**
- Click "Start Next Random Player" → Automatically selects random ACTIVE player and starts auction
- Stats update in real-time

---

### 2. Current Player Card (Left Column - 4 columns)
**Location:** Left side, below admin controls
**Visibility:** Visible to all roles, but admin has additional controls

**Components:**
- **Card Header:** "Current Player" (blue background, white text)
- **Card Body:**
  - Player name (large, centered)
  - Player category badge (e.g., "BATSMAN", "BOWLER")
  - Base price display
  - Horizontal divider
  - **Current Bid:** Large green text showing current bid amount
  - **Current Bidder Badge:** Shows team name of current highest bidder
  - **Auction Status Badge:**
    - "Auction Paused" (yellow badge) - when status = PAUSED
  - **Timer Display:**
    - Timer countdown (MM:SS format) - when status = LIVE
    - Timer end time below countdown

- **Admin Controls Section (Only for ADMIN):**
  - **When Auction is LIVE:**
    - Button: "⏸ Pause" (yellow/warning)
    - Button: "✅ Sold" (green/success) - disabled if no bidder
    - Button: "↶ Undo" (gray/secondary) - disabled if no bidder
  - **When Auction is PAUSED:**
    - Button: "▶ Resume" (blue/primary)
    - Button: "✅ Sold" (green/success) - disabled if no bidder
    - Button: "↶ Undo" (gray/secondary) - disabled if no bidder

- **Bid History Section (Visible to all):**
  - Title: "Bid History:"
  - Scrollable list (max-height: 200px)
  - Each bid shows:
    - Team name (bold)
    - Bid amount (green badge)
    - Timestamp (small, gray text)
  - Empty state: No history shown if no bids

**Functionality:**
- Real-time updates via WebSocket
- Admin can pause/resume auction
- Admin can mark player as sold
- Admin can undo last bid
- Bid history updates automatically

---

### 3. Team Bid Tiles (Below Current Player Card)
**Location:** Below current player card, in 4-column grid
**Visibility:** Only visible to ADMIN when auction is LIVE or PAUSED

**Layout:** 4 cards in a row (responsive: 2 columns on tablet, 1 on mobile)

**Each Team Card Contains:**
- **Card Header:**
  - Team name (bold)
  - Remaining budget (small, gray text)
  - Border highlight: Green border if this team is current highest bidder

- **Card Body:**
  - 5 Quick Bid Buttons (stacked vertically):
    - "+5" button
    - "+10" button
    - "+20" button
    - "+30" button
    - "+50" button
  - Buttons are disabled if:
    - Team doesn't have enough budget
    - Bid amount is not higher than current price
    - Auction is not LIVE

**Functionality:**
- Admin clicks any increment button → Places bid on behalf of that team
- Buttons auto-disable based on budget/price validation
- Visual feedback: Current bidder team card has green border

---

### 4. Teams Leaderboard Table (Right Column - 8 columns)
**Location:** Right side of dashboard
**Visibility:** Visible to all roles

**Components:**
- **Card Header:** "Teams"
- **Card Body:**
  - Compact table with columns:
    - **Team:** Team name (bold)
    - **Budget Left:** Badge showing remaining budget (blue badge)
    - **Players:** Badge showing total players acquired (gray badge)

**Functionality:**
- Real-time budget updates
- Shows all teams in the auction

---

### 5. Players List Table (Bottom Section - Full Width)
**Location:** Bottom of dashboard
**Visibility:** Only visible to ADMIN

**Components:**
- **Card Header:** "Players List" (info blue background, white text)
- **Card Body:**
  - Responsive table with columns:
    - **#:** Row number
    - **Name:** Player name (bold)
    - **Category:** Badge (e.g., BATSMAN, BOWLER)
    - **Base Price:** Numeric value
    - **Status:** Badge
      - Green: SOLD
      - Red: UNSOLD
      - Blue: ACTIVE
    - **Sold Price:** Numeric value or "-"
    - **Team:** Team name or "-"
    - **Actions:** (Only for ADMIN)
      - "🔄 Reopen" button (shown only for SOLD/UNSOLD players)

**Row Highlighting:**
- Green background: Current player being auctioned
- Yellow background: Sold players
- Gray background: Unsold players

**Functionality:**
- Admin can reopen sold/unsold players for re-auction
- Table updates in real-time
- Visual indicators for player status

---

## 👤 OWNER Role Features

### 1. Current Player Card (Same as Admin, but NO Admin Controls)
**Location:** Left side (4 columns)
**Visibility:** Visible to OWNER

**Components:**
- Same as Admin version EXCEPT:
  - No admin control buttons (Pause/Resume/Sold/Undo)
  - Has **Owner Bid Controls** in card footer (see below)

**Owner Bid Controls (Card Footer):**
- **Title:** "Place Your Bid"
- **Quick Bid Button:**
  - "Bid +10" button (full width, green)
  - Disabled when: auction not LIVE
- **Custom Bid Input:**
  - Number input field
  - "Bid" button (primary blue)
  - Disabled when:
    - Auction not LIVE
    - No amount entered
    - Amount <= current price
- **Helper Text:**
  - "Minimum bid: X" (gray, small text)

**Functionality:**
- Owner can place bids for their own team only
- Real-time validation
- Auto-disables when auction is not LIVE

---

### 2. Teams Leaderboard Table (Same as Admin)
**Location:** Right side (8 columns)
**Visibility:** Visible to OWNER

**Components:**
- Same as Admin version
- Shows all teams with budgets and player counts

---

### 3. Bid History (Same as Admin)
**Location:** Inside Current Player Card
**Visibility:** Visible to OWNER

**Components:**
- Same scrollable bid history list
- Shows all bids for current player

---

## 👁️ VIEWER Role Features

### 1. Current Player Card (Read-Only)
**Location:** Left side (4 columns)
**Visibility:** Visible to VIEWER

**Components:**
- Same as Owner version EXCEPT:
  - **NO bid controls**
  - **NO admin controls**
  - Only displays:
    - Player information
    - Current bid
    - Timer
    - Bid history

**Functionality:**
- Read-only view
- Real-time updates via WebSocket
- Can observe auction progress

---

### 2. Teams Leaderboard Table (Same as Admin/Owner)
**Location:** Right side (8 columns)
**Visibility:** Visible to VIEWER

**Components:**
- Same table as other roles
- Read-only view of team standings

---

### 3. Bid History (Same as Other Roles)
**Location:** Inside Current Player Card
**Visibility:** Visible to VIEWER

**Components:**
- Same scrollable bid history
- Read-only view

---

## 🔄 Real-Time Features (All Roles)

### WebSocket Updates
**Events:**
- `AUCTION_UPDATE`: Updates current price, bidder, timer, status, bid history
- `AUCTION_COMPLETE`: Notifies when player is sold/unsold
- `ERROR`: Displays error messages (e.g., bid failed, insufficient budget)

**Auto-Actions:**
- Admin dashboard: Auto-starts next random player 2 seconds after auction completes (if active players available)
- Timer countdown: Updates every second
- State sync: Fetches full state on WebSocket reconnect

---

## 📱 Responsive Design

### Desktop (≥992px)
- Admin Controls: Full width
- Current Player Card: 4 columns
- Teams Table: 8 columns
- Team Bid Tiles: 4 columns (4 tiles per row)
- Players Table: Full width

### Tablet (768px - 991px)
- Admin Controls: Full width
- Current Player Card: 6 columns
- Teams Table: 6 columns
- Team Bid Tiles: 2 columns (2 tiles per row)
- Players Table: Full width

### Mobile (<768px)
- Admin Controls: Full width
- Current Player Card: 12 columns (full width)
- Teams Table: 12 columns (full width)
- Team Bid Tiles: 12 columns (1 tile per row, stacked)
- Players Table: Full width with horizontal scroll

---

## 🎨 UI Components & Styling

### Color Scheme
- **Primary (Blue):** Buttons, badges, headers
- **Success (Green):** Sold status, bid amounts, success actions
- **Warning (Yellow):** Paused status, timer
- **Danger (Red):** Admin controls header, unsold status
- **Secondary (Gray):** Disabled states, unsold players

### Badges
- Status badges: Green (SOLD), Red (UNSOLD), Blue (ACTIVE)
- Count badges: Blue (budget), Gray (players)
- Category badges: Gray (player category)

### Buttons
- Primary: Blue (main actions)
- Success: Green (bid, sell)
- Warning: Yellow (pause)
- Secondary: Gray (undo, secondary actions)
- Outline: For team bid tiles

### Cards
- White background
- Border radius
- Shadow on hover
- Header with colored background (role-specific)

---

## 🔔 User Feedback & Validation

### Error Messages
- Displayed via `alert()` dialogs
- Examples:
  - "Bid must be higher than current price (X)"
  - "Insufficient budget. Remaining: X"
  - "Auction is not currently live"
  - "Rate limit: Please wait X second(s)"

### Success Feedback
- Real-time UI updates
- Visual highlights (green border on current bidder)
- Automatic state refresh

### Disabled States
- Buttons disabled based on:
  - Auction status (not LIVE)
  - Budget constraints
  - No current bidder (for sell/undo)
  - No active players (for start auction)

---

## 📋 Feature Summary by Role

### ADMIN Features:
✅ Start random player auction  
✅ View quick stats (active/sold/unsold players)  
✅ Pause auction  
✅ Resume auction  
✅ Mark player as sold  
✅ Undo last bid  
✅ Place bids on behalf of any team (via tiles)  
✅ View complete players list  
✅ Reopen sold/unsold players  
✅ View bid history  
✅ View teams leaderboard  

### OWNER Features:
✅ View current player  
✅ Place bids for own team  
✅ Quick bid (+10)  
✅ Custom bid amount  
✅ View bid history  
✅ View teams leaderboard  
✅ View timer countdown  

### VIEWER Features:
✅ View current player (read-only)  
✅ View bid history (read-only)  
✅ View teams leaderboard (read-only)  
✅ View timer countdown  

---

## 🎯 Wireframe Priority

### High Priority (Core Features):
1. **Dashboard Layout** - Main structure
2. **Current Player Card** - Central auction display
3. **Admin Controls Panel** - Auction management
4. **Team Bid Tiles** (Admin) - Quick bidding interface
5. **Owner Bid Controls** - Owner bidding interface
6. **Teams Leaderboard** - Team standings

### Medium Priority:
7. **Players List Table** (Admin) - Player management
8. **Bid History** - Transaction log
9. **Timer Display** - Countdown visualization

### Low Priority (Enhancements):
10. **Responsive breakpoints** - Mobile/tablet layouts
11. **Error states** - Validation feedback
12. **Loading states** - Data fetching indicators

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN CONTROLS                        │
│  [Stats]                    [Start Next Random Player]   │
└─────────────────────────────────────────────────────────┘

┌──────────────┐  ┌─────────────────────────────────────┐
│              │  │         TEAMS LEADERBOARD             │
│   CURRENT    │  │  ┌─────────────────────────────────┐ │
│    PLAYER    │  │  │ Team 1 | Budget | Players      │ │
│              │  │  │ Team 2 | Budget | Players      │ │
│  [Bid Info]  │  │  │ Team 3 | Budget | Players      │ │
│              │  │  │ Team 4 | Budget | Players      │ │
│  [Controls]  │  │  └─────────────────────────────────┘ │
│              │  └─────────────────────────────────────┘
│  [Bid Hist]  │
│              │
│ [Owner Bids] │
└──────────────┘

┌─────────────────────────────────────────────────────────┐
│              TEAM BID TILES (ADMIN ONLY)                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │Team1 │  │Team2 │  │Team3 │  │Team4 │               │
│  │+5 +10│  │+5 +10│  │+5 +10│  │+5 +10│               │
│  │+20   │  │+20   │  │+20   │  │+20   │               │
│  │+30   │  │+30   │  │+30   │  │+30   │               │
│  │+50   │  │+50   │  │+50   │  │+50   │               │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              PLAYERS LIST TABLE (ADMIN ONLY)            │
│  # | Name | Category | Price | Status | Team | Actions │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Notes

### Typography
- Headers: Bold, larger font sizes
- Body: Standard font, readable sizes
- Badges: Small, uppercase or capitalized

### Spacing
- Cards: Margin bottom between sections
- Buttons: Consistent padding, gap between grouped buttons
- Tables: Compact but readable

### Icons/Symbols
- ⏸ Pause icon
- ▶ Resume icon
- ✅ Sold/Checkmark
- ↶ Undo icon
- 🔄 Reopen icon

---

This specification provides all the details needed to create comprehensive wireframes for each user role. Each section can be wireframed independently and then combined into role-specific views.
