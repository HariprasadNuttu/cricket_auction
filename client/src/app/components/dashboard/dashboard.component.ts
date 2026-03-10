import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  auctionState: any = null;
  teams: any[] = [];
  players: any[] = [];
  currentPlayer: any = null;
  bidHistory: any[] = [];

  user: any = null;
  timer: any = '00:00';
  customBidAmount: number = 0;
  timerInterval: any = null;
  selectedTeamId: number | null = null;
  selectedSeasonId: number | null = null;
  groups: any[] = [];
  seasons: any[] = [];
  expandedTeamId: number | null = null;

  private subs: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    this.authService.user$.subscribe(u => this.user = u);
  }

  ngOnInit() {
    this.loadGroups();
    this.socketService.connect();

    // Log socket connection status
    const socket = (this.socketService as any).socket;
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        // Sync state on reconnect
        this.fetchState();
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socket.on('reconnect', (attemptNumber: number) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        // Sync state after reconnection
        setTimeout(() => {
          this.fetchState();
        }, 500);
      });
      
      socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        // Don't alert on every error, just log
      });
    }

    this.subs.add(
      this.socketService.listen('AUCTION_UPDATE').subscribe((data: any) => {
        console.log('Auction Update received:', data);
        // Only process updates for the selected season
        if (data.seasonId && data.seasonId !== this.selectedSeasonId) {
          return;
        }
        if (this.auctionState) {
          // Update auction state immediately for real-time display
          this.auctionState.currentPrice = data.currentPrice;
          // Handle timerEndsAt - it might be a string or Date object
          this.auctionState.timerEndsAt = data.timerEndsAt 
            ? (data.timerEndsAt instanceof Date ? data.timerEndsAt : new Date(data.timerEndsAt))
            : null;
          this.auctionState.currentBidderTeamId = data.currentBidderTeamId;
          
          // Update status if provided
          if (data.status) {
            this.auctionState.status = data.status;
          }
          
          // Update bid history if provided
          if (data.bidHistory) {
            this.bidHistory = data.bidHistory;
          }
          
          console.log('Updated auction state:', {
            currentPrice: this.auctionState.currentPrice,
            currentBidderTeamId: this.auctionState.currentBidderTeamId,
            timerEndsAt: this.auctionState.timerEndsAt,
            status: this.auctionState.status
          });
          
          // Start timer monitoring
          this.startTimerMonitoring();
          
          // Refresh full state after a short delay to get updated team budgets
          // This ensures the UI updates immediately while budgets refresh in background
          setTimeout(() => {
            this.fetchState();
          }, 200);
        } else {
          // If auction state doesn't exist, fetch it
          this.fetchState();
        }
      })
    );

    // Start timer monitoring
    this.startTimerMonitoring();

    // Listen for socket errors
    this.subs.add(
      this.socketService.listen('ERROR').subscribe((error: any) => {
        console.error('Socket Error:', error);
        alert(error.message || 'Bid failed. Please try again.');
      })
    );

    // Listen for auction completion
    this.subs.add(
      this.socketService.listen('AUCTION_COMPLETE').subscribe((data: any) => {
        console.log('Auction completed:', data);
        // Refresh state to get updated player statuses
        setTimeout(() => {
          this.fetchState();
          // Auto-start next random player if admin and there are active players
          if (this.user?.role === 'ADMIN') {
            setTimeout(() => {
              if (this.getActivePlayersCount() > 0) {
                this.startRandomAuction();
              } else {
                console.log('No more active players available');
              }
            }, 2000); // Wait 2 seconds before starting next
          }
        }, 500);
      })
    );
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.subs.unsubscribe();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimerMonitoring() {
    // Clear existing interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Check timer every second
    this.timerInterval = setInterval(() => {
      if (this.auctionState && this.auctionState.status === 'LIVE' && this.auctionState.timerEndsAt) {
        const now = new Date();
        const timerEndsAt = new Date(this.auctionState.timerEndsAt);
        const diff = timerEndsAt.getTime() - now.getTime();

        // Update timer display
        if (diff > 0) {
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          this.timer = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
          // Timer expired
          this.timer = '00:00';
          this.onTimerExpired();
        }
      } else if (this.auctionState && this.auctionState.status === 'PAUSED') {
        // Show paused state
        this.timer = 'PAUSED';
      } else {
        this.timer = '00:00';
      }
    }, 1000);
  }

  onTimerExpired() {
    if (this.auctionState && this.auctionState.status === 'LIVE') {
      console.log('Timer expired, completing auction...');
      // Complete the auction
      this.completeAuction();
    }
  }

  pauseAuction() {
    if (!this.selectedSeasonId) return;
    this.apiService.pauseAuction(this.selectedSeasonId).subscribe({
      next: () => {
        console.log('Auction paused');
        this.fetchState();
      },
      error: (e) => {
        console.error('Failed to pause auction:', e);
        alert(e.error?.message || 'Failed to pause auction');
      }
    });
  }

  resumeAuction() {
    if (!this.selectedSeasonId) return;
    this.apiService.resumeAuction(this.selectedSeasonId).subscribe({
      next: () => {
        console.log('Auction resumed');
        this.fetchState();
      },
      error: (e) => {
        console.error('Failed to resume auction:', e);
        alert(e.error?.message || 'Failed to resume auction');
      }
    });
  }

  sellPlayer() {
    if (!this.auctionState?.currentBidderTeamId) {
      alert('No bidder to sell to. Player will be marked as unsold.');
    }
    
    // Use completeAuction which handles selling to current bidder
    this.completeAuction();
  }

  undoLastBid() {
    if (!confirm('Are you sure you want to undo the last bid?')) {
      return;
    }
    if (!this.selectedSeasonId) return;
    this.apiService.undoLastBid(this.selectedSeasonId).subscribe({
      next: (response: any) => {
        console.log('Bid undone:', response);
        this.fetchState();
      },
      error: (e) => {
        console.error('Failed to undo bid:', e);
        alert(e.error?.message || 'Failed to undo bid');
      }
    });
  }

  reopenPlayer(seasonPlayerId: number) {
    if (!confirm('Are you sure you want to reopen this player for auction? This will revert team changes if player was sold.')) {
      return;
    }
    if (!this.selectedSeasonId) return;
    this.apiService.reopenPlayer(this.selectedSeasonId, seasonPlayerId).subscribe({
      next: (response: any) => {
        console.log('Player reopened:', response);
        this.fetchState();
      },
      error: (e) => {
        console.error('Failed to reopen player:', e);
        alert(e.error?.message || 'Failed to reopen player');
      }
    });
  }

  completeAuction() {
    if (!this.selectedSeasonId) return;
    this.apiService.completeAuction(this.selectedSeasonId).subscribe({
      next: () => {
        console.log('Auction completed');
        setTimeout(() => {
          this.fetchState();
        }, 500);
      },
      error: (e) => {
        console.error('Failed to complete auction:', e);
        this.fetchState();
      }
    });
  }

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.groups || data || [];
        if (this.groups.length > 0) {
          this.loadSeasons(this.groups[0].id);
        }
      },
      error: (e) => {
        console.error('Error loading groups:', e);
      }
    });
  }

  loadSeasons(groupId: number) {
    this.apiService.getSeasonsByGroup(groupId).subscribe({
      next: (data) => {
        this.seasons = data.seasons || data || [];
        if (this.seasons.length > 0 && !this.selectedSeasonId) {
          // Auto-select first active season, or first season
          const activeSeason = this.seasons.find((s: any) => s.status === 'ACTIVE') || this.seasons[0];
          this.selectedSeasonId = activeSeason.id;
          this.fetchState();
        } else if (this.selectedSeasonId) {
          this.fetchState();
        }
      },
      error: (e) => {
        console.error('Error loading seasons:', e);
      }
    });
  }

  onSeasonChange() {
    this.fetchState();
  }

  fetchState() {
    if (!this.selectedSeasonId) {
      console.log('No season selected');
      return;
    }
    
    this.apiService.getAuctionState(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.auctionState = data.state;
        this.teams = data.teams || [];
        this.players = data.players || [];
        this.currentPlayer = data.currentPlayer;
        this.bidHistory = data.bidHistory || [];
        
        // Log teams for debugging
        console.log('Teams loaded:', this.teams.map(t => ({ id: t.id, name: t.name, idType: typeof t.id })));
        this.startTimerMonitoring();
      },
      error: (e) => {
        console.error('Error fetching state:', e);
        this.teams = [];
      }
    });
  }

  startAuction(playerId: number) {
    if (!this.selectedSeasonId) return;
    this.apiService.startAuction(this.selectedSeasonId, playerId).subscribe({
      next: () => {
        console.log('Auction started');
        this.fetchState();
      },
      error: (e) => {
        console.error('Failed to start auction:', e);
        alert('Failed to start auction. Please try again.');
      }
    });
  }

  startRandomAuction() {
    if (this.auctionState?.status === 'LIVE') {
      alert('An auction is already in progress. Please wait for it to complete.');
      return;
    }
    if (!this.selectedSeasonId) return;
    this.apiService.startRandomAuction(this.selectedSeasonId).subscribe({
      next: (response: any) => {
        console.log('Random player selected:', response);
        const seasonPlayerId = response.seasonPlayerId ?? response.playerId;
        if (seasonPlayerId) {
          this.startAuction(seasonPlayerId);
        } else {
          alert('No active players available for auction.');
        }
      },
      error: (e) => {
        console.error('Failed to start random auction:', e);
        alert(e.error?.message || 'Failed to start random auction. Please try again.');
      }
    });
  }

  getActivePlayersCount(): number {
    return this.players.filter(p => p.status === 'ACTIVE').length;
  }

  getSoldPlayersCount(): number {
    return this.players.filter(p => p.status === 'SOLD').length;
  }

  getUnsoldPlayersCount(): number {
    return this.players.filter(p => p.status === 'UNSOLD').length;
  }

  getTeamNameById(teamId: number | null): string {
    if (!teamId) return '';
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : '';
  }

  getPlayerImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/api/uploads/${url}`;
  }

  getPlayerName(item: any): string {
    return item?.player?.name ?? item?.name ?? '-';
  }

  getPlayerCategory(item: any): string {
    return item?.player?.category ?? item?.category ?? item?.role ?? '-';
  }

  getSeasonPlayerId(item: any): number {
    return item?.id ?? 0;
  }

  getPlayerBasePrice(item: any): number {
    return item?.player?.basePrice ?? item?.basePrice ?? 0;
  }

  toggleTeamAccordion(teamId: number) {
    this.expandedTeamId = this.expandedTeamId === teamId ? null : teamId;
  }

  isTeamExpanded(teamId: number): boolean {
    return this.expandedTeamId === teamId;
  }

  getTeamSoldPlayers(teamId: number): any[] {
    return this.players.filter(p => (p.teamId === teamId || p.team?.id === teamId) && p.status === 'SOLD');
  }

  getTeamTotalSpent(teamId: number): number {
    return this.getTeamSoldPlayers(teamId).reduce((sum, p) => sum + (p.soldPrice || 0), 0);
  }

  placeBidForTeam(amount: number, teamId?: number | string) {
    // Only admin can place bids
    if (this.user?.role !== 'ADMIN') {
      console.error('Only admin can place bids');
      alert('Only admin can place bids on behalf of teams');
      return;
    }

    // Use provided teamId or fall back to selectedTeamId
    // Convert to number to handle string IDs from dropdown
    const targetTeamId = teamId ? Number(teamId) : (this.selectedTeamId ? Number(this.selectedTeamId) : null);
    
    // Validate team selection
    if (!targetTeamId || isNaN(targetTeamId)) {
      alert('Please select a team first');
      return;
    }
    
    // Validate teams array is loaded
    if (!this.teams || this.teams.length === 0) {
      console.error('Teams array is empty');
      alert('Teams not loaded. Please refresh the page.');
      this.fetchState();
      return;
    }

    // Validate amount
    if (!amount || amount <= 0 || isNaN(amount)) {
      console.error('Invalid bid amount:', amount);
      alert('Please enter a valid bid amount');
      return;
    }

    // Validate auction state
    if (!this.auctionState) {
      console.error('Auction state not loaded');
      alert('Auction state not available. Please refresh the page.');
      return;
    }

    // Validate auction is LIVE
    if (this.auctionState.status !== 'LIVE') {
      console.error('Auction is not live. Status:', this.auctionState.status);
      alert('Auction is not currently live.');
      return;
    }

    // Validate current price
    if (amount <= this.auctionState.currentPrice) {
      console.error('Bid amount must be higher than current price');
      alert(`Bid must be higher than current price (${this.auctionState.currentPrice})`);
      return;
    }

    // Find selected team - handle both string and number types
    const selectedTeam = this.teams.find(t => t.id === Number(targetTeamId) || t.id === targetTeamId);
    if (!selectedTeam) {
      console.error('Selected team not found', {
        targetTeamId,
        targetTeamIdType: typeof targetTeamId,
        teams: this.teams,
        teamIds: this.teams.map(t => ({ id: t.id, name: t.name, idType: typeof t.id }))
      });
      alert(`Selected team not found (ID: ${targetTeamId}). Available teams: ${this.teams.map(t => t.name).join(', ')}`);
      return;
    }

    // Validate team budget
    if (selectedTeam.remainingBudget < amount) {
      console.error('Insufficient budget');
      alert(`${selectedTeam.name} has insufficient budget. Remaining: ${selectedTeam.remainingBudget}`);
      return;
    }

    // Ensure socket is connected
    this.socketService.connect();

    console.log('Admin placing bid:', { amount, teamId: selectedTeam.id, teamName: selectedTeam.name });
    this.socketService.emit('PLACE_BID', { 
      amount, 
      teamId: selectedTeam.id,
      seasonId: this.selectedSeasonId,
      isAdminBid: true,
      adminUserId: this.user.id
    });
    
    // Clear custom bid amount after placing bid
    this.customBidAmount = 0;
  }

  canBid(teamId: number, amount: number): boolean {
    if (!this.auctionState || this.auctionState.status !== 'LIVE') {
      return false;
    }
    
    const team = this.teams.find(t => t.id === teamId);
    if (!team) {
      return false;
    }
    
    // Check if amount is higher than current price and team has enough budget
    return amount > this.auctionState.currentPrice && team.remainingBudget >= amount;
  }

  canBidAsOwner(amount: number): boolean {
    if (this.user?.role !== 'OWNER' || !this.auctionState || this.auctionState.status !== 'LIVE') {
      return false;
    }
    const myTeam = this.teams.find(t => t.ownerId === this.user.id);
    if (!myTeam) return false;
    return amount > this.auctionState.currentPrice && myTeam.remainingBudget >= amount;
  }

  placeBidAsOwner(amount: number) {
    // Only owners can use this method
    if (this.user?.role !== 'OWNER') {
      console.error('This method is for owners only');
      return;
    }

    // Validate amount
    if (!amount || amount <= 0 || isNaN(amount)) {
      console.error('Invalid bid amount:', amount);
      alert('Please enter a valid bid amount');
      return;
    }

    // Validate auction state
    if (!this.auctionState) {
      console.error('Auction state not loaded');
      alert('Auction state not available. Please refresh the page.');
      return;
    }

    // Validate auction is LIVE
    if (this.auctionState.status !== 'LIVE') {
      console.error('Auction is not live. Status:', this.auctionState.status);
      alert('Auction is not currently live.');
      return;
    }

    // Validate current price
    if (amount <= this.auctionState.currentPrice) {
      console.error('Bid amount must be higher than current price');
      alert(`Bid must be higher than current price (${this.auctionState.currentPrice})`);
      return;
    }

    // Find user's team
    const myTeam = this.teams.find(t => t.ownerId === this.user.id);
    if (!myTeam) {
      console.error('Team not found for user:', this.user);
      console.log('Available teams:', this.teams);
      console.log('User ID:', this.user.id);
      alert('Team not found. Please contact administrator.');
      return;
    }

    // Validate team budget
    if (myTeam.remainingBudget < amount) {
      console.error('Insufficient budget');
      alert(`Insufficient budget. You have ${myTeam.remainingBudget} remaining.`);
      return;
    }

    // Ensure socket is connected
    this.socketService.connect();

    console.log('Owner placing bid:', { amount, teamId: myTeam.id, teamName: myTeam.name });
    this.socketService.emit('PLACE_BID', { 
      amount, 
      teamId: myTeam.id,
      seasonId: this.selectedSeasonId,
      isAdminBid: false,
      ownerUserId: this.user.id
    });
    
    // Clear custom bid amount after placing bid
    this.customBidAmount = 0;
  }

  // Legacy method - kept for backward compatibility
  placeBid(amount: number) {
    if (this.user?.role === 'OWNER') {
      this.placeBidAsOwner(amount);
    } else if (this.user?.role === 'ADMIN') {
      if (!this.selectedTeamId) {
        alert('Please select a team first');
        return;
      }
      this.placeBidForTeam(amount);
    }
  }

  getTeamName(teamId: number): string {
    const team = this.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  }
}
