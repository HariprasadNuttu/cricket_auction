import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  user: any = null;
  isSidebarCollapsed = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.user$.subscribe(u => this.user = u);
  }

  ngOnInit() {
    // Check current user immediately
    const currentUser = this.user;
    if (currentUser && currentUser.role !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Also subscribe for user changes
    this.authService.user$.subscribe(user => {
      if (user && user.role !== 'ADMIN') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}
