import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-exam-speaking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './exam-speaking.component.html',
  styleUrls: ['./exam-speaking.component.scss']
})
export class ExamSpeakingComponent implements OnInit, OnDestroy {
   private isSessionCompleted: boolean = false;
  
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  
  // Basic info
  examId: string = '';
  userId: string = '';
  fullTestId: string = '';
  sessionId: string = '';
  
  // UI states
  isSubmitting: boolean = false;
  isRecording: boolean = false;
  isPlaying: boolean[] = [false, false, false];
  isProcessing: boolean = false;
  
  // Data - 3 câu hỏi
  questions: any[] = [];
  audioBlobs: (Blob | null)[] = [null, null, null];  // ✅ Cho phép null
  audioUrls: (string | null)[] = [null, null, null]; // ✅ Cho phép null
  audioFileNames: (string | null)[] = [null, null, null]; // ✅ Cho phép null
  transcripts: string[] = ['', '', ''];
  
  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  public currentRecordingIndex: number = -1; // ✅ Đổi thành public
  
  // Timer
  private timerInterval: any;
  private timeRemaining: number = 0;
  public isPreparing: boolean = false;
  public isSpeaking: boolean = false;

  // Hybrid: debounce sync
  private syncTimeout: any = null;
  private isSyncing: boolean = false;

  // Total time spent
  private totalTimeSpent: number = 0;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private examService: ExamService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Session ID:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
        console.log('📌 Full Test ID:', this.fullTestId);
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
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('🎙️ Speaking Exam ID:', this.examId);
      this.loadSpeakingExam();
    });

    this.startTotalTimer();

    window.addEventListener('beforeunload', () => {
      this.syncToServer();
    });
  }

  ngOnDestroy(): void {
    this.stopRecording();
    // ✅ Xóa timer thay vì gọi clearTimer()
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.forceSyncToServer();
    window.removeEventListener('beforeunload', () => {});
  }

  // ========== TOTAL TIMER ==========
  startTotalTimer(): void {
    this.totalTimeSpent = 0;
    this.timerInterval = setInterval(() => {
      this.totalTimeSpent++;
    }, 1000);
  }

  getTotalTimeSpent(): number {
    return this.totalTimeSpent;
  }

  // ========== LOAD EXAM ==========
  loadSpeakingExam(): void {
    if (!this.examId) return;
    
    console.log('🔄 Loading speaking exam for ID:', this.examId);
    
    this.examService.getSpeakingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Speaking exam loaded:', data);
        console.log('📊 Questions from API:', data.questions?.length || 0);
        
        this.questions = data.questions || [];
        
        if (this.questions.length === 0) {
          console.warn('⚠️ No questions from API, creating fallback...');
          this.createFallbackQuestions();
        }
        
        // Khởi tạo transcripts
        this.questions.forEach((q: any, i: number) => {
          if (!this.transcripts[i]) {
            this.transcripts[i] = '';
          }
        });
        
        console.log('📊 Total questions:', this.questions.length);
        this.cdr.detectChanges();
        this.loadSavedDrafts();
      },
      error: (err: any) => {
        console.error('❌ Error loading speaking exam:', err);
        this.createFallbackQuestions();
        this.cdr.detectChanges();
      }
    });
  }

  createFallbackQuestions(): void {
    this.questions = [
      { 
        id: crypto.randomUUID(),
        orderNumber: 1, 
        partNumber: 1,
        questionText: 'Introduce yourself. Tell me about your hometown.', 
        preparationTime: 30, 
        speakingTime: 60 
      },
      { 
        id: crypto.randomUUID(),
        orderNumber: 2,
        partNumber: 2, 
        questionText: 'Describe your favorite hobby. Why do you enjoy it?', 
        preparationTime: 60, 
        speakingTime: 90 
      },
      { 
        id: crypto.randomUUID(),
        orderNumber: 3,
        partNumber: 3, 
        questionText: 'Some people think technology has made our lives more complicated. What do you think?', 
        preparationTime: 60, 
        speakingTime: 120 
      }
    ];
    console.log('📋 Created fallback questions:', this.questions.length);
    this.questions.forEach((q: any, i: number) => {
      if (!this.transcripts[i]) {
        this.transcripts[i] = '';
      }
    });
  }

  // ========== LOAD SAVED DRAFTS ==========
  loadSavedDrafts(): void {
    if (!this.sessionId) return;

    this.examService.getDraftAnswers(this.sessionId).subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const idx = this.questions.findIndex(q => q.id === item.questionId);
            if (idx !== -1 && item.transcript) {
              this.transcripts[idx] = item.transcript;
            }
          });
          console.log('📦 Loaded speaking drafts from server:', data.length);
        }
      },
      error: (err: any) => {
        console.error('Error loading speaking drafts:', err);
      }
    });
  }

  // ========== SYNC TO SERVER ==========
  syncToServer(): void {
     if (this.isSessionCompleted) {
    console.log('⚠️ Session already completed, skip sync');
    return;
  }
    if (this.isSyncing || !this.sessionId) return;
    
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      const answerList: any[] = [];

      for (let i = 0; i < this.questions.length; i++) {
        const question = this.questions[i];
        if (this.transcripts[i] && this.transcripts[i].trim()) {
          answerList.push({
            questionId: question.id,
            skillType: 3,
            transcript: this.transcripts[i]
          });
        }
        if (this.audioUrls[i]) {
          const existing = answerList.find((a: any) => a.questionId === question.id);
          if (existing) {
            existing.audioUrl = this.audioUrls[i];
          } else {
            answerList.push({
              questionId: question.id,
              skillType: 3,
              audioUrl: this.audioUrls[i]
            });
          }
        }
      }

      if (answerList.length === 0) {
        return;
      }

      this.isSyncing = true;
      const payload = {
        sessionId: this.sessionId,
        answers: answerList
      };

      console.log('📤 Syncing speaking to server:', answerList.length, 'items');
      
      this.examService.saveDraftAnswers(payload).subscribe({
        next: () => {
          console.log('✅ Speaking synced to server');
          this.isSyncing = false;
        },
        error: (err: any) => {
          console.error('❌ Speaking sync failed:', err);
          this.isSyncing = false;
        }
      });
    }, 3000);
  }

  // ========== FORCE SYNC ==========
  forceSyncToServer(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isSessionCompleted) {
      console.log('⚠️ Session already completed, skip force sync');
      resolve();
      return;
    }
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
      }
      
      if (!this.sessionId) {
        resolve();
        return;
      }

      const answerList: any[] = [];

      for (let i = 0; i < this.questions.length; i++) {
        const question = this.questions[i];
        if (this.transcripts[i] && this.transcripts[i].trim()) {
          answerList.push({
            questionId: question.id,
            skillType: 3,
            transcript: this.transcripts[i]
          });
        }
        if (this.audioUrls[i]) {
          const existing = answerList.find((a: any) => a.questionId === question.id);
          if (existing) {
            existing.audioUrl = this.audioUrls[i];
          } else {
            answerList.push({
              questionId: question.id,
              skillType: 3,
              audioUrl: this.audioUrls[i]
            });
          }
        }
      }

      if (answerList.length === 0) {
        resolve();
        return;
      }

      this.isSyncing = true;
      const payload = { sessionId: this.sessionId, answers: answerList };
      
      this.examService.saveDraftAnswers(payload).subscribe({
        next: () => {
          console.log('✅ Speaking force sync completed');
          this.isSyncing = false;
          resolve();
        },
        error: (err: any) => {
          console.error('❌ Speaking force sync failed:', err);
          this.isSyncing = false;
          resolve();
        }
      });
    });
  }

async startRecording(index: number): Promise<void> {
  try {
    if (this.currentRecordingIndex !== -1 && this.currentRecordingIndex !== index) {
      this.stopRecording();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.currentRecordingIndex = index;
    this.stopRecording();
    this.audioChunks = [];
    
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioBlobs[index] = audioBlob;
      this.audioUrls[index] = URL.createObjectURL(audioBlob);
      this.isRecording = false;
      this.currentRecordingIndex = -1;
      this.cdr.detectChanges();  // ✅ THÊM
      console.log(`✅ Audio recorded for question ${index + 1}`);
      this.syncToServer();
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    this.cdr.detectChanges();  // ✅ THÊM
    console.log(`🎙️ Recording question ${index + 1} started...`);
    
  } catch (error) {
    console.error('❌ Error accessing microphone:', error);
    alert('⚠️ Không thể truy cập microphone.');
    this.isRecording = false;
    this.currentRecordingIndex = -1;
    this.cdr.detectChanges();  // ✅ THÊM
  }
}

stopRecording(): void {
  if (this.mediaRecorder && this.isRecording) {
    this.mediaRecorder.stop();
    this.isRecording = false;
    this.currentRecordingIndex = -1;
    this.cdr.detectChanges();  // ✅ THÊM
    console.log('⏹️ Recording stopped');
  }
}

  playRecording(index: number): void {
    if (this.audioUrls[index]) {
      const audio = new Audio(this.audioUrls[index]);
      this.isPlaying[index] = true;
      audio.play();
      audio.onended = () => {
        this.isPlaying[index] = false;
      };
    }
  }

  // ========== UPDATE TRANSCRIPT ==========
  updateTranscript(index: number, event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.transcripts[index] = textarea.value;
    this.syncToServer();
  }

  // ========== SUBMIT ==========
  submitSpeaking(): void {
    const recordedCount = this.audioBlobs.filter(b => b !== null).length;
    
    if (recordedCount === 0) {
      alert('⚠️ Bạn chưa ghi âm câu trả lời nào. Vui lòng ghi âm trước khi nộp bài!');
      return;
    }
    
    if (recordedCount < 3) {
      const confirmSubmit = confirm(
        `⚠️ Bạn mới ghi âm ${recordedCount}/3 câu hỏi.\n` +
        `Bạn có chắc muốn nộp bài không?`
      );
      if (!confirmSubmit) return;
    }
    
    this.isSubmitting = true;
    this.isProcessing = true;
    this.submitToBackend();
  }

submitToBackend(): void {
  this.forceSyncToServer().then(() => {
    const formData = new FormData();
    
    formData.append('ExerciseId', this.examId);
    
    if (this.sessionId) {
      formData.append('SessionId', this.sessionId);
    }
    
    const totalTime = this.getTotalTimeSpent();
    formData.append('TimeSpentSeconds', String(totalTime));
    
    // ✅ GỬI AUDIO FILES - KIỂM TRA NULL
    let audioCount = 0;
    for (let i = 0; i < this.audioBlobs.length; i++) {
      if (this.audioBlobs[i]) {  // ✅ QUAN TRỌNG: KIỂM TRA NULL
        const fileName = `speaking_${this.userId}_q${i + 1}_${Date.now()}_${audioCount}.webm`;
        if (this.audioBlobs[i]) {
  formData.append('AudioFiles', this.audioBlobs[i]!, fileName);
  //                                         👆 THÊM DẤU !
}
        console.log(`📁 Added audio ${audioCount + 1}:`, fileName);
        audioCount++;
      }
    }
    console.log('📌 Total audio files:', audioCount);
    
    // Transcripts
    const transcriptsObj: { [key: string]: string } = {};
    this.questions.forEach((q, i) => {
      if (this.transcripts[i] && this.transcripts[i].trim()) {
        transcriptsObj[q.id] = this.transcripts[i];
      } else if (this.audioBlobs[i]) {
        transcriptsObj[q.id] = `Transcript for question ${i + 1}`;
      } else {
        transcriptsObj[q.id] = '';
      }
    });
    formData.append('Transcripts', JSON.stringify(transcriptsObj));
    console.log('📝 Transcripts:', transcriptsObj);

    console.log('📤 Submitting Speaking with FormData');
    console.log('📌 Exercise ID:', this.examId);
    console.log('📌 Session ID:', this.sessionId);
    console.log('📌 Audio files:', audioCount);
    console.log('📌 Total time:', totalTime, 'seconds');

    this.examService.submitSpeaking(formData).subscribe({
      next: (result: any) => {
        console.log('✅ Speaking submitted successfully:', result);
        this.handleSubmitSuccess(result);
      },
      error: (err: any) => {
        console.error('❌ Submit failed:', err);
        alert('❌ Nộp bài thất bại. Vui lòng thử lại!');
        this.isSubmitting = false;
        this.isProcessing = false;
        this.fallbackSubmit();
      }
    });
  });
}

  handleSubmitSuccess(result: any): void {
    const totalTime = this.getTotalTimeSpent();
    
    const resultWithSource = {
      ...result,
      timeSpentSeconds: totalTime,
      source: this.fullTestId ? 'fulltest' : 'standalone',
      fullTestId: this.fullTestId || null,
      submittedAt: new Date().toISOString()
    };
    
    const storageKey = 'speaking_result_' + this.examId + '_' + this.userId;
    localStorage.setItem(storageKey, JSON.stringify(resultWithSource));
    
    console.log('💾 Saved to localStorage with timeSpentSeconds:', totalTime);
    
    if (this.sessionId) {
      this.examService.clearDraftAnswers(this.sessionId).subscribe({
        next: () => console.log('🗑️ Speaking drafts cleared'),
        error: (err: any) => console.error('Failed to clear drafts:', err)
      });
    }
    
    this.isProcessing = false;
    this.isSubmitting = false;
    
    alert('🎉 Nộp bài thành công!\nĐiểm Speaking: ' + result.totalScore + '/10');
    
    this.submitFullTestSession();
    
    setTimeout(() => {
      if (this.fullTestId) {
        this.router.navigate(['/exam', this.fullTestId]);
      } else {
        this.router.navigate(['/result', 'speaking', result.submissionId]);
      }
    }, 1500);
  }

  fallbackSubmit(): void {
    const totalTime = this.getTotalTimeSpent();
    
    const defaultResult = {
      submissionId: 'temp-' + Date.now(),
      userId: this.userId,
      exerciseId: this.examId,
      exerciseTitle: 'Speaking Test',
      totalScore: 5,
      totalQuestions: this.questions.length,
      correctCount: 0,
      timeSpentSeconds: totalTime,
      submittedAt: new Date().toISOString(),
      source: this.fullTestId ? 'fulltest' : 'standalone',
      fullTestId: this.fullTestId || null,
      details: this.questions.map((q: any, idx: number) => ({  // ✅ THÊM idx
        orderNumber: q.orderNumber,
        questionText: q.questionText,
        userAnswer: this.transcripts[idx] || 'Audio recorded',  // ✅ DÙNG idx
        isCorrect: false,
        aiScore: 5,
        aiFeedback: 'Tính năng đang phát triển. Điểm tạm thời: 5/10'
      }))
    };
    
    const storageKey = 'speaking_result_' + this.examId + '_' + this.userId;
    localStorage.setItem(storageKey, JSON.stringify(defaultResult));
    
    this.submitFullTestSession();
    this.isProcessing = false;
    this.isSubmitting = false;
    
    alert('⚠️ Nộp bài thành công (chế độ tạm thời)!\nĐiểm: 5/10');
    
    setTimeout(() => {
      if (this.fullTestId) {
        this.router.navigate(['/exam', this.fullTestId]);
      } else {
        this.goBack();
      }
    }, 1500);
  }

submitFullTestSession(): void {
  if (this.sessionId) {
    console.log('📤 Submitting Full Test session:', this.sessionId);
    this.examService.submitFullTest(this.sessionId).subscribe({
      next: (result: any) => {
        console.log('✅ Full Test completed! Score:', result.totalScore);
        const fullTestKey = 'fulltest_result_' + this.fullTestId + '_' + this.userId;
        localStorage.setItem(fullTestKey, JSON.stringify(result));
        
        // ✅ ĐÁNH DẤU SESSION ĐÃ COMPLETED
        this.isSessionCompleted = true;
        
        // ✅ HỦY TẤT CẢ SYNC TIMEOUT
        if (this.syncTimeout) {
          clearTimeout(this.syncTimeout);
          this.syncTimeout = null;
        }
      },
      error: (err: any) => {
        console.error('❌ Failed to submit Full Test:', err);
      }
    });
  }
}

  // ========== UTILITY ==========
  goBack(): void {
    window.history.back();
  }

  getProgressPercent(): number {
    if (this.questions.length === 0) return 0;
    const recorded = this.audioBlobs.filter(b => b !== null).length;
    return Math.round((recorded / 3) * 100);
  }

  getPartNumber(question: any): number {
    return question?.partNumber || question?.orderNumber || 0;
  }
}