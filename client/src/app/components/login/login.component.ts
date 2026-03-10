import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        // Redirect based on user role
        const user = response.user;
        if (user?.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (user?.role === 'AUCTIONEER') {
          this.router.navigate(['/auctioneer']);
        } else {
          this.router.navigate(['/owner']);
        }
      },
      error: (err) => {
        this.error = 'Login failed';
        console.error(err);
      }
    });
  }
}
