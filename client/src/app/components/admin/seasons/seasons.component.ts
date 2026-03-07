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
  selectedGroupId: number | null = null;
  showCreateModal = false;
  showEditModal = false;
  selectedSeason: any = null;
  formData = {
    name: '',
    year: new Date().getFullYear(),
    budget: 10000
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
        this.loadSeasons();
      }
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
    this.formData = {
      name: '',
      year: new Date().getFullYear(),
      budget: 10000
    };
    this.showCreateModal = true;
  }

  openEditModal(season: any) {
    this.selectedSeason = season;
    this.formData = {
      name: season.name,
      year: season.year,
      budget: season.budget || 10000
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

    this.apiService.createSeason(this.selectedGroupId, this.formData).subscribe({
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

    this.apiService.updateSeason(this.selectedSeason.id, this.formData).subscribe({
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
    this.router.navigate(['/admin/seasons', seasonId]);
  }
}
