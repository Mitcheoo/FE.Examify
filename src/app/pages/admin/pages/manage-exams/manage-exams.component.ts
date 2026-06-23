// src/app/pages/admin/pages/manage-exams/manage-exams.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ExamService } from '../../../../services/exam.service';

@Component({
  selector: 'app-manage-exams-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-exams.component.html',
})
export class ManageExamsPageComponent implements OnInit {
  private authService = inject(AuthService);
  private examService = inject(ExamService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  userFullName = '';
  exams: any[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.userFullName = this.authService.getCurrentUser()?.fullName || 'Admin';
    console.log('🚀 ManageExamsPageComponent initialized');
    
    // ✅ FORCE LOAD DỮ LIỆU
    this.loadExams();
  }

  loadExams() {
    this.isLoading = true;
    console.log('🔄 Loading exams...');
    
    this.examService.getExercisesList().subscribe({
      next: (response: any) => {
        console.log('📦 Response received:', response);
        
        const allExams = response.items || [];
        
        this.exams = allExams.map((exam: any) => ({
          id: exam.id,
          title: exam.title,
          skill: exam.skill,
          isFullTest: exam.isFullTest || false,
          status: this.getExamStatus(exam),
          created: exam.createdAt ? new Date(exam.createdAt).toISOString().split('T')[0] : 'N/A',
          totalQuestions: exam.totalQuestions || 0,
          timeLimitSeconds: exam.timeLimitSeconds || 0,
          description: exam.description
        }));
        
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
        console.log('✅ Loaded exams:', this.exams.length);
      },
      error: (err) => {
        console.error('❌ Error loading exams:', err);
        this.errorMessage = 'Không thể tải danh sách bài thi. Vui lòng thử lại!';
        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
      }
    });
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

  deleteExam(id: string) {
    if (confirm('Bạn có chắc muốn xóa bài thi này?')) {
      console.log('🗑️ Delete exam:', id);
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

  refresh() {
    console.log('🔄 Refresh clicked');
    this.loadExams();
  }
}