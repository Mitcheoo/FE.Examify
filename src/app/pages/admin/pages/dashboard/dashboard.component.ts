import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardPageComponent implements OnInit {
  userFullName = '';
  readonly stats = {
    totalExams: 3,
    publishedExams: 2,
    draftExams: 1
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userFullName = this.authService.getCurrentUser()?.fullName || 'Admin';
  }
}
