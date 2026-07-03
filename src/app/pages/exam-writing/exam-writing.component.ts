// 📁 src/app/pages/exam-writing/exam-writing.component.ts

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
  isLoading = true;
  errorMessage: string = '';
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';
  private sessionId: string = '';

  private syncTimeout: any = null;
  private isSyncing: boolean = false;
  private hasUnsavedChanges: boolean = false;

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Writing sessionId:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
        console.log('📌 Writing fullTestId:', this.fullTestId);
      }
    });
    
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { fullTestId?: string; sessionId?: string };
    if (state?.sessionId && !this.sessionId) {
      this.sessionId = state.sessionId;
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

    window.addEventListener('beforeunload', () => {
      this.syncToServer();
    });
  }

  // ========== LOAD SAVED ANSWERS ==========
  loadSavedAnswers() {
    const localKey = 'writing_answers_' + this.examId + '_' + this.userId;
    
    const isNewSession = localStorage.getItem(`new_session_${this.sessionId}`) === 'true';
    
    if (isNewSession) {
      localStorage.removeItem(localKey);
      console.log('🗑️ Cleared old writing draft answers for new session');
      localStorage.removeItem(`new_session_${this.sessionId}`);
    }
    
    const localData = localStorage.getItem(localKey);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        this.answers = parsed.answers || {};
        Object.keys(this.answers).forEach(questionId => {
          this.updateWordCount(questionId);
        });
        console.log('📦 Loaded from localStorage:', Object.keys(this.answers).length);
      } catch(e) {
        console.error('Error loading local answers:', e);
      }
    }

    if (this.sessionId) {
      this.examService.getDraftAnswers(this.sessionId).subscribe({
        next: (data: any) => {
          if (data && data.length > 0) {
            const serverAnswers: Record<string, string> = {};
            data.forEach((item: any) => {
              serverAnswers[item.questionId] = item.userAnswer || '';
            });
            
            let mergedCount = 0;
            Object.keys(serverAnswers).forEach(key => {
              if (!this.answers[key] || serverAnswers[key] !== this.answers[key]) {
                this.answers[key] = serverAnswers[key];
                this.updateWordCount(key);
                mergedCount++;
              }
            });
            
            console.log('📦 Merged from server:', mergedCount, 'answers');
            console.log('📦 Total answers:', Object.keys(this.answers).length);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error loading server answers:', err);
        }
      });
    }
  }

  // ========== AUTO-SAVE TO LOCAL ==========
  saveToLocal() {
    const key = 'writing_answers_' + this.examId + '_' + this.userId;
    const toSave = {
      answers: this.answers,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(toSave));
    this.hasUnsavedChanges = true;
  }

  // ========== SYNC TO SERVER ==========
  syncToServer() {
    if (this.isSyncing || !this.sessionId) return;
    
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      if (Object.keys(this.answers).length === 0) return;
      
      this.isSyncing = true;
      
      const answerList = Object.entries(this.answers)
        .filter(([_, answer]) => answer && answer.trim().length > 0)
        .map(([questionId, userAnswer]) => ({
          questionId: questionId,
          skillType: 2,
          userAnswer: userAnswer || ''
        }));

      if (answerList.length === 0) {
        this.isSyncing = false;
        return;
      }

      const payload = {
        sessionId: this.sessionId,
        answers: answerList
      };

      console.log('📤 Syncing writing to server:', answerList.length, 'answers');
      
      this.examService.saveDraftAnswers(payload).subscribe({
        next: () => {
          console.log('✅ Writing synced to server successfully');
          this.hasUnsavedChanges = false;
          this.isSyncing = false;
        },
        error: (err) => {
          console.error('❌ Writing sync failed:', err);
          this.isSyncing = false;
        }
      });
    }, 3000);
  }

  // ========== FORCE SYNC ==========
  forceSyncToServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
      }
      
      if (!this.sessionId || Object.keys(this.answers).length === 0) {
        resolve();
        return;
      }

      const answerList = Object.entries(this.answers)
        .filter(([_, answer]) => answer && answer.trim().length > 0)
        .map(([questionId, userAnswer]) => ({
          questionId: questionId,
          skillType: 2,
          userAnswer: userAnswer || ''
        }));

      if (answerList.length === 0) {
        resolve();
        return;
      }

      this.isSyncing = true;
      const payload = { sessionId: this.sessionId, answers: answerList };
      
      this.examService.saveDraftAnswers(payload).subscribe({
        next: () => {
          console.log('✅ Writing force sync completed');
          this.hasUnsavedChanges = false;
          this.isSyncing = false;
          resolve();
        },
        error: (err) => {
          console.error('❌ Writing force sync failed:', err);
          this.isSyncing = false;
          resolve();
        }
      });
    });
  }

  // ========== ON TEXT CHANGE ==========
  onTextChange(questionId: string) {
    this.updateWordCount(questionId);
    this.saveToLocal();
    this.syncToServer();
    this.cdr.detectChanges();
  }

  // ========== LOAD EXAM ==========
  loadExam() {
    console.log('🔄 Loading Writing exam...');
    this.isLoading = true;
    this.errorMessage = '';
    this.answers = {};
    this.wordCounts = {};
    
    this.examService.getWritingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Writing data:', data);
        
        const questions = data.questions || [];
        
        // ✅ KHÔNG CÓ CÂU HỎI - HIỂN THỊ THÔNG BÁO
        if (questions.length === 0) {
          console.warn('⚠️ Không có câu hỏi từ API');
          this.errorMessage = '⚠️ Chưa có câu hỏi cho bài thi này. Vui lòng quay lại sau.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        this.questions = questions;
        
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
        this.isLoading = false;
        this.startTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading Writing exam:', err);
        this.isLoading = false;
        this.errorMessage = '❌ Không thể tải đề thi. Vui lòng thử lại sau!';
        this.cdr.detectChanges();
        alert('Không thể tải đề thi. Vui lòng thử lại!');
      }
    });
  }

  updateWordCount(questionId: string) {
    const text = this.answers[questionId] || '';
    if (text) {
      this.wordCounts[questionId] = text.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    } else {
      this.wordCounts[questionId] = 0;
    }
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

  // ========== SUBMIT ==========
  async submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    await this.forceSyncToServer();

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
    console.log('📌 Total time spent:', totalTime, 'seconds');
    console.log('📌 Session ID:', this.sessionId);

    this.isSubmitting = true;
    this.examService.submitWriting(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        
        const resultWithSource = {
          ...result,
          timeSpentSeconds: totalTime,
          source: this.fullTestId ? 'fulltest' : 'standalone',
          fullTestId: this.fullTestId || null,
          submittedAt: new Date().toISOString()
        };
        
        const storageKey = 'writing_result_' + this.examId + '_' + this.userId;
        localStorage.setItem(storageKey, JSON.stringify(resultWithSource));
        
        console.log('💾 Saved to localStorage with timeSpentSeconds:', totalTime);
        
        const draftKey = 'writing_answers_' + this.examId + '_' + this.userId;
        localStorage.removeItem(draftKey);
        
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
goBack(): void {
  if (this.fullTestId) {
    this.router.navigate(['/exam', this.fullTestId]);
  } else if (this.examId) {
    this.router.navigate(['/exam', this.examId]);
  } else {
    this.router.navigate(['/exam-list']);
  }
}
  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.forceSyncToServer();
    window.removeEventListener('beforeunload', () => {});
  }
}