import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { UserProfileDto } from '../../models/auth/auth.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<header class="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
  <div class="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
    <div class="flex justify-between items-center h-20">
      
      <!-- Logo -->
      <div class="flex items-center gap-2 flex-shrink-0 ml-0 pl-0">
        <a routerLink="/" class="flex items-center gap-3 no-underline">
          <img src="assets/favicons/LogoE.jpg" alt="Examify" class="h-14 w-auto">
          <div class="hidden sm:block">
            <span class="text-2xl font-bold text-vstep">Examify</span>
            <span class="block text-[10px] text-text-dark opacity-60 leading-tight">VSTEP Exam Preparation</span>
          </div>
        </a>
      </div>

      <!-- Navigation Menu -->
      <nav class="hidden lg:flex items-center gap-5 ml-4">
        <!-- Listening -->
        <a routerLink="/listening" class="flex items-center gap-2 text-sm font-medium text-text-dark hover:text-vstep transition-colors group">
          <span class="text-xl group-hover:scale-110 transition-transform">🎧</span>
          <span class="text-vstep group-hover:text-vstep-dark transition-all">Nghe</span>
        </a>

        <!-- Reading -->
        <a routerLink="/reading" class="flex items-center gap-2 text-sm font-medium text-text-dark hover:text-vstep transition-colors group">
          <span class="text-xl group-hover:scale-110 transition-transform">📖</span>
          <span class="text-vstep group-hover:text-vstep-dark transition-all">Đọc</span>
        </a>

        <!-- Writing -->
        <a routerLink="/writing" class="flex items-center gap-2 text-sm font-medium text-text-dark hover:text-vstep transition-colors group">
          <span class="text-xl group-hover:scale-110 transition-transform">✍️</span>
          <span class="text-vstep group-hover:text-vstep-dark transition-all">Viết</span>
        </a>

        <!-- Speaking -->
       

        <!-- Full Test -->
        <a routerLink="/exam-list" class="flex items-center gap-2 text-sm font-medium text-text-dark hover:text-vstep transition-colors group">
          <span class="text-xl group-hover:scale-110 transition-transform">📋</span>
          <span class="text-vstep group-hover:text-vstep-dark transition-all">Full Test</span>
        </a>

        <!-- Vocabulary -->
        <a routerLink="/vocabulary" class="flex items-center gap-2 text-sm font-medium text-text-dark hover:text-vstep transition-colors group">
          <span class="text-xl group-hover:scale-110 transition-transform">📝</span>
          <span class="text-vstep group-hover:text-vstep-dark transition-all">Từ vựng</span>
        </a>

        <!-- Grammar -->
        <a routerLink="/grammar" class="flex items-center gap-2 text-sm font-medium text-text-dark hover:text-vstep transition-colors group">
          <span class="text-xl group-hover:scale-110 transition-transform">📚</span>
          <span class="text-vstep group-hover:text-vstep-dark transition-all">Ngữ pháp</span>
        </a>
        
        <!-- More Dropdown -->
        <div class="relative" (click)="toggleMoreMenu()">
          <button class="flex items-center gap-1 text-sm font-medium text-text-dark hover:text-vstep transition-colors">
            More
            <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="showMoreMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          <!-- More Dropdown Menu -->
          <div *ngIf="showMoreMenu" class="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
            <a routerLink="/practice" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeMoreMenu()">
              <span class="text-lg">🎯</span> Luyện tập
            </a>
            <a routerLink="/guidelines" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeMoreMenu()">
              <span class="text-lg">📖</span> Hướng dẫn
            </a>
            <a routerLink="/leaderboard" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeMoreMenu()">
              <span class="text-lg">🏆</span> Bảng xếp hạng
            </a>
            <a routerLink="/contact" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeMoreMenu()">
              <span class="text-lg">💬</span> Liên hệ
            </a>
            <a routerLink="/about" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeMoreMenu()">
              <span class="text-lg">ℹ️</span> Giới thiệu
            </a>
          </div>
        </div>
      </nav>

      <!-- Auth Buttons / User Menu -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <ng-container *ngIf="!(isAuthenticated$ | async)">
          <button class="px-4 py-2 text-sm font-medium text-vstep border border-vstep rounded-lg hover:bg-vstep-lighter transition-colors" routerLink="/login">
            Đăng nhập
          </button>
          <button class="px-4 py-2 text-sm font-medium text-white bg-vstep rounded-lg hover:bg-vstep-dark transition-all hover:shadow-lg" routerLink="/register">
            Đăng ký
          </button>
        </ng-container>

        <ng-container *ngIf="(isAuthenticated$ | async)">
          <div class="relative" (click)="toggleMenu()">
            <div class="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-vstep-lighter rounded-full px-3 py-1.5 transition-colors">
              <div class="w-8 h-8 rounded-full bg-vstep flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                <img *ngIf="avatarUrl" [src]="avatarUrl" alt="Avatar" class="w-full h-full object-cover">
                <span *ngIf="!avatarUrl">{{ userInitial }}</span>
              </div>
              <span class="text-sm font-medium text-text-dark max-w-[100px] truncate">{{ userFullName || 'User' }}</span>
              <svg class="w-4 h-4 text-text-dark opacity-60 transition-transform duration-200" [class.rotate-180]="showMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>

            <!-- Dropdown Menu -->
            <div *ngIf="showMenu" class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
              <a routerLink="/profile" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeDropdown()">
                <span class="text-lg">👤</span> Hồ sơ cá nhân
              </a>
              <a routerLink="/dashboard" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeDropdown()">
                <span class="text-lg">📊</span> Dashboard
              </a>
              <a routerLink="/my-submissions" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeDropdown()">
                <span class="text-lg">📝</span> Lịch sử làm bài
              </a>
              <a routerLink="/wallet" class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-dark hover:bg-vstep-lighter transition-colors no-underline" (click)="closeDropdown()">
                <span class="text-lg">💰</span> Ví của tôi
              </a>
              <hr class="my-1 border-gray-100">
              <button class="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left" (click)="logout()">
                <span class="text-lg">🚪</span> Đăng xuất
              </button>
            </div>
          </div>
        </ng-container>

        <!-- Mobile Menu Button -->
        <button class="lg:hidden p-2 rounded-lg hover:bg-vstep-lighter transition-colors" (click)="toggleMobile()">
          <svg class="w-6 h-6 text-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div *ngIf="mobileOpen" class="lg:hidden border-t border-gray-100 py-3 space-y-1">
      <a routerLink="/listening" class="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">
        <span class="text-lg">🎧</span> Nghe
      </a>
      <a routerLink="/reading" class="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">
        <span class="text-lg">📖</span> Đọc
      </a>
      <a routerLink="/writing" class="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">
        <span class="text-lg">✍️</span> Viết
      </a>
    
      <a routerLink="/full-test" class="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">
        <span class="text-lg">📋</span> Full Test
      </a>
      <a routerLink="/vocabulary" class="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">
        <span class="text-lg">📝</span> Từ vựng
      </a>
      <a routerLink="/grammar" class="flex items-center gap-2 px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">
        <span class="text-lg">📚</span> Ngữ pháp
      </a>
      <hr class="my-2 border-gray-100">
      <a routerLink="/practice" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">🎯 Luyện tập</a>
      <a routerLink="/guidelines" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">📖 Hướng dẫn</a>
      <a routerLink="/leaderboard" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">🏆 Bảng xếp hạng</a>
      <a routerLink="/contact" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">💬 Liên hệ</a>
      <a routerLink="/about" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">ℹ️ Giới thiệu</a>
      
      <hr class="my-2 border-gray-100">
      
      <ng-container *ngIf="!(isAuthenticated$ | async)">
        <a routerLink="/login" class="block px-3 py-2 text-sm text-vstep hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">Đăng nhập</a>
        <a routerLink="/register" class="block px-3 py-2 text-sm text-white bg-vstep rounded-lg text-center hover:bg-vstep-dark" (click)="closeMobile()">Đăng ký</a>
      </ng-container>
      
      <ng-container *ngIf="(isAuthenticated$ | async)">
        <a routerLink="/profile" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">👤 Hồ sơ</a>
        <a routerLink="/dashboard" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">📊 Dashboard</a>
        <a routerLink="/my-submissions" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">📝 Lịch sử</a>
        <a routerLink="/wallet" class="block px-3 py-2 text-sm text-text-dark hover:bg-vstep-lighter rounded-lg no-underline" (click)="closeMobile()">💰 Ví</a>
        <button class="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg" (click)="logout()">🚪 Đăng xuất</button>
      </ng-container>
    </div>
  </div>
</header>
  `,
  styles: [`
    /* ClickOutside directive cần được import */
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;
  isAuthenticated$ = this.authService.isAuthenticated$;
  
  showMenu = false;
  showMoreMenu = false;
  mobileOpen = false;
  
  userFullName: string = '';
  avatarUrl: string | null = null;
  
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.userFullName = currentUser.fullName;
        this.avatarUrl = currentUser.avatarUrl;
      }
      
      this.authService.getProfile().subscribe({
        next: (profile) => {
          this.userFullName = profile.fullName;
          this.avatarUrl = profile.avatarUrl;
        },
        error: (err) => console.error('Failed to load profile', err)
      });
    }
    
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.userFullName = user.fullName;
          this.avatarUrl = user.avatarUrl;
        }
      })
    );
  }

  get userInitial(): string {
    return this.userFullName?.charAt(0).toUpperCase() || 'U';
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
    if (this.showMenu) this.showMoreMenu = false;
  }

  toggleMoreMenu() {
    this.showMoreMenu = !this.showMoreMenu;
    if (this.showMoreMenu) this.showMenu = false;
  }

  closeDropdown() {
    this.showMenu = false;
  }

  closeMoreMenu() {
    this.showMoreMenu = false;
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  logout() {
    this.showMenu = false;
    this.showMoreMenu = false;
    this.mobileOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}