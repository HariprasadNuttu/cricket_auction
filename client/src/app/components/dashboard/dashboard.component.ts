import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
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

  private subs: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService
  ) {
    this.authService.user$.subscribe(u => this.user = u);
  }

  ngOnInit() {
    this.fetchState();
    this.socketService.connect();

    // Log socket connection status
    const socket = (this.socketService as any).socket;
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        alert('Failed to connect to auction server. Please refresh the page.');
      });
    }

    this.subs.add(
      this.socketService.listen('AUCTION_UPDATE').subscribe((data: any) => {
        console.log('Auction Update received:', data);
        if (this.auctionState) {
          // Update auction state immediately for real-time display
          this.auctionState.currentPrice = data.currentPrice;
          // Handle timerEndsAt - it might be a string or Date object
          this.auctionState.timerEndsAt = data.timerEndsAt 
            ? (data.timerEndsAt instanceof Date ? data.timerEndsAt : new Date(data.timerEndsAt))
            : null;
          this.auctionState.currentBidderTeamId = data.currentBidderTeamId;
          
          // Update bid history if provided
          if (data.bidHistory) {
            this.bidHistory = data.bidHistory;
          }
          
          console.log('Updated auction state:', {
            currentPrice: this.auctionState.currentPrice,
            currentBidderTeamId: this.auctionState.currentBidderTeamId,
            timerEndsAt: this.auctionState.timerEndsAt
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

  completeAuction() {
    // Call API to complete auction (mark player as sold/unsold)
    this.http.post('http://localhost:3000/api/auction/complete', {}, {
      headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
    }).subscribe({
      next: () => {
        console.log('Auction completed');
        // Refresh state
        setTimeout(() => {
          this.fetchState();
        }, 500);
      },
      error: (e) => {
        console.error('Failed to complete auction:', e);
        // Still refresh state
        this.fetchState();
      }
    });
  }

  fetchState() {
    this.http.get<any>('http://localhost:3000/api/auction/state', {
      headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
    }).subscribe({
      next: (data) => {
        this.auctionState = data.state;
        this.teams = data.teams || [];
        this.players = data.players || [];
        this.currentPlayer = data.currentPlayer;
        this.bidHistory = data.bidHistory || [];
        
        // Log teams for debugging
        console.log('Teams loaded:', this.teams.map(t => ({ id: t.id, name: t.name, idType: typeof t.id })));
      },
      error: (e) => {
        console.error('Error fetching state:', e);
        this.teams = [];
      }
    });
  }

  startAuction(playerId: number) {
    this.http.post('http://localhost:3000/api/auction/start', { playerId }, {
      headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
    }).subscribe({
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
    // Check if auction is already live
    if (this.auctionState?.status === 'LIVE') {
      alert('An auction is already in progress. Please wait for it to complete.');
      return;
    }

    this.http.post('http://localhost:3000/api/auction/start-random', {}, {
      headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
    }).subscribe({
      next: (response: any) => {
        console.log('Random player selected:', response);
        if (response.playerId) {
          // Start auction with the selected random player
          this.startAuction(response.playerId);
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

  // Legacy method - kept for backward compatibility but disabled for owners
  placeBid(amount: number) {
    // Owners can no longer place bids directly
    if (this.user?.role === 'OWNER') {
      alert('Only admin can place bids on behalf of teams.');
      return;
    }
    
    // If admin calls this, redirect to placeBidForTeam
    if (this.user?.role === 'ADMIN') {
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
