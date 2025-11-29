import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  username = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  isRegisterMode = false;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
  }

  login(): void {
    if (this.isRegisterMode) {
      this.register();
      return;
    }

    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Token is automatically stored by auth service
        this.authService.setUsername(res.username || this.username);
        this.router.navigate(['/vault']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Login failed. Please check your credentials.';
        }
      }
    });
  }

  register(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    if (this.username.length < 3) {
      this.errorMessage = 'Username must be at least 3 characters long.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Token is automatically stored by auth service
        this.authService.setUsername(res.username || this.username);
        this.router.navigate(['/vault']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 409) {
          this.errorMessage = 'Username already exists. Please choose a different username.';
        } else if (err.error && typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }
}
