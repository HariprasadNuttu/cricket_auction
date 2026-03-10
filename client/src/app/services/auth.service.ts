import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

interface User {
  id: number;
  name: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth` : 'http://localhost:4200/api/auth';

  // Access token in memory only (XSS-safe)
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private isRefreshing = false;

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Restore session from refresh token (HttpOnly cookie).
   * Returns a Promise that resolves when refresh completes (success or failure).
   * Used by APP_INITIALIZER so auth guard has correct state before routing.
   */
  tryRefreshFromCookie(): Promise<void> {
    return firstValueFrom(
      this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, {}, {
        withCredentials: true
      }).pipe(
        tap(res => {
          this.accessTokenSubject.next(res.accessToken);
          if (res.user) this.userSubject.next(res.user);
        }),
        catchError(() => of(null)),
        map(() => undefined)
      )
    );
  }

  login(email: string, pass: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password: pass }, {
      withCredentials: true
    }).pipe(
      tap(res => {
        this.accessTokenSubject.next(res.accessToken);
        this.userSubject.next(res.user);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {}
    });
    this.accessTokenSubject.next(null);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  setAccessToken(token: string): void {
    this.accessTokenSubject.next(token);
  }

  setUser(user: User): void {
    this.userSubject.next(user);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  refreshToken(): Observable<string | null> {
    if (this.isRefreshing) {
      return new Observable(obs => {
        const sub = this.accessTokenSubject.subscribe(t => {
          obs.next(t);
          obs.complete();
        });
        return () => sub.unsubscribe();
      });
    }

    this.isRefreshing = true;
    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, {}, {
      withCredentials: true
    }).pipe(
      tap(res => {
        this.accessTokenSubject.next(res.accessToken);
        if (res.user) this.userSubject.next(res.user);
        this.isRefreshing = false;
      }),
      catchError(() => {
        this.isRefreshing = false;
        this.accessTokenSubject.next(null);
        this.userSubject.next(null);
        return of(null);
      })
    ).pipe(
      map(res => res?.accessToken ?? null)
    );
  }
}
