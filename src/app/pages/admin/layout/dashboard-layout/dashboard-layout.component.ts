// 📁 src/app/pages/admin/layout/dashboard-layout/dashboard-layout.component.ts

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { Subscription, filter } from 'rxjs';

interface MenuItem {
  label: string;
  route: string;
  exact: boolean;
}

@Component({
  selector: 'app-admin-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class AdminDashboardLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  userFullName = '';
  sidebarOpen = true;
  currentPageTitle = 'Dashboard';

  private routerSubscription?: Subscription;

  // ✅ MENU ITEMS
  readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/admin',
      exact: true
    },
    {
      label: 'Quản lý đề thi',
      route: '/admin/manage-exams',
      exact: false
    },
    {
      label: 'Bài nộp',
      route: '/admin/submissions',
      exact: false
    },
    {
      label: 'Người dùng',
      route: '/admin/users',
      exact: false
    },
    {
      label: 'Thanh toán',
      route: '/admin/payments',
      exact: false
    }
  ];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userFullName = user?.fullName || 'Admin';
    
    // Theo dõi route change để cập nhật title
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });
    
    // Cập nhật title lần đầu
    this.updatePageTitle();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getIcon(label: string): string {
    const icons: Record<string, string> = {
      'Dashboard': '📊',
      'Quản lý đề thi': '📚',
      'Bài nộp': '📝',
      'Người dùng': '👤',
      'Thanh toán': '💳'
    };
    return icons[label] || '📌';
  }

  getPageTitle(): string {
    const currentRoute = this.router.url;
    const menuItem = this.menuItems.find(item => currentRoute.includes(item.route));
    return menuItem?.label || 'Dashboard';
  }

  updatePageTitle(): void {
    this.currentPageTitle = this.getPageTitle();
  }
}