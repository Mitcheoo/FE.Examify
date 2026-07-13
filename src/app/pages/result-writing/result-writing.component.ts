// src/app/pages/result-writing/result-writing.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-result-writing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-writing.component.html',
  styleUrls: ['./result-writing.component.scss']
})
export class ResultWritingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private examService = inject(ExamService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  submissionId: string = '';
  result: any = null;
  isLoading = true;
  error = '';
  userId: string = '';
  exerciseId: string = '';
  expandedEssayIndex: number | null = null;

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.params.subscribe(params => {
      this.submissionId = params['id'];
      console.log('📌 Submission ID:', this.submissionId);
      this.loadResult();
    });

    this.route.queryParams.subscribe(params => {
      if (params['exerciseId']) {
        this.exerciseId = params['exerciseId'];
      }
    });
  }

  loadResult() {
    this.isLoading = true;
    this.error = '';
    this.cdr.detectChanges();

    // Thử lấy từ localStorage trước
    const localKey = `writing_result_${this.exerciseId || this.submissionId}_${this.userId}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      try {
        this.result = JSON.parse(localData);
        console.log('📦 Loaded from localStorage:', this.result);
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      } catch (e) {
        console.error('Error parsing local data:', e);
      }
    }

    // Nếu không có trong localStorage, gọi API
    if (this.submissionId) {
      this.examService.getSubmissionResult(this.submissionId).subscribe({
        next: (data) => {
          console.log('✅ Result loaded:', data);
          this.result = data;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error loading result:', err);
          this.error = 'Không thể tải kết quả. Vui lòng thử lại!';
          this.isLoading = false;
          this.cdr.detectChanges();
          this.createFallbackResult();
        }
      });
    } else {
      this.error = 'Không tìm thấy ID bài làm';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  createFallbackResult() {
    const localKey = `writing_result_${this.exerciseId || this.submissionId}_${this.userId}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      try {
        this.result = JSON.parse(localData);
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      } catch (e) {}
    }

    this.result = {
      id: this.submissionId,
      exerciseTitle: 'Bài thi Writing',
      totalScore: 0,
      totalQuestions: 2,
      timeSpentSeconds: 0,
      details: [
        { 
          score: 0, 
          questionText: 'Task 1: Letter', 
          userAnswer: 'Chưa có bài viết', 
          wordCount: 0,
          minWords: 150,
          maxWords: 300,
          aiFeedback: null 
        },
        { 
          score: 0, 
          questionText: 'Task 2: Essay', 
          userAnswer: 'Chưa có bài viết', 
          wordCount: 0,
          minWords: 150,
          maxWords: 300,
          aiFeedback: null 
        }
      ],
      submittedAt: new Date().toISOString()
    };
    this.isLoading = false;
    this.cdr.detectChanges();
    console.log('📦 Fallback result created for Writing');
  }

  toggleEssay(index: number) {
    this.expandedEssayIndex = this.expandedEssayIndex === index ? null : index;
  }

  getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  }

  getScoreEmoji(score: number): string {
    if (score >= 8) return '🌟';
    if (score >= 6) return '👍';
    if (score >= 4) return '📚';
    return '💪';
  }

  getStatusText(score: number): string {
    if (score >= 8) return 'Xuất sắc!';
    if (score >= 6) return 'Khá tốt!';
    if (score >= 4) return 'Cần cải thiện';
    return 'Cần luyện tập thêm';
  }

  goBack() {
    this.router.navigate(['/exam-list']);
  }

  retry() {
    this.loadResult();
  }
}