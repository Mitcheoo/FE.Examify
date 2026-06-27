import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';
interface SubmitReadingCommand {
  exerciseId: string;
  answers: { [key: string]: string };
  timeSpentSeconds: number;
  sessionId?: string;
  
}

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
  
  // ✅ HYBRID: Dùng để debounce sync lên server
  private syncTimeout: any = null;
  private isSyncing: boolean = false;
  private hasUnsavedChanges: boolean = false;

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    const savedNavState = localStorage.getItem('reading_show_navigator');
    if (savedNavState !== null) {
      this.showNavigator = savedNavState === 'true';
    }
    
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Reading sessionId:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
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
      console.log('📌 Reading Exam ID:', this.examId);
      this.loadExam();
      this.loadSavedAnswers();
    });

    // ✅ LƯU TRƯỚC KHI THOÁT
    window.addEventListener('beforeunload', () => {
      this.syncToServer();
    });
  }

  // ========== LOAD SAVED ANSWERS (ƯU TIÊN SERVER) ==========
  loadSavedAnswers() {
    // 1. Load từ localStorage (nhanh)
    const localKey = 'reading_answers_' + this.examId + '_' + this.userId;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      try {
        this.answers = JSON.parse(localData);
        console.log('📦 Loaded from localStorage:', Object.keys(this.answers).length);
      } catch(e) {
        console.error('Error loading local answers:', e);
      }
    }

    // 2. Load từ server (nếu có sessionId)
    if (this.sessionId) {
      this.examService.getDraftAnswers(this.sessionId).subscribe({
        next: (data: any) => {
          if (data && data.length > 0) {
            // Merge: ưu tiên server (mới hơn)
            const serverAnswers: Record<string, string> = {};
            data.forEach((item: any) => {
              serverAnswers[item.questionId] = item.userAnswer;
            });
            
            // So sánh thời gian và lấy dữ liệu mới nhất
            // Ở đây ta merge: server có thì lấy server, không thì giữ local
            let mergedCount = 0;
            Object.keys(serverAnswers).forEach(key => {
              if (!this.answers[key] || serverAnswers[key] !== this.answers[key]) {
                this.answers[key] = serverAnswers[key];
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
    const key = 'reading_answers_' + this.examId + '_' + this.userId;
    localStorage.setItem(key, JSON.stringify(this.answers));
    this.hasUnsavedChanges = true;
  }

  // ========== SYNC TO SERVER (DEBOUNCE 3s) ==========
  syncToServer() {
    if (this.isSyncing || !this.sessionId) return;
    
    // Clear timeout cũ
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Debounce: chỉ sync sau 3s không có thay đổi
    this.syncTimeout = setTimeout(() => {
      if (Object.keys(this.answers).length === 0) return;
      
      this.isSyncing = true;
      
      // Chuyển answers sang format array
      const answerList = Object.entries(this.answers).map(([questionId, userAnswer]) => ({
        questionId: questionId,
        skillType: 0, // Reading
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

      console.log('📤 Syncing to server:', answerList.length, 'answers');
      
      this.examService.saveDraftAnswers(payload).subscribe({
        next: () => {
          console.log('✅ Synced to server successfully');
          this.hasUnsavedChanges = false;
          this.isSyncing = false;
        },
        error: (err) => {
          console.error('❌ Sync failed:', err);
          this.isSyncing = false;
        }
      });
    }, 3000); // 3 giây
  }

  // ========== FORCE SYNC (khi chuyển kỹ năng hoặc submit) ==========
  forceSyncToServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
      }
      
      if (!this.sessionId || Object.keys(this.answers).length === 0) {
        resolve();
        return;
      }

      const answerList = Object.entries(this.answers).map(([questionId, userAnswer]) => ({
        questionId: questionId,
        skillType: 0,
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
          console.log('✅ Force sync completed');
          this.hasUnsavedChanges = false;
          this.isSyncing = false;
          resolve();
        },
        error: (err) => {
          console.error('❌ Force sync failed:', err);
          this.isSyncing = false;
          resolve();
        }
      });
    });
  }

  // ========== ON ANSWER CHANGE ==========
  onAnswerChange() {
    // 1. Lưu vào localStorage (ngay lập tức)
    this.saveToLocal();
    
    // 2. Schedule sync lên server (debounce)
    this.syncToServer();
    
    this.cdr.detectChanges();
  }

  // ========== LOAD EXAM ==========
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

  scrollToQuestion(index: number) {
    this.currentQuestionIndex = index;
    const element = document.getElementById('question-' + index);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // ========== SUBMIT ==========
 // src/app/pages/exam-reading/exam-reading.component.ts
async submitExam() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  await this.forceSyncToServer();

  const totalTime = (this.exam?.timeLimitSeconds || 3600) - this.timeRemaining;
  
  // ✅ CHUYỂN ANSWERS THÀNH DICTIONARY
  const answersDict: { [key: string]: string } = {};
  Object.entries(this.answers).forEach(([questionId, answer]) => {
    if (answer && answer.trim() !== '') {
      answersDict[questionId] = answer;
    }
  });

  if (Object.keys(answersDict).length === 0) {
    const confirmSubmit = confirm('⚠️ Bạn chưa chọn đáp án nào. Bạn có chắc muốn nộp bài không?');
    if (!confirmSubmit) {
      this.isSubmitting = false;
      return;
    }
  }

  // ✅ TẠO PAYLOAD TRỰC TIẾP (KHÔNG BỌC COMMAND)
  const payload: SubmitReadingCommand = {
    exerciseId: this.examId,
    answers: answersDict,
    timeSpentSeconds: totalTime
  };

  // ✅ THÊM SESSION ID NẾU CÓ
  if (this.sessionId) {
    payload.sessionId = this.sessionId;
  }

  console.log('📤 SUBMITTING READING:');
  console.log('   Payload:', JSON.stringify(payload, null, 2));
  console.log('   Total time spent:', totalTime, 'seconds');

  this.isSubmitting = true;
  
  // ✅ GỬI TRỰC TIẾP PAYLOAD
this.examService.submitReading(payload).subscribe({
  next: (result) => {
    console.log('✅ Submit success:', result);
    
    const resultWithSource = {
      ...result,
      timeSpentSeconds: totalTime,
      source: this.fullTestId ? 'fulltest' : 'standalone',
      fullTestId: this.fullTestId || null,
      submittedAt: new Date().toISOString()
    };
    
    const storageKey = 'reading_result_' + this.examId + '_' + this.userId;
    localStorage.setItem(storageKey, JSON.stringify(resultWithSource));
    
    console.log('💾 Saved to localStorage with timeSpentSeconds:', totalTime);
    
    const draftKey = 'reading_answers_' + this.examId + '_' + this.userId;
    localStorage.removeItem(draftKey);
    
    this.isSubmitting = false;
    
    // ✅ SỬA: QUAY LẠI FULL TEST, KHÔNG PHẢI TRANG KẾT QUẢ
    if (this.fullTestId) {
      alert('🎉 Nộp bài Reading thành công!');
      // ✅ QUAY LẠI FULL TEST DETAIL
      this.router.navigate(['/exam', this.fullTestId]);
    } else {
      // Standalone: Chuyển đến trang kết quả Reading
      alert('🎉 Nộp bài thành công!');
      this.router.navigate(['/result/reading', result.id]);
    }
  },
  error: (err) => {
    console.error('❌ Submit error:', err);
    this.isSubmitting = false;
    
    if (err.error?.errors) {
      const errorMsg = Object.values(err.error.errors).flat().join('\n');
      alert(`❌ Lỗi:\n${errorMsg}`);
    } else if (err.error?.title) {
      alert(`❌ ${err.error.title}`);
    } else {
      alert('❌ Nộp bài thất bại. Vui lòng thử lại!');
    }
  }
});
}
// src/app/pages/exam-reading/exam-reading.component.ts
// async submitExam() {
//     if (this.timerInterval) {
//       clearInterval(this.timerInterval);
//       this.timerInterval = null;
//     }

//     await this.forceSyncToServer();

//     const totalTime = (this.exam?.timeLimitSeconds || 3600) - this.timeRemaining;
    
//     // ✅ CHUYỂN ANSWERS THÀNH DICTIONARY
//     const answersDict: { [key: string]: string } = {};
//     Object.entries(this.answers).forEach(([questionId, answer]) => {
//       if (answer && answer.trim() !== '') {
//         answersDict[questionId] = answer;
//       }
//     });

//     // ✅ KIỂM TRA NẾU KHÔNG CÓ CÂU NÀO ĐƯỢC CHỌN
//     if (Object.keys(answersDict).length === 0) {
//       const confirmSubmit = confirm('⚠️ Bạn chưa chọn đáp án nào. Bạn có chắc muốn nộp bài không?');
//       if (!confirmSubmit) {
//         this.isSubmitting = false;
//         return;
//       }
//     }

//     // ✅ TẠO COMMAND VỚI INTERFACE
//     const command: SubmitReadingCommand = {
//       exerciseId: this.examId,
//       answers: answersDict,
//       timeSpentSeconds: totalTime
//     };

//     // ✅ THÊM SESSION ID NẾU CÓ
//     if (this.sessionId) {
//       command.sessionId = this.sessionId;
//     }

//     // ✅ BỌC COMMAND VÀO PAYLOAD
//     const payload = {
//       command: command
//     };

//     console.log('📤 SUBMITTING READING:');
//     console.log('   Payload:', JSON.stringify(payload, null, 2));
//     console.log('   Total time spent:', totalTime, 'seconds');

//     this.isSubmitting = true;
    
//     this.examService.submitReading(payload).subscribe({
//       next: (result) => {
//         console.log('✅ Submit success:', result);
        
//         const resultWithSource = {
//           ...result,
//           timeSpentSeconds: totalTime,
//           source: this.fullTestId ? 'fulltest' : 'standalone',
//           fullTestId: this.fullTestId || null,
//           submittedAt: new Date().toISOString()
//         };
        
//         const storageKey = 'reading_result_' + this.examId + '_' + this.userId;
//         localStorage.setItem(storageKey, JSON.stringify(resultWithSource));
        
//         console.log('💾 Saved to localStorage with timeSpentSeconds:', totalTime);
        
//         const draftKey = 'reading_answers_' + this.examId + '_' + this.userId;
//         localStorage.removeItem(draftKey);
        
//         this.isSubmitting = false;
        
//         if (this.fullTestId) {
//           alert('🎉 Nộp bài Reading thành công!');
//           this.router.navigate(['/exam', this.fullTestId]);
//         } else {
//           alert('🎉 Nộp bài thành công!');
//           this.router.navigate(['/reading']);
//         }
//       },
//       error: (err) => {
//         console.error('❌ Submit error:', err);
//         this.isSubmitting = false;
        
//         if (err.error?.errors) {
//           const errorMsg = Object.values(err.error.errors).flat().join('\n');
//           alert(`❌ Lỗi:\n${errorMsg}`);
//         } else if (err.error?.title) {
//           alert(`❌ ${err.error.title}`);
//         } else {
//           alert('❌ Nộp bài thất bại. Vui lòng thử lại!');
//         }
//       }
//     });
//   }
  // ========== NAVIGATION HELPERS ==========
  toggleNavigator() {
    this.showNavigator = !this.showNavigator;
    localStorage.setItem('reading_show_navigator', String(this.showNavigator));
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    // ✅ FORCE SYNC TRƯỚC KHI THOÁT
    this.forceSyncToServer();
    window.removeEventListener('beforeunload', () => {});
  }
}