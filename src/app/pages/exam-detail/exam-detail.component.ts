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
              score: undefined,
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
    
    this.examService.getFullTestStatus(this.examId).subscribe({
      next: (statusData) => {
        console.log('✅ Full test status loaded:', statusData);
        
        this.skills = statusData.skills.map((skill: any) => ({
          skillType: this.getSkillTypeFromNumber(skill.skill),
          skillName: this.getSkillIcon(this.getSkillTypeFromNumber(skill.skill)) + ' ' + skill.skillName,
          duration: this.getSkillDuration(skill.skill),
          status: skill.isUnlocked ? (skill.isCompleted ? 'completed' : 'available') : 'locked',
          score: skill.bestScore,
          examId: skill.exerciseId,
          message: skill.message,
          attempts: skill.attempts
        }));
        
        const speakingKey = 'speaking_result_' + this.skillExamIds.speaking + '_' + this.userId;
        const speakingResult = localStorage.getItem(speakingKey);
        
        if (speakingResult) {
          const speakingData = JSON.parse(speakingResult);
          const speakingSkill = this.skills.find(s => s.skillType === 'speaking');
          if (speakingSkill) {
            speakingSkill.status = 'completed';
            speakingSkill.score = speakingData.totalScore;
            console.log('✅ Updated speaking status from localStorage:', speakingSkill);
          }
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('🔴 Final skills:', this.skills);
      },
      error: (err) => {
        console.error('❌ Error loading full test status:', err);
        this.loadLegacyProgress();
      }
    });
  }

  loadLegacyProgress() {
    console.log('🔄 Using legacy progress loading...');
    
    this.skills = [
      { skillType: 'reading', skillName: '📖 Reading', duration: 60, status: 'available', score: undefined, examId: this.skillExamIds.reading },
      { skillType: 'listening', skillName: '🎧 Listening', duration: 35, status: 'locked', score: undefined, examId: this.skillExamIds.listening },
      { skillType: 'writing', skillName: '✍️ Writing', duration: 60, status: 'locked', score: undefined, examId: this.skillExamIds.writing },
      { skillType: 'speaking', skillName: '🎙️ Speaking', duration: 17, status: 'locked', score: undefined, examId: this.skillExamIds.speaking }
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

  // ✅ SỬA: DÙNG QUERY PARAMS THAY VÌ STATE
  startSkill(skillType: string) {
    console.log('🚀 Starting skill:', skillType);
    const skill = this.skills.find(s => s.skillType === skillType);
    const targetExamId = skill?.examId || this.examId;
    
    const savedSession = localStorage.getItem('fulltest_session_' + this.examId + '_' + this.userId);
    
    if (savedSession && savedSession !== 'null' && savedSession !== '') {
      this.sessionId = savedSession;
      console.log('📌 Using existing session:', this.sessionId);
      
      // ✅ DÙNG QUERY PARAMS
      this.router.navigate(['/exam', targetExamId, skillType], {
        queryParams: { 
          fullTestId: this.examId,
          sessionId: this.sessionId
        }
      });
    } else {
      console.log('⚠️ No session found, creating one first...');
      this.examService.startFullTestSession(this.examId).subscribe({
        next: (data: any) => {
          this.sessionId = data.sessionId;
          localStorage.setItem('fulltest_session_' + this.examId + '_' + this.userId, this.sessionId || '');
          console.log('✅ Session created:', this.sessionId);
          
          // ✅ DÙNG QUERY PARAMS
          this.router.navigate(['/exam', targetExamId, skillType], {
            queryParams: { 
              fullTestId: this.examId,
              sessionId: this.sessionId
            }
          });
        },
        error: (err) => {
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
    const icons: any = { reading: '📖', listening: '🎧', writing: '✍️', speaking: '🎙️' };
    return icons[skillType] || '📚';
  }

  getStatusText(status: string): string {
    const texts: any = { locked: '🔒 Chưa mở khóa', available: '✅ Có thể làm', completed: '✅ Đã hoàn thành' };
    return texts[status] || status;
  }

  checkFullTestCompletion(): boolean {
    const readingKey = 'reading_result_' + this.skillExamIds.reading + '_' + this.userId;
    const listeningKey = 'listening_result_' + this.skillExamIds.listening + '_' + this.userId;
    const writingKey = 'writing_result_' + this.skillExamIds.writing + '_' + this.userId;
    const speakingKey = 'speaking_result_' + this.skillExamIds.speaking + '_' + this.userId;
    
    const hasReading = localStorage.getItem(readingKey) !== null;
    const hasListening = localStorage.getItem(listeningKey) !== null;
    const hasWriting = localStorage.getItem(writingKey) !== null;
    const hasSpeaking = localStorage.getItem(speakingKey) !== null;
    
    const allCompleted = hasReading && hasListening && hasWriting && hasSpeaking;
    
    if (allCompleted) {
      console.log('✅ All 4 skills completed in localStorage');
    }
    
    return allCompleted;
  }

  viewFullTestResult() {
    console.log('🚀 Navigating to full test result...');
    this.router.navigate(['/fulltest', this.examId, 'result']);
  }
}