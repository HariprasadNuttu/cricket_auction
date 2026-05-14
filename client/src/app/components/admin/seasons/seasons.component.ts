import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-seasons',
  imports: [CommonModule, FormsModule],
  templateUrl: './seasons.component.html',
  styleUrl: './seasons.component.css'
})
export class SeasonsComponent implements OnInit {
  groups: any[] = [];
  seasons: any[] = [];
  auctioneers: any[] = [];
  selectedGroupId: number | null = null;
  showCreateModal = false;
  showEditModal = false;
  selectedSeason: any = null;
  formData = {
    name: '',
    year: new Date().getFullYear(),
    budget: 10000,
    auctioneerId: null as number | null,
    minPlayersPerTeam: 11,
    maxPlayersPerTeam: 17
  };

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadGroups();
    this.loadAuctioneers();
    this.route.queryParams.subscribe(params => {
      if (params['groupId']) {
        this.selectedGroupId = +params['groupId'];
        this.loadSeasons();
      }
    });
  }

  loadAuctioneers() {
    this.apiService.getAuctioneers().subscribe({
      next: (data) => {
        this.auctioneers = Array.isArray(data) ? data : (data.auctioneers || []);
      },
      error: (e) => console.error('Failed to load auctioneers:', e)
    });
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
      },
      error: (e) => {
        console.error('Failed to load seasons:', e);
      }
    });
  }

  onGroupChange() {
    this.loadSeasons();
    this.router.navigate(['/admin/seasons'], { queryParams: { groupId: this.selectedGroupId } });
  }

  openCreateModal() {
    if (!this.selectedGroupId) {
      alert('Please select a group first');
      return;
    }
    const selectedGroup = this.groups.find(g => g.id === this.selectedGroupId);
    this.formData = {
      name: '',
      year: new Date().getFullYear(),
      budget: 10000,
      auctioneerId: selectedGroup?.auctioneerId ?? selectedGroup?.auctioneer?.id ?? null,
      minPlayersPerTeam: 11,
      maxPlayersPerTeam: 17
    };
    this.showCreateModal = true;
  }

  openEditModal(season: any) {
    this.selectedSeason = season;
    this.formData = {
      name: season.name,
      year: season.year,
      budget: season.budget || 10000,
      auctioneerId: season.auctioneerId ?? season.auctioneer?.id ?? null,
      minPlayersPerTeam: season.minPlayersPerTeam ?? 17,
      maxPlayersPerTeam: season.maxPlayersPerTeam ?? 17
    };
    this.showEditModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedSeason = null;
  }

  createSeason() {
    if (!this.selectedGroupId || !this.formData.name.trim()) {
      alert('Season name is required');
      return;
    }
    const min = Number(this.formData.minPlayersPerTeam);
    const max = Number(this.formData.maxPlayersPerTeam);
    if (min < 1 || max < 1 || min > max) {
      alert('Min and max players must be at least 1, and min cannot be greater than max.');
      return;
    }

    this.apiService.createSeason(this.selectedGroupId, {
      name: this.formData.name,
      year: this.formData.year,
      budget: this.formData.budget,
      auctioneerId: this.formData.auctioneerId,
      minPlayersPerTeam: this.formData.minPlayersPerTeam,
      maxPlayersPerTeam: this.formData.maxPlayersPerTeam
    }).subscribe({
      next: () => {
        this.closeModals();
        this.loadSeasons();
      },
      error: (e) => {
        console.error('Failed to create season:', e);
        alert(e.error?.message || 'Failed to create season');
      }
    });
  }

  updateSeason() {
    if (!this.selectedSeason || !this.formData.name.trim()) {
      alert('Season name is required');
      return;
    }
    const min = Number(this.formData.minPlayersPerTeam);
    const max = Number(this.formData.maxPlayersPerTeam);
    if (min < 1 || max < 1 || min > max) {
      alert('Min and max players must be at least 1, and min cannot be greater than max.');
      return;
    }

    this.apiService.updateSeason(this.selectedSeason.id, {
      name: this.formData.name,
      year: this.formData.year,
      budget: this.formData.budget,
      auctioneerId: this.formData.auctioneerId,
      minPlayersPerTeam: this.formData.minPlayersPerTeam,
      maxPlayersPerTeam: this.formData.maxPlayersPerTeam
    }).subscribe({
      next: () => {
        this.closeModals();
        this.loadSeasons();
      },
      error: (e) => {
        console.error('Failed to update season:', e);
        alert(e.error?.message || 'Failed to update season');
      }
    });
  }

  deleteSeason(seasonId: number) {
    if (!confirm('Are you sure you want to delete this season? This will delete all related data.')) {
      return;
    }

    this.apiService.deleteSeason(seasonId).subscribe({
      next: () => {
        this.loadSeasons();
      },
      error: (e) => {
        console.error('Failed to delete season:', e);
        alert(e.error?.message || 'Failed to delete season');
      }
    });
  }

  viewSeasonDetails(seasonId: number) {
    this.router.navigate(['/admin/teams'], { queryParams: { groupId: this.selectedGroupId, seasonId } });
  }
}
