import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auction-room',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './auction-room.component.html',
  styleUrl: './auction-room.component.css'
})
export class AuctionRoomComponent implements OnInit, OnDestroy {
  groups: any[] = [];
  seasons: any[] = [];
  auctionState: any = null;
  teams: any[] = [];
  players: any[] = [];
  currentPlayer: any = null;
  bidHistory: any[] = [];
  user: any = null;
  timer: any = '00:00';
  customBidAmount: number = 0;
  timerInterval: any = null;
  selectedGroupId: number | null = null;
  selectedSeasonId: number | null = null;
  currentSeason: any = null;
  currentGroup: any = null;
  expandedTeamId: number | null = null;

  private subs: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.authService.user$.subscribe(u => this.user = u);
  }

  ngOnInit() {
    this.loadGroups();
    this.route.queryParams.subscribe(params => {
      if (params['groupId']) {
        this.selectedGroupId = +params['groupId'];
        this.loadSeasons();
      }
      if (params['seasonId']) {
        this.selectedSeasonId = +params['seasonId'];
        this.loadAuctionState();
      }
    });
    
    this.socketService.connect();

    // Socket event listeners
    const socket = (this.socketService as any).socket;
    if (socket) {
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        if (this.selectedSeasonId) {
          this.loadAuctionState();
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socket.on('reconnect', (attemptNumber: number) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setTimeout(() => {
          if (this.selectedSeasonId) {
            this.loadAuctionState();
          }
        }, 500);
      });
    }

    this.subs.add(
      this.socketService.listen('AUCTION_UPDATE').subscribe((data: any) => {
        console.log('Auction Update received:', data);
        if (this.auctionState && data.seasonId === this.selectedSeasonId) {
          this.auctionState.currentPrice = data.currentPrice;
          this.auctionState.timerEndsAt = data.timerEndsAt 
            ? (data.timerEndsAt instanceof Date ? data.timerEndsAt : new Date(data.timerEndsAt))
            : null;
          this.auctionState.currentBidderTeamId = data.currentBidderTeamId;
          if (data.status) {
            this.auctionState.status = data.status;
          }
          if (data.bidHistory) {
            this.bidHistory = data.bidHistory;
          }
          this.startTimerMonitoring();
          setTimeout(() => {
            this.loadAuctionState();
          }, 200);
        } else {
          this.loadAuctionState();
        }
      })
    );

    this.subs.add(
      this.socketService.listen('ERROR').subscribe((error: any) => {
        console.error('Socket Error:', error);
        alert(error.message || 'Bid failed. Please try again.');
      })
    );

    this.subs.add(
      this.socketService.listen('AUCTION_COMPLETE').subscribe((data: any) => {
        console.log('Auction completed:', data);
        setTimeout(() => {
          this.loadAuctionState();
          if (this.user?.role === 'ADMIN' || this.user?.role === 'AUCTIONEER') {
            setTimeout(() => {
              if (this.getActivePlayersCount() > 0) {
                this.startRandomAuction();
              }
            }, 2000);
          }
        }, 500);
      })
    );

    this.startTimerMonitoring();
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.subs.unsubscribe();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.groups || data || [];
        if (this.groups.length > 0 && !this.selectedGroupId) {
          this.selectedGroupId = this.groups[0].id;
          this.loadSeasons();
        }
      }
    });
  }

  loadSeasons() {
    if (!this.selectedGroupId) return;
    this.apiService.getSeasonsByGroup(this.selectedGroupId).subscribe({
      next: (data) => {
        this.seasons = data.seasons || data || [];
        if (this.seasons.length > 0 && !this.selectedSeasonId) {
          this.selectedSeasonId = this.seasons[0].id;
          this.loadAuctionState();
        } else if (this.selectedSeasonId) {
          this.loadAuctionState();
        }
      }
    });
  }

  onGroupChange() {
    this.loadSeasons();
    this.selectedSeasonId = null;
    this.auctionState = null;
  }

  onSeasonChange() {
    this.loadAuctionState();
    this.router.navigate(['/admin/auction-room'], { queryParams: { groupId: this.selectedGroupId, seasonId: this.selectedSeasonId } });
  }

  loadAuctionState() {
    if (!this.selectedSeasonId) return;
    
    this.apiService.getAuctionState(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.auctionState = data.state;
        this.teams = data.teams || [];
        this.currentSeason = data.season;
        this.currentGroup = data.season?.group;
        this.players = data.players || [];
        if (!this.players.length && data.seasonPlayers) {
          this.players = data.seasonPlayers.map((sp: any) => ({
            id: sp.id,
            name: sp.player?.name,
            category: sp.player?.category,
            basePrice: sp.player?.basePrice,
            imageUrl: sp.player?.imageUrl,
            status: sp.status,
            soldPrice: sp.soldPrice,
            team: sp.team,
            teamName: sp.team?.name
          }));
        }
        this.currentPlayer = data.currentPlayer || data.currentSeasonPlayer?.player;
        this.bidHistory = data.bidHistory || [];
        this.startTimerMonitoring();
      },
      error: (e) => {
        console.error('Error fetching auction state:', e);
        this.teams = [];
      }
    });
  }

  startTimerMonitoring() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.auctionState && this.auctionState.status === 'LIVE' && this.auctionState.timerEndsAt) {
        const now = new Date();
        const timerEndsAt = new Date(this.auctionState.timerEndsAt);
        const diff = timerEndsAt.getTime() - now.getTime();

        if (diff > 0) {
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          this.timer = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
          this.timer = '00:00';
          this.onTimerExpired();
        }
      } else if (this.auctionState && this.auctionState.status === 'PAUSED') {
        this.timer = 'PAUSED';
      } else {
        this.timer = '00:00';
      }
    }, 1000);
  }

  getGroupName(): string {
    return this.currentGroup?.name || this.groups.find(g => g.id === this.selectedGroupId)?.name || 'Group';
  }

  getSeasonName(): string {
    return this.currentSeason?.name || this.seasons.find(s => s.id === this.selectedSeasonId)?.name || 'Season';
  }

  onTimerExpired() {
    if (this.auctionState && this.auctionState.status === 'LIVE') {
      this.completeAuction();
    }
  }

  pauseAuction() {
    if (!this.selectedSeasonId) return;
    this.apiService.pauseAuction(this.selectedSeasonId).subscribe({
      next: () => {
        console.log('Auction paused');
        this.loadAuctionState();
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
        this.loadAuctionState();
      },
      error: (e) => {
        console.error('Failed to resume auction:', e);
        alert(e.error?.message || 'Failed to resume auction');
      }
    });
  }

  completeAuction() {
    if (!this.selectedSeasonId) return;
    this.apiService.completeAuction(this.selectedSeasonId).subscribe({
      next: () => {
        console.log('Auction completed');
        setTimeout(() => {
          this.loadAuctionState();
        }, 500);
      },
      error: (e) => {
        console.error('Failed to complete auction:', e);
        this.loadAuctionState();
      }
    });
  }

  undoLastBid() {
    if (!confirm('Are you sure you want to undo the last bid?')) {
      return;
    }
    if (!this.selectedSeasonId) return;
    this.apiService.undoLastBid(this.selectedSeasonId).subscribe({
      next: (response: any) => {
        console.log('Bid undone:', response);
        this.loadAuctionState();
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
        this.loadAuctionState();
      },
      error: (e) => {
        console.error('Failed to reopen player:', e);
        alert(e.error?.message || 'Failed to reopen player');
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

  startAuction(playerId: number) {
    if (!this.selectedSeasonId) return;
    this.apiService.startAuction(this.selectedSeasonId, playerId).subscribe({
      next: () => {
        console.log('Auction started');
        this.loadAuctionState();
      },
      error: (e) => {
        console.error('Failed to start auction:', e);
        alert('Failed to start auction. Please try again.');
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

  getPlayerName(item: any): string {
    return item?.player?.name ?? item?.name ?? '-';
  }

  getPlayerCategory(item: any): string {
    return item?.player?.category ?? item?.category ?? item?.role ?? '-';
  }

  getPlayerImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url : `/api/uploads/${url}`;
  }

  onPlayerImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
      const next = img.nextElementSibling as HTMLElement;
      if (next) next.style.display = 'block';
    }
  }

  getSeasonPlayerId(item: any): number {
    return item?.id ?? 0;
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
    if (this.user?.role !== 'ADMIN' && this.user?.role !== 'AUCTIONEER') {
      console.error('Only admin or auctioneer can place bids on behalf of teams');
      alert('Only admin or auctioneer can place bids on behalf of teams');
      return;
    }

    const targetTeamId = teamId ? Number(teamId) : null;
    if (!targetTeamId || isNaN(targetTeamId)) {
      alert('Please select a team first');
      return;
    }
    
    if (!this.teams || this.teams.length === 0) {
      alert('Teams not loaded. Please refresh the page.');
      this.loadAuctionState();
      return;
    }

    if (!amount || amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid bid amount');
      return;
    }

    if (!this.auctionState) {
      alert('Auction state not available. Please refresh the page.');
      return;
    }

    if (this.auctionState.status !== 'LIVE') {
      alert('Auction is not currently live.');
      return;
    }

    if (amount <= this.auctionState.currentPrice) {
      alert(`Bid must be higher than current price (${this.auctionState.currentPrice})`);
      return;
    }

    const selectedTeam = this.teams.find(t => t.id === Number(targetTeamId) || t.id === targetTeamId);
    if (!selectedTeam) {
      alert(`Selected team not found`);
      return;
    }

    if (selectedTeam.remainingBudget < amount) {
      alert(`${selectedTeam.name} has insufficient budget. Remaining: ${selectedTeam.remainingBudget}`);
      return;
    }

    this.socketService.connect();

    const isAuctioneer = this.user?.role === 'AUCTIONEER';
    (this.socketService as any).socket.emit('PLACE_BID', { 
      amount, 
      teamId: selectedTeam.id,
      seasonId: this.selectedSeasonId,
      isAdminBid: this.user?.role === 'ADMIN',
      isAuctioneerBid: isAuctioneer,
      adminUserId: this.user.id
    });
    
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
    
    return amount > this.auctionState.currentPrice && team.remainingBudget >= amount;
  }
}
