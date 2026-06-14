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
  flatQuestions: ListeningQuestion[] = [];
  currentPlayingAudio: number | null = null;
  isPlaying = false;
  showProgressPanel: boolean = true;
  private audioElement: HTMLAudioElement | null = null;
  
  timeRemaining: number = 2400;
  isSubmitting = false;
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';

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
      console.log('🎧 Listening Exam ID:', this.examId);
      this.loadExam();
    });
  }

  toggleProgressPanel() {
    this.showProgressPanel = !this.showProgressPanel;
  }

  loadExam() {
    this.examService.getListeningExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Listening data:', data);
        
        const questions = data.questions || [];
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
          totalQuestions: data.totalQuestions,
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
        alert('Không thể tải đề thi Listening. Vui lòng thử lại!');
      }
    });
  }

  getFlatQuestions(): ListeningQuestion[] {
    return this.flatQuestions;
  }

  scrollToQuestion(questionId: string) {
    const element = document.getElementById('question-' + questionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  parseQuestion(q: any): ListeningQuestion {
    let options: { key: string; value: string }[] = [];
    try {
      const optsJson = q.optionsJson;
      if (optsJson) {
        const parsed = typeof optsJson === 'string' ? JSON.parse(optsJson) : optsJson;
        options = Object.entries(parsed).map(([key, value]) => ({ key, value: value as string }));
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
    }
    return {
      id: q.id,
      orderNumber: q.orderNumber,
      questionText: q.questionText,
      options: options,
      correctAnswer: q.correctAnswer
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

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }

    const totalTime = (this.exam?.timeLimitSeconds || 2400) - this.timeRemaining;
    
    const answersDict: Record<string, string> = {};
    Object.entries(this.answers).forEach(([id, answer]) => {
      if (answer) answersDict[id] = answer;
    });

    const submitData = {
      exerciseId: this.examId,
      answers: answersDict,
      timeSpentSeconds: totalTime
    };

    console.log('📤 Submitting Listening:', submitData);

    this.isSubmitting = true;
    this.examService.submitListening(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        const storageKey = 'listening_result_' + this.examId + '_' + this.userId;
        localStorage.setItem(storageKey, JSON.stringify(result));
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
  }
}
