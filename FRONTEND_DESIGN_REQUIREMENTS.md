# Cricket Auction App – Frontend Design Requirements

This document defines the frontend design requirements for the Cricket Auction application. Use these requirements to validate wireframes, mockups, and implementation.

---

## 1. Functional Requirements by Role

### 1.1 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | System shall provide a Login page with email and password fields | Must |
| AUTH-02 | System shall display error message when login fails | Must |
| AUTH-03 | System shall provide a Register page for new users | Must |
| AUTH-04 | System shall redirect users to role-specific dashboard after login | Must |
| AUTH-05 | System shall provide Logout in all authenticated layouts | Must |

### 1.2 Owner Role

| ID | Requirement | Priority |
|----|-------------|----------|
| OWN-01 | Owner shall see Group and Season context at top (read-only) | Must |
| OWN-02 | Owner shall see "Place Your Bid" section when season is selected | Must |
| OWN-03 | Owner shall place bids via preset buttons (+10, +20, +30, +50) | Must |
| OWN-04 | Owner shall place custom bid amount (desktop only) | Should |
| OWN-05 | Owner shall see current player being auctioned (image, name, category, base price, current bid) | Must |
| OWN-06 | Owner shall see current bidder and timer when auction is live | Must |
| OWN-07 | Owner shall see auction status (Live, Paused, Not live) | Must |
| OWN-08 | Owner shall view teams accordion with sold players (name + price only) | Must |
| OWN-09 | Owner shall see total spent per team | Must |
| OWN-10 | Bid buttons shall be disabled when auction is not live or budget insufficient | Must |

### 1.3 Admin Role

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-01 | Admin shall access sidebar navigation: Dashboard, Groups, Seasons, Teams, Players, Auction Rooms, Reports | Must |
| ADM-02 | Admin shall start next random player auction | Must |
| ADM-03 | Admin shall see quick stats (Active, Sold, Unsold players) | Must |
| ADM-04 | Admin shall pause, resume, sell, and undo bids during live auction | Must |
| ADM-05 | Admin shall place bids on behalf of teams via team bid tiles (+5, +10, +20, +30, +50) | Must |
| ADM-06 | Admin shall place custom bid for any team (desktop) | Should |
| ADM-07 | Admin shall view full players list with status, sold price, team | Must |
| ADM-08 | Admin shall reopen sold/unsold players for re-auction | Must |
| ADM-09 | Admin shall see bid history for current player | Must |
| ADM-10 | Current bidder team shall be visually highlighted (e.g., green border) | Must |

### 1.4 Auctioneer Role

| ID | Requirement | Priority |
|----|-------------|----------|
| AUC-01 | Auctioneer shall see list of assigned auction rooms | Must |
| AUC-02 | Auctioneer shall select room to conduct auction (Group - Season displayed) | Must |
| AUC-03 | Auctioneer shall have same auction controls as Admin (start, pause, resume, bid) | Must |
| AUC-04 | Auctioneer shall see "No rooms assigned" when empty | Must |

---

## 2. User Experience Requirements

### 2.1 Navigation & Layout

| ID | Requirement | Priority |
|----|-------------|----------|
| UX-01 | Owner and Auctioneer shall have minimal header (brand, user, role badge, logout) | Must |
| UX-02 | Admin shall have collapsible sidebar for navigation | Must |
| UX-03 | Group and Season shall be visible at top without dropdown (read-only display) | Must |
| UX-04 | Place Your Bid shall appear once, at top for Owner | Must |
| UX-05 | Current player card shall be prominent and centered | Must |

### 2.2 Bid Interaction

| ID | Requirement | Priority |
|----|-------------|----------|
| UX-06 | Bid buttons shall be circular, touch-friendly (min 44px) | Must |
| UX-07 | Bid buttons shall provide visual feedback on hover and click | Must |
| UX-08 | Disabled bid buttons shall be visually distinct (reduced opacity) | Must |
| UX-09 | Preset bid amounts shall be visible without scrolling on mobile | Must |
| UX-10 | Custom bid shall be hidden on mobile to maximize space | Must |

### 2.3 Information Display

| ID | Requirement | Priority |
|----|-------------|----------|
| UX-11 | Teams accordion shall show: team name, budget left, player count, total budget | Must |
| UX-12 | Expanded team shall show player list: name and sold price only | Must |
| UX-13 | Player image shall have fallback placeholder when missing or failed | Must |
| UX-14 | Timer shall be clearly visible when auction is live | Must |
| UX-15 | Bid history shall be scrollable when long | Must |

---

## 3. Visual Design Requirements

### 3.1 Color & Branding

| ID | Requirement | Priority |
|----|-------------|----------|
| VD-01 | Header/navbar shall use dark gradient background (#1a1a2e to #16213e) | Must |
| VD-02 | Page background shall be light gray (#f8f9fa) | Must |
| VD-03 | Owner bid bar shall use green gradient (#15803d to #166534) | Must |
| VD-04 | Success/primary bid buttons shall use green gradient | Must |
| VD-05 | Custom bid button shall use blue gradient | Must |
| VD-06 | Team bid buttons shall use outline style (blue border) | Must |
| VD-07 | Role badges shall be distinct (Owner: yellow/amber, Auctioneer: yellow, Admin: info blue) | Must |

### 3.2 Components

| ID | Requirement | Priority |
|----|-------------|----------|
| VD-08 | Bid buttons shall be fully circular (border-radius: 50%) | Must |
| VD-09 | Bid buttons shall have gradient, subtle shine, and shadow | Must |
| VD-10 | Group/Season bar shall be light gray, rounded, with pipe separator | Must |
| VD-11 | Cards shall have rounded corners (8–12px) and subtle shadow | Must |
| VD-12 | Current bidder team tile shall have green border highlight | Must |
| VD-13 | Accordion expanded state shall have left border indicator | Must |

### 3.3 Typography

| ID | Requirement | Priority |
|----|-------------|----------|
| VD-14 | Labels (Group, Season) shall use muted gray | Must |
| VD-15 | Values shall use bold, dark text | Must |
| VD-16 | Icons shall use Bootstrap Icons (or equivalent) | Should |

---

## 4. Responsive Design Requirements

### 4.1 Breakpoints

| ID | Requirement | Priority |
|----|-------------|----------|
| RD-01 | Mobile: <576px | Must |
| RD-02 | Tablet: 576px–767px | Must |
| RD-03 | Desktop: ≥768px | Must |
| RD-04 | Large: ≥992px | Should |

### 4.2 Mobile-Specific

| ID | Requirement | Priority |
|----|-------------|----------|
| RD-05 | All 4 owner bid buttons (+10, +20, +30, +50) shall display in one line on mobile | Must |
| RD-06 | All 5 team bid buttons shall display in one line on mobile | Must |
| RD-07 | Custom bid input shall be hidden on mobile (<768px) | Must |
| RD-08 | Layout shall stack vertically (single column) on mobile | Must |
| RD-09 | Team bid tiles shall use 2 columns on mobile | Must |
| RD-10 | Touch targets shall be minimum 44×44px | Must |

### 4.3 Desktop-Specific

| ID | Requirement | Priority |
|----|-------------|----------|
| RD-11 | Current player card and teams accordion shall be side-by-side (e.g., 4/8 columns) | Must |
| RD-12 | Team bid tiles shall use 3–4 columns on desktop | Must |
| RD-13 | Custom bid shall be visible on desktop | Must |

---

## 5. State & Feedback Requirements

### 5.1 Loading & Empty States

| ID | Requirement | Priority |
|----|-------------|----------|
| SF-01 | "Waiting for auction to start" when no current player | Must |
| SF-02 | "No players sold yet" when team has no sold players | Must |
| SF-03 | "No auction rooms assigned" for auctioneer when empty | Must |
| SF-04 | "Auction not live" badge when auction is paused/not started | Must |

### 5.2 Interactive Feedback

| ID | Requirement | Priority |
|----|-------------|----------|
| SF-05 | Bid buttons shall scale on hover (e.g., 1.08x) | Should |
| SF-06 | Bid buttons shall scale down on click | Should |
| SF-07 | Disabled state shall show reduced opacity | Must |
| SF-08 | Real-time updates via WebSocket (no page refresh for bids) | Must |

---

## 6. Accessibility Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ACC-01 | Form inputs shall have associated labels | Must |
| ACC-02 | Images shall have alt text | Must |
| ACC-03 | Sufficient color contrast for text | Must |
| ACC-04 | Interactive elements shall be keyboard accessible | Should |

---

## 7. Performance Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PERF-01 | Bid actions shall feel instant (<500ms perceived) | Should |
| PERF-02 | Player images shall load with fallback on error | Must |
| PERF-03 | Accordion expand/collapse shall be smooth (transition) | Should |

---

## 8. Priority Legend

| Priority | Meaning |
|----------|---------|
| **Must** | Required for release; design must support |
| **Should** | Important; include if feasible |
| **Could** | Nice to have |

---

## 9. Screen Inventory (for Wireframes)

| Screen | Route | Primary Users |
|--------|-------|---------------|
| Login | /login | All |
| Register | /register | New users |
| Owner Dashboard | /owner | Owner |
| Admin Dashboard | /admin/dashboard | Admin |
| Admin Auction Room | /admin/auction-room | Admin |
| Auctioneer Rooms | /auctioneer | Auctioneer |
| Auction Room (Conduct) | /auctioneer/conduct | Auctioneer |
| Groups | /admin/groups | Admin |
| Seasons | /admin/seasons | Admin |
| Teams | /admin/teams | Admin |
| Players | /admin/players | Admin |
| Auction Rooms | /admin/auction-rooms | Admin |
| Reports | /admin/reports | Admin |
