import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="header-container">
        <div class="logo">
          <a routerLink="/">
            <img src="assets/favicons/ex.png" alt="Examify" class="logo-img">
            <div class="logo-text">
              <span class="logo-main">Examify</span>
              <span class="logo-sub">VSTEP Exam Preparation</span>
            </div>
          </a>
        </div>
        
        <nav class="nav-menu">
          <a routerLink="/" class="nav-link">Trang chủ</a>
          <a routerLink="/exam-list" class="nav-link">Đề thi VSTEP</a>
          <a routerLink="/exam-list?level=3" class="nav-link">Bậc 3</a>
          <a routerLink="/exam-list?level=4" class="nav-link">Bậc 4</a>
          <a routerLink="/exam-list?level=5" class="nav-link">Bậc 5</a>
          <a routerLink="/practice" class="nav-link">Luyện tập</a>
        </nav>
        
        <div class="auth-buttons">
          <ng-container *ngIf="!(isAuthenticated$ | async)">
            <button class="btn-login" routerLink="/login">Đăng nhập</button>
            <button class="btn-register" routerLink="/register">Đăng ký</button>
          </ng-container>
          
          <ng-container *ngIf="(isAuthenticated$ | async)">
            <div class="user-info" (click)="toggleMenu()">
              <div class="avatar">{{ userInitial }}</div>
              <span class="username">{{ (currentUser$ | async)?.fullName || 'User' }}</span>
              <span class="dropdown-arrow">▼</span>
              
              <div class="dropdown-menu" *ngIf="showMenu">
                <a routerLink="/profile" (click)="closeMenu()">👤 Hồ sơ cá nhân</a>
                <a routerLink="/dashboard" (click)="closeMenu()">📊 Bảng điều khiển</a>
                <a routerLink="/my-results" (click)="closeMenu()">📝 Kết quả thi</a>
                <a routerLink="/payment-history" (click)="closeMenu()">💰 Lịch sử giao dịch</a>
                <div class="divider"></div>
                <button (click)="logout()">🚪 Đăng xuất</button>
              </div>
            </div>
          </ng-container>
        </div>
        
        <button class="mobile-btn" (click)="toggleMobile()">☰</button>
      </div>
      
      <div class="mobile-menu" *ngIf="mobileOpen">
        <a routerLink="/" (click)="closeMobile()">Trang chủ</a>
        <a routerLink="/exam-list" (click)="closeMobile()">Đề thi VSTEP</a>
        <a routerLink="/exam-list?level=3" (click)="closeMobile()">Bậc 3</a>
        <a routerLink="/exam-list?level=4" (click)="closeMobile()">Bậc 4</a>
        <a routerLink="/exam-list?level=5" (click)="closeMobile()">Bậc 5</a>
        <a routerLink="/practice" (click)="closeMobile()">Luyện tập</a>
        <hr>
        <button *ngIf="!(isAuthenticated$ | async)" routerLink="/login" (click)="closeMobile()">Đăng nhập</button>
        <button *ngIf="(isAuthenticated$ | async)" (click)="logout()">Đăng xuất</button>
      </div>
    </header>
  `,
  styles: [
    '.header { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: fixed; top: 0; left: 0; right: 0; z-index: 1000; }',
    '.header-container { max-width: 1200px; margin: 0 auto; padding: 0.75rem 2rem; display: flex; justify-content: space-between; align-items: center; }',
    '.logo a { display: flex; align-items: center; gap: 15px; text-decoration: none; }',
    '.logo-img { height: 50px; width: auto; }',
    '.logo-text { display: flex; flex-direction: column; }',
    '.logo-main { font-size: 1.3rem; font-weight: bold; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }',
    '.logo-sub { font-size: 0.65rem; color: #888; margin-top: -2px; }',
    '.nav-menu { display: flex; gap: 2rem; }',
    '.nav-link { text-decoration: none; color: #333; transition: color 0.3s; }',
    '.nav-link:hover { color: #667eea; }',
    '.auth-buttons { display: flex; gap: 1rem; align-items: center; }',
    '.btn-login, .btn-register { padding: 0.5rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 500; }',
    '.btn-login { background: transparent; border: 1px solid #667eea; color: #667eea; }',
    '.btn-login:hover { background: #667eea; color: white; }',
    '.btn-register { background: linear-gradient(135deg, #667eea, #764ba2); border: none; color: white; }',
    '.btn-register:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102,126,234,0.4); }',
    '.user-info { position: relative; display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 0.5rem 1rem; border-radius: 8px; background: #f8f9fa; }',
    '.avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }',
    '.username { font-weight: 500; color: #333; }',
    '.dropdown-arrow { font-size: 10px; color: #888; }',
    '.dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 10px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); min-width: 220px; padding: 0.5rem 0; z-index: 1001; }',
    '.dropdown-menu a, .dropdown-menu button { display: block; width: 100%; padding: 0.75rem 1rem; text-decoration: none; color: #333; background: none; border: none; text-align: left; cursor: pointer; }',
    '.dropdown-menu a:hover, .dropdown-menu button:hover { background: #f8f9fa; }',
    '.divider { height: 1px; background: #e9ecef; margin: 0.5rem 0; }',
    '.mobile-btn { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; }',
    '.mobile-menu { display: none; flex-direction: column; background: white; padding: 1rem; border-top: 1px solid #eee; }',
    '.mobile-menu a, .mobile-menu button { padding: 0.75rem; text-decoration: none; color: #333; background: none; border: none; text-align: left; cursor: pointer; }',
    '@media (max-width: 768px) { .header-container { padding: 0.5rem 1rem; } .logo-img { height: 40px; } .logo-main { font-size: 1rem; } .logo-sub { font-size: 0.55rem; } .nav-menu, .auth-buttons { display: none; } .mobile-btn { display: block; } .mobile-menu { display: flex; } }'
  ]
})
export class HeaderComponent {
  authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  showMenu = false;
  mobileOpen = false;

  get userInitial(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName?.charAt(0).toUpperCase() || 'U';
  }

  toggleMenu() { this.showMenu = !this.showMenu; }
  closeMenu() { this.showMenu = false; }
  toggleMobile() { this.mobileOpen = !this.mobileOpen; }
  closeMobile() { this.mobileOpen = false; }
  logout() { this.showMenu = false; this.mobileOpen = false; this.authService.logout(); }
}
