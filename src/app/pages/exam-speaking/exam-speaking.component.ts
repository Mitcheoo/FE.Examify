import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-speaking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exam-speaking.component.html',
  styleUrls: ['./exam-speaking.component.scss']
})
export class ExamSpeakingComponent implements OnInit {
  
  examId: string = '';
  userId: string = '';
  isSubmitting: boolean = false;
  private fullTestId: string = '';
  private sessionId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private examService: ExamService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    console.log('🎙️ Speaking page loaded - Under development');
    
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    // ✅ LẤY SESSION ID TỪ QUERY PARAMS
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        console.log('📌 Speaking received sessionId from queryParams:', this.sessionId);
      }
      if (params['fullTestId']) {
        this.fullTestId = params['fullTestId'];
        console.log('📌 Speaking received fullTestId from queryParams:', this.fullTestId);
      }
    });
    
    // ✅ FALLBACK: Lấy từ navigation state (nếu có)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { fullTestId?: string; sessionId?: string };
    if (state?.sessionId && !this.sessionId) {
      this.sessionId = state.sessionId;
      console.log('📌 Speaking received sessionId from state:', this.sessionId);
    }
    if (state?.fullTestId && !this.fullTestId) {
      this.fullTestId = state.fullTestId;
    }
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('🎙️ Speaking Exam ID:', this.examId);
      console.log('🎙️ Full Test ID:', this.fullTestId);
      console.log('🎙️ Session ID:', this.sessionId);
    });
  }

  goBack(): void {
    window.history.back();
  }

  showNotification(): void {
    alert('🔔 Chúng tôi sẽ thông báo khi tính năng Speaking sẵn sàng!');
  }

  // Hàm nộp bài mặc định - trả về 5 điểm
  submitDefaultScore(): void {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    
    // Tạo kết quả mặc định với 5 điểm
    const defaultResult = {
      submissionId: 'temp-' + Date.now(),
      userId: this.userId,
      exerciseId: this.examId,
      exerciseTitle: 'Speaking Test (Demo)',
      totalScore: 5,
      totalQuestions: 3,
      correctCount: 0,
      timeSpentSeconds: 1800,
      submittedAt: new Date().toISOString(),
      details: [
        {
          orderNumber: 1,
          questionText: 'Part 1: Introduction',
          userAnswer: 'Demo answer - Feature under development',
          isCorrect: false,
          aiScore: 5,
          aiFeedback: 'Tính năng đang phát triển. Điểm tạm thời: 5/10'
        },
        {
          orderNumber: 2,
          questionText: 'Part 2: Long Turn',
          userAnswer: 'Demo answer - Feature under development',
          isCorrect: false,
          aiScore: 5,
          aiFeedback: 'Tính năng đang phát triển. Điểm tạm thời: 5/10'
        },
        {
          orderNumber: 3,
          questionText: 'Part 3: Discussion',
          userAnswer: 'Demo answer - Feature under development',
          isCorrect: false,
          aiScore: 5,
          aiFeedback: 'Tính năng đang phát triển. Điểm tạm thời: 5/10'
        }
      ]
    };

    console.log('📤 Submitting default speaking result:', defaultResult);
    console.log('📌 Session ID:', this.sessionId);
    
    // Lưu vào localStorage
    const storageKey = 'speaking_result_' + this.examId + '_' + this.userId;
    localStorage.setItem(storageKey, JSON.stringify(defaultResult));
    
    // ✅ LƯU SUBMISSION ID VÀO SESSION
    if (this.sessionId) {
      this.examService.savePartResult(this.sessionId, 'speaking', defaultResult.submissionId).subscribe({
        next: () => {
          console.log('✅ Saved speaking result to session');
          // Sau khi lưu xong, submit Full Test
          this.submitFullTestSession();
        },
        error: (err) => {
          console.error('❌ Failed to save part result:', err);
          this.submitFullTestSession(); // Vẫn submit kể cả lỗi
        }
      });
    } else {
      console.log('⚠️ No sessionId, skipping savePartResult');
      this.submitFullTestSession();
    }
    
    // Hiển thị thông báo
    alert('🎉 Nộp bài thành công!\nĐiểm của bạn: 5/10\n(Tính năng đang phát triển, điểm tạm thời)');
    
    // Chuyển về trang trước
    setTimeout(() => {
      this.isSubmitting = false;
      if (this.fullTestId) {
        this.router.navigate(['/exam', this.fullTestId]);
      } else {
        this.goBack();
      }
    }, 1000);
  }

  // ✅ HOÀN THÀNH FULL TEST
  submitFullTestSession() {
    if (this.sessionId) {
      console.log('📤 Submitting Full Test session:', this.sessionId);
      this.examService.submitFullTest(this.sessionId).subscribe({
        next: (result) => {
          console.log('✅ Full Test completed! Score:', result.totalScore);
          // Lưu kết quả Full Test vào localStorage
          const fullTestKey = 'fulltest_result_' + this.fullTestId + '_' + this.userId;
          localStorage.setItem(fullTestKey, JSON.stringify(result));
        },
        error: (err) => {
          console.error('❌ Failed to submit Full Test:', err);
        }
      });
    } else {
      console.log('⚠️ No sessionId, cannot submit Full Test');
    }
  }
}