# Cricket Auction App – Frontend Design Specification

This document describes the implemented frontend design in detail for creating wireframes.

---

## 1. User Roles & Entry Points

| Role | Login Redirect | Layout |
|------|----------------|--------|
| **Admin** | `/admin` | Admin Layout (sidebar + main content) |
| **Auctioneer** | `/auctioneer` | Auctioneer Layout (simple header) |
| **Owner** | `/owner` | Owner Layout (simple header) |

---

## 2. Login Page (`/login`)

- **Layout:** Centered card, max-width ~col-md-6
- **Elements:**
  - Card with header "Login"
  - Email input (type email, required)
  - Password input (type password, required)
  - Error message (alert-danger, shown when login fails)
  - Submit button "Login"
  - Link "Register"
- **Background:** Light gray (#f8f9fa)

---

## 3. Register Page (`/register`)

- Similar card layout to Login
- Form fields for user registration
- Link back to Login

---

## 4. Owner Layout (`/owner`)

### 4.1 Header (Navbar)
- **Background:** Dark gradient (#1a1a2e → #16213e)
- **Left:** "Cricket Auction - Owner" (navbar brand)
- **Right:** 
  - User name (white text)
  - "Owner" badge (yellow/amber gradient, rounded)
  - "Logout" button (outline light, small)
- **Responsive:** Right section wraps on small screens

### 4.2 Content Area
- Padding: 0.25rem (mobile), 0.75rem–1rem (desktop)
- Renders Dashboard (see Section 5)

---

## 5. Owner Dashboard (`/owner` or `/owner/dashboard`)

### 5.1 Top Section – Group & Season Display
- **Style:** Light gray bar (#f8f9fa), rounded corners (8px), subtle border
- **Content:** `Group: [Group Name] | Season: [Season Name]`
- **Labels:** Gray (#6c757d)
- **Values:** Bold, dark (#212529)
- **Empty state:** Shows `--` when no season selected

### 5.2 Place Your Bid Bar (Owner only, when season selected)
- **Position:** Directly below Group/Season display
- **Background:** Green gradient (#15803d → #166534)
- **Layout:**
  - **Label row:** Icon (bi-cash-stack) + "Place Your Bid" + status badge ("Auction not live" when paused)
  - **Controls row:** 
    - 4 circular bid buttons: +10, +20, +30, +50 (green gradient)
    - Custom bid input + "Bid" button (hidden on mobile)
    - Min bid text (hidden on mobile)
- **Mobile:**
  - All 4 bid buttons in one line (44×44px each)
  - Custom bid and min text hidden
- **Desktop:**
  - Horizontal layout: label | buttons | custom input
  - Custom bid visible

### 5.3 Main Content Layout (2-column on desktop, stacked on mobile)

#### Left Column (col-12 col-md-4)

**Current Player Card** (when player on auction):
- Header: "Current Player" (blue bg)
- Body:
  - Player image (140×140px max, rounded, placeholder if no image)
  - Player name (h3)
  - Category badge
  - Base Price
  - Current Bid (large, green)
  - Current Bidder badge (info)
  - Paused badge (when paused)
  - Timer (when live)
  - Timer end time
- **Admin only:** Pause / Resume / Sold / Undo button group
- **Bid History** (scrollable, max-height 200px): Team name + amount + timestamp per bid

**No Player State:** "Waiting for auction to start..."

**Team Bid Tiles** (Admin only, below player card when LIVE/PAUSED):
- Grid: 2 cols mobile, 4 cols tablet, 3 cols desktop
- Each tile: Team name, remaining budget, 5 bid buttons (+5, +10, +20, +30, +50)
- Current bidder team: green border highlight
- Buttons: Circular, outline style (blue border)

#### Right Column (col-12 col-md-8)

**Teams Accordion:**
- Card with "Teams" header (trophy icon)
- Each team: Expandable row
  - **Header (collapsed):** Chevron + team name + "₹X left" badge + "X players" badge + "Total: ₹X"
  - **Expanded body:** 
    - Player list: Name | Price (2 columns, simple rows)
    - Total Spent row (green highlight)
    - Empty state: "No players sold yet" with icon

### 5.4 Players Table (Admin only, full width below)
- Table: #, Name, Category, Base Price, Status, Sold Price, Team, Actions
- Row highlighting: Green (current player), Yellow (sold), Gray (unsold)
- Reopen button for sold/unsold players

---

## 6. Auctioneer Layout (`/auctioneer`)

### 6.1 Header
- **Background:** Dark gradient (same as owner)
- **Left:** "Cricket Auction - Auctioneer"
- **Right:** User name | "Auctioneer" badge (yellow) | Logout

### 6.2 My Auction Rooms (`/auctioneer`)
- Title: "My Auction Rooms"
- Subtitle: "Select an auction room to conduct the auction..."
- **Room cards** (grid, 3 cols on desktop):
  - Room/season name
  - Group - Season text
  - "Conduct Auction" button
- Empty state: "No auction rooms assigned..."

---

## 7. Auction Room (`/admin/auction-room` or `/auctioneer/conduct`)

### 7.1 Group & Season Display
- Card or bar: `Group: [Name] | Season: [Name]`
- Empty state: Link to select from Auction Rooms

### 7.2 Admin Controls Card (Admin/Auctioneer)
- Red header: "Admin Controls"
- "Start Next Random Player" button
- Quick stats: Active, Sold, Unsold badges
- Action buttons: Pause, Resume, Complete, Undo

### 7.3 Layout (2 columns)

**Left – Current Player Card:**
- Same as Owner dashboard (image, name, category, base price, current bid, bidder, timer)
- No bid buttons (admin places bids via team tiles)

**Right – Place Bid Section:**
- Card: "Place Bid" (hammer icon)
- **Team Bid Tiles** (grid: 2 cols mobile, 4 tablet, 3 desktop):
  - Per team: name, budget, +5/+10/+20/+30/+50 buttons
  - Current bidder: green border
- **Custom Bid** (desktop only, hidden on mobile): Input + "Place Bid" button

### 7.4 Teams Accordion
- Same structure as Owner dashboard
- Player rows: Name | Price only

### 7.5 Players List Table
- Columns: Player, Category, Status, Team, Sold Price, Actions
- Reopen button for sold players

---

## 8. Admin Layout (`/admin/*`)

### 8.1 Top Navbar
- Dark background
- Left: Hamburger (sidebar toggle) + "Cricket Auction System"
- Right: User name | Role badge | Logout

### 8.2 Sidebar (collapsible)
- **Dashboard** (speedometer icon)
- **Auction Setup:**
  - Groups (people icon)
  - Seasons (calendar icon)
  - Teams (trophy icon)
  - Players (person icon)
  - Auction Rooms (hammer icon)
- **Reports:**
  - Sold Players (graph icon)
  - Team Summary (table icon)

### 8.3 Admin Dashboard (`/admin/dashboard`)
- **Stats cards** (4 cols): Groups, Seasons, Teams, Players counts
- **Quick Actions:** Buttons to Groups, Seasons, Teams, Players, Auction Room
- **Recent Groups** list with "View Seasons"
- **Recent Seasons** list with "View Details"

### 8.4 Groups, Seasons, Teams, Players, Auction Rooms, Reports
- Standard CRUD interfaces (tables, forms, modals)
- Create/Edit/Delete actions
- Bootstrap cards and tables

---

## 9. Bid Button Design System

### 9.1 Premium Bid Buttons (Circular)
- **Shape:** Fully circular (border-radius: 50%)
- **Sizes:** 52×52px (default), 44×44px (mobile), 36×36px (team tiles mobile)
- **Variants:**
  - **Success (green):** +10, +20, +30, +50 for owner
  - **Primary (blue):** Custom "Bid" button
  - **Outline (blue border):** Team bid buttons
- **Effects:** Gradient background, subtle shine overlay, hover scale (1.08x), shadow
- **Disabled:** 45% opacity

### 9.2 Layout
- **Owner bid grid:** 4 buttons in one line (mobile & desktop)
- **Team bid buttons:** 5 in one line on mobile (flex, equal width), wrap on desktop
- **Custom bid:** Hidden on mobile (<768px)

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Key Behaviors |
|------------|-------|---------------|
| Mobile | <576px | Single column, bid buttons 44px, custom bid hidden, team tiles 2 cols |
| Tablet | 576–767px | 2-col layout starts, team tiles 4 cols |
| Desktop | ≥768px | Full 2-col (4/8), custom bid visible |
| Large | ≥992px | Team tiles 3 cols |

---

## 11. Color Palette

| Use | Color |
|-----|-------|
| Page background | #f8f9fa |
| Dark header | #1a1a2e, #16213e (gradient) |
| Success/Green | #22c55e, #16a34a, #15803d |
| Primary/Blue | #3b82f6, #2563eb |
| Warning/Yellow | #fbbf24, #f59e0b (Owner badge) |
| Danger/Red | Admin controls header |
| Info | Badges, current bidder |
| Muted text | #6c757d |
| Card borders | #e9ecef |

---

## 12. Typography & Spacing

- **Font:** Bootstrap default (system fonts)
- **Icons:** Bootstrap Icons (bi-*)
- **Cards:** Rounded (8–12px), subtle shadow
- **Accordion:** Smooth expand/collapse, left border on expanded

---

## 13. Component Summary for Wireframes

1. **Login** – Centered card, email/password, login/register
2. **Owner Header** – Dark bar, title, user, Owner badge, Logout
3. **Group/Season Bar** – Read-only, light gray, `Group: X | Season: Y`
4. **Place Your Bid Bar** – Green, 4 circular buttons + custom (desktop)
5. **Current Player Card** – Image, name, category, base price, current bid, timer, bid history
6. **Team Bid Tiles** – Per-team cards with 5 circular buttons
7. **Teams Accordion** – Expandable teams, player list (name | price), total spent
8. **Admin Sidebar** – Collapsible nav with sections
9. **Auctioneer Rooms** – Card grid, Conduct Auction per room
10. **Auction Room** – Admin controls + player card + team tiles + accordion + players table
