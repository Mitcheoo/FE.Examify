// 📁 src/app/pages/admin/pages/manage-exams/manage-exams.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ExamService } from '../../../../services/exam.service';
import { AdminExamService } from '../../../../services/admin-exam.service';

@Component({
  selector: 'app-manage-exams-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './manage-exams.component.html',
  styleUrls: ['./manage-exams.component.scss']
})
export class ManageExamsPageComponent implements OnInit {
  private authService = inject(AuthService);
  private examService = inject(ExamService);
  private adminExamService = inject(AdminExamService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  userFullName = '';
  exams: any[] = [];
  isLoading = true;
  errorMessage = '';
  isDeleting = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // Filter
  selectedSkill: string = '';
  searchKeyword: string = '';

  ngOnInit() {
    this.userFullName = this.authService.getCurrentUser()?.fullName || 'Admin';
    console.log('🚀 ManageExamsPageComponent initialized');
    this.loadExams();
  }

  loadExams() {
    this.isLoading = true;
    console.log('🔄 Loading exams with pagination...');
    
    const skill = this.selectedSkill ? parseInt(this.selectedSkill) : undefined;
    const search = this.searchKeyword || undefined;
    
    this.examService.getExercisesList(this.currentPage, this.pageSize, skill, search).subscribe({
      next: (response: any) => {
        console.log('📦 Response received:', response);
        
        const items = response.items || [];
        this.totalItems = response.totalCount || 0;
        this.totalPages = response.totalPages || 0;
        
        this.exams = items.map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          skill: exam.skill,
          isFullTest: exam.isFullTest || false,
          status: this.getExamStatus(exam),
          created: this.formatDate(exam.createdAt),
          totalQuestions: exam.totalQuestions || 0,
          timeLimitSeconds: exam.timeLimitSeconds || 0,
          description: exam.description
        }));
        
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('✅ Loaded exams:', this.exams.length, 'Total:', this.totalItems);
      },
      error: (err) => {
        console.error('❌ Error loading exams:', err);
        this.errorMessage = 'Không thể tải danh sách bài thi. Vui lòng thử lại!';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============ PAGINATION ============

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadExams();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadExams();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ============ FILTER ============

  onSearch(): void {
    this.currentPage = 1;
    this.loadExams();
  }

  resetFilters(): void {
    this.selectedSkill = '';
    this.searchKeyword = '';
    this.currentPage = 1;
    this.loadExams();
  }

  // ============ NAVIGATION ============

  navigateToFullTestQuestions(fullTestId: string): void {
    this.router.navigate(['/admin/fulltest', fullTestId, 'questions']);
  }
  navigateToAddQuestions(exerciseId: string, skill: number): void {
  this.router.navigate(['/admin/exercises', exerciseId, 'add-questions'], {
    queryParams: { skill: skill }
  });}

  // ============ DELETE ============

  deleteExam(id: string): void {
    if (this.isDeleting) return;

    const exam = this.exams.find(e => e.id === id);
    const confirmMessage = `Bạn có chắc muốn xóa bài thi "${exam?.title || id}"?\n\nHành động này không thể hoàn tác!`;
    
    if (!confirm(confirmMessage)) return;

    this.isDeleting = true;
    console.log('🗑️ Deleting exam:', id);

    this.adminExamService.deleteExercise(id).subscribe({
      next: () => {
        console.log('✅ Exam deleted successfully');
        this.isDeleting = false;
        this.loadExams();
        alert('✅ Đã xóa bài thi thành công!');
      },
      error: (err) => {
        console.error('❌ Delete exam error:', err);
        this.isDeleting = false;
        alert(`❌ Không thể xóa bài thi: ${err.error?.message || 'Vui lòng thử lại!'}`);
      }
    });
  }

  // ============ HELPERS ============

  formatDate(dateValue: any): string {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return `${hours}h ${remainMinutes}p`;
  }

  getExamStatus(exam: any): string {
    if (exam.isFullTest) return 'Full Test';
    if (exam.isPublished) return 'Published';
    return 'Draft';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Full Test': 'bg-purple-100 text-purple-700',
      'Published': 'bg-emerald-100 text-emerald-700',
      'Draft': 'bg-slate-100 text-slate-700'
    };
    return classes[status] || 'bg-slate-100 text-slate-700';
  }

  getExamType(exam: any): string {
    if (exam.isFullTest) return '📚 Full Test';
    const skillNames: { [key: number]: string } = {
      0: '📖 Reading',
      1: '🎧 Listening',
      2: '✍️ Writing',
      3: '🎙️ Speaking'
    };
    return skillNames[exam.skill] || '📝 Exercise';
  }

  getSkillBadge(skill: number): string {
    const colors: { [key: number]: string } = {
      0: 'bg-blue-100 text-blue-700',
      1: 'bg-green-100 text-green-700',
      2: 'bg-orange-100 text-orange-700',
      3: 'bg-pink-100 text-pink-700'
    };
    return colors[skill] || 'bg-gray-100 text-gray-700';
  }

  getSkillName(skill: number): string {
    const names: { [key: number]: string } = {
      0: 'Reading',
      1: 'Listening',
      2: 'Writing',
      3: 'Speaking'
    };
    return names[skill] || 'Unknown';
  }

  refresh() {
    console.log('🔄 Refresh clicked');
    this.loadExams();
  }
}