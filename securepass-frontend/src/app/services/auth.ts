import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private readonly TOKEN_KEY = 'token';
  private readonly USERNAME_KEY = 'username';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  
  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            if (response.username) {
              this.setUsername(response.username);
            }
          }
        })
      );
  }

  register(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/register`, { username, password })
      .pipe(
        tap(response => {
          if (response.token) {
            this.setToken(response.token);
            if (response.username) {
              this.setUsername(response.username);
            }
          }
        })
      );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USERNAME_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  getToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (token && this.isTokenExpired()) {
      this.logout();
      return null;
    }
    return token;
  }

  setToken(token: string): void {
    // JWT tokens typically expire in 24 hours (86400000 ms)
    // We'll set expiry to 23 hours to be safe
    const expiryTime = Date.now() + (23 * 60 * 60 * 1000);
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const expiryStr = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) {
      return true;
    }
    const expiryTime = parseInt(expiryStr, 10);
    return Date.now() >= expiryTime;
  }

  getUsername(): string {
    return sessionStorage.getItem(this.USERNAME_KEY) || 'User';
  }

  setUsername(username: string): void {
    sessionStorage.setItem(this.USERNAME_KEY, username);
  }
}
