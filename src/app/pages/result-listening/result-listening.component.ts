// src/app/pages/result-listening/result-listening.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-result-listening',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-listening.component.html',
  styleUrls: ['./result-listening.component.scss']
})
export class ResultListeningComponent implements OnInit {
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
    const localKey = `listening_result_${this.exerciseId || this.submissionId}_${this.userId}`;
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
    // Kiểm tra lại localStorage lần nữa
    const localKey = `listening_result_${this.exerciseId || this.submissionId}_${this.userId}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      try {
        this.result = JSON.parse(localData);
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      } catch (e) {}
    }

    // Tạo kết quả mẫu từ submissionId
    this.result = {
      id: this.submissionId,
      exerciseTitle: 'Bài thi Listening',
      totalScore: 0,
      totalQuestions: 35,
      correctCount: 0,
      timeSpentSeconds: 0,
      details: [
        { isCorrect: false, questionText: 'Câu 1', userAnswer: 'Chưa có', correctAnswer: 'N/A' },
        { isCorrect: false, questionText: 'Câu 2', userAnswer: 'Chưa có', correctAnswer: 'N/A' },
        { isCorrect: false, questionText: 'Câu 3', userAnswer: 'Chưa có', correctAnswer: 'N/A' },
        { isCorrect: false, questionText: 'Câu 4', userAnswer: 'Chưa có', correctAnswer: 'N/A' },
        { isCorrect: false, questionText: 'Câu 5', userAnswer: 'Chưa có', correctAnswer: 'N/A' }
      ],
      submittedAt: new Date().toISOString()
    };
    this.isLoading = false;
    this.cdr.detectChanges();
    console.log('📦 Fallback result created for Listening');
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
    this.router.navigate(['/listening']);
  }

  retry() {
    this.loadResult();
  }
}