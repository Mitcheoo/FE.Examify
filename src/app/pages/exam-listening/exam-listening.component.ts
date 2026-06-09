import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

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
  answers: Record<string, string> = {};
  timeRemaining: number = 2400;
  isSubmitting = false;
  isPlaying = false;
  private timerInterval: any;
  private examId: string = '';
  private fullTestId: string = '';
  private userId: string = '';
  private audioElement: HTMLAudioElement | null = null;

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
      console.log('📌 User ID:', this.userId);
      console.log('📌 Full Test ID:', this.fullTestId);
      this.loadExam();
    });
  }

  loadExam() {
    console.log('🔄 Loading Listening exam...');
    this.examService.getListeningExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Listening data:', data);
        
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
            options: options
          };
        });
        
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds || 2400,
          totalQuestions: data.totalQuestions,
          audioUrl: data.audioUrl,
          parts: data.parts || [],
          questions: parsedQuestions
        };
        
        console.log('✅ Parsed Listening exam:', this.exam);
        this.timeRemaining = this.exam.timeLimitSeconds;
        
        this.startTimer();
        this.initAudio();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading Listening exam:', err);
        alert('Không thể tải đề thi Listening. Vui lòng thử lại!');
      }
    });
  }

  initAudio() {
    if (this.exam?.audioUrl) {
      this.audioElement = new Audio(this.exam.audioUrl);
      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.cdr.detectChanges();
      });
    }
  }

  playAudio() {
    if (this.audioElement) {
      if (this.isPlaying) {
        this.audioElement.pause();
        this.isPlaying = false;
      } else {
        this.audioElement.play();
        this.isPlaying = true;
      }
      this.cdr.detectChanges();
    } else {
      console.warn('No audio URL available');
      alert('Không có file audio cho bài thi này');
    }
  }

  startTimer() {
    console.log('🕐 Starting Listening timer with:', this.timeRemaining);
    
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
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  get answeredCount(): number {
    return Object.keys(this.answers).filter(key => this.answers[key]?.trim()).length;
  }

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
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
        
        const storageKey = `listening_result_${this.examId}_${this.userId}`;
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
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }
}