// 📁 src/app/pages/exam-detail/exam-detail.component.ts

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService, SkillProgress } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service'; // ✅ THÊM IMPORT

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './exam-detail.component.html',
  styleUrls: ['./exam-detail.component.scss']
})
export class ExamDetailComponent implements OnInit {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private walletService = inject(WalletService); // ✅ THÊM WALLET SERVICE

  exam: any = null;
  skills: SkillProgress[] = [];
  examId: string = '';
  isLoading = true;
  errorMessage = '';
  private userId: string = '';
  private sessionId: string | null = null;
  private isClosingSession: boolean = false;

  // ✅ THÊM TRẠNG THÁI KIỂM TRA MUA
  private isCheckingPurchase: boolean = false;
  private isPurchased: boolean = false;

  private skillExamIds = {
    reading: '8c0375f7-335a-49eb-b199-41cbd35f94e2',
    listening: '32e69c0b-7568-4410-8147-40a6738fba6f',
    writing: 'a7f7c65c-f1ff-45f1-a02b-f923204556c0',
    speaking: '80f047ba-b805-483c-850d-97426ab994fe'
  };

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('📌 Exam ID from URL:', this.examId);
      console.log('📌 User ID:', this.userId);
      
      if (this.examId) {
        // ✅ THAY VÌ LOAD TRỰC TIẾP, KIỂM TRA MUA TRƯỚC
        this.checkPurchaseAndLoad();
      } else {
        this.errorMessage = 'Không tìm thấy ID đề thi';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // ✅ KIỂM TRA MUA VÀ LOAD BÀI THI (THÊM MỚI)
  // ============================================================

  checkPurchaseAndLoad() {
    this.isLoading = true;
    this.isCheckingPurchase = true;
    
    // 1. Lấy thông tin bài thi
    this.examService.getExerciseById(this.examId).subscribe({
      next: (examData) => {
        this.exam = examData;
        console.log('✅ Exam loaded:', this.exam);
        
        // 2. Kiểm tra bài thi có phí không (Full Test hoặc bài thường)
        if (this.exam && !this.exam.isFree && this.exam.price > 0) {
          console.log(`💰 Bài thi có phí: ${this.exam.price}đ`);
          
          // 3. Kiểm tra user đã mua chưa (cho cả Full Test và bài thường)
          this.walletService.checkPurchased(this.examId).subscribe({
            next: (purchaseResult) => {
              this.isPurchased = purchaseResult.isPurchased;
              this.isCheckingPurchase = false;
              
              if (!this.isPurchased) {
                // ❌ CHƯA MUA → CHẶN VÀ CHUYỂN HƯỚNG
                console.warn('⚠️ User chưa mua bài thi này, redirecting...');
                this.errorMessage = `Bạn cần mua bài thi này trước khi làm. Giá: ${this.exam?.price?.toLocaleString()}đ`;
                this.isLoading = false;
                this.cdr.detectChanges();
                
                // Hiển thị alert và chuyển về trang danh sách
                alert(`⚠️ Bạn cần mua bài thi này trước khi làm.\n📖 "${this.exam?.title}"\n💰 Giá: ${this.exam?.price?.toLocaleString()}đ\n\nVui lòng quay lại trang danh sách để mua.`);
                this.router.navigate(['/exam-list']);
                return;
              }
              
              console.log('✅ User đã mua bài thi này');
              // ✅ ĐÃ MUA → TIẾP TỤC LOAD
              this.continueLoadExamDetail();
            },
            error: (err) => {
              console.error('❌ Error checking purchase:', err);
              this.isCheckingPurchase = false;
              // Nếu lỗi kiểm tra mua, vẫn cho vào làm (fallback)
              this.continueLoadExamDetail();
            }
          });
        } else {
          // Bài thi miễn phí
          console.log('🆓 Bài thi miễn phí');
          this.isCheckingPurchase = false;
          this.isPurchased = true;
          this.continueLoadExamDetail();
        }
      },
      error: (err) => {
        console.error('❌ Error loading exam:', err);
        this.errorMessage = 'Có lỗi xảy ra khi tải đề thi';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // ✅ TIẾP TỤC LOAD CHI TIẾT (TÁCH RIÊNG ĐỂ KHÔNG ẢNH HƯỞNG CODE CŨ)
  // ============================================================

  continueLoadExamDetail() {
    // GỌI LẠI LOGIC CŨ
    this.loadExamDetail();
  }

  // ============================================================
  // LOAD EXAM DETAIL (GIỮ NGUYÊN CODE CŨ)
  // ============================================================

  loadExamDetail() {
    console.log('🔄 Loading exam detail for ID:', this.examId);
    
    // ✅ NẾU ĐÃ CÓ EXAM TỪ BƯỚC TRƯỚC, DÙNG LẠI
    if (this.exam && this.exam.id === this.examId) {
      console.log('✅ Using existing exam data');
      if (this.exam.isFullTest) {
        this.loadFullTestStatus();
        const savedSession = localStorage.getItem('fulltest_session_' + this.examId + '_' + this.userId);
        if (savedSession && savedSession !== 'null' && savedSession !== '') {
          this.sessionId = savedSession;
          console.log('📌 Found existing session:', this.sessionId);
        }
      } else {
        this.skills = [
          { 
            skillType: this.getSkillType(this.exam.skill), 
            skillName: this.getSkillName(this.exam.skill), 
            duration: Math.floor(this.exam.timeLimitSeconds / 60), 
            status: 'available', 
            examId: this.examId
          }
        ];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
      return;
    }
    
    // FALLBACK: GỌI API NẾU CHƯA CÓ DATA
    this.examService.getExerciseById(this.examId).subscribe({
      next: (data) => {
        console.log('✅ Exam detail loaded:', data);
        
        if (data && data.id) {
          this.exam = data;
          console.log('✅ Exam assigned:', this.exam.title);
        }
        
        if (data.isFullTest) {
          this.loadFullTestStatus();
          const savedSession = localStorage.getItem('fulltest_session_' + this.examId + '_' + this.userId);
          if (savedSession && savedSession !== 'null' && savedSession !== '') {
            this.sessionId = savedSession;
            console.log('📌 Found existing session:', this.sessionId);
          }
        } else {
          this.skills = [
            { 
              skillType: this.getSkillType(data.skill), 
              skillName: this.getSkillName(data.skill), 
              duration: Math.floor(data.timeLimitSeconds / 60), 
              status: 'available', 
              examId: this.examId
            }
          ];
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('❌ Error loading exam detail:', err);
        this.errorMessage = 'Có lỗi xảy ra khi tải đề thi';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // CÁC HÀM CÒN LẠI GIỮ NGUYÊN (KHÔNG THAY ĐỔI)
  // ============================================================

  loadFullTestStatus() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    console.log('🔄 Loading full test status...');
    
    const sessionKey = `fulltest_session_${this.examId}_${this.userId}`;
    let sessionId = localStorage.getItem(sessionKey);
    
    this.examService.getActiveSession(this.examId).subscribe({
      next: (response: any) => {
        console.log('📌 Active session check:', response);
        
        if (response.hasActiveSession) {
          sessionId = response.sessionId;
          if (sessionId) {
            localStorage.setItem(sessionKey, sessionId);
            console.log('📌 Using active session:', sessionId);
            this.sessionId = sessionId;
            this.continueLoadFullTestStatus(sessionId);
          } else {
            this.createNewSession();
          }
        } else {
          console.log('📌 No active session, creating new one...');
          this.createNewSession();
        }
      },
      error: (err) => {
        console.error('❌ Failed to check active session:', err);
        if (sessionId && sessionId !== 'null' && sessionId !== '') {
          this.sessionId = sessionId;
          this.continueLoadFullTestStatus(sessionId);
        } else {
          this.createNewSession();
        }
      }
    });
  }

  clearAllDraftAnswers() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    const skillTypes = ['reading', 'listening', 'writing', 'speaking'];
    const exerciseIds = this.skills.map(s => s.examId).filter(id => id);
    const ids = exerciseIds.length > 0 ? exerciseIds : [
      this.skillExamIds.reading,
      this.skillExamIds.listening,
      this.skillExamIds.writing,
      this.skillExamIds.speaking
    ];
    
    skillTypes.forEach((skill, index) => {
      const examId = ids[index] || this.examId;
      const draftKey = `${skill}_answers_${examId}_${this.userId}`;
      localStorage.removeItem(draftKey);
      console.log(`🗑️ Deleted draft: ${draftKey}`);
    });
    
    console.log('✅ All draft answers cleared from localStorage');
  }

  createNewSession() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    this.examService.startFullTestSession(this.examId).subscribe({
      next: (data: any) => {
        const sessionId = data.sessionId;
        if (sessionId) {
          localStorage.setItem(`fulltest_session_${this.examId}_${this.userId}`, sessionId);
          localStorage.setItem(`new_session_${sessionId}`, 'true');
          console.log(`✅ Set new_session flag for: ${sessionId}`);
          this.clearAllDraftAnswers();
          console.log('✅ Full Test session created:', sessionId);
          this.sessionId = sessionId;
          this.continueLoadFullTestStatus(sessionId);
        } else {
          console.error('❌ Session ID is null or empty');
          this.continueLoadFullTestStatus(null);
        }
      },
      error: (err) => {
        console.error('❌ Failed to create session:', err);
        this.continueLoadFullTestStatus(null);
      }
    });
  }

  continueLoadFullTestStatus(sessionId: string | null = null) {
    // ... GIỮ NGUYÊN CODE CŨ ...
    this.examService.getFullTestStatus(this.examId).subscribe({
      next: (statusData) => {
        console.log('✅ Full test status loaded:', statusData);
        
        if (sessionId) {
          this.sessionId = sessionId;
        }
        
        this.skills = statusData.skills.map((skill: any) => ({
          skillType: this.getSkillTypeFromNumber(skill.skill),
          skillName: skill.skillName,
          duration: this.getSkillDuration(skill.skill),
          status: skill.isUnlocked ? (skill.isCompleted ? 'completed' : 'available') : 'locked',
          score: skill.bestScore,
          examId: skill.exerciseId,
          message: skill.message,
          attempts: skill.attempts
        }));
        
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('🔴 Final skills:', this.skills);
      },
      error: (err) => {
        console.error('❌ Error loading full test status:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadLegacyProgress();
      }
    });
  }

  loadLegacyProgress() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    console.log('🔄 Using legacy progress loading...');
    
    this.skills = [
      { skillType: 'reading', skillName: 'Reading', duration: 60, status: 'available', examId: this.skillExamIds.reading },
      { skillType: 'listening', skillName: 'Listening', duration: 35, status: 'locked', examId: this.skillExamIds.listening },
      { skillType: 'writing', skillName: 'Writing', duration: 60, status: 'locked', examId: this.skillExamIds.writing },
      { skillType: 'speaking', skillName: 'Speaking', duration: 17, status: 'locked', examId: this.skillExamIds.speaking }
    ];
    
    this.skills.forEach(skill => {
      if (skill.examId) {
        const storageKey = skill.skillType + '_result_' + skill.examId + '_' + this.userId;
        const savedResult = localStorage.getItem(storageKey);
        if (savedResult) {
          const result = JSON.parse(savedResult);
          skill.status = 'completed';
          skill.score = result.totalScore;
          
          const currentIndex = this.skills.findIndex(s => s.skillType === skill.skillType);
          const nextSkill = this.skills[currentIndex + 1];
          if (nextSkill && nextSkill.status === 'locked') {
            nextSkill.status = 'available';
          }
        }
      }
    });
    
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  startSkill(skillType: string) {
    // ... GIỮ NGUYÊN CODE CŨ ...
    console.log('🚀 Starting skill:', skillType);
    const skill = this.skills.find(s => s.skillType === skillType);
    const targetExamId = skill?.examId || this.examId;
    
    if (skill?.status === 'completed') {
      alert('✅ Bạn đã hoàn thành kỹ năng này!');
      return;
    }
    
    if (skill?.status === 'locked') {
      alert('🔒 Kỹ năng này đang bị khóa. Hãy hoàn thành kỹ năng trước!');
      return;
    }
    
    const fullTestSessionKey = `fulltest_session_${this.examId}_${this.userId}`;
    const fullTestSessionId = localStorage.getItem(fullTestSessionKey);
    
    console.log(`📌 Current full test session: ${fullTestSessionId}`);
    
    if (!fullTestSessionId || fullTestSessionId === 'null' || fullTestSessionId === '') {
      console.log(`⚠️ No session found, creating one first...`);
      this.examService.startFullTestSession(this.examId).subscribe({
        next: (data: any) => {
          const newSessionId = data.sessionId;
          if (newSessionId) {
            localStorage.setItem(fullTestSessionKey, newSessionId);
            localStorage.setItem(`fulltest_session_${this.examId}_${skillType}_${this.userId}`, newSessionId);
            localStorage.setItem(`new_session_${newSessionId}`, 'true');
            
            console.log(`✅ Session created: ${newSessionId}`);
            
            const draftKey = `${skillType}_answers_${targetExamId}_${this.userId}`;
            localStorage.removeItem(draftKey);
            console.log(`🗑️ Deleted draft for ${skillType}`);
            
            this.router.navigate(['/exam', targetExamId, skillType], {
              queryParams: { 
                fullTestId: this.examId,
                sessionId: newSessionId
              }
            });
          }
        },
        error: (err) => {
          console.error('❌ Failed to create session:', err);
          alert('Không thể tạo phiên làm bài. Vui lòng thử lại!');
        }
      });
      return;
    }
    
    const skillSessionKey = `fulltest_session_${this.examId}_${skillType}_${this.userId}`;
    localStorage.setItem(skillSessionKey, fullTestSessionId);
    console.log(`📌 Using session ${fullTestSessionId} for ${skillType}`);
    
    const isNewSession = localStorage.getItem(`new_session_${fullTestSessionId}`) === 'true';
    if (isNewSession) {
      const draftKey = `${skillType}_answers_${targetExamId}_${this.userId}`;
      localStorage.removeItem(draftKey);
      console.log(`🗑️ Deleted draft for ${skillType}: ${draftKey}`);
      localStorage.removeItem(`new_session_${fullTestSessionId}`);
    }
    
    this.examService.getFullTestStatus(this.examId).subscribe({
      next: (status: any) => {
        console.log('📊 Full test status:', status);
        
        const allCompleted = status.skills?.every((s: any) => s.isCompleted === true);
        
        if (allCompleted) {
          console.log('⚠️ Session already completed, redirecting to result...');
          alert('Bạn đã hoàn thành bài thi này. Chuyển đến trang kết quả!');
          this.router.navigate(['/fulltest', this.examId, 'result']);
          return;
        }
        
        console.log(`📌 Session still in progress for ${skillType}, continuing...`);
        this.router.navigate(['/exam', targetExamId, skillType], {
          queryParams: { 
            fullTestId: this.examId,
            sessionId: fullTestSessionId
          }
        });
      },
      error: (err: any) => {
        console.error('❌ Failed to check session status:', err);
        this.router.navigate(['/exam', targetExamId, skillType], {
          queryParams: { 
            fullTestId: this.examId,
            sessionId: fullTestSessionId
          }
        });
      }
    });
  }

  viewFullTestResult() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    if (this.isClosingSession) {
      console.log('⏳ Already closing session, please wait...');
      return;
    }

    console.log('🚀 Viewing full test result...');
    this.isClosingSession = true;
    
    this.examService.closeFullTestSession(this.examId).subscribe({
      next: (response) => {
        console.log('✅ Session closed successfully:', response);
        console.log('📊 Attempt count updated:', response.attemptCount);
        
        this.clearLocalStorageSessions();
        this.isClosingSession = false;
        this.router.navigate(['/fulltest', this.examId, 'result']);
      },
      error: (err) => {
        console.error('❌ Failed to close session:', err);
        this.isClosingSession = false;
        this.router.navigate(['/fulltest', this.examId, 'result']);
      }
    });
  }

  clearLocalStorageSessions() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    const sessionKey = `fulltest_session_${this.examId}_${this.userId}`;
    localStorage.removeItem(sessionKey);
    
    ['reading', 'listening', 'writing', 'speaking'].forEach(skill => {
      const skillKey = `fulltest_session_${this.examId}_${skill}_${this.userId}`;
      localStorage.removeItem(skillKey);
    });
    
    console.log('🗑️ All sessions cleared from localStorage');
  }

  retryFullTest() {
    // ... GIỮ NGUYÊN CODE CŨ ...
    console.log('🔄 Retrying full test...');
    
    this.examService.closeFullTestSession(this.examId).subscribe({
      next: () => {
        console.log('✅ Session closed for retry');
        this.clearLocalStorageSessions();
        
        this.examService.createNewFullTestSession(this.examId).subscribe({
          next: (response) => {
            console.log('✅ New session created:', response.sessionId);
            
            if (response.sessionId) {
              localStorage.setItem(`fulltest_session_${this.examId}_${this.userId}`, response.sessionId);
              this.sessionId = response.sessionId;
              this.loadFullTestStatus();
              alert('🔄 Đã tạo phiên làm bài mới! Bạn có thể bắt đầu lại từ đầu.');
            } else {
              alert('Không thể tạo phiên làm bài mới. Vui lòng thử lại!');
            }
          },
          error: (err) => {
            console.error('❌ Failed to create new session:', err);
            alert('Không thể tạo phiên làm bài mới. Vui lòng thử lại!');
          }
        });
      },
      error: (err) => {
        console.error('❌ Failed to close session for retry:', err);
        alert('Không thể đóng phiên làm bài. Vui lòng thử lại!');
      }
    });
  }

  checkFullTestCompletion(): boolean {
    // ... GIỮ NGUYÊN CODE CŨ ...
    const readingSkill = this.skills.find(s => s.skillType === 'reading');
    const listeningSkill = this.skills.find(s => s.skillType === 'listening');
    const writingSkill = this.skills.find(s => s.skillType === 'writing');
    const speakingSkill = this.skills.find(s => s.skillType === 'speaking');
    
    if (!readingSkill || !listeningSkill || !writingSkill || !speakingSkill) {
      console.log('⚠️ Missing skills in array');
      return false;
    }
    
    const allCompleted = this.skills.every(s => s.status === 'completed');
    
    console.log('📊 checkFullTestCompletion:', {
      reading: readingSkill.status,
      listening: listeningSkill.status,
      writing: writingSkill.status,
      speaking: speakingSkill.status,
      allCompleted
    });
    
    return allCompleted;
  }

  // ============================================================
  // GETTER HELPERS (GIỮ NGUYÊN)
  // ============================================================

  getSkillName(skill: number): string {
    const names: any = { 0: 'Reading', 1: 'Listening', 2: 'Writing', 3: 'Speaking', 4: 'Full Test' };
    return names[skill] || 'Unknown';
  }

  getSkillType(skill: number): string {
    const types: any = { 0: 'reading', 1: 'listening', 2: 'writing', 3: 'speaking' };
    return types[skill] || 'unknown';
  }

  getSkillTypeFromNumber(skill: number): string {
    const types: any = { 0: 'reading', 1: 'listening', 2: 'writing', 3: 'speaking' };
    return types[skill] || 'unknown';
  }

  getSkillDuration(skill: number): number {
    const durations: any = { 0: 60, 1: 35, 2: 60, 3: 17 };
    return durations[skill] || 30;
  }

  getSkillIcon(skillType: string): string {
    const icons: any = { 
      reading: '📖', 
      listening: '🎧', 
      writing: '✍️', 
      speaking: '🎙️' 
    };
    return icons[skillType] || '📚';
  }

  getStatusText(status: string): string {
    const texts: any = { 
      locked: '🔒 Đã khóa', 
      available: '📝 Có thể làm', 
      completed: '✅ Đã hoàn thành' 
    };
    return texts[status] || status;
  }

  getCompletedSkillsCount(): number {
    return this.skills.filter(s => s.status === 'completed').length;
  }

  getProgressPercentage(): number {
    if (this.skills.length === 0) return 0;
    const completed = this.getCompletedSkillsCount();
    return Math.round((completed / this.skills.length) * 100);
  }

  getProgressGradient(): string {
    const percent = this.getProgressPercentage();
    if (percent === 100) {
      return 'linear-gradient(90deg, #27ae60, #2ecc71)';
    } else if (percent >= 50) {
      return 'linear-gradient(90deg, #f39c12, #e67e22)';
    } else {
      return 'linear-gradient(90deg, #667eea, #764ba2)';
    }
  }

  // ============================================================
  // NAVIGATION (GIỮ NGUYÊN)
  // ============================================================

  goBack() {
    this.router.navigate(['/home']);
  }
}