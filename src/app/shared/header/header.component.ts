import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClickOutsideDirective } from '../../core/directives/click-outside.directive';
import { Subscription } from 'rxjs';
import { UserProfileDto } from '../../models/auth/auth.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective], // ✅ Đã thêm ClickOutsideDirective
  template: `
    <header class="header">
      <div class="header-container">
        <!-- Logo -->
        <div class="logo">
          <a routerLink="/">
            <img src="assets/favicons/LogoE.jpg" alt="Examify" class="logo-img">
            <div class="logo-text">
              <span class="logo-main">Examify</span>
              <span class="logo-sub">VSTEP Exam Preparationn</span>
            </div>
          </a>
        </div>
        
        <nav class="nav-menu">
          <a routerLink="/" class="nav-link" (click)="closeDropdown()">Quiick Test</a>
          <a routerLink="/exam-list" class="nav-link" (click)="closeDropdown()">Thi Vstep</a>
    
          <a routerLink="/exam-list" [queryParams]="{level: 5}" class="nav-link" (click)="closeDropdown()">Khóa Học</a>
          <a routerLink="/practice" class="nav-link" (click)="closeDropdown()">Luyện tập</a>
            <a routerLink="/practice" class="nav-link" (click)="closeDropdown()">Trò Chơi</a>
        </nav>
        
        <div class="auth-buttons">
          <ng-container *ngIf="!(isAuthenticated$ | async)">
            <button class="btn-login" routerLink="/login">Đăng nhập</button>
            <button class="btn-register" routerLink="/register">Đăng ký</button>
          </ng-container>
          
          <ng-container *ngIf="(isAuthenticated$ | async)">
            <div class="user-info" (click)="toggleMenu()" clickOutside (clickOutside)="closeDropdown()">
              <div class="avatar">
                <img *ngIf="avatarUrl" [src]="avatarUrl" alt="Avatar" class="avatar-img">
                <span *ngIf="!avatarUrl" class="avatar-text">{{ userInitial }}</span>
              </div>
              <span class="username">{{ userFullName || 'User' }}</span>
              <i class="dropdown-arrow" [class.open]="showMenu">▼</i>
              
              <div class="dropdown-menu" *ngIf="showMenu">
                <a routerLink="/profile" class="dropdown-item" (click)="closeDropdown()">
                  <span>👤</span> Hồ sơ cá nhân
                </a>
                <a routerLink="/dashboard" class="dropdown-item" (click)="closeDropdown()">
                  <span>📊</span> Dashboard
                </a>
                <a routerLink="/my-submissions" class="dropdown-item" (click)="closeDropdown()">
                  <span>📝</span> Lịch sử làm bài
                </a>
                <hr>
                <button class="dropdown-item logout-btn" (click)="logout()">
                  <span>🚪</span> Đăng xuất
                </button>
              </div>
            </div>
          </ng-container>
        </div>
        
        <button class="mobile-btn" (click)="toggleMobile()">☰</button>
      </div>
      <!-- chua cap nhat mobile menu -->
      <div class="mobile-menu" *ngIf="mobileOpen">
        <a routerLink="/" (click)="closeMobile()">Quisk Test</a>
        <a routerLink="/exam-list" (click)="closeMobile()">Thi Vstep</a>
        <a routerLink="/exam-list" [queryParams]="{level: 3}" (click)="closeMobile()">Khóa Học</a>
        <a routerLink="/exam-list" [queryParams]="{level: 4}" (click)="closeMobile()">Liên Hệ</a>
        <a routerLink="/exam-list" [queryParams]="{level: 5}" (click)="closeMobile()">Hướng Dẫn</a>
        <a routerLink="/practice" (click)="closeMobile()">Luyện tập</a>
        <hr>
        <ng-container *ngIf="!(isAuthenticated$ | async)">
          <a routerLink="/login" (click)="closeMobile()">Đăng nhập</a>
          <a routerLink="/register" (click)="closeMobile()">Đăng ký</a>
        </ng-container>
        <ng-container *ngIf="(isAuthenticated$ | async)">
          <a routerLink="/profile" (click)="closeMobile()">Hồ sơ</a>
          <a routerLink="/dashboard" (click)="closeMobile()">Dashboard</a>
          <button (click)="logout()">Đăng xuất</button>
        </ng-container>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo a {
      display: flex;
      align-items: center;
      gap: 15px;
      text-decoration: none;
    }
    .logo-img {
      height: 60px;
      width: auto;
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .logo-main {
      font-size: 1.5rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-sub {
      font-size: 0.7rem;
      color: #888;
      margin-top: -2px;
    }
    .nav-menu {
      display: flex;
      gap: 2rem;
    }
    .nav-link {
      text-decoration: none;
      color: #333;
      transition: color 0.3s;
      cursor: pointer;
    }
    .nav-link:hover {
      color: #667eea;
    }
    .auth-buttons {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .btn-login, .btn-register {
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
    }
    .btn-login {
      background: transparent;
      border: 1px solid #667eea;
      color: #667eea;
    }
    .btn-login:hover {
      background: #667eea;
      color: white;
    }
    .btn-register {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border: none;
      color: white;
    }
    .btn-register:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102,126,234,0.4);
    }
    .user-info {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 40px;
      background: #f5f5f5;
      transition: all 0.3s;
    }
    .user-info:hover {
      background: #e8e8e8;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      overflow: hidden;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-text {
      color: white;
      font-weight: bold;
      font-size: 16px;
    }
    .username {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dropdown-arrow {
      font-size: 10px;
      color: #888;
      transition: transform 0.3s;
    }
    .dropdown-arrow.open {
      transform: rotate(180deg);
    }
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 10px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      min-width: 220px;
      padding: 0.5rem 0;
      z-index: 1001;
      overflow: hidden;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #333;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 14px;
    }
    .dropdown-item span:first-child {
      width: 24px;
    }
    .dropdown-item:hover {
      background: #f5f5f5;
    }
    .dropdown-menu hr {
      margin: 0.5rem 0;
      border: none;
      border-top: 1px solid #eee;
    }
    .logout-btn {
      color: #e74c3c;
    }
    .logout-btn:hover {
      background: #fef0ef;
    }
    .mobile-btn {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .mobile-menu {
      display: none;
      flex-direction: column;
      background: white;
      padding: 1rem;
      border-top: 1px solid #eee;
    }
    .mobile-menu a, .mobile-menu button {
      padding: 0.75rem;
      text-decoration: none;
      color: #333;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
    }
    @media (max-width: 768px) {
      .header-container {
        padding: 0.5rem 1rem;
      }
      .logo-img {
        height: 40px;
      }
      .logo-main {
        font-size: 1rem;
      }
      .logo-sub {
        font-size: 0.55rem;
      }
      .nav-menu, .auth-buttons {
        display: none;
      }
      .mobile-btn {
        display: block;
      }
      .mobile-menu {
        display: flex;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  
  showMenu = false;
  mobileOpen = false;
  
  userFullName: string = '';
  avatarUrl: string | null = null;
  
  private subscriptions: Subscription[] = [];

  // Chỉ sửa phần ngOnInit và loadUserProfile
ngOnInit() {
  // Load user profile nếu đã đăng nhập
  if (this.authService.isLoggedIn()) {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userFullName = currentUser.fullName;
      this.avatarUrl = currentUser.avatarUrl;
    }
    
    // Gọi API để cập nhật dữ liệu mới nhất
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userFullName = profile.fullName;
        this.avatarUrl = profile.avatarUrl;
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }
  
  // Subscribe để cập nhật khi user thay đổi
  this.subscriptions.push(
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userFullName = user.fullName;
        this.avatarUrl = user.avatarUrl;
      }
    })
  );
}

  loadUserProfile() {
    this.authService.getProfile().subscribe({
      next: (profile: UserProfileDto) => {
        this.userFullName = profile.fullName;
        // Xử lý avatarUrl: có thể là null hoặc undefined
        this.avatarUrl = profile.avatarUrl || null;
        // Cập nhật avatar URL để hiển thị
        if (this.avatarUrl && !this.avatarUrl.startsWith('http')) {
          this.avatarUrl = `https://localhost:7241${this.avatarUrl}`;
        }
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  get userInitial(): string {
    return this.userFullName?.charAt(0).toUpperCase() || 'U';
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  closeDropdown() {
    this.showMenu = false;
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  logout() {
    this.showMenu = false;
    this.mobileOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}