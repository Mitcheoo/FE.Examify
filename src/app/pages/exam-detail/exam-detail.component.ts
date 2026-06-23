import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, SkillProgress } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-detail.component.html',
  styleUrls: ['./exam-detail.component.scss']
})
export class ExamDetailComponent implements OnInit {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  exam: any = null;
  skills: SkillProgress[] = [];
  examId: string = '';
  isLoading = true;
  errorMessage = '';
  private userId: string = '';
  private sessionId: string | null = null;

  private skillExamIds = {
    reading: '8c0375f7-335a-49eb-b199-41cbd35f94e2',
    listening: '32e69c0b-7568-4410-8147-40a6738fba6f',
    writing: 'a7f7c65c-f1ff-45f1-a02b-f923204556c0',
    speaking: '80f047ba-b805-483c-850d-97426ab994fe'
  };

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('📌 Exam ID from URL:', this.examId);
      console.log('📌 User ID:', this.userId);
      
      if (this.examId) {
        this.loadExamDetail();
      } else {
        this.errorMessage = 'Không tìm thấy ID đề thi';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadExamDetail() {
    console.log('🔄 Loading exam detail for ID:', this.examId);
    
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

loadFullTestStatus() {
  console.log('🔄 Loading full test status...');
  
  const sessionKey = `fulltest_session_${this.examId}_${this.userId}`;
  let sessionId = localStorage.getItem(sessionKey);
  
  if (!sessionId || sessionId === 'null' || sessionId === '') {
    this.examService.startFullTestSession(this.examId).subscribe({
      next: (data: any) => {
        sessionId = data.sessionId;
        if (sessionId) {
          localStorage.setItem(sessionKey, sessionId);
          console.log('✅ Full Test session created:', sessionId);
        } else {
          console.error('❌ Session ID is null or empty');
        }
        this.sessionId = sessionId;
        this.continueLoadFullTestStatus(sessionId);
      },
      error: (err) => {
        console.error('❌ Failed to create session:', err);
        this.continueLoadFullTestStatus(null);
      }
    });
  } else {
    console.log('📌 Found existing session:', sessionId);
    this.sessionId = sessionId;
    this.continueLoadFullTestStatus(sessionId);
  }
  // ❌ KHÔNG CẦN detectChanges ở đây
}

continueLoadFullTestStatus(sessionId: string | null = null) {
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
      
      // ✅ DÙNG detectChanges Ở ĐÂY - SAU KHI CÓ DỮ LIỆU
      this.cdr.detectChanges();
      
      console.log('🔴 Final skills:', this.skills);
    },
    error: (err) => {
      console.error('❌ Error loading full test status:', err);
      this.isLoading = false;
      this.cdr.detectChanges();  // ✅ CẢ Ở ĐÂY
      this.loadLegacyProgress();
    }
  });
}
  loadLegacyProgress() {
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
  console.log('🚀 Starting skill:', skillType);
  const skill = this.skills.find(s => s.skillType === skillType);
  const targetExamId = skill?.examId || this.examId;
  
  // ✅ GIỮ SESSION KEY RIÊNG CHO TỪNG KỸ NĂNG (GIỮ NGUYÊN)
  const skillSessionKey = `fulltest_session_${this.examId}_${skillType}_${this.userId}`;
  let skillSessionId = localStorage.getItem(skillSessionKey);
  
  // ✅ KIỂM TRA SESSION CHUNG (THÊM MỚI)
  const fullTestSessionKey = `fulltest_session_${this.examId}_${this.userId}`;
  const fullTestSessionId = localStorage.getItem(fullTestSessionKey);
  
  // Nếu chưa có session riêng cho skill này, dùng session chung
  if (!skillSessionId || skillSessionId === 'null' || skillSessionId === '') {
    if (fullTestSessionId && fullTestSessionId !== 'null' && fullTestSessionId !== '') {
      // ✅ DÙNG SESSION CHUNG CHO SKILL NÀY
      skillSessionId = fullTestSessionId;
      localStorage.setItem(skillSessionKey, skillSessionId);
      console.log(`📌 Using common session for ${skillType}:`, skillSessionId);
    }
  }
  
  if (skillSessionId && skillSessionId !== 'null' && skillSessionId !== '') {
    // ✅ KIỂM TRA SESSION CÓ HOÀN THÀNH KHÔNG (GIỮ NGUYÊN)
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
            sessionId: skillSessionId
          }
        });
      },
      error: (err: any) => {
        console.error('❌ Failed to check session status:', err);
        this.router.navigate(['/exam', targetExamId, skillType], {
          queryParams: { 
            fullTestId: this.examId,
            sessionId: skillSessionId
          }
        });
      }
    });
  } else {
    // ✅ TẠO SESSION MỚI (FALLBACK - GIỮ NGUYÊN)
    console.log(`⚠️ No session found for ${skillType}, creating one first...`);
    this.examService.startFullTestSession(this.examId).subscribe({
      next: (data: any) => {
        const newSessionId = data.sessionId;
        
        // Lưu session chung
        localStorage.setItem(`fulltest_session_${this.examId}_${this.userId}`, newSessionId);
        
        // Lưu session riêng cho skill
        localStorage.setItem(skillSessionKey, newSessionId);
        
        console.log(`✅ Session created for ${skillType}:`, newSessionId);
        
        this.router.navigate(['/exam', targetExamId, skillType], {
          queryParams: { 
            fullTestId: this.examId,
            sessionId: newSessionId
          }
        });
      },
      error: (err: any) => {
        console.error('❌ Failed to create session:', err);
        alert('Không thể tạo phiên làm bài. Vui lòng thử lại!');
      }
    });
  }
}
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

  // ✅ HÀM LẤY SỐ KỸ NĂNG ĐÃ HOÀN THÀNH
  getCompletedSkillsCount(): number {
    return this.skills.filter(s => s.status === 'completed').length;
  }

  // ✅ HÀM LẤY PHẦN TRĂM TIẾN ĐỘ
  getProgressPercentage(): number {
    if (this.skills.length === 0) return 0;
    const completed = this.getCompletedSkillsCount();
    return Math.round((completed / this.skills.length) * 100);
  }

  // ✅ HÀM LẤY MÀU GRADIENT THEO TIẾN ĐỘ
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

  // ✅ KIỂM TRA ĐÃ HOÀN THÀNH FULL TEST CHƯA (GIỮ NGUYÊN)
// exam-detail.component.ts

checkFullTestCompletion(): boolean {
  // ✅ LẤY ID ĐỘNG TỪ SKILLS ARRAY (KHÔNG DÙNG skillExamIds CỐ ĐỊNH)
  const readingSkill = this.skills.find(s => s.skillType === 'reading');
  const listeningSkill = this.skills.find(s => s.skillType === 'listening');
  const writingSkill = this.skills.find(s => s.skillType === 'writing');
  const speakingSkill = this.skills.find(s => s.skillType === 'speaking');
  
  // Nếu chưa có skills → chưa hoàn thành
  if (!readingSkill || !listeningSkill || !writingSkill || !speakingSkill) {
    console.log('⚠️ Missing skills in array');
    return false;
  }
  
  // ✅ KIỂM TRA TỪ localStorage VỚI ID ĐÚNG
  const readingKey = `reading_result_${readingSkill.examId}_${this.userId}`;
  const listeningKey = `listening_result_${listeningSkill.examId}_${this.userId}`;
  const writingKey = `writing_result_${writingSkill.examId}_${this.userId}`;
  const speakingKey = `speaking_result_${speakingSkill.examId}_${this.userId}`;
  
  const hasReading = localStorage.getItem(readingKey) !== null;
  const hasListening = localStorage.getItem(listeningKey) !== null;
  const hasWriting = localStorage.getItem(writingKey) !== null;
  const hasSpeaking = localStorage.getItem(speakingKey) !== null;
  
  const allCompleted = hasReading && hasListening && hasWriting && hasSpeaking;
  
  console.log('📊 checkFullTestCompletion:', {
    reading: { examId: readingSkill.examId, hasResult: hasReading },
    listening: { examId: listeningSkill.examId, hasResult: hasListening },
    writing: { examId: writingSkill.examId, hasResult: hasWriting },
    speaking: { examId: speakingSkill.examId, hasResult: hasSpeaking },
    allCompleted
  });
  
  return allCompleted;
}

  // ✅ XEM KẾT QUẢ FULL TEST (GIỮ NGUYÊN)
  viewFullTestResult() {
    console.log('🚀 Navigating to full test result...');
    this.router.navigate(['/fulltest', this.examId, 'result']);
  }
}