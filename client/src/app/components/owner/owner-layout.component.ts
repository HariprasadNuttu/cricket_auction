import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, AvatarComponent],
  templateUrl: './owner-layout.component.html',
  styleUrl: './owner-layout.component.css'
})
export class OwnerLayoutComponent {
  user: any = null;

  constructor(private authService: AuthService) {
    this.authService.user$.subscribe(u => this.user = u);
  }

  logout() {
    this.authService.logout();
  }
}
