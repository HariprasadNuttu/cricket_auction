import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  email = '';
  password = '';
  name = '';
  role = 'VIEWER';
  teamName = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) { }

  register() {
    this.authService.register({
      email: this.email,
      password: this.password,
      name: this.name,
      role: this.role,
      teamName: this.teamName
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.error = 'Registration failed: ' + (err.error.message || err.message);
        console.error(err);
      }
    });
  }
}
