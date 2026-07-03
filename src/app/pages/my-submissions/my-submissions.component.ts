// 📁 src/app/pages/my-submissions/my-submissions.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

interface SubmissionItem {
  submissionId: string;
  exerciseId: string;
  exerciseTitle: string;
  skillType: number;
  skillName: string;
  totalScore: number;
  totalQuestions?: number;
  correctCount?: number;
  timeSpentSeconds?: number;
  submittedAt: string;
  audioUrl?: string;
  transcript?: string;
  essayText?: string;
}

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './my-submissions.component.html',
  styleUrls: ['./my-submissions.component.scss']
})
export class MySubmissionsComponent implements OnInit {
  private examService = inject(ExamService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  submissions: SubmissionItem[] = [];
  filteredSubmissions: SubmissionItem[] = [];
  isLoading = true;
  errorMessage = '';
  
  selectedSkill: string = 'all';
  searchTerm: string = '';

  ngOnInit() {
    this.loadSubmissions();
  }

  loadSubmissions() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // ✅ FORCE UPDATE UI - BẮT ĐẦU LOADING
    
    this.examService.getMySubmissions().subscribe({
      next: (data: SubmissionItem[]) => {
        console.log('📊 Loaded submissions:', data?.length || 0);
        this.submissions = data || [];
        this.filteredSubmissions = data || [];
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI - HIỂN THỊ DỮ LIỆU
      },
      error: (err) => {
        console.error('❌ Error loading submissions:', err);
        this.errorMessage = 'Không thể tải lịch sử làm bài. Vui lòng thử lại!';
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI - HIỂN THỊ LỖI
      }
    });
  }

  filterSubmissions() {
    let filtered = this.submissions;

    if (this.selectedSkill !== 'all') {
      filtered = filtered.filter(s => s.skillName === this.selectedSkill);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.exerciseTitle?.toLowerCase().includes(term) ||
        s.skillName?.toLowerCase().includes(term)
      );
    }

    this.filteredSubmissions = filtered;
    this.cdr.detectChanges(); // ✅ FORCE UPDATE UI - CẬP NHẬT FILTER
  }

  viewDetail(submissionId: string) {
    this.router.navigate(['/submission', submissionId]);
  }

  getSkillIcon(skillType: number): string {
    const icons: Record<number, string> = {
      0: '📖',
      1: '🎧',
      2: '✍️',
      3: '🎙️'
    };
    return icons[skillType] || '📚';
  }

  getScoreColor(score: number): string {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  }

  getAvgScore(): string {
    if (!this.submissions || this.submissions.length === 0) return '0';
    const sum = this.submissions.reduce((acc, s) => acc + s.totalScore, 0);
    return (sum / this.submissions.length).toFixed(1);
  }

  getBestScore(): string {
    if (!this.submissions || this.submissions.length === 0) return '0';
    const best = Math.max(...this.submissions.map(s => s.totalScore));
    return best + '/10';
  }

  getTotalTime(): string {
    if (!this.submissions || this.submissions.length === 0) return '0p';
    const total = this.submissions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}p`;
    if (minutes > 0) return `${minutes}p`;
    return '0p';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--/--/----';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}p ${secs}s`;
    }
    return `${secs}s`;
  }

  refresh() {
    this.loadSubmissions();
  }
}