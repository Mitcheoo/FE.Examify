import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-writing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-writing.component.html',
  styleUrls: ['./exam-writing.component.scss']
})
export class ExamWritingComponent implements OnInit, OnDestroy {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  exam: any = null;
  essayText: string = '';
  timeRemaining: number = 3600;
  isSubmitting = false;
  wordCount: number = 0;
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';
  private currentTaskIndex: number = 0;
  private tasks: any[] = [];

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { fullTestId?: string };
    
    if (state?.fullTestId) {
      this.fullTestId = state.fullTestId;
    }
    
    if (!this.fullTestId && history.state?.fullTestId) {
      this.fullTestId = history.state.fullTestId;
    }
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('✍️ Writing Exam ID:', this.examId);
      console.log('📌 User ID:', this.userId);
      console.log('📌 Full Test ID:', this.fullTestId);
      this.loadExam();
    });
  }

  loadExam() {
    console.log('🔄 Loading Writing exam...');
    this.examService.getWritingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Writing data:', data);
        
        this.tasks = data.tasks || [];
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds || 3600,
          tasks: this.tasks,
          totalQuestions: data.totalQuestions
        };
        
        console.log('✅ Parsed Writing exam:', this.exam);
        this.timeRemaining = this.exam.timeLimitSeconds;
        
        this.startTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading Writing exam:', err);
        alert('Không thể tải đề thi Writing. Vui lòng thử lại!');
      }
    });
  }

  startTimer() {
    console.log('🕐 Starting Writing timer with:', this.timeRemaining);
    
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.updateWordCount();
        this.cdr.detectChanges();
      } else {
        console.log('⏰ Time is up!');
        this.submitExam();
      }
    }, 1000);
  }

  updateWordCount() {
    if (this.essayText) {
      this.wordCount = this.essayText.trim().split(/\s+/).filter(w => w.length > 0).length;
    } else {
      this.wordCount = 0;
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getTaskTypeName(taskType: number): string {
    const types: any = {
      0: 'Letter',
      1: 'Essay',
      2: 'Report'
    };
    return types[taskType] || 'Writing Task';
  }

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const totalTime = (this.exam?.timeLimitSeconds || 3600) - this.timeRemaining;

    const submitData = {
      exerciseId: this.examId,
      essayText: this.essayText,
      timeSpentSeconds: totalTime
    };

    console.log('📤 Submitting Writing:', submitData);

    this.isSubmitting = true;
    this.examService.submitWriting(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        
        const storageKey = `writing_result_${this.examId}_${this.userId}`;
        localStorage.setItem(storageKey, JSON.stringify(result));
        console.log('💾 Saved to:', storageKey);
        
        const returnUrl = this.fullTestId || this.examId;
        this.router.navigate(['/exam', returnUrl]);
      },
      error: (err) => {
        console.error('❌ Submit error:', err);
        alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!');
        this.isSubmitting = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}