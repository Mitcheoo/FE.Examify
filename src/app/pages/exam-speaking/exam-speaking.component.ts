import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  
  // Basic info
  examId: string = '';
  userId: string = '';
  fullTestId: string = '';
  sessionId: string = '';
  
  // UI states
  isSubmitting: boolean = false;
  isRecording: boolean = false;
  isPlaying: boolean = false;
  isProcessing: boolean = false;
  currentQuestionIndex: number = 0;
  
  // Data
  questions: any[] = [];
  audioBlobs: { [key: string]: Blob } = {};
  audioUrls: { [key: string]: string } = {};
  transcripts: { [key: string]: string } = {};
  audioFileNames: { [key: string]: string } = {};
  
  // Recording
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  // Timer
  private timerInterval: any;
  private timeRemaining: number = 0;
 // Sửa thành:
public isPreparing: boolean = false;
public isSpeaking: boolean = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private examService: ExamService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    // Lấy session ID từ query params
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
    
    // Fallback: Lấy từ navigation state
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
  }

  ngOnDestroy(): void {
    this.stopRecording();
    this.clearTimer();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  // ========== LOAD EXAM ==========

  loadSpeakingExam(): void {
    if (!this.examId) return;
    
    this.examService.getSpeakingExam(this.examId).subscribe({
      next: (data) => {
        console.log('✅ Speaking exam loaded:', data);
        this.questions = data.questions || [];
        if (this.questions.length === 0) {
          this.loadFallbackQuestions();
        }
        // Khởi tạo transcripts
        this.questions.forEach(q => {
          if (!this.transcripts[q.id]) {
            this.transcripts[q.id] = '';
          }
        });
      },
      error: (err) => {
        console.error('❌ Error loading speaking exam:', err);
        this.loadFallbackQuestions();
      }
    });
  }

  loadFallbackQuestions(): void {
    this.questions = [
      { 
        id: 'q1', 
        orderNumber: 1, 
        partNumber: 1,
        questionText: 'Introduce yourself. Tell me about your hometown.', 
        preparationTime: 30, 
        speakingTime: 60 
      },
      { 
        id: 'q2', 
        orderNumber: 2,
        partNumber: 2, 
        questionText: 'Describe your favorite hobby. Why do you enjoy it?', 
        preparationTime: 60, 
        speakingTime: 90 
      },
      { 
        id: 'q3', 
        orderNumber: 3,
        partNumber: 3, 
        questionText: 'Some people think technology has made our lives more complicated. What do you think?', 
        preparationTime: 60, 
        speakingTime: 120 
      }
    ];
    console.log('📋 Using fallback questions:', this.questions);
    // Khởi tạo transcripts
    this.questions.forEach(q => {
      if (!this.transcripts[q.id]) {
        this.transcripts[q.id] = '';
      }
    });
  }

  // ========== GET CURRENT QUESTION ==========

  getCurrentQuestion(): any {
    return this.questions[this.currentQuestionIndex] || null;
  }

  // ========== RECORDING ==========

  async startRecording(): Promise<void> {
    try {
      // Dừng recording cũ nếu có
      this.stopRecording();
      
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const questionId = this.getCurrentQuestion()?.id;
        if (questionId) {
          this.audioBlobs[questionId] = audioBlob;
          this.audioUrls[questionId] = URL.createObjectURL(audioBlob);
          // Tạo tên file
          const timestamp = Date.now();
          const fileName = `speaking_${this.userId}_${questionId}_${timestamp}.webm`;
          this.audioFileNames[questionId] = fileName;
          console.log('✅ Audio recorded for question:', questionId);
          console.log('📁 File name:', fileName);
        }
        this.isRecording = false;
        this.isSpeaking = false;
        this.clearTimer();
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.isSpeaking = true;
      console.log('🎙️ Recording started...');
      
      // Bắt đầu đếm thời gian nói
      const speakingTime = this.getCurrentQuestion()?.speakingTime || 60;
      this.startTimer(speakingTime, 'speaking');
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      alert('⚠️ Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('⏹️ Recording stopped');
    }
  }

  // ========== PLAYBACK ==========

  playRecording(): void {
    const questionId = this.getCurrentQuestion()?.id;
    if (questionId && this.audioUrls[questionId] && this.audioPlayer) {
      this.audioPlayer.nativeElement.src = this.audioUrls[questionId];
      this.audioPlayer.nativeElement.play();
      this.isPlaying = true;
    }
  }

  onAudioEnded(): void {
    this.isPlaying = false;
  }

  // ========== TIMER ==========

  startTimer(seconds: number, type: 'preparation' | 'speaking'): void {
    this.clearTimer();
    this.timeRemaining = seconds;
    
    if (type === 'preparation') {
      this.isPreparing = true;
      this.isSpeaking = false;
    } else {
      this.isPreparing = false;
      this.isSpeaking = true;
    }
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.clearTimer();
        if (type === 'preparation') {
          this.isPreparing = false;
          // Tự động bắt đầu ghi âm sau khi chuẩn bị xong
          this.startRecording();
        } else if (type === 'speaking') {
          this.isSpeaking = false;
          this.stopRecording();
        }
      }
    }, 1000);
  }

  clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isPreparing = false;
    this.isSpeaking = false;
  }

  getTimeRemaining(): number {
    return this.timeRemaining;
  }

  getTimerDisplay(): string {
    const seconds = this.getTimeRemaining();
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ========== NAVIGATION ==========

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      const currentQ = this.getCurrentQuestion();
      if (currentQ && !this.audioBlobs[currentQ.id]) {
        const userConfirmed = confirm('⚠️ Bạn chưa ghi âm câu này. Bạn có chắc muốn chuyển sang câu tiếp theo?');
        if (!userConfirmed) return;
      }
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  // ========== UPDATE TRANSCRIPT ==========

  updateTranscript(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const questionId = this.getCurrentQuestion()?.id;
    if (questionId) {
      this.transcripts[questionId] = textarea.value;
      console.log(`📝 Transcript updated for ${questionId}:`, textarea.value);
    }
  }

  getCurrentTranscript(): string {
    const questionId = this.getCurrentQuestion()?.id;
    return questionId ? this.transcripts[questionId] || '' : '';
  }

  // ========== SUBMIT ==========

  submitSpeaking(): void {
    if (this.isSubmitting) return;
    
    const recordedCount = Object.keys(this.audioBlobs).length;
    if (recordedCount < this.questions.length) {
      const userConfirmed = confirm(
        `⚠️ Bạn mới ghi âm ${recordedCount}/${this.questions.length} câu hỏi.\n` +
        `Bạn có chắc muốn nộp bài không?`
      );
      if (!userConfirmed) return;
    }
    
    this.isSubmitting = true;
    this.isProcessing = true;
    
    // Gọi API submit với FormData
    this.submitToBackend();
  }

  submitToBackend(): void {
    const formData = new FormData();
    
    // 1. Thêm ExerciseId
    formData.append('ExerciseId', this.examId);
    
    // 2. Thêm thời gian làm bài
    const totalTime = this.calculateTotalTime();
    formData.append('TimeSpentSeconds', String(totalTime));
    
    // 3. Thêm các file audio
    let audioIndex = 0;
    for (const question of this.questions) {
      const questionId = question.id;
      if (this.audioBlobs[questionId]) {
        const fileName = `speaking_${this.userId}_${questionId}_${Date.now()}_${audioIndex}.webm`;
        formData.append('AudioFiles', this.audioBlobs[questionId], fileName);
        console.log(`📁 Added audio ${audioIndex + 1}: ${fileName}`);
        audioIndex++;
      }
    }
    
    // 4. Thêm transcripts cho từng câu hỏi
    // Backend mong đợi Transcripts là Dictionary<Guid, string>
    const transcriptsObj: { [key: string]: string } = {};
    for (const question of this.questions) {
      const questionId = question.id;
      // Nếu user đã nhập transcript, dùng nó. Nếu không, dùng mock.
      if (this.transcripts[questionId] && this.transcripts[questionId].trim()) {
        transcriptsObj[questionId] = this.transcripts[questionId];
      } else if (this.audioBlobs[questionId]) {
        // Tạo transcript giả cho những câu đã ghi âm
        transcriptsObj[questionId] = `This is a transcript for question ${question.orderNumber}. The user has recorded audio for this question.`;
      } else {
        transcriptsObj[questionId] = '';
      }
    }
    
    // Chuyển transcripts thành JSON string và gửi
    formData.append('Transcripts', JSON.stringify(transcriptsObj));
    console.log('📝 Transcripts:', transcriptsObj);

    console.log('📤 Submitting Speaking with FormData');
    console.log('📌 Exercise ID:', this.examId);
    console.log('📌 Session ID:', this.sessionId);
    console.log('📌 Audio files:', audioIndex);
    console.log('📌 Questions:', this.questions.length);

    this.examService.submitSpeaking(formData).subscribe({
      next: (result) => {
        console.log('✅ Speaking submitted successfully:', result);
        this.handleSubmitSuccess(result);
      },
      error: (err) => {
        console.error('❌ Submit failed:', err);
        alert('❌ Nộp bài thất bại. Vui lòng thử lại!');
        this.isSubmitting = false;
        this.isProcessing = false;
        // Fallback: vẫn lưu vào localStorage
        this.fallbackSubmit();
      }
    });
  }

  handleSubmitSuccess(result: any): void {
    // Lưu kết quả vào localStorage
    const storageKey = 'speaking_result_' + this.examId + '_' + this.userId;
    localStorage.setItem(storageKey, JSON.stringify(result));
    
    this.isProcessing = false;
    this.isSubmitting = false;
    
    alert(`🎉 Nộp bài thành công!\nĐiểm Speaking: ${result.totalScore}/10`);
    
    // Gọi submit Full Test
    this.submitFullTestSession();
    
    // Chuyển hướng
    setTimeout(() => {
      if (this.fullTestId) {
        this.router.navigate(['/exam', this.fullTestId]);
      } else {
        this.router.navigate(['/result', 'speaking', result.submissionId]);
      }
    }, 1500);
  }

  fallbackSubmit(): void {
    const defaultResult = {
      submissionId: 'temp-' + Date.now(),
      userId: this.userId,
      exerciseId: this.examId,
      exerciseTitle: 'Speaking Test',
      totalScore: 5,
      totalQuestions: this.questions.length,
      correctCount: 0,
      timeSpentSeconds: this.calculateTotalTime(),
      submittedAt: new Date().toISOString(),
      details: this.questions.map(q => ({
        orderNumber: q.orderNumber,
        questionText: q.questionText,
        userAnswer: this.transcripts[q.id] || 'Audio recorded',
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
        next: (result) => {
          console.log('✅ Full Test completed! Score:', result.totalScore);
          const fullTestKey = 'fulltest_result_' + this.fullTestId + '_' + this.userId;
          localStorage.setItem(fullTestKey, JSON.stringify(result));
        },
        error: (err) => {
          console.error('❌ Failed to submit Full Test:', err);
        }
      });
    }
  }

  calculateTotalTime(): number {
    let total = 0;
    this.questions.forEach(q => {
      total += (q.speakingTime || 60);
    });
    return total;
  }

  // ========== UTILITY ==========

  goBack(): void {
    window.history.back();
  }

  getQuestionStatus(index: number): string {
    const question = this.questions[index];
    if (!question) return 'pending';
    if (this.audioBlobs[question.id]) {
      return 'completed';
    }
    return 'pending';
  }

  getProgressPercent(): number {
    if (this.questions.length === 0) return 0;
    const recorded = Object.keys(this.audioBlobs).length;
    return Math.round((recorded / this.questions.length) * 100);
  }

  isCurrentQuestionRecorded(): boolean {
    const current = this.getCurrentQuestion();
    return current ? !!this.audioBlobs[current.id] : false;
  }

  getQuestionStatusText(index: number): string {
    const status = this.getQuestionStatus(index);
    if (status === 'completed') {
      return '✅ Đã ghi âm';
    }
    return '⏳ Chưa ghi âm';
  }

  getPartNumber(question: any): number {
    return question?.partNumber || question?.orderNumber || 0;
  }
}