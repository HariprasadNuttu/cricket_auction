import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-players',
  imports: [CommonModule, FormsModule],
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
    country: ''
  };

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadGroups();
    this.route.queryParams.subscribe(params => {
      if (params['groupId']) {
        this.selectedGroupId = +params['groupId'];
      }
      if (params['seasonId']) {
        this.selectedSeasonId = +params['seasonId'];
        this.viewMode = 'season';
        this.loadSeasons();
        this.loadSeasonPlayers();
      }
    });
  }

  loadGroups() {
    this.apiService.getPlayersByGroup(1).subscribe({
      next: (data) => {
        this.groups = data.groups || [];
        if (this.groups.length > 0 && !this.selectedGroupId) {
          this.selectedGroupId = this.groups[0].id;
          this.loadPlayers();
        }
      },
      error: () => {
        // Fallback: Load groups normally
        this.apiService.getGroups().subscribe({
          next: (groupsData) => {
            this.groups = groupsData.groups || groupsData || [];
            if (this.groups.length > 0 && !this.selectedGroupId) {
              this.selectedGroupId = this.groups[0].id;
              this.loadPlayers();
            }
          }
        });
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
      country: ''
    };
    this.showCreateModal = true;
  }

  openEditModal(player: any) {
    this.selectedPlayer = player;
    this.formData = {
      name: player.name,
      category: player.category || 'BATSMAN',
      basePrice: player.basePrice || 100,
      country: player.country || ''
    };
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

    this.apiService.updatePlayer(this.selectedPlayer.id, this.formData).subscribe({
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
  }

  deletePlayer(playerId: number) {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    this.apiService.deletePlayer(playerId).subscribe({
      next: () => {
        if (this.viewMode === 'group') {
          this.loadPlayers();
        } else {
          this.loadSeasonPlayers();
        }
      },
      error: (e) => {
        console.error('Failed to delete player:', e);
        alert(e.error?.message || 'Failed to delete player');
      }
    });
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
