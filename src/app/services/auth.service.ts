import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
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
    this.loadStoredData();
  }

  private loadStoredData(): void {
    // Load token
    const token = this.getToken();
    
    // Load user từ localStorage trước
    const savedUser = this.getUserFromStorage();
    if (savedUser) {
      console.log('📦 Loaded user from localStorage:', savedUser.fullName);
      this.currentUserSubject.next(savedUser);
    }
    
    // Kiểm tra token
    if (token && !this.isTokenExpired()) {
      console.log('✅ Token valid, setting authenticated');
      this.isAuthenticatedSubject.next(true);
      
      // Nếu chưa có user trong storage hoặc cần cập nhật mới
      if (!savedUser) {
        this.getProfile().subscribe({
          next: (profile) => {
            console.log('✅ Profile loaded from API');
            this.currentUserSubject.next(profile);
            this.saveUserToStorage(profile);
          },
          error: (err) => {
            console.error('❌ Failed to load profile', err);
            if (err.status === 401) {
              this.logout();
            }
          }
        });
      } else {
        // Có user rồi, vẫn gọi API để cập nhật (nhưng không block UI)
        this.getProfile().subscribe({
          next: (profile) => {
            this.currentUserSubject.next(profile);
            this.saveUserToStorage(profile);
          },
          error: () => {}
        });
      }
    } else if (token) {
      console.log('❌ Token expired, clearing storage');
      this.clearStorage();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
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
    const isValid = !!token && !this.isTokenExpired();
    console.log('🔑 isLoggedIn:', isValid);
    return isValid;
  }

  getCurrentUser(): UserProfile | null {
    // Lấy từ subject trước, nếu null thì lấy từ storage
    const subjectValue = this.currentUserSubject.value;
    if (subjectValue) return subjectValue;
    return this.getUserFromStorage();
  }

  private getUserFromStorage(): UserProfile | null {
    const userStr = localStorage.getItem('current_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private saveUserToStorage(user: UserProfile): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    console.log('💾 Saved user to localStorage');
  }

  private clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('token_expiry');
    console.log('🗑️ Cleared all storage');
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
          
          // Lưu user vào localStorage
          const userProfile: UserProfile = {
            id: response.userId,
            fullName: response.fullName,
            email: response.email,
            userName: response.userName,
            avatarUrl: null,
            createdAt: new Date()
          };
          this.saveUserToStorage(userProfile);
          this.currentUserSubject.next(userProfile);
          this.isAuthenticatedSubject.next(true);
          
          console.log('✅ Login success, user saved');
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
    const headers = this.getAuthHeaders();
    return this.http.get<UserProfile>(this.apiUrl + '/profile', { headers })
      .pipe(
        tap(profile => {
          console.log('✅ Profile loaded from API:', profile.fullName);
          this.currentUserSubject.next(profile);
          this.saveUserToStorage(profile);
        }),
        catchError(this.handleError<UserProfile>('getProfile'))
      );
  }

  updateProfile(profileData: UpdateProfileDto): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.put<{ message: string }>(this.apiUrl + '/profile', profileData, { headers })
      .pipe(
        tap(response => {
          // Cập nhật lại profile sau khi sửa
          this.getProfile().subscribe();
        }),
        catchError(this.handleError<{ message: string }>('updateProfile'))
      );
  }

  changePassword(passwordData: ChangePasswordDto): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ message: string }>(this.apiUrl + '/change-password', passwordData, { headers })
      .pipe(
        catchError(this.handleError<{ message: string }>('changePassword'))
      );
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    console.log('🚪 Logged out, redirecting to login');
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