import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-manage-exams-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-exams.component.html',
})
export class ManageExamsPageComponent implements OnInit {
  userFullName = '';
  exams = [
    { title: 'English Listening Practice', status: 'Draft', created: '2026-06-01' },
    { title: 'Reading Comprehension Test', status: 'Published', created: '2026-05-25' },
    { title: 'Writing Task 2 Mock Exam', status: 'Published', created: '2026-05-18' },
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userFullName = this.authService.getCurrentUser()?.fullName || 'Admin';
  }
}
