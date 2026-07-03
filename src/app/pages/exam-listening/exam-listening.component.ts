import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

interface AudioItem {
  id: number;
  url: string;
  played: boolean;
  partNumber: number;
  questions: ListeningQuestion[];
}

interface ListeningQuestion {
  id: string;
  orderNumber: number;
  questionText: string;
  options: { key: string; value: string }[];
  correctAnswer: string;
}

@Component({
  selector: 'app-exam-listening',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-listening.component.html',
  styleUrls: ['./exam-listening.component.scss']
})
export class ExamListeningComponent implements OnInit, OnDestroy {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  exam: any = null;
  audioItems: AudioItem[] = [];
  answers: Record<string, string> = {};
  currentPlayingAudio: number | null = null;
  isPlaying = false;
  private audioElement: HTMLAudioElement | null = null;
  
  timeRemaining: number = 2400;
  isSubmitting = false;
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';
  private sessionId: string = '';

  showProgressPanel: boolean = true;
  flatQuestions: ListeningQuestion[] = [];
  
  // ✅ THÊM BIẾN currentQuestionIndex Ở ĐÂY
  currentQuestionIndex: number = 0;

  private syncTimeout: any = null;
  private isSyncing: boolean = false;
  private hasUnsavedChanges: boolean = false;

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Listening sessionId:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
        console.log('📌 Listening fullTestId:', this.fullTestId);
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
      console.log('🎧 Listening Exam ID:', this.examId);
      console.log('🎧 Full Test ID:', this.fullTestId);
      console.log('🎧 Session ID:', this.sessionId);
      this.loadExam();
      this.loadSavedAnswers();
    });

    window.addEventListener('beforeunload', () => {
      this.syncToServer();
    });
  }

  // ========== LOAD SAVED ANSWERS ==========
loadSavedAnswers() {
  const localKey = 'listening_answers_' + this.examId + '_' + this.userId;
  
  // ✅ THÊM: KIỂM TRA SESSION MỚI
  // Kiểm tra xem session này có phải là session mới không
  const isNewSession = localStorage.getItem(`new_session_${this.sessionId}`) === 'true';
  
  if (isNewSession) {
    // Xóa draft cũ trong localStorage
    localStorage.removeItem(localKey);
    console.log('🗑️ Cleared old listening draft answers for new session');
    // Xóa flag sau khi đã xử lý
    localStorage.removeItem(`new_session_${this.sessionId}`);
  }
  
  // Load từ localStorage
  const localData = localStorage.getItem(localKey);
  if (localData) {
    try {
      this.answers = JSON.parse(localData);
      console.log('📦 Loaded from localStorage:', Object.keys(this.answers).length);
    } catch(e) {
      console.error('Error loading local answers:', e);
    }
  }

  // Load từ server (SessionAnswers)
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
// ========== CLEAR DRAFT FOR NEW SESSION ==========
clearDraftForNewSession() {
  // Kiểm tra xem session này có phải là session mới không
  const isNewSession = localStorage.getItem(`new_session_${this.sessionId}`) === 'true';
  
  if (isNewSession) {
    // Xóa draft answers
    const draftKey = 'listening_answers_' + this.examId + '_' + this.userId;
    localStorage.removeItem(draftKey);
    console.log('🗑️ Cleared listening draft for new session');
    
    // Xóa flag
    localStorage.removeItem(`new_session_${this.sessionId}`);
  }
}
  saveToLocal() {
    const key = 'listening_answers_' + this.examId + '_' + this.userId;
    localStorage.setItem(key, JSON.stringify(this.answers));
    this.hasUnsavedChanges = true;
  }

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
          skillType: 1,
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

      console.log('📤 Syncing listening to server:', answerList.length, 'answers');
      
      this.examService.saveDraftAnswers(payload).subscribe({
        next: () => {
          console.log('✅ Listening synced to server');
          this.hasUnsavedChanges = false;
          this.isSyncing = false;
        },
        error: (err) => {
          console.error('❌ Listening sync failed:', err);
          this.isSyncing = false;
        }
      });
    }, 3000);
  }

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
          skillType: 1,
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
          console.log('✅ Listening force sync completed');
          this.hasUnsavedChanges = false;
          this.isSyncing = false;
          resolve();
        },
        error: (err) => {
          console.error('❌ Listening force sync failed:', err);
          this.isSyncing = false;
          resolve();
        }
      });
    });
  }

  onAnswerChange() {
    this.saveToLocal();
    this.syncToServer();
    this.cdr.detectChanges();
  }

  // ✅ TẠO CÂU HỎI FALLBACK KHI API KHÔNG CÓ DỮ LIỆU
  generateFallbackQuestions(): any[] {
    const questions = [];
    const part1Questions = [
      'What time does the meeting start?',
      'Where is the conference held?',
      'Who is the keynote speaker?',
      'What is the main topic?',
      'How long is the lunch break?',
      'What day is the workshop?',
      'How many participants are expected?',
      'What is the registration fee?'
    ];
    const part2Questions = [
      'Where did the woman go on vacation?',
      'How did she travel to the destination?',
      'What was the weather like?',
      'What did she do on the first day?',
      'What did she eat for dinner?',
      'How much did the trip cost?',
      'Who did she go with?',
      'What was her favorite activity?'
    ];
    const part3Questions = [
      'What is the lecture mainly about?',
      'How many types of pollution are mentioned?',
      'What is the main cause of air pollution?',
      'How does water pollution affect humans?',
      'What solution is proposed for plastic waste?',
      'Why is recycling important?',
      'What is the speaker\'s opinion about climate change?',
      'What should governments do to protect the environment?'
    ];
    
    const allQuestions = [...part1Questions, ...part2Questions, ...part3Questions];
    
    for (let i = 0; i < 35 && i < allQuestions.length; i++) {
      questions.push({
        id: crypto.randomUUID(),
        orderNumber: i + 1,
        questionText: allQuestions[i] || `Listening question ${i + 1}: What did the speaker say?`,
        options: [
          { key: 'A', value: 'Option A' },
          { key: 'B', value: 'Option B' },
          { key: 'C', value: 'Option C' },
          { key: 'D', value: 'Option D' }
        ],
        correctAnswer: 'A'
      });
    }
    return questions;
  }

  loadExam() {
    this.examService.getListeningExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Listening data:', data);
        
        let questions = data.questions || [];
        
        if (questions.length === 0) {
          console.warn('⚠️ Không có câu hỏi từ API, tạo câu hỏi mẫu...');
          questions = this.generateFallbackQuestions();
        }
        
        const baseAudioUrl = 'https://localhost:7241/uploads/audio';
        const audioItemsList: AudioItem[] = [];
        
        for (let i = 0; i < 8 && i < questions.length; i++) {
          audioItemsList.push({
            id: i + 1,
            url: baseAudioUrl + '/TESTEXAMIFY.mp3',
            played: false,
            partNumber: 1,
            questions: [this.parseQuestion(questions[i])]
          });
        }
        
        for (let i = 0; i < 3; i++) {
          const startIdx = 8 + i * 4;
          const partQuestions = questions.slice(startIdx, startIdx + 4).map((q: any) => this.parseQuestion(q));
          audioItemsList.push({
            id: 9 + i,
            url: baseAudioUrl + '/TESTEXAMIFY.mp3',
            played: false,
            partNumber: 2,
            questions: partQuestions
          });
        }
        
        for (let i = 0; i < 3; i++) {
          const startIdx = 20 + i * 5;
          const partQuestions = questions.slice(startIdx, startIdx + 5).map((q: any) => this.parseQuestion(q));
          audioItemsList.push({
            id: 12 + i,
            url: baseAudioUrl + '/TESTEXAMIFY.mp3',
            played: false,
            partNumber: 3,
            questions: partQuestions
          });
        }
        
        this.audioItems = audioItemsList;
        this.flatQuestions = audioItemsList.flatMap(a => a.questions);
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds || 2400,
          totalQuestions: data.totalQuestions || questions.length,
          audioItems: this.audioItems
        };
        
        console.log('✅ Parsed Listening exam:', this.exam);
        console.log('✅ Audio items:', this.audioItems.length);
        console.log('✅ Total questions:', this.flatQuestions.length);
        
        this.timeRemaining = this.exam.timeLimitSeconds;
        this.startTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading Listening exam:', err);
        
        const fallbackQuestions = this.generateFallbackQuestions();
        const baseAudioUrl = 'https://localhost:7241/uploads/audio';
        const audioItemsList: AudioItem[] = [];
        
        for (let i = 0; i < 8 && i < fallbackQuestions.length; i++) {
          audioItemsList.push({
            id: i + 1,
            url: baseAudioUrl + '/TESTEXAMIFY.mp3',
            played: false,
            partNumber: 1,
            questions: [this.parseQuestion(fallbackQuestions[i])]
          });
        }
        
        for (let i = 0; i < 3; i++) {
          const startIdx = 8 + i * 4;
          const partQuestions = fallbackQuestions.slice(startIdx, startIdx + 4).map((q: any) => this.parseQuestion(q));
          audioItemsList.push({
            id: 9 + i,
            url: baseAudioUrl + '/TESTEXAMIFY.mp3',
            played: false,
            partNumber: 2,
            questions: partQuestions
          });
        }
        
        for (let i = 0; i < 3; i++) {
          const startIdx = 20 + i * 5;
          const partQuestions = fallbackQuestions.slice(startIdx, startIdx + 5).map((q: any) => this.parseQuestion(q));
          audioItemsList.push({
            id: 12 + i,
            url: baseAudioUrl + '/TESTEXAMIFY.mp3',
            played: false,
            partNumber: 3,
            questions: partQuestions
          });
        }
        
        this.audioItems = audioItemsList;
        this.flatQuestions = audioItemsList.flatMap(a => a.questions);
        this.exam = {
          exerciseId: this.examId,
          title: 'Listening Comprehension (Fallback)',
          timeLimitSeconds: 2400,
          totalQuestions: fallbackQuestions.length,
          audioItems: this.audioItems
        };
        
        console.log('✅ Using fallback questions:', this.flatQuestions.length);
        
        this.timeRemaining = this.exam.timeLimitSeconds;
        this.startTimer();
        this.cdr.detectChanges();
        alert('Không thể tải đề thi từ server. Sử dụng đề thi mẫu!');
      }
    });
  }

  parseQuestion(q: any): ListeningQuestion {
    let options: { key: string; value: string }[] = [];
    try {
      const optsJson = q.optionsJson;
      if (optsJson) {
        const parsed = typeof optsJson === 'string' ? JSON.parse(optsJson) : optsJson;
        options = Object.entries(parsed).map(([key, value]) => ({ key, value: value as string }));
      } else if (q.options && Array.isArray(q.options)) {
        options = q.options;
      } else {
        options = [
          { key: 'A', value: q.optionA || 'Option A' },
          { key: 'B', value: q.optionB || 'Option B' },
          { key: 'C', value: q.optionC || 'Option C' },
          { key: 'D', value: q.optionD || 'Option D' }
        ];
      }
    } catch (e) {
      console.error('Error parsing options:', e);
      options = [
        { key: 'A', value: 'Option A' },
        { key: 'B', value: 'Option B' },
        { key: 'C', value: 'Option C' },
        { key: 'D', value: 'Option D' }
      ];
    }
    
    let id = q.id;
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!id || !guidRegex.test(id)) {
      id = crypto.randomUUID();
      console.log('🔄 Generated new GUID for question:', id);
    }
    
    return {
      id: id,
      orderNumber: q.orderNumber || 0,
      questionText: q.questionText || 'What did the speaker say?',
      options: options,
      correctAnswer: q.correctAnswer || 'A'
    };
  }

  playAudio(audioId: number) {
    const audioItem = this.audioItems.find(a => a.id === audioId);
    if (!audioItem) return;
    
    if (audioItem.played) {
      alert('⚠️ Bạn chỉ được nghe audio này một lần duy nhất!');
      return;
    }
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
    }
    
    this.currentPlayingAudio = audioId;
    this.audioElement = new Audio(audioItem.url);
    this.audioElement.play();
    this.isPlaying = true;
    audioItem.played = true;
    
    this.audioElement.onended = () => {
      this.isPlaying = false;
      this.currentPlayingAudio = null;
      this.cdr.detectChanges();
    };
    
    this.audioElement.onerror = () => {
      console.error('Error playing audio:', audioItem.url);
      alert('Không thể phát audio. Vui lòng kiểm tra file audio!');
      this.isPlaying = false;
      this.currentPlayingAudio = null;
      this.cdr.detectChanges();
    };
  }

  startTimer() {
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
    return minutes + ':' + secs.toString().padStart(2, '0');
  }

  get answeredCount(): number {
    return Object.keys(this.answers).filter(key => this.answers[key]?.trim()).length;
  }

  getPart1Audios() { return this.audioItems.filter(a => a.partNumber === 1); }
  getPart2Audios() { return this.audioItems.filter(a => a.partNumber === 2); }
  getPart3Audios() { return this.audioItems.filter(a => a.partNumber === 3); }
  
  // ✅ THÊM PHƯƠNG THỨC LẤY CÂU HỎI THEO PART
  getPart1Questions() {
    return this.flatQuestions.filter(q => q.orderNumber >= 1 && q.orderNumber <= 8);
  }
  
  getPart2Questions() {
    return this.flatQuestions.filter(q => q.orderNumber >= 9 && q.orderNumber <= 20);
  }
  
  getPart3Questions() {
    return this.flatQuestions.filter(q => q.orderNumber >= 21 && q.orderNumber <= 35);
  }

  getFlatQuestions(): ListeningQuestion[] {
    return this.flatQuestions;
  }

  // ✅ SỬA LẠI PHƯƠNG THỨC scrollToQuestion
  scrollToQuestion(questionId: string) {
    const element = document.getElementById('question-' + questionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Cập nhật currentQuestionIndex
      const index = this.flatQuestions.findIndex(q => q.id === questionId);
      if (index !== -1) {
        this.currentQuestionIndex = index;
      }
    }
  }

  toggleProgressPanel() {
    this.showProgressPanel = !this.showProgressPanel;
  }

  async submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }

    await this.forceSyncToServer();

    const totalTime = (this.exam?.timeLimitSeconds || 2400) - this.timeRemaining;
    
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

    console.log('📤 Submitting Listening:', submitData);
    console.log('📌 Total time spent:', totalTime, 'seconds');
    console.log('📌 Session ID:', this.sessionId);

    this.isSubmitting = true;
    this.examService.submitListening(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        
        const resultWithSource = {
          ...result,
          timeSpentSeconds: totalTime,
          source: this.fullTestId ? 'fulltest' : 'standalone',
          fullTestId: this.fullTestId || null,
          submittedAt: new Date().toISOString()
        };
        
        const storageKey = 'listening_result_' + this.examId + '_' + this.userId;
        localStorage.setItem(storageKey, JSON.stringify(resultWithSource));
        
        console.log('💾 Saved to localStorage with timeSpentSeconds:', totalTime);
        
        const draftKey = 'listening_answers_' + this.examId + '_' + this.userId;
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

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.forceSyncToServer();
    window.removeEventListener('beforeunload', () => {});
  }
}