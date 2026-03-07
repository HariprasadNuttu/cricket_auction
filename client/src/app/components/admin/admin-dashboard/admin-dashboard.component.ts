import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalGroups: 0,
    totalSeasons: 0,
    totalTeams: 0,
    totalPlayers: 0,
    activeAuctions: 0
  };

  recentGroups: any[] = [];
  recentSeasons: any[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Load groups
    this.apiService.getGroups().subscribe({
      next: (data) => {
        const groups = data.groups || data || [];
        this.stats.totalGroups = groups.length;
        this.recentGroups = groups.slice(0, 5);
        
        // Load seasons for each group
        let totalSeasons = 0;
        groups.forEach((group: any) => {
          this.apiService.getSeasonsByGroup(group.id).subscribe({
            next: (seasonsData) => {
              const seasons = seasonsData.seasons || seasonsData || [];
              totalSeasons += seasons.length;
              this.stats.totalSeasons = totalSeasons;
              if (this.recentSeasons.length < 5) {
                this.recentSeasons = [...this.recentSeasons, ...seasons].slice(0, 5);
              }
            }
          });
        });
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
