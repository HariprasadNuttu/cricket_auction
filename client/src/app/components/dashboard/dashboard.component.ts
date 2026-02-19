import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  auctionState: any = null;
  teams: any[] = [];
  players: any[] = [];
  currentPlayer: any = null;

  user: any = null;
  timer: any = '00:00';

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

    this.subs.add(
      this.socketService.listen('AUCTION_UPDATE').subscribe((data: any) => {
        console.log('Update:', data);
        if (this.auctionState) {
          this.auctionState.currentPrice = data.currentPrice;
          this.auctionState.timerEndsAt = data.timerEndsAt;
          // Update logic...
        }
      })
    );
  }

  ngOnDestroy() {
    this.socketService.disconnect();
    this.subs.unsubscribe();
  }

  fetchState() {
    this.http.get<any>('http://localhost:3000/api/auction/state', {
      headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
    }).subscribe({
      next: (data) => {
        this.auctionState = data.state;
        this.teams = data.teams;
        this.players = data.players;
        this.currentPlayer = data.currentPlayer;
      },
      error: (e) => console.error(e)
    });
  }

  startAuction(playerId: number) {
    this.http.post('http://localhost:3000/api/auction/start', { playerId }, {
      headers: { Authorization: `Bearer ${this.authService.getAccessToken()}` }
    }).subscribe({
      next: () => console.log('Auction started'),
      error: (e) => console.error(e)
    });
  }

  placeBid(amount: number) {
    if (this.user?.role !== 'OWNER') return;
    // Need teamId. For now assume user.teamId or fetch it.
    // In real app, user object should have teamId.
    // Auth service login response returns user.
    // But schema says User has teamId? No, Team has ownerId.
    // So we need to find the team where ownerId = user.id.
    const myTeam = this.teams.find(t => t.ownerId === this.user.id);
    if (myTeam) {
      this.socketService.emit('PLACE_BID', { amount, teamId: myTeam.id });
    }
  }
}
