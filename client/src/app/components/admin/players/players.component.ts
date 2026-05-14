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
  /** Season chosen inside "Add to Season" modal (may differ from page-level selectedSeasonId). */
  modalSeasonId: number | null = null;
  addToSeasonMode: 'all' | 'pick' = 'all';
  pickedPlayerIds: number[] = [];
  selectedPlayer: any = null;
  spreadsheetFile: File | null = null;
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
    this.spreadsheetFile = null;
    this.showUploadModal = true;
  }

  openAddToSeasonModal() {
    if (!this.selectedGroupId) {
      alert('Please select a group first');
      return;
    }
    this.apiService.getSeasonsByGroup(this.selectedGroupId).subscribe({
      next: (data) => {
        this.seasons = data.seasons || data || [];
        if (this.seasons.length === 0) {
          alert('No seasons for this group. Create a season under this group first.');
          return;
        }
        this.addToSeasonMode = 'all';
        this.pickedPlayerIds = [];
        const sid = this.selectedSeasonId;
        const hasSelected = sid != null && this.seasons.some((s: any) => Number(s.id) === Number(sid));
        this.modalSeasonId = hasSelected ? Number(sid) : Number(this.seasons[0].id);
        this.showAddToSeasonModal = true;
      },
      error: (e) => {
        console.error('Failed to load seasons:', e);
        alert(e.error?.message || 'Failed to load seasons');
      }
    });
  }

  get activeGroupPlayers(): any[] {
    return this.players.filter((p: any) => p.status === 'ACTIVE');
  }

  get activeGroupPlayersCount(): number {
    return this.activeGroupPlayers.length;
  }

  get pickedPlayerIdsCount(): number {
    return this.pickedPlayerIds.length;
  }

  isPlayerPickedForSeason(playerId: number): boolean {
    return this.pickedPlayerIds.includes(playerId);
  }

  togglePlayerPickedForSeason(playerId: number, checked: boolean) {
    if (checked) {
      if (!this.pickedPlayerIds.includes(playerId)) {
        this.pickedPlayerIds = [...this.pickedPlayerIds, playerId];
      }
    } else {
      this.pickedPlayerIds = this.pickedPlayerIds.filter((id) => id !== playerId);
    }
  }

  selectAllActiveForSeason() {
    this.pickedPlayerIds = this.activeGroupPlayers.map((p: any) => p.id);
  }

  clearPickedPlayers() {
    this.pickedPlayerIds = [];
  }

  confirmAddPlayersToSeason() {
    if (!this.modalSeasonId) {
      alert('Please select a season');
      return;
    }
    let playerIds: number[];
    if (this.addToSeasonMode === 'all') {
      playerIds = this.activeGroupPlayers.map((p: any) => p.id);
    } else {
      playerIds = [...this.pickedPlayerIds];
    }
    if (playerIds.length === 0) {
      alert(
        this.addToSeasonMode === 'all'
          ? 'No active players in this group to add.'
          : 'Select at least one player, or use "Add all active".'
      );
      return;
    }

    this.apiService.addPlayersToSeason(this.modalSeasonId, playerIds).subscribe({
      next: (res: any) => {
        const addedSeasonId = this.modalSeasonId;
        const ok = res?.success ?? 0;
        const err = res?.errors ?? 0;
        this.closeModals();
        this.loadPlayers();
        if (this.viewMode === 'season' && this.selectedSeasonId === addedSeasonId) {
          this.loadSeasonPlayers();
        }
        if (err > 0) {
          alert(`Added ${ok} player(s). ${err} row(s) skipped (e.g. already in season).`);
        } else {
          alert(`Added ${ok} player(s) to the season.`);
        }
      },
      error: (e) => {
        console.error('Failed to add players to season:', e);
        alert(e.error?.error || e.error?.message || 'Failed to add players to season');
      }
    });
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showUploadModal = false;
    this.showAddToSeasonModal = false;
    this.modalSeasonId = null;
    this.addToSeasonMode = 'all';
    this.pickedPlayerIds = [];
    this.selectedPlayer = null;
    this.spreadsheetFile = null;
    this.imageFile = null;
    this.revokeImagePreview();
    this.resetFileInputs();
  }

  private resetFileInputs() {
    const imgInput = document.getElementById('player-image-input') as HTMLInputElement | null;
    const sheetInput = document.getElementById('spreadsheet-file-input') as HTMLInputElement | null;
    if (imgInput) imgInput.value = '';
    if (sheetInput) sheetInput.value = '';
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

  onSpreadsheetSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      alert('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    this.spreadsheetFile = file;
  }

  uploadPlayersSpreadsheet() {
    if (!this.spreadsheetFile || !this.selectedGroupId) {
      alert('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    this.apiService.uploadPlayersSpreadsheet(this.selectedGroupId, this.spreadsheetFile).subscribe({
      next: (res) => {
        this.closeModals();
        this.loadPlayers();
        const errCount = res?.errors ?? 0;
        const ok = res?.success ?? 0;
        if (errCount > 0) {
          alert(`Upload finished: ${ok} added, ${errCount} row(s) had errors. Check server response for details.`);
        } else {
          alert('Players uploaded successfully!');
        }
      },
      error: (e) => {
        console.error('Failed to upload spreadsheet:', e);
        alert(e.error?.message || e.error?.error || 'Failed to upload Excel file');
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

}
