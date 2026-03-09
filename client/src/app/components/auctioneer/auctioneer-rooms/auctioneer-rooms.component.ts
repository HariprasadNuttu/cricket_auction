import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-auctioneer-rooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auctioneer-rooms.component.html',
  styleUrl: './auctioneer-rooms.component.css'
})
export class AuctioneerRoomsComponent implements OnInit {
  rooms: any[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.apiService.getAuctionRooms().subscribe({
      next: (data) => {
        this.rooms = Array.isArray(data) ? data : (data.rooms || []);
      },
      error: (e) => {
        console.error('Failed to load auction rooms:', e);
      }
    });
  }

  conductAuction(room: any) {
    const groupId = room.season?.groupId ?? room.season?.group?.id;
    this.router.navigate(['/auctioneer/conduct'], {
      queryParams: { groupId, seasonId: room.seasonId }
    });
  }
}
