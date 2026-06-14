import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

interface WritingQuestion {
  id: string;
  orderNumber: number;
  taskType: number;
  promptText: string;
  minWords: number;
  maxWords: number;
  recommendedTimeMinutes: number;
}

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
  questions: WritingQuestion[] = [];
  answers: Record<string, string> = {};
  wordCounts: Record<string, number> = {};
  timeRemaining: number = 3600;
  isSubmitting = false;
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';
  private sessionId: string = '';

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    // ✅ LẤY SESSION ID TỪ QUERY PARAMS
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Writing received sessionId from queryParams:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
        console.log('📌 Writing received fullTestId from queryParams:', this.fullTestId);
      }
    });
    
    // ✅ FALLBACK: Lấy từ navigation state (nếu có)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { fullTestId?: string; sessionId?: string };
    if (state?.sessionId && !this.sessionId) {
      this.sessionId = state.sessionId;
      console.log('📌 Writing received sessionId from state:', this.sessionId);
    }
    if (state?.fullTestId && !this.fullTestId) {
      this.fullTestId = state.fullTestId;
    }
    
    if (!this.fullTestId && history.state?.fullTestId) {
      this.fullTestId = history.state.fullTestId;
    }
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('✍️ Writing Exam ID:', this.examId);
      console.log('✍️ Full Test ID:', this.fullTestId);
      console.log('✍️ Session ID:', this.sessionId);
      this.loadExam();
      this.loadSavedAnswers();
    });
  }

  loadExam() {
    console.log('🔄 Loading Writing exam...');
    this.examService.getWritingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Writing data:', data);
        
        this.questions = data.questions || [];
        
        this.questions.forEach((q: WritingQuestion) => {
          if (!this.answers[q.id]) {
            this.answers[q.id] = '';
            this.wordCounts[q.id] = 0;
          }
        });
        
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds || 3600,
          questions: this.questions,
          totalQuestions: this.questions.length
        };
        
        console.log('✅ Parsed Writing exam:', this.exam);
        console.log('✅ Questions:', this.questions.length);
        
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

  loadSavedAnswers() {
    const key = 'writing_answers_' + this.examId + '_' + this.userId;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.answers = parsed.answers || {};
        Object.keys(this.answers).forEach(questionId => {
          this.updateWordCount(questionId);
        });
        console.log('📦 Loaded saved answers:', Object.keys(this.answers).length);
      } catch(e) {
        console.error('Error loading saved answers:', e);
      }
    }
  }

  saveAnswersToLocal() {
    const key = 'writing_answers_' + this.examId + '_' + this.userId;
    const toSave = {
      answers: this.answers,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  }

  updateWordCount(questionId: string) {
    const text = this.answers[questionId] || '';
    if (text) {
      this.wordCounts[questionId] = text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    } else {
      this.wordCounts[questionId] = 0;
    }
    this.saveAnswersToLocal();
  }

  getWordCount(questionId: string): number {
    return this.wordCounts[questionId] || 0;
  }

  getMinWords(question: WritingQuestion): number {
    return question.minWords || 150;
  }

  getMaxWords(question: WritingQuestion): number {
    return question.maxWords || 300;
  }

  isWordCountValid(questionId: string): boolean {
    const question = this.questions.find(function(q) { return q.id === questionId; });
    if (!question) { return true; }
    const wordCount = this.getWordCount(questionId);
    const minWords = this.getMinWords(question);
    const maxWords = this.getMaxWords(question);
    return wordCount >= minWords && wordCount <= maxWords;
  }

  startTimer() {
    console.log('🕐 Starting Writing timer with:', this.timeRemaining);
    
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.cdr.detectChanges();
      } else {
        console.log('⏰ Time is up!');
        this.submitExam();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes + ':' + (secs < 10 ? '0' : '') + secs;
  }

  getTaskTypeName(taskType: number): string {
    if (taskType === 1 || taskType === 0) {
      return 'Letter';
    }
    return 'Essay';
  }

  get answeredCount(): number {
    let count = 0;
    for (const key in this.answers) {
      if (this.answers[key] && this.answers[key].trim().length > 0) {
        count++;
      }
    }
    return count;
  }

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const totalTime = (this.exam?.timeLimitSeconds || 3600) - this.timeRemaining;
    
    const answersDict: Record<string, string> = {};
    this.questions.forEach((q: WritingQuestion) => {
      if (this.answers[q.id] && this.answers[q.id].trim()) {
        answersDict[q.id] = this.answers[q.id];
      }
    });

    const submitData = {
      exerciseId: this.examId,
      answers: answersDict,
      timeSpentSeconds: totalTime,
      sessionId: this.sessionId
    };

    console.log('📤 Submitting Writing:', submitData);
    console.log('📤 Answers count:', Object.keys(answersDict).length);
    console.log('📌 Session ID:', this.sessionId);

    this.isSubmitting = true;
    this.examService.submitWriting(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        
        // ✅ LƯU SUBMISSION ID VÀO SESSION
        if (this.sessionId && result.submissionId) {
          this.examService.savePartResult(this.sessionId, 'writing', result.submissionId).subscribe({
            next: () => console.log('✅ Saved writing result to session'),
            error: (err) => console.error('❌ Failed to save part result:', err)
          });
        }
        
        const storageKey = 'writing_result_' + this.examId + '_' + this.userId;
        localStorage.setItem(storageKey, JSON.stringify(result));
        localStorage.removeItem('writing_answers_' + this.examId + '_' + this.userId);
        
        // ✅ QUAY LẠI FULL TEST
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
    this.saveAnswersToLocal();
  }
}