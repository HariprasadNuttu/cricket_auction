import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  groups: any[] = [];
  seasons: any[] = [];
  selectedGroupId: number | null = null;
  selectedSeasonId: number | null = null;
  reportType: 'sold' | 'team-summary' = 'sold';
  soldPlayers: any[] = [];
  teamSummary: any[] = [];

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
      if (params['seasonId']) {
        this.selectedSeasonId = +params['seasonId'];
        this.loadReportData();
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
          this.loadReportData();
        } else if (this.selectedSeasonId) {
          this.loadReportData();
        }
      }
    });
  }

  onGroupChange() {
    this.loadSeasons();
    this.selectedSeasonId = null;
    this.soldPlayers = [];
    this.teamSummary = [];
  }

  onSeasonChange() {
    this.loadReportData();
    this.router.navigate(['/admin/reports'], { queryParams: { groupId: this.selectedGroupId, seasonId: this.selectedSeasonId } });
  }

  switchReportType(type: 'sold' | 'team-summary') {
    this.reportType = type;
    this.loadReportData();
  }

  loadReportData() {
    if (!this.selectedSeasonId) return;
    
    // Load sold players
    this.apiService.getPlayersBySeason(this.selectedSeasonId).subscribe({
      next: (data) => {
        const players = data.players || data.seasonPlayers || data || [];
        this.soldPlayers = players.filter((p: any) => p.status === 'SOLD');
        
        // Calculate team summary
        const teamsMap = new Map();
        players.forEach((player: any) => {
          if (player.status === 'SOLD' && player.teamId) {
            const teamId = player.teamId;
            if (!teamsMap.has(teamId)) {
              teamsMap.set(teamId, {
                teamId,
                teamName: player.team?.name || player.teamName || 'Unknown',
                playersCount: 0,
                totalSpent: 0,
                averagePrice: 0
              });
            }
            const team = teamsMap.get(teamId);
            team.playersCount++;
            team.totalSpent += player.soldPrice || player.soldPrice || 0;
            team.averagePrice = team.totalSpent / team.playersCount;
          }
        });
        this.teamSummary = Array.from(teamsMap.values());
      },
      error: (e) => {
        console.error('Failed to load report data:', e);
      }
    });
  }
}
