import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-speaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-speaking.component.html',
  styleUrls: ['./exam-speaking.component.scss']
})
export class ExamSpeakingComponent implements OnInit, OnDestroy {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  exam: any = null;
  transcript: string = '';
  audioFile: File | null = null;
  audioUrl: string | null = null;
  isRecording = false;
  isPlaying = false;
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  timeRemaining: number = 1020;
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
      console.log('🎙️ Speaking Exam ID:', this.examId);
      console.log('📌 User ID:', this.userId);
      console.log('📌 Full Test ID:', this.fullTestId);
      this.loadExam();
    });
    
    this.requestMicrophonePermission();
  }

  async requestMicrophonePermission() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
    }
  }

  loadExam() {
    console.log('🔄 Loading Speaking exam...');
    this.examService.getSpeakingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Raw Speaking data:', data);
        
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds || 1020,
          parts: data.parts || [],
          totalQuestions: data.totalQuestions
        };
        
        console.log('✅ Parsed Speaking exam:', this.exam);
        this.timeRemaining = this.exam.timeLimitSeconds;
        
        this.startTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading Speaking exam:', err);
        alert('Không thể tải đề thi Speaking. Vui lòng thử lại!');
      }
    });
  }

  startTimer() {
    console.log('🕐 Starting Speaking timer with:', this.timeRemaining);
    
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

  startRecording() {
    if (this.isRecording) return;
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        this.audioUrl = URL.createObjectURL(audioBlob);
        this.cdr.detectChanges();
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('🎙️ Recording started');
    }).catch(err => {
      console.error('Error accessing microphone:', err);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền!');
    });
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      console.log('🎙️ Recording stopped');
    }
  }

  playRecording() {
    if (this.audioPlayer?.nativeElement && this.audioUrl) {
      if (this.isPlaying) {
        this.audioPlayer.nativeElement.pause();
        this.isPlaying = false;
      } else {
        this.audioPlayer.nativeElement.play();
        this.isPlaying = true;
        this.audioPlayer.nativeElement.onended = () => {
          this.isPlaying = false;
          this.cdr.detectChanges();
        };
      }
    }
  }

  uploadAudio() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.audioFile = input.files[0];
      this.audioUrl = URL.createObjectURL(this.audioFile);
      console.log('📁 Audio file selected:', this.audioFile.name);
    }
  }

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const totalTime = (this.exam?.timeLimitSeconds || 1020) - this.timeRemaining;

    const submitData = new FormData();
    submitData.append('exerciseId', this.examId);
    submitData.append('transcript', this.transcript);
    submitData.append('timeSpentSeconds', totalTime.toString());
    
    if (this.audioFile) {
      submitData.append('audioFile', this.audioFile);
    }

    console.log('📤 Submitting Speaking...');

    this.isSubmitting = true;
    this.examService.submitSpeaking(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        
        const storageKey = `speaking_result_${this.examId}_${this.userId}`;
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
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
}