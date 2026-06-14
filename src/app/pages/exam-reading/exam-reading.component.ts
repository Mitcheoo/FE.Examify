import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-reading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-reading.component.html',
  styleUrls: ['./exam-reading.component.scss']
})
export class ExamReadingComponent implements OnInit, OnDestroy {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  exam: any = null;
  answers: Record<string, string> = {};
  timeRemaining: number = 3600;
  isSubmitting = false;
  currentQuestionIndex: number = 0;
  showNavigator: boolean = true;
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';
  private sessionId: string = '';

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    const savedNavState = localStorage.getItem('reading_show_navigator');
    if (savedNavState !== null) {
      this.showNavigator = savedNavState === 'true';
    }
    
    // ✅ LẤY SESSION ID TỪ QUERY PARAMS
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Reading received sessionId from queryParams:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
        console.log('📌 Reading received fullTestId from queryParams:', this.fullTestId);
      }
    });
    
    // ✅ FALLBACK: Lấy từ navigation state (nếu có)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { fullTestId?: string; sessionId?: string };
    if (state?.sessionId && !this.sessionId) {
      this.sessionId = state.sessionId;
      console.log('📌 Reading received sessionId from state:', this.sessionId);
    }
    if (state?.fullTestId && !this.fullTestId) {
      this.fullTestId = state.fullTestId;
    }
    
    if (!this.fullTestId && history.state?.fullTestId) {
      this.fullTestId = history.state.fullTestId;
    }
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('📌 Reading Exam ID:', this.examId);
      console.log('📌 Full Test ID:', this.fullTestId);
      console.log('📌 Session ID:', this.sessionId);
      this.loadExam();
      this.loadSavedAnswers();
    });
  }

  toggleNavigator() {
    this.showNavigator = !this.showNavigator;
    localStorage.setItem('reading_show_navigator', String(this.showNavigator));
  }

  loadSavedAnswers() {
    const saved = localStorage.getItem('reading_answers_' + this.examId + '_' + this.userId);
    if (saved) {
      try {
        this.answers = JSON.parse(saved);
        console.log('📦 Loaded saved answers:', Object.keys(this.answers).length);
      } catch(e) {
        console.error('Error loading saved answers:', e);
      }
    }
  }

  loadExam() {
    console.log('🔄 Loading Reading exam...');
    this.examService.getReadingExam(this.examId).subscribe({
      next: (data: any) => {
        const parsedQuestions = (data.questions || []).map((q: any) => {
          let options: { key: string; value: string }[] = [];
          try {
            const optsJson = q.optionsJson;
            if (optsJson) {
              const parsed = typeof optsJson === 'string' ? JSON.parse(optsJson) : optsJson;
              options = Object.entries(parsed).map(([key, value]) => ({ key, value: value as string }));
            }
          } catch (e) {
            console.error('Error parsing options:', e);
          }
          return {
            id: q.id,
            orderNumber: q.orderNumber,
            questionText: q.questionText,
            options: options,
            correctAnswer: q.correctAnswer
          };
        });
        
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds,
          totalQuestions: data.totalQuestions,
          parts: data.parts || [],
          questions: parsedQuestions
        };
        
        this.timeRemaining = this.exam.timeLimitSeconds || 3600;
        this.startTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading Reading exam:', err);
        alert('Không thể tải đề thi Reading. Vui lòng thử lại!');
      }
    });
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.cdr.detectChanges();
      } else {
        this.submitExam();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes + ':' + secs.toString().padStart(2, '0');
  }

  get answeredCount(): number {
    return Object.keys(this.answers).filter(key => this.answers[key]?.trim()).length;
  }

  onAnswerChange() {
    localStorage.setItem('reading_answers_' + this.examId + '_' + this.userId, JSON.stringify(this.answers));
    this.cdr.detectChanges();
  }

  scrollToQuestion(index: number) {
    this.currentQuestionIndex = index;
    const element = document.getElementById('question-' + index);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const totalTime = (this.exam?.timeLimitSeconds || 3600) - this.timeRemaining;
    
    const answersDict: Record<string, string> = {};
    Object.entries(this.answers).forEach(([id, answer]) => {
      if (answer) answersDict[id] = answer;
    });

    const submitData = {
      exerciseId: this.examId,
      answers: answersDict,
      timeSpentSeconds: totalTime,
      sessionId: this.sessionId
    };

    console.log('📤 Submitting Reading:', submitData);
    console.log('📌 Session ID:', this.sessionId);

    this.isSubmitting = true;
    this.examService.submitReading(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        
        // ✅ LƯU SUBMISSION ID VÀO SESSION
        if (this.sessionId && result.submissionId) {
          this.examService.savePartResult(this.sessionId, 'reading', result.submissionId).subscribe({
            next: () => console.log('✅ Saved reading result to session'),
            error: (err) => console.error('❌ Failed to save part result:', err)
          });
        }
        
        const storageKey = 'reading_result_' + this.examId + '_' + this.userId;
        localStorage.setItem(storageKey, JSON.stringify(result));
        localStorage.removeItem('reading_answers_' + this.examId + '_' + this.userId);
        
        // ✅ QUAY LẠI FULL TEST VỚI QUERY PARAMS
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