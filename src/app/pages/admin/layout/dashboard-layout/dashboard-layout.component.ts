import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

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
export class AdminDashboardLayoutComponent implements OnInit {
  private authService = inject(AuthService);

  userFullName = '';
  sidebarOpen = true;

readonly menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    route: '/admin',
    exact: true
  },
  {
    label: 'Manage Exams',
    route: '/admin/manage-exams',
    exact: false
  }
];

  ngOnInit(): void {
    this.userFullName = this.authService.getCurrentUser()?.fullName || 'Admin';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
