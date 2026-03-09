import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-auction-rooms',
  imports: [CommonModule, FormsModule],
  templateUrl: './auction-rooms.component.html',
  styleUrl: './auction-rooms.component.css'
})
export class AuctionRoomsComponent implements OnInit {
  rooms: any[] = [];
  groups: any[] = [];
  seasons: any[] = [];
  auctioneers: any[] = [];
  selectedGroupId: number | null = null;
  selectedSeasonId: number | null = null;
  selectedAuctioneerId: number | null = null;
  roomName = '';
  showCreateModal = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRooms();
    this.loadGroups();
    this.loadAuctioneers();
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

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.groups || data || [];
      }
    });
  }

  loadAuctioneers() {
    this.apiService.getAuctioneers().subscribe({
      next: (data) => {
        this.auctioneers = Array.isArray(data) ? data : (data.auctioneers || []);
      },
      error: (e) => {
        console.error('Failed to load auctioneers:', e);
      }
    });
  }

  onGroupChange() {
    this.selectedSeasonId = null;
    this.seasons = [];
    if (this.selectedGroupId) {
      this.apiService.getSeasonsByGroup(this.selectedGroupId).subscribe({
        next: (data) => {
          this.seasons = data.seasons || data || [];
        }
      });
    }
  }

  openCreateModal() {
    this.selectedGroupId = null;
    this.selectedSeasonId = null;
    this.selectedAuctioneerId = null;
    this.roomName = '';
    this.seasons = [];
    this.showCreateModal = true;
  }

  closeModal() {
    this.showCreateModal = false;
  }

  createRoom() {
    if (!this.selectedSeasonId || !this.selectedAuctioneerId) {
      alert('Please select Season and Auctioneer');
      return;
    }
    this.apiService.createAuctionRoom({
      seasonId: this.selectedSeasonId,
      auctioneerId: this.selectedAuctioneerId,
      name: this.roomName || undefined
    }).subscribe({
      next: () => {
        this.closeModal();
        this.loadRooms();
      },
      error: (e) => {
        alert(e.error?.error || 'Failed to create auction room');
      }
    });
  }

  deleteRoom(room: any) {
    if (!confirm(`Delete auction room for ${room.season?.name}?`)) return;
    this.apiService.deleteAuctionRoom(room.id).subscribe({
      next: () => this.loadRooms(),
      error: (e) => alert(e.error?.error || 'Failed to delete')
    });
  }

  conductAuction(room: any) {
    const groupId = room.season?.groupId ?? room.season?.group?.id;
    this.router.navigate(['/admin/auction-room'], {
      queryParams: { groupId, seasonId: room.seasonId }
    });
  }
}
