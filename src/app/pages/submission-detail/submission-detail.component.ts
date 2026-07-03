// 📁 src/app/pages/submission-detail/submission-detail.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ExamService } from '../../services/exam.service';

interface SubmissionDetail {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  skillType: number;
  skillName: string;
  totalScore: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  audioUrl?: string;
  transcript?: string;
  essayText?: string;
  answerJson?: string;
  resultJson?: string;
  aiFeedback?: string;
  details?: SubmissionAnswerDetail[];
}

interface SubmissionAnswerDetail {
  questionId: string;
  questionText: string;
  orderNumber: number;
  userAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  aiScore?: number;
  aiFeedback?: string;
  explanation?: string;
}

@Component({
  selector: 'app-submission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>

    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Loading -->
        <div *ngIf="isLoading" class="flex flex-col items-center justify-center py-16">
          <div class="w-12 h-12 border-4 border-vstep/20 border-t-vstep rounded-full animate-spin"></div>
          <p class="mt-4 text-slate-600">Đang tải chi tiết bài làm...</p>
        </div>

        <!-- Error -->
        <div *ngIf="!isLoading && errorMessage" class="text-center py-16">
          <div class="text-6xl mb-4">❌</div>
          <p class="text-slate-600 text-lg">{{ errorMessage }}</p>
          <button class="mt-4 px-6 py-2 border border-vstep text-vstep rounded-lg hover:bg-vstep-lighter transition" (click)="goBack()">
            ← Quay lại
          </button>
        </div>

        <!-- Content -->
        <div *ngIf="!isLoading && !errorMessage && submission">
          <!-- Back Button -->
          <button class="mb-4 px-4 py-2 border border-vstep text-vstep rounded-lg hover:bg-vstep-lighter transition flex items-center gap-2" (click)="goBack()">
            ← Quay lại lịch sử
          </button>

          <!-- Header -->
          <div class="bg-white rounded-xl shadow-card p-6 mb-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 class="text-2xl font-bold text-slate-800">{{ submission.exerciseTitle }}</h1>
                <div class="flex flex-wrap gap-3 mt-2">
                  <span class="px-3 py-1 bg-vstep-lighter text-vstep rounded-full text-sm">{{ submission.skillName }}</span>
                  <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">📅 {{ formatDate(submission.submittedAt) }}</span>
                  <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">⏱️ {{ formatTime(submission.timeSpentSeconds) }}</span>
                </div>
              </div>
              <div class="text-center">
                <div class="text-4xl font-bold" [class]="getScoreColor(submission.totalScore)">
                  {{ submission.totalScore }}/10
                </div>
                <div class="text-sm text-slate-500">✅ {{ submission.correctCount }}/{{ submission.totalQuestions }} câu đúng</div>
              </div>
            </div>
          </div>

          <!-- AI Feedback -->
          <div *ngIf="submission.aiFeedback" class="bg-white rounded-xl shadow-card p-6 mb-6">
            <h3 class="font-semibold text-slate-800 mb-3">🤖 Nhận xét từ AI</h3>
            <div class="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-slate-700 text-sm">
              {{ submission.aiFeedback }}
            </div>
          </div>

          <!-- Answer Details -->
          <div *ngIf="submission.details && submission.details.length > 0" class="bg-white rounded-xl shadow-card p-6">
            <h3 class="font-semibold text-slate-800 mb-4">📝 Chi tiết câu trả lời</h3>
            <div class="space-y-4">
              <div *ngFor="let detail of submission.details" 
                   class="border border-slate-200 rounded-lg p-4"
                   [class.border-l-4]="true"
                   [class.border-l-emerald-500]="detail.isCorrect"
                   [class.border-l-red-500]="!detail.isCorrect">
                
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-sm font-medium text-slate-500">Câu {{ detail.orderNumber }}</span>
                    <p class="text-slate-700 mt-1">{{ detail.questionText }}</p>
                  </div>
                  <span class="px-2 py-1 rounded-full text-xs font-medium"
                        [class]="detail.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ detail.isCorrect ? '✅ Đúng' : '❌ Sai' }}
                  </span>
                </div>
                
                <div class="mt-2 text-sm">
                  <div class="text-slate-600">
                    📝 Bạn trả lời: <span class="font-medium text-slate-800">{{ detail.userAnswer || 'Chưa trả lời' }}</span>
                  </div>
                  <div *ngIf="!detail.isCorrect && detail.correctAnswer" class="text-emerald-600">
                    ✅ Đáp án đúng: <span class="font-medium">{{ detail.correctAnswer }}</span>
                  </div>
                  <div *ngIf="detail.aiScore" class="text-vstep">
                    🤖 Điểm AI: <span class="font-medium">{{ detail.aiScore }}/10</span>
                  </div>
                  <div *ngIf="detail.explanation" class="mt-2 p-3 bg-blue-50 rounded-lg text-slate-700">
                    💡 {{ detail.explanation }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Audio (Speaking) -->
          <div *ngIf="submission.audioUrl" class="bg-white rounded-xl shadow-card p-6 mt-6">
            <h3 class="font-semibold text-slate-800 mb-3">🎙️ Ghi âm của bạn</h3>
            <audio controls class="w-full">
              <source [src]="submission.audioUrl" type="audio/webm">
              Trình duyệt của bạn không hỗ trợ audio.
            </audio>
            <div *ngIf="submission.transcript" class="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
              📝 Transcript: {{ submission.transcript }}
            </div>
          </div>

          <!-- Essay (Writing) -->
          <div *ngIf="submission.essayText" class="bg-white rounded-xl shadow-card p-6 mt-6">
            <h3 class="font-semibold text-slate-800 mb-3">✍️ Bài viết của bạn</h3>
            <div class="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-slate-700">
              {{ submission.essayText }}
            </div>
          </div>

          <!-- Answer JSON (Reading/Listening) -->
          <div *ngIf="submission.answerJson" class="bg-white rounded-xl shadow-card p-6 mt-6">
            <h3 class="font-semibold text-slate-800 mb-3">📊 Đáp án chi tiết</h3>
            <div class="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 overflow-x-auto">
              <pre>{{ submission.answerJson | json }}</pre>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex flex-wrap gap-4">
            <button class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition" (click)="goBack()">
              ← Quay lại
            </button>
            <button class="px-6 py-2 border border-vstep text-vstep rounded-lg hover:bg-vstep-lighter transition" (click)="retakeExam()">
              🔄 Làm lại bài này
            </button>
          </div>
        </div>

      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    .shadow-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  `]
})
export class SubmissionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private examService = inject(ExamService);
  private cdr = inject(ChangeDetectorRef);

  submission: SubmissionDetail | null = null;
  isLoading = true;
  errorMessage = '';
  submissionId = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.submissionId = params['id'];
      if (this.submissionId) {
        this.loadSubmissionDetail();
      } else {
        this.errorMessage = 'Không tìm thấy ID bài làm';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSubmissionDetail() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.examService.getSubmissionDetail(this.submissionId).subscribe({
      next: (data: SubmissionDetail) => {
        this.submission = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('📋 Submission detail:', data);
      },
      error: (err) => {
        console.error('❌ Error loading submission detail:', err);
        if (err.status === 404) {
          this.errorMessage = 'Không tìm thấy bài làm này.';
        } else if (err.status === 403) {
          this.errorMessage = 'Bạn không có quyền xem bài làm này.';
        } else {
          this.errorMessage = 'Không thể tải chi tiết bài làm. Vui lòng thử lại!';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-amber-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
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

  goBack() {
    this.router.navigate(['/my-submissions']);
  }

  retakeExam() {
    if (this.submission?.exerciseId) {
      this.router.navigate(['/exam', this.submission.exerciseId]);
    }
  }
}