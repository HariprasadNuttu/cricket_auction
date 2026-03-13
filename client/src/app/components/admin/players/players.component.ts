import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-players',
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './players.component.html',
  styleUrl: './players.component.css'
})
export class PlayersComponent implements OnInit {
  groups: any[] = [];
  seasons: any[] = [];
  players: any[] = [];
  seasonPlayers: any[] = [];
  selectedGroupId: number | null = null;
  selectedSeasonId: number | null = null;
  viewMode: 'group' | 'season' = 'group';
  showCreateModal = false;
  showEditModal = false;
  showUploadModal = false;
  showAddToSeasonModal = false;
  selectedPlayer: any = null;
  csvFile: File | null = null;
  formData = {
    name: '',
    category: 'BATSMAN',
    basePrice: 100,
    country: '',
    imageUrl: '' as string | null
  };
  imageFile: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['groupId']) {
        this.selectedGroupId = +params['groupId'];
      }
      if (params['seasonId']) {
        this.selectedSeasonId = +params['seasonId'];
        this.viewMode = 'season';
      }
    });
    this.loadGroups();
  }

  loadGroups() {
    this.apiService.getGroups().subscribe({
      next: (data) => {
        this.groups = data.groups || data || [];
        if (this.groups.length > 0 && !this.selectedGroupId) {
          this.selectedGroupId = this.groups[0].id;
        }
        if (this.selectedGroupId) {
          this.loadPlayers();
          this.loadSeasons();
          if (this.selectedSeasonId) {
            this.loadSeasonPlayers();
          }
        }
      },
      error: (e) => {
        console.error('Failed to load groups:', e);
      }
    });
  }

  loadSeasons() {
    if (!this.selectedGroupId) return;
    this.apiService.getSeasonsByGroup(this.selectedGroupId).subscribe({
      next: (data) => {
        this.seasons = data.seasons || data || [];
        if (this.seasons.length > 0 && this.selectedSeasonId && this.viewMode === 'season') {
          this.loadSeasonPlayers();
        }
      }
    });
  }

  loadPlayers() {
    if (!this.selectedGroupId) return;
    this.apiService.getPlayersByGroup(this.selectedGroupId).subscribe({
      next: (data) => {
        this.players = data.players || data || [];
      },
      error: (e) => {
        console.error('Failed to load players:', e);
      }
    });
  }

  loadSeasonPlayers() {
    if (!this.selectedSeasonId) return;
    this.apiService.getPlayersBySeason(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.seasonPlayers = data.players || data.seasonPlayers || data || [];
      },
      error: (e) => {
        console.error('Failed to load season players:', e);
      }
    });
  }

  onGroupChange() {
    this.loadPlayers();
    this.loadSeasons();
    this.selectedSeasonId = null;
    this.viewMode = 'group';
  }

  onSeasonChange() {
    this.loadSeasonPlayers();
    this.viewMode = 'season';
    this.router.navigate(['/admin/players'], { queryParams: { groupId: this.selectedGroupId, seasonId: this.selectedSeasonId } });
  }

  switchViewMode(mode: 'group' | 'season') {
    this.viewMode = mode;
    if (mode === 'group') {
      this.loadPlayers();
    } else {
      this.loadSeasonPlayers();
    }
  }

  openCreateModal() {
    if (!this.selectedGroupId) {
      alert('Please select a group first');
      return;
    }
    this.formData = {
      name: '',
      category: 'BATSMAN',
      basePrice: 100,
      country: '',
      imageUrl: null
    };
    this.showCreateModal = true;
  }

  openEditModal(player: any) {
    this.revokeImagePreview();
    this.selectedPlayer = player;
    const p = player.player || player;
    this.formData = {
      name: p.name || '',
      category: p.category || 'BATSMAN',
      basePrice: p.basePrice ?? 100,
      country: p.country || '',
      imageUrl: p.imageUrl || null
    };
    this.imageFile = null;
    this.showEditModal = true;
  }

  openUploadModal() {
    if (!this.selectedGroupId) {
      alert('Please select a group first');
      return;
    }
    this.csvFile = null;
    this.showUploadModal = true;
  }

  openAddToSeasonModal() {
    if (!this.selectedGroupId || !this.selectedSeasonId) {
      alert('Please select both group and season');
      return;
    }
    this.showAddToSeasonModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showUploadModal = false;
    this.showAddToSeasonModal = false;
    this.selectedPlayer = null;
    this.csvFile = null;
    this.imageFile = null;
    this.revokeImagePreview();
  }

  private revokeImagePreview() {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
    }
  }

  getImagePreviewUrl(): string | null {
    if (this.imageFile && this.imagePreviewUrl) return this.imagePreviewUrl;
    const url = this.getSelectedPlayerImageUrl();
    return url ? this.getImageUrl(url) : null;
  }

  getPlayerName(item: any): string {
    return item?.player?.name ?? item?.name ?? '-';
  }

  getPlayerCategory(item: any): string {
    return item?.player?.category ?? item?.category ?? item?.role ?? '-';
  }

  getPlayerBasePrice(item: any): number {
    return item?.player?.basePrice ?? item?.basePrice ?? 0;
  }

  getSeasonPlayerStatus(item: any): string {
    return item?.status ?? 'ACTIVE';
  }

  getSelectedPlayerImageUrl(): string | null {
    if (!this.selectedPlayer) return null;
    return this.selectedPlayer?.player?.imageUrl ?? this.selectedPlayer?.imageUrl ?? null;
  }

  getImageUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `/api/uploads/${url}`;
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file && /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      this.revokeImagePreview();
      this.imageFile = file;
      this.imagePreviewUrl = URL.createObjectURL(file);
    } else if (file) {
      alert('Please select a valid image file (JPG, PNG, GIF, or WebP)');
    }
  }

  onStatusChange(player: any, newStatus: string) {
    const seasonPlayerId = player.id;
    if (!seasonPlayerId || player.status === 'SOLD') return;
    this.apiService.updateSeasonPlayer(seasonPlayerId, { status: newStatus }).subscribe({
      next: () => this.loadSeasonPlayers(),
      error: (e) => {
        console.error('Failed to update status:', e);
        alert(e.error?.message || 'Failed to update status');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.csvFile = file;
    }
  }

  uploadCSV() {
    if (!this.csvFile || !this.selectedGroupId) {
      alert('Please select a CSV file');
      return;
    }

    this.apiService.uploadPlayersCSV(this.selectedGroupId, this.csvFile).subscribe({
      next: () => {
        this.closeModals();
        this.loadPlayers();
        alert('Players uploaded successfully!');
      },
      error: (e) => {
        console.error('Failed to upload CSV:', e);
        alert(e.error?.message || 'Failed to upload CSV file');
      }
    });
  }

  createPlayer() {
    if (!this.selectedGroupId || !this.formData.name.trim()) {
      alert('Player name is required');
      return;
    }

    this.apiService.addPlayerToGroup(this.selectedGroupId, this.formData).subscribe({
      next: () => {
        this.closeModals();
        this.loadPlayers();
      },
      error: (e) => {
        console.error('Failed to create player:', e);
        alert(e.error?.message || 'Failed to create player');
      }
    });
  }

  updatePlayer() {
    if (!this.selectedPlayer || !this.formData.name.trim()) {
      alert('Player name is required');
      return;
    }

    const playerId = this.selectedPlayer?.player?.id ?? this.selectedPlayer?.id;
    if (!playerId) {
      alert('Invalid player');
      return;
    }

    const doUpdate = (imageUrl?: string | null) => {
      const data = {
        name: this.formData.name,
        category: this.formData.category,
        basePrice: this.formData.basePrice,
        country: this.formData.country,
        imageUrl: imageUrl ?? this.formData.imageUrl ?? undefined
      };
      this.apiService.updatePlayer(playerId, data).subscribe({
        next: () => {
          this.closeModals();
          if (this.viewMode === 'group') {
            this.loadPlayers();
          } else {
            this.loadSeasonPlayers();
          }
        },
        error: (e) => {
          console.error('Failed to update player:', e);
          alert(e.error?.message || 'Failed to update player');
        }
      });
    };

    if (this.imageFile) {
      this.apiService.uploadPlayerImage(this.imageFile).subscribe({
        next: (res) => doUpdate(res.imageUrl),
        error: (e) => {
          console.error('Failed to upload image:', e);
          alert(e.error?.message || 'Failed to upload image');
        }
      });
    } else {
      doUpdate();
    }
  }

  deletePlayer(player: any) {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    if (this.viewMode === 'season') {
      const seasonPlayerId = player.id;
      this.apiService.removeSeasonPlayer(seasonPlayerId).subscribe({
        next: () => this.loadSeasonPlayers(),
        error: (e) => {
          console.error('Failed to remove player from season:', e);
          alert(e.error?.message || 'Failed to remove player from season');
        }
      });
    } else {
      const playerId = player.id;
      this.apiService.deletePlayer(playerId).subscribe({
        next: () => this.loadPlayers(),
        error: (e) => {
          console.error('Failed to delete player:', e);
          alert(e.error?.message || 'Failed to delete player');
        }
      });
    }
  }

  addPlayersToSeason() {
    if (!this.selectedSeasonId) {
      alert('Please select a season');
      return;
    }
    // Get selected player IDs from checkboxes or select all active players
    const playerIds = this.players.filter(p => p.status === 'ACTIVE').map(p => p.id);
    if (playerIds.length === 0) {
      alert('No active players selected');
      return;
    }

    this.apiService.addPlayersToSeason(this.selectedSeasonId, playerIds).subscribe({
      next: () => {
        this.closeModals();
        this.loadSeasonPlayers();
        alert('Players added to season successfully!');
      },
      error: (e) => {
        console.error('Failed to add players to season:', e);
        alert(e.error?.message || 'Failed to add players to season');
      }
    });
  }
}
