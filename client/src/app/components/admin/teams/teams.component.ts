import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-teams',
  imports: [CommonModule, FormsModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css'
})
export class TeamsComponent implements OnInit {
  groups: any[] = [];
  seasons: any[] = [];
  teams: any[] = [];
  selectedGroupId: number | null = null;
  selectedSeasonId: number | null = null;
  showCreateModal = false;
  showEditModal = false;
  showAssignOwnerModal = false;
  selectedTeam: any = null;
  formData = {
    name: '',
    budget: 1000
  };
  assignOwnerData = {
    ownerId: null as number | null
  };
  owners: any[] = []; // Will load users with OWNER role

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
        this.loadSeasons();
        this.loadTeams();
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
        if (this.seasons.length > 0 && !this.selectedSeasonId) {
          this.selectedSeasonId = this.seasons[0].id;
          this.loadTeams();
        } else if (this.selectedSeasonId) {
          this.loadTeams();
        }
      },
      error: (e) => {
        console.error('Failed to load seasons:', e);
      }
    });
  }

  onGroupChange() {
    this.loadSeasons();
    this.selectedSeasonId = null;
    this.teams = [];
  }

  onSeasonChange() {
    this.loadTeams();
    this.router.navigate(['/admin/teams'], { queryParams: { groupId: this.selectedGroupId, seasonId: this.selectedSeasonId } });
  }

  loadTeams() {
    if (!this.selectedSeasonId) return;
    
    this.apiService.getTeamsBySeason(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.teams = data.teams || data || [];
        // Load owners list for assignment
        this.loadOwners();
      },
      error: (e) => {
        console.error('Failed to load teams:', e);
      }
    });
  }

  loadOwners() {
    // TODO: Create API endpoint to get users with OWNER role
    // For now, we'll use a placeholder
    // In real implementation, call: GET /api/users?role=OWNER
    this.owners = []; // Placeholder
  }

  openCreateModal() {
    if (!this.selectedSeasonId) {
      alert('Please select a season first');
      return;
    }
    this.formData = {
      name: '',
      budget: 1000
    };
    this.showCreateModal = true;
  }

  openEditModal(team: any) {
    this.selectedTeam = team;
    this.formData = {
      name: team.name,
      budget: team.budget || 1000
    };
    this.showEditModal = true;
  }

  openAssignOwnerModal(team: any) {
    this.selectedTeam = team;
    this.assignOwnerData = {
      ownerId: team.ownerId || null
    };
    this.showAssignOwnerModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showAssignOwnerModal = false;
    this.selectedTeam = null;
  }

  createTeam() {
    if (!this.selectedSeasonId || !this.formData.name.trim()) {
      alert('Team name is required');
      return;
    }

    this.apiService.createTeam(this.selectedSeasonId, this.formData).subscribe({
      next: () => {
        this.closeModals();
        this.loadTeams();
      },
      error: (e) => {
        console.error('Failed to create team:', e);
        alert(e.error?.message || 'Failed to create team');
      }
    });
  }

  updateTeam() {
    if (!this.selectedTeam || !this.formData.name.trim()) {
      alert('Team name is required');
      return;
    }

    this.apiService.updateTeam(this.selectedTeam.id, this.formData).subscribe({
      next: () => {
        this.closeModals();
        this.loadTeams();
      },
      error: (e) => {
        console.error('Failed to update team:', e);
        alert(e.error?.message || 'Failed to update team');
      }
    });
  }

  assignOwner() {
    if (!this.selectedTeam || !this.assignOwnerData.ownerId) {
      alert('Please select an owner');
      return;
    }

    this.apiService.updateTeam(this.selectedTeam.id, { ownerId: this.assignOwnerData.ownerId }).subscribe({
      next: () => {
        this.closeModals();
        this.loadTeams();
      },
      error: (e) => {
        console.error('Failed to assign owner:', e);
        alert(e.error?.message || 'Failed to assign owner');
      }
    });
  }

  deleteTeam(teamId: number) {
    if (!confirm('Are you sure you want to delete this team? This will remove all related data.')) {
      return;
    }

    this.apiService.deleteTeam(teamId).subscribe({
      next: () => {
        this.loadTeams();
      },
      error: (e) => {
        console.error('Failed to delete team:', e);
        alert(e.error?.message || 'Failed to delete team');
      }
    });
  }
}
