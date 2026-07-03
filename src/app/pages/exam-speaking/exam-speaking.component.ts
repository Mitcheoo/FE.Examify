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
  private MIN_RECORDING_DURATION = 5000; // 5 giây tối thiểu
  private recordingStartTime: number = 0;
  private isPreviewing: boolean = false;
  
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  
  // Basic info
  examId: string = '';
  userId: string = '';
  fullTestId: string = '';
  sessionId: string = '';
  
  // UI states
  isSubmitting: boolean = false;
  isRecording: boolean = false;
  isPlaying: boolean[] = [];
  isProcessing: boolean = false;
  isLoading: boolean = true;
  hasQuestions: boolean = false;
  errorMessage: string = '';
  isPreviewingTranscript: boolean[] = [];
  
  // Data
  questions: any[] = [];
  audioBlobs: (Blob | null)[] = [];
  audioUrls: (string | null)[] = [];
  audioFileNames: (string | null)[] = [];
  
  // ✅ Transcript từ Whisper
  whisperTranscripts: string[] = [];
  transcriptQuality: boolean[] = [];
  transcriptStatus: string[] = []; // 'good', 'poor', 'empty'
  
  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  public currentRecordingIndex: number = -1;
  
  // Timer
  private timerInterval: any;
  private totalTimeSpent: number = 0;

  // Sync
  private syncTimeout: any = null;
  private isSyncing: boolean = false;

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
    if (!this.examId) {
      this.errorMessage = 'Không tìm thấy ID bài thi';
      this.isLoading = false;
      return;
    }
    
    console.log('🔄 Loading speaking exam for ID:', this.examId);
    this.isLoading = true;
    this.hasQuestions = false;
    
    this.examService.getSpeakingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Speaking exam loaded:', data);
        
        this.questions = data.questions || [];
        
        if (this.questions.length === 0) {
          console.warn('⚠️ No questions found for this speaking exam');
          this.hasQuestions = false;
          this.errorMessage = '⚠️ Bài thi này chưa có câu hỏi. Vui lòng liên hệ Admin để thêm câu hỏi.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        this.hasQuestions = true;
        this.errorMessage = '';
        
        // Khởi tạo arrays
        const count = this.questions.length;
        this.audioBlobs = new Array(count).fill(null);
        this.audioUrls = new Array(count).fill(null);
        this.audioFileNames = new Array(count).fill(null);
        this.isPlaying = new Array(count).fill(false);
        this.isPreviewingTranscript = new Array(count).fill(false);
        this.whisperTranscripts = new Array(count).fill('');
        this.transcriptQuality = new Array(count).fill(false);
        this.transcriptStatus = new Array(count).fill('');
        
        console.log('📊 Total questions:', this.questions.length);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadSavedDrafts();
      },
      error: (err: any) => {
        console.error('❌ Error loading speaking exam:', err);
        this.isLoading = false;
        
        if (err.status === 404) {
          this.errorMessage = 'Không tìm thấy bài thi. Vui lòng kiểm tra lại.';
        } else if (err.status === 401) {
          this.errorMessage = 'Vui lòng đăng nhập để tiếp tục.';
        } else {
          this.errorMessage = 'Có lỗi xảy ra khi tải bài thi. Vui lòng thử lại sau.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ========== LOAD SAVED DRAFTS ==========
  loadSavedDrafts(): void {
    if (!this.sessionId || !this.hasQuestions) return;

    const isNewSession = localStorage.getItem(`new_session_${this.sessionId}`) === 'true';
    
    if (isNewSession) {
      const localKey = 'speaking_answers_' + this.examId + '_' + this.userId;
      localStorage.removeItem(localKey);
      console.log('🗑️ Cleared old speaking draft answers for new session');
      localStorage.removeItem(`new_session_${this.sessionId}`);
      this.audioBlobs = new Array(this.questions.length).fill(null);
      this.audioUrls = new Array(this.questions.length).fill(null);
      this.audioFileNames = new Array(this.questions.length).fill(null);
      this.cdr.detectChanges();
      return;
    }

    this.examService.getDraftAnswers(this.sessionId).subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          data.forEach((item: any) => {
            const idx = this.questions.findIndex(q => q.id === item.questionId);
            if (idx !== -1) {
              if (item.audioUrl) {
                this.audioUrls[idx] = item.audioUrl;
              }
            }
          });
          console.log('📦 Loaded speaking drafts from server:', data.length);
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error loading speaking drafts:', err);
      }
    });
  }

  // ========== SYNC TO SERVER ==========
  syncToServer(): void {
    if (this.isSessionCompleted || !this.hasQuestions) {
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
        if (this.audioUrls[i]) {
          answerList.push({
            questionId: question.id,
            skillType: 3,
            audioUrl: this.audioUrls[i]
          });
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
      if (this.isSessionCompleted || !this.hasQuestions) {
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
        if (this.audioUrls[i]) {
          answerList.push({
            questionId: question.id,
            skillType: 3,
            audioUrl: this.audioUrls[i]
          });
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

  // ========== RECORDING ==========
  async startRecording(index: number): Promise<void> {
    if (!this.hasQuestions) {
      alert('⚠️ Không có câu hỏi để ghi âm. Vui lòng liên hệ Admin.');
      return;
    }
    
    try {
      if (this.currentRecordingIndex !== -1 && this.currentRecordingIndex !== index) {
        this.stopRecording();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.currentRecordingIndex = index;
      this.audioChunks = [];
      this.recordingStartTime = Date.now();
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // ✅ KHI DỪNG GHI ÂM, TỰ ĐỘNG PREVIEW TRANSCRIPT
      this.mediaRecorder.onstop = async () => {
        const duration = Date.now() - this.recordingStartTime;
        
        if (duration < this.MIN_RECORDING_DURATION) {
          alert(`⚠️ Thời gian ghi âm quá ngắn (${Math.round(duration/1000)}s). Vui lòng ghi âm ít nhất ${this.MIN_RECORDING_DURATION/1000} giây.`);
          this.isRecording = false;
          this.currentRecordingIndex = -1;
          this.cdr.detectChanges();
          return;
        }
        
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioBlobs[index] = audioBlob;
        this.audioUrls[index] = URL.createObjectURL(audioBlob);
        this.isRecording = false;
        this.currentRecordingIndex = -1;
        this.cdr.detectChanges();
        console.log(`✅ Audio recorded for question ${index + 1} (${Math.round(duration/1000)}s)`);
        
        // ✅ PREVIEW TRANSCRIPT SAU KHI GHI ÂM
        await this.previewTranscript(index);
        
        this.syncToServer();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.cdr.detectChanges();
      console.log(`🎙️ Recording question ${index + 1} started...`);
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      alert('⚠️ Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
      this.isRecording = false;
      this.currentRecordingIndex = -1;
      this.cdr.detectChanges();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.currentRecordingIndex = -1;
      this.cdr.detectChanges();
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

  // ============================================================
  // ✅ PREVIEW TRANSCRIPT - KIỂM TRA CHẤT LƯỢNG GHI ÂM
  // ============================================================
  
  async previewTranscript(index: number): Promise<void> {
    const blob = this.audioBlobs[index];
    if (!blob) {
      console.log('⚠️ No audio blob to preview');
      return;
    }

    // Reset state
    this.isPreviewingTranscript[index] = true;
    this.transcriptStatus[index] = 'loading';
    this.cdr.detectChanges();

    try {
      const formData = new FormData();
      // Tạo file với tên phù hợp
      const fileName = `preview_${this.userId}_q${index + 1}_${Date.now()}.webm`;
      formData.append('audio', blob, fileName);

      console.log(`📤 Previewing transcript for question ${index + 1}...`);
      
      const result = await this.examService.previewTranscript(formData).toPromise();
      
      console.log(`📥 Preview result for Q${index + 1}:`, result);

      // Lưu transcript
      this.whisperTranscripts[index] = result?.transcript || '';
      
      // Đánh giá chất lượng
      if (result?.isValid) {
        this.transcriptQuality[index] = true;
        this.transcriptStatus[index] = 'good';
        console.log(`✅ Q${index + 1}: Transcript quality GOOD`);
      } else {
        this.transcriptQuality[index] = false;
        this.transcriptStatus[index] = 'poor';
        console.log(`⚠️ Q${index + 1}: Transcript quality POOR - "${result?.transcript || ''}"`);
      }
      
      this.isPreviewingTranscript[index] = false;
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error(`❌ Preview transcript error for Q${index + 1}:`, error);
      this.isPreviewingTranscript[index] = false;
      this.transcriptStatus[index] = 'error';
      this.cdr.detectChanges();
    }
  }

  // ========== SUBMIT ==========
  async submitSpeaking(): Promise<void> {
    if (!this.hasQuestions) {
      alert('⚠️ Không có câu hỏi để nộp. Vui lòng liên hệ Admin.');
      return;
    }
    
    const recordedCount = this.audioBlobs.filter(b => b !== null).length;
    
    if (recordedCount === 0) {
      alert('⚠️ Bạn chưa ghi âm câu trả lời nào. Vui lòng ghi âm tất cả câu hỏi trước khi nộp bài!');
      return;
    }
    
    // ✅ KIỂM TRA CHẤT LƯỢNG TRANSCRIPT TRƯỚC KHI NỘP
    let hasPoorQuality = false;
    let poorQualityIndices: number[] = [];
    
    for (let i = 0; i < this.questions.length; i++) {
      if (this.audioBlobs[i]) {
        // Nếu chưa preview, thì preview ngay
        if (this.transcriptStatus[i] === '' || this.transcriptStatus[i] === 'loading') {
          await this.previewTranscript(i);
        }
        
        if (!this.transcriptQuality[i]) {
          hasPoorQuality = true;
          poorQualityIndices.push(i + 1);
        }
      }
    }
    
    if (hasPoorQuality) {
      const confirmSubmit = confirm(
        `⚠️ Có ${poorQualityIndices.length} câu hỏi có chất lượng ghi âm kém: ${poorQualityIndices.join(', ')}.\n\n` +
        `Nội dung nhận diện không rõ ràng, có thể ảnh hưởng đến điểm số.\n\n` +
        `Bạn có muốn tiếp tục nộp bài không?`
      );
      if (!confirmSubmit) return;
    }
    
    if (recordedCount < this.questions.length) {
      const confirmSubmit = confirm(
        `⚠️ Bạn mới ghi âm ${recordedCount}/${this.questions.length} câu hỏi.\n` +
        `Bạn có chắc muốn nộp bài không?`
      );
      if (!confirmSubmit) return;
    }
    
    this.isSubmitting = true;
    this.isProcessing = true;
    await this.submitToBackend();
  }

  async submitToBackend(): Promise<void> {
    try {
      await this.forceSyncToServer();
      
      const formData = new FormData();
      formData.append('ExerciseId', this.examId);
      
      if (this.sessionId) {
        formData.append('SessionId', this.sessionId);
      }
      
      const totalTime = this.getTotalTimeSpent();
      formData.append('TimeSpentSeconds', String(totalTime));
      
      // Upload audio files
      let audioCount = 0;
      for (let i = 0; i < this.audioBlobs.length; i++) {
        if (this.audioBlobs[i]) {
          const fileName = `speaking_${this.userId}_q${i + 1}_${Date.now()}_${audioCount}.webm`;
          formData.append('AudioFiles', this.audioBlobs[i]!, fileName);
          console.log(`📁 Added audio ${audioCount + 1}:`, fileName);
          audioCount++;
        }
      }
      
      console.log('📌 Total audio files:', audioCount);
      console.log('📤 Submitting Speaking with FormData');
      console.log('📌 Exercise ID:', this.examId);
      console.log('📌 Session ID:', this.sessionId);
      console.log('📌 Total time:', totalTime, 'seconds');

      this.examService.submitSpeaking(formData).subscribe({
        next: (result: any) => {
          console.log('✅ Speaking submitted successfully:', result);
          this.handleSubmitSuccess(result);
        },
        error: (err: any) => {
          console.error('❌ Submit failed:', err);
          const errorMessage = err.error?.message || err.message || 'Vui lòng thử lại!';
          alert(`❌ Nộp bài thất bại: ${errorMessage}`);
          this.isSubmitting = false;
          this.isProcessing = false;
        }
      });
    } catch (error) {
      console.error('❌ Submit error:', error);
      this.isSubmitting = false;
      this.isProcessing = false;
    }
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
    
    this.isProcessing = false;
    this.isSubmitting = false;
    
    this.submitFullTestSession();
    
    setTimeout(() => {
      if (this.fullTestId) {
        this.router.navigate(['/fulltest', this.fullTestId, 'result']);
      } else {
        this.router.navigate(['/result', 'speaking', result.id]);
      }
    }, 2000);
  }

  submitFullTestSession(): void {
    if (this.sessionId) {
      console.log('📤 Submitting Full Test session:', this.sessionId);
      this.examService.submitFullTest(this.sessionId).subscribe({
        next: (result: any) => {
          console.log('✅ Full Test completed! Score:', result.totalScore);
          
          const fullTestKey = 'fulltest_result_' + this.fullTestId + '_' + this.userId;
          localStorage.setItem(fullTestKey, JSON.stringify(result));
          
          this.isSessionCompleted = true;
          
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
    return Math.round((recorded / this.questions.length) * 100);
  }

  getPartNumber(question: any): number {
    return question?.partNumber || question?.orderNumber || 0;
  }
  
  // ✅ Lấy status text cho transcript
  getTranscriptStatusText(status: string): string {
    switch(status) {
      case 'good': return '✅ Chất lượng tốt';
      case 'poor': return '⚠️ Chất lượng kém';
      case 'loading': return '⏳ Đang xử lý...';
      case 'error': return '❌ Lỗi';
      default: return '⏳ Chưa kiểm tra';
    }
  }
  
  getTranscriptStatusClass(status: string): string {
    switch(status) {
      case 'good': return 'status-good';
      case 'poor': return 'status-poor';
      case 'loading': return 'status-loading';
      case 'error': return 'status-error';
      default: return 'status-pending';
    }
  }
}