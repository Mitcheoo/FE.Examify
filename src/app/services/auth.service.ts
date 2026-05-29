import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  roles: string[];
  expiresIn?: number;
  refreshToken?: string;
}

export interface RegisterRequest {
  fullName: string;
  userName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  succeeded: boolean;
  message: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  userName: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UpdateProfileDto {
  fullName?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'https://localhost:7241/api/auth';
  
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    const token = this.getToken();
    if (token && !this.isTokenExpired()) {
      this.isAuthenticatedSubject.next(true);
      this.getProfile().subscribe({
        next: (profile) => this.currentUserSubject.next(profile),
        error: () => this.logout()
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl + '/login', credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('access_token', response.token);
            if (response.expiresIn) {
              localStorage.setItem('token_expiry', (Date.now() + response.expiresIn * 1000).toString());
            }
          }
          this.isAuthenticatedSubject.next(true);
        }),
        catchError(this.handleError<LoginResponse>('login'))
      );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.apiUrl + '/register', userData)
      .pipe(
        catchError(this.handleError<RegisterResponse>('register'))
      );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl + '/profile')
      .pipe(
        tap(profile => this.currentUserSubject.next(profile)),
        catchError(this.handleError<UserProfile>('getProfile'))
      );
  }

  updateProfile(profileData: UpdateProfileDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(this.apiUrl + '/profile', profileData)
      .pipe(
        catchError(this.handleError<{ message: string }>('updateProfile'))
      );
  }

  changePassword(passwordData: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl + '/change-password', passwordData)
      .pipe(
        catchError(this.handleError<{ message: string }>('changePassword'))
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expiry');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  private handleError<T>(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(operation + ' failed:', error);
      let errorMessage = 'Đã có lỗi xảy ra';
      if (error.status === 401) {
        errorMessage = 'Vui lòng đăng nhập lại';
        this.logout();
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
      return throwError(() => new Error(errorMessage));
    };
  }
}