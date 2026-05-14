import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';
import { ImageService } from '../../../services/image.service';
import { SoldCelebrationService } from '../../../services/sold-celebration.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auction-room',
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent],
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

  private timerExpiryFinalizeSent = false;

  private subs: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService,
    private apiService: ApiService,
    private imageService: ImageService,
    private soldCelebration: SoldCelebrationService,
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

    // Celebration shown for ALL roles when viewing this auction room
    this.subs.add(
      this.socketService.listen('AUCTION_COMPLETE').subscribe((data: any) => {
        console.log('Auction completed:', data);
        const seasonMatch = !this.selectedSeasonId || data.seasonId === this.selectedSeasonId;
        if (seasonMatch && data.status === 'SOLD' && data.playerName && data.teamName) {
          this.soldCelebration.triggerSold({
            playerName: data.playerName,
            teamName: data.teamName,
            soldPrice: data.soldPrice || 0,
            playerImageUrl: data.playerImageUrl,
            category: data.category
          });
        }
        setTimeout(() => {
          this.loadAuctionState();
          if (this.user?.role === 'ADMIN' || this.user?.role === 'AUCTIONEER') {
            setTimeout(() => {
              if (this.getActivePlayersCount() > 0) {
                this.startRandomAuction();
              }
            }, 9000); // Wait for celebration sequence before next player
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
          this.timerExpiryFinalizeSent = false;
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          this.timer = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
          this.timer = '00:00';
          if (!this.timerExpiryFinalizeSent) {
            this.timerExpiryFinalizeSent = true;
            this.onTimerExpired();
          }
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
    if (!(this.auctionState && this.auctionState.status === 'LIVE')) return;
    if (this.user?.role !== 'ADMIN' && this.user?.role !== 'AUCTIONEER') return;
    this.completeAuction();
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

  finalizeAuctionSold() {
    if (!this.selectedSeasonId) return;
    if (!this.auctionState?.currentBidderTeamId) {
      alert('No current bidder. Use Unsold to skip this player, or wait for a bid.');
      return;
    }
    this.completeAuction({ outcome: 'sold' });
  }

  finalizeAuctionUnsold() {
    if (!this.selectedSeasonId) return;
    if (!confirm('Mark this player as Unsold and skip the auction for them?')) return;
    this.completeAuction({ outcome: 'unsold' });
  }

  completeAuction(body?: { outcome?: 'sold' | 'unsold' }) {
    if (!this.selectedSeasonId) return;
    this.apiService.completeAuction(this.selectedSeasonId, body).subscribe({
      next: () => {
        console.log('Auction completed');
        this.timerExpiryFinalizeSent = false;
        setTimeout(() => {
          this.loadAuctionState();
        }, 500);
      },
      error: (e) => {
        console.error('Failed to complete auction:', e);
        this.timerExpiryFinalizeSent = false;
        alert(e.error?.error || e.error?.message || 'Failed to complete auction');
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

  getTeamRemainingBudget(team: any): number {
    const total = team?.totalBudget ?? team?.budget ?? 2000;
    return total - this.getTeamTotalSpent(team?.id);
  }

  downloadTeamsExcel() {
    const rows: string[][] = [];
    rows.push(['Team', 'Player Name', 'Category', 'Sold Price (₹)', 'Total Players']);
    for (const team of this.teams) {
      const players = this.getTeamSoldPlayers(team.id);
      if (players.length === 0) {
        rows.push([team.name, '-', '-', '0', '0/17']);
      } else {
        players.forEach((p: any, i: number) => {
          rows.push([
            i === 0 ? team.name : '',
            this.getPlayerName(p),
            this.getPlayerCategory(p),
            String(p.soldPrice ?? 0),
            i === 0 ? `${players.length}/17` : ''
          ]);
        });
      }
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Team_Players_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
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

  async downloadPlayerImage(p: any, team: any) {
    const playerName = this.getPlayerName(p);
    const category = this.getPlayerCategory(p);
    const teamName = team?.name ?? this.getTeamNameById(p.teamId) ?? 'Team';
    const soldPrice = p.soldPrice ?? 0;
    const imgUrl = this.imageService.getImageUrl(p?.player?.imageUrl ?? p?.imageUrl);

    const loadImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url.startsWith('/') ? window.location.origin + url : url;
      });

    try {
      const w = 420;
      const h = 560;
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d')!;

      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(0.5, '#1e293b');
      bg.addColorStop(1, '#0f172a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      const logoSize = 72;
      const logoPad = 24;
      try {
        const logoImg = await loadImage('/assets/logo.png');
        ctx.drawImage(logoImg, logoPad * scale, logoPad * scale, logoSize * scale, logoSize * scale);
      } catch { /* ignore */ }

      const imgSize = 160 * scale;
      const imgX = (canvas.width - imgSize) / 2;
      const imgY = 120 * scale;
      if (imgUrl) {
        try {
          const playerImg = await loadImage(imgUrl);
          ctx.save();
          ctx.beginPath();
          ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(playerImg, imgX, imgY, imgSize, imgSize);
          ctx.restore();
        } catch {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${scale * 22}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('CONGRATULATIONS!', canvas.width / 2, 340 * scale);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = `bold ${scale * 20}px system-ui`;
      ctx.fillText(playerName, canvas.width / 2, 380 * scale);

      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.font = `${scale * 12}px system-ui`;
      ctx.fillText(category, canvas.width / 2, 405 * scale);

      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.font = `${scale * 14}px system-ui`;
      ctx.fillText('Sold to', canvas.width / 2, 435 * scale);
      ctx.font = `bold ${scale * 18}px system-ui`;
      ctx.fillText(teamName, canvas.width / 2, 465 * scale);

      ctx.fillStyle = '#22c55e';
      ctx.font = `bold ${scale * 24}px system-ui`;
      ctx.fillText(`₹${soldPrice}`, canvas.width / 2, 515 * scale);

      const link = document.createElement('a');
      link.download = `${playerName.replace(/[^a-zA-Z0-9]/g, '_')}_${teamName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
      alert('Failed to download image. Please try again.');
    }
  }
}
