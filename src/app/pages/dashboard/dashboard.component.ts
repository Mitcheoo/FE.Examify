import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  
  userFullName = '';
  stats = {
    totalExercises: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    readingScore: 0,
    listeningScore: 0,
    writingScore: 0,
    speakingScore: 0,
    fullTestScore: 0
  };

  ngOnInit() {
    this.userFullName = this.authService.getCurrentUser()?.fullName || 'User';
    // TODO: Load real data from API
  }
}
