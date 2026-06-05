import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';

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

  exam: any = null;
  answers: Record<string, string> = {};
  timeRemaining: number = 3600;
  isSubmitting = false;
  private timerInterval: any;
  private examId: string = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('📌 Exam ID from URL:', this.examId);
      this.loadExam();
    });
  }

  loadExam() {
    this.examService.getReadingExam(this.examId).subscribe({
      next: (data: any) => {
        console.log('✅ Exam loaded:', data);
        this.exam = {
          exerciseId: data.exerciseId,
          title: data.title,
          timeLimitSeconds: data.timeLimitSeconds,
          totalQuestions: data.totalQuestions,
          parts: data.parts || [],
          questions: data.questions?.map((q: any) => ({
            id: q.id,
            orderNumber: q.orderNumber,
            questionText: q.questionText,
            options: this.parseOptions(q.optionsJson)
          })) || []
        };
        this.timeRemaining = this.exam.timeLimitSeconds;
        this.startTimer();
      },
      error: (err) => {
        console.error('❌ Error loading exam:', err);
        alert('Không thể tải đề thi. Vui lòng thử lại!');
      }
    });
  }

  parseOptions(optionsJson: string): { key: string; value: string }[] {
    if (!optionsJson) return [];
    try {
      const parsed = JSON.parse(optionsJson);
      return Object.entries(parsed).map(([key, value]) => ({ key, value: value as string }));
    } catch {
      return [];
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
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

  submitExam() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const totalTime = (this.exam?.timeLimitSeconds || 3600) - this.timeRemaining;
    
    const answersDict: Record<string, string> = {};
    Object.entries(this.answers).forEach(([id, answer]) => {
      if (answer) answersDict[id] = answer;
    });

    const submitData = {
      exerciseId: this.examId,
      answers: answersDict,
      timeSpentSeconds: totalTime
    };

    console.log('📤 Submitting:', submitData);

    this.isSubmitting = true;
    this.examService.submitReading(submitData).subscribe({
      next: (result) => {
        console.log('✅ Submit success:', result);
        this.router.navigate(['/exam', this.examId, 'reading-result'], { 
          state: { result, skill: 'reading' } 
        });
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
  }
}
