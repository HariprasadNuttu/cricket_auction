import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ImageService } from '../../../services/image.service';

@Component({
  selector: 'app-teams',
  imports: [CommonModule, FormsModule, RouterLink, AvatarComponent],
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
  showCreateOwnerModal = false;
  showAssignPlayerModal = false;
  selectedTeam: any = null;
  formData = {
    name: '',
    budget: 1000,
    ownerId: null as number | null
  };
  assignOwnerData = {
    ownerId: null as number | null
  };
  ownerFormData = {
    name: '',
    email: '',
    password: ''
  };
  owners: any[] = []; // Season-scoped owners (only for selected season)
  seasonPlayers: any[] = []; // Season players (for assigned list)
  groupPlayers: any[] = []; // Group players (for assign - already created players)
  assignPlayerForm = {
    playerId: null as number | null,
    teamId: null as number | null,
    amount: 0
  };

  constructor(
    private apiService: ApiService,
    private imageService: ImageService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  getTeamPlayers(team: any): any[] {
    return this.seasonPlayers.filter(
      (sp: any) => sp.status === 'SOLD' && (sp.teamId === team.id || sp.team?.id === team.id)
    );
  }

  getImageUrl(url: string | null | undefined): string {
    return this.imageService.getImageUrl(url);
  }

  async downloadTeamSquad(team: any, _event: Event) {
    const players = this.getTeamPlayers(team);
    try {
      const canvas = document.createElement('canvas');
      const pad = 24;
      const cardW = 100;
      const cardH = 130;
      const cols = 5;
      const rows = Math.ceil(Math.max(players.length, 1) / cols);
      const w = pad * 2 + cols * (cardW + 12) - 12;
      const h = pad * 2 + 60 + rows * (cardH + 12) - 12;
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d')!;
      const scale = 2;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${scale * 18}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(team.name.toUpperCase(), canvas.width / 2, scale * 36);

      ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.font = `${scale * 11}px system-ui`;
      ctx.fillText(`${players.length}/15 Players`, canvas.width / 2, scale * 52);

      const loadImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          const isSameOrigin = url.startsWith('/') || url.startsWith(window.location.origin);
          if (!isSameOrigin) img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = url;
        });

      for (let i = 0; i < players.length; i++) {
        const sp = players[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = pad * scale + col * (cardW + 12) * scale;
        const y = pad * scale + 60 * scale + row * (cardH + 12) * scale;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(x, y, cardW * scale, cardH * scale);

        const imgUrl = this.getImageUrl(sp.player?.imageUrl);
        if (imgUrl) {
          try {
            const img = await loadImage(imgUrl);
            ctx.drawImage(img, x, y, cardW * scale, (cardW * scale * 0.85));
          } catch {
            ctx.fillStyle = '#334155';
            ctx.fillRect(x, y, cardW * scale, cardW * scale * 0.85);
          }
        } else {
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, cardW * scale, cardW * scale * 0.85);
        }

        ctx.fillStyle = '#f1f5f9';
        ctx.font = `600 ${scale * 9}px system-ui`;
        ctx.textAlign = 'center';
        const name = (sp.player?.name || 'Unknown').slice(0, 12);
        ctx.fillText(name, x + (cardW * scale) / 2, y + cardW * scale * 0.85 + scale * 14);

        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${scale * 10}px system-ui`;
        ctx.fillText(`₹${sp.soldPrice ?? 0}`, x + (cardW * scale) / 2, y + cardH * scale - scale * 6);
      }

      const link = document.createElement('a');
      link.download = `${team.name.replace(/[^a-zA-Z0-9]/g, '_')}_Squad.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
      alert('Failed to download image. Please try again.');
    }
  }

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
    this.loadGroupPlayers();
  }

  onSeasonChange() {
    this.loadTeams();
    this.loadGroupPlayers();
    this.router.navigate(['/admin/teams'], { queryParams: { groupId: this.selectedGroupId, seasonId: this.selectedSeasonId } });
  }

  loadTeams() {
    if (!this.selectedSeasonId) return;
    
    this.apiService.getTeamsBySeason(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.teams = Array.isArray(data) ? data : (data?.teams || data?.data || []);
        this.loadOwners();
        this.loadSeasonPlayers();
        this.loadGroupPlayers();
      },
      error: (e) => {
        console.error('Failed to load teams:', e);
      }
    });
  }

  loadSeasonPlayers() {
    if (!this.selectedSeasonId) return;
    this.apiService.getPlayersBySeason(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.seasonPlayers = Array.isArray(data) ? data : (data.players || data.seasonPlayers || data || []);
      },
      error: (e) => console.error('Failed to load season players:', e)
    });
  }

  loadGroupPlayers() {
    if (!this.selectedGroupId) return;
    this.apiService.getPlayersByGroup(this.selectedGroupId).subscribe({
      next: (data) => {
        this.groupPlayers = Array.isArray(data) ? data : (data.players || data || []);
      },
      error: (e) => console.error('Failed to load group players:', e)
    });
  }

  // Group players that can be assigned (not yet sold to a team in this season)
  get availablePlayers() {
    const assignedPlayerIds = new Set(
      this.seasonPlayers
        .filter((sp: any) => sp.status === 'SOLD' && sp.soldType === 'DIRECT_ASSIGN')
        .map((sp: any) => sp.playerId)
    );
    return this.groupPlayers.filter((p: any) => !assignedPlayerIds.has(p.id));
  }

  // Players already directly assigned to teams this season
  get assignedPlayers() {
    return this.seasonPlayers.filter((sp: any) => sp.status === 'SOLD' && sp.soldType === 'DIRECT_ASSIGN');
  }

  loadOwners() {
    if (!this.selectedSeasonId) return;
    this.apiService.getSeasonOwners(this.selectedSeasonId).subscribe({
      next: (data) => {
        this.owners = Array.isArray(data) ? data : (data.owners || []);
      },
      error: (e) => {
        console.error('Failed to load owners:', e);
        this.owners = [];
      }
    });
  }

  openCreateModal() {
    if (!this.selectedSeasonId) {
      alert('Please select a season first');
      return;
    }
    if (this.owners.length === 0) {
      alert('Add at least one owner to this season before creating teams.');
      return;
    }
    this.formData = {
      name: '',
      budget: 1000,
      ownerId: this.owners[0]?.id ?? null
    };
    this.showCreateModal = true;
  }

  openCreateOwnerModal() {
    if (!this.selectedSeasonId) {
      alert('Please select a season first');
      return;
    }
    this.ownerFormData = { name: '', email: '', password: '' };
    this.showCreateOwnerModal = true;
  }

  createOwner() {
    if (!this.selectedSeasonId || !this.ownerFormData.name.trim() || !this.ownerFormData.email.trim() || !this.ownerFormData.password) {
      alert('Name, email and password are required');
      return;
    }
    this.apiService.addSeasonOwner(this.selectedSeasonId, {
      name: this.ownerFormData.name,
      email: this.ownerFormData.email,
      password: this.ownerFormData.password
    }).subscribe({
      next: () => {
        this.showCreateOwnerModal = false;
        this.loadOwners();
      },
      error: (e) => {
        const msg = e.error?.details || e.error?.error || 'Failed to add owner';
        alert(msg);
      }
    });
  }

  removeOwner(owner: any) {
    if (!this.selectedSeasonId || !confirm(`Remove ${owner.name} from this season?`)) return;
    this.apiService.removeSeasonOwner(this.selectedSeasonId, owner.id).subscribe({
      next: () => this.loadOwners(),
      error: (e) => alert(e.error?.error || 'Failed to remove owner')
    });
  }

  openEditModal(team: any) {
    this.selectedTeam = team;
    this.formData = {
      name: team.name,
      budget: team.totalBudget ?? team.budget ?? 1000,
      ownerId: team.ownerId ?? null
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
    this.showCreateOwnerModal = false;
    this.showAssignPlayerModal = false;
    this.selectedTeam = null;
  }

  openAssignPlayerModal() {
    this.assignPlayerForm = {
      playerId: this.availablePlayers[0]?.id ?? null,
      teamId: this.teams[0]?.id ?? null,
      amount: 0
    };
    this.showAssignPlayerModal = true;
  }

  closeAssignPlayerModal() {
    this.showAssignPlayerModal = false;
  }

  assignPlayerFromModal() {
    if (!this.selectedSeasonId) return;
    const { playerId, teamId, amount } = this.assignPlayerForm;
    if (!playerId || !teamId) {
      alert('Please select a player and team');
      return;
    }
    const amountNum = parseInt(String(amount), 10) || 0;
    const team = this.teams.find((t: any) => t.id === teamId);
    if (team && amountNum > 0 && (team.remainingBudget || 0) < amountNum) {
      alert(`Insufficient budget. ${team.name} has ₹${team.remainingBudget || 0} remaining.`);
      return;
    }
    this.apiService.directAssignPlayer(this.selectedSeasonId, {
      playerId,
      teamId,
      amount: amountNum
    }).subscribe({
      next: () => {
        this.closeAssignPlayerModal();
        this.loadTeams();
        this.loadSeasonPlayers();
        this.loadGroupPlayers();
      },
      error: (e) => {
        alert(e.error?.error || 'Failed to assign player');
      }
    });
  }

  createTeam() {
    if (!this.selectedSeasonId || !this.formData.name.trim()) {
      alert('Team name is required');
      return;
    }
    if (!this.formData.ownerId) {
      alert('Please select an owner');
      return;
    }

    this.apiService.createTeam(this.selectedSeasonId, {
      name: this.formData.name,
      budget: this.formData.budget,
      ownerId: this.formData.ownerId
    }).subscribe({
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

    const updateData: { name: string; budget?: number; ownerId?: number } = {
      name: this.formData.name,
      budget: this.formData.budget
    };
    if (this.formData.ownerId != null) {
      updateData.ownerId = this.formData.ownerId;
    }

    this.apiService.updateTeam(this.selectedTeam.id, updateData).subscribe({
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

  removeAssignment(sp: any) {
    if (!this.selectedSeasonId || !confirm(`Remove ${sp.player?.name} from ${sp.team?.name}?`)) return;
    this.apiService.removeDirectAssignment(this.selectedSeasonId, sp.id).subscribe({
      next: () => {
        this.loadTeams();
        this.loadSeasonPlayers();
      },
      error: (e) => alert(e.error?.error || 'Failed to remove assignment')
    });
  }
}
