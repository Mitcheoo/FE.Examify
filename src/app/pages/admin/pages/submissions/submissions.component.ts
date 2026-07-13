// src/app/pages/admin/pages/submissions/submissions.component.ts

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';

// ============================================================
// INTERFACES
// ============================================================

interface AdminSubmissionDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  exerciseId: string;
  exerciseTitle: string;
  skillType: number;
  skillName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  timeSpentFormatted: string;
  status: 'Passed' | 'Failed' | 'In Progress';
  submittedAt: string;
  isGraded: boolean;
  audioUrl?: string;
  transcript?: string;
  essayText?: string;
  aiFeedback?: string;
}

interface AdminSubmissionStats {
  totalSubmissions: number;
  passedCount: number;
  failedCount: number;
  inProgressCount: number;
  averageScore: number;
  dailyStats: DailyStats[];
}

interface DailyStats {
  date: string;
  count: number;
  averageScore: number;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-submissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss']
})
export class SubmissionsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private apiUrl = 'https://localhost:7241/api/admin/AdminSubmissions';
  
  // ✅ THÊM HẰNG SỐ THRESHOLD
  private readonly PASS_THRESHOLD = 4;

  // Data
  submissions: AdminSubmissionDto[] = [];
  filteredSubmissions: AdminSubmissionDto[] = [];
  stats: AdminSubmissionStats | null = null;

  // Loading states
  isLoading: boolean = false;
  isLoadingStats: boolean = false;

  // Filters
  searchTerm: string = '';
  selectedSkill: string = '';
  selectedStatus: string = '';
  fromDate: string = '';
  toDate: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  totalPages: number = 0;

  // Toast
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  showToast: boolean = false;

  // Math
  Math = Math;

  // Filter options
  skillOptions = [
    { value: '', label: 'Tất cả kỹ năng' },
    { value: 'Reading', label: '📖 Reading' },
    { value: 'Listening', label: '🎧 Listening' },
    { value: 'Writing', label: '✍️ Writing' },
    { value: 'Speaking', label: '🎤 Speaking' },
    { value: 'FullTest', label: '📋 Full Test' }
  ];

  statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'Passed', label: '✅ Đã qua' },
    { value: 'Failed', label: '❌ Trượt' },
    { value: 'InProgress', label: '⏳ Đang làm' }
  ];

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit() {
    this.loadStats();
    this.loadSubmissions();
  }

  // ============================================================
  // API CALLS
  // ============================================================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async loadSubmissions() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      let params = new URLSearchParams();
      params.set('page', this.currentPage.toString());
      params.set('pageSize', this.pageSize.toString());

      if (this.searchTerm) params.set('search', this.searchTerm);
      if (this.selectedSkill) params.set('skill', this.selectedSkill);
      if (this.selectedStatus) params.set('status', this.selectedStatus);
      if (this.fromDate) params.set('fromDate', this.fromDate);
      if (this.toDate) params.set('toDate', this.toDate);

      const url = `${this.apiUrl}?${params.toString()}`;
      
      const response = await firstValueFrom(
        this.http.get<PagedResult<AdminSubmissionDto>>(url, {
          headers: this.getHeaders()
        })
      );

      this.submissions = response.items || [];
      this.filteredSubmissions = this.submissions;
      this.totalCount = response.totalCount || 0;
      this.totalPages = response.totalPages || 0;

    } catch (error: any) {
      console.error('❌ Load submissions error:', error);
      this.showToastMessage('Không thể tải danh sách bài nộp', 'error');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadStats() {
    this.isLoadingStats = true;
    this.cdr.detectChanges();

    try {
      const response = await firstValueFrom(
        this.http.get<AdminSubmissionStats>(`${this.apiUrl}/stats?days=30`, {
          headers: this.getHeaders()
        })
      );
      this.stats = response;
    } catch (error: any) {
      console.error('❌ Load stats error:', error);
    } finally {
      this.isLoadingStats = false;
      this.cdr.detectChanges();
    }
  }

  async refreshData() {
    await this.loadStats();
    await this.loadSubmissions();
  }

  // ============================================================
  // FILTERS
  // ============================================================

  applyFilters() {
    this.currentPage = 1;
    this.loadSubmissions();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedSkill = '';
    this.selectedStatus = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 1;
    this.loadSubmissions();
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadSubmissions();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadSubmissions();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSubmissions();
    }
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(current + 1, total - 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }

    return pages;
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  viewDetail(submission: AdminSubmissionDto) {
    // ✅ SỬA: Hiển thị màu sắc dựa trên threshold
    const scoreColor = submission.score >= this.PASS_THRESHOLD ? '🟢' : '🔴';
    const statusEmoji = submission.score >= this.PASS_THRESHOLD ? '✅' : '❌';
    
    alert(
      `📋 Chi tiết bài nộp\n\n` +
      `👤 User: ${submission.userName} (${submission.userEmail})\n` +
      `📝 Bài thi: ${submission.exerciseTitle}\n` +
      `🏷️ Kỹ năng: ${submission.skillName}\n` +
      `📊 Điểm: ${scoreColor} ${submission.score}/10\n` +
      `✅ Đúng: ${submission.correctCount}/${submission.totalQuestions}\n` +
      `🕐 Thời gian: ${submission.timeSpentFormatted}\n` +
      `📌 Trạng thái: ${statusEmoji} ${submission.status}\n` +
      `📅 Nộp bài: ${new Date(submission.submittedAt).toLocaleString('vi-VN')}`
    );
  }

  exportData() {
    this.showToastMessage('📥 Đang xuất dữ liệu...', 'info');
    // TODO: Implement export
  }

  // ============================================================
  // HELPERS
  // ============================================================

  // ✅ THÊM CÁC PHƯƠNG THỨC MỚI
  isPassed(score: number): boolean {
    return score >= this.PASS_THRESHOLD;
  }

  getScoreClass(score: number): string {
    return this.isPassed(score) ? 'text-emerald-600' : 'text-red-600';
  }

  getScoreIcon(score: number): string {
    return this.isPassed(score) ? '✅' : '❌';
  }

  getStatusByScore(score: number): string {
    return this.isPassed(score) ? 'Passed' : 'Failed';
  }

  getSkillBadge(skillName: string): string {
    const map: Record<string, string> = {
      'Reading': 'badge-reading',
      'Listening': 'badge-listening',
      'Writing': 'badge-writing',
      'Speaking': 'badge-speaking',
      'FullTest': 'badge-fulltest'
    };
    return map[skillName] || 'badge-default';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Passed': 'badge-passed',
      'Failed': 'badge-failed',
      'In Progress': 'badge-inprogress'
    };
    return map[status] || 'badge-default';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'Passed': '✅',
      'Failed': '❌',
      'In Progress': '⏳'
    };
    return map[status] || '📌';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  // ============================================================
  // TOAST
  // ============================================================

  showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  closeToast() {
    this.showToast = false;
    this.cdr.detectChanges();
  }
}