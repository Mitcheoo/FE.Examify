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
        
        // ✅ NẾU LÀ FULL TEST, GỌI API STATUS
        if (data.isFullTest) {
          this.loadFullTestStatus();
        } else {
          // Bài thi đơn lẻ
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

  // ✅ GỌI API STATUS CHO FULL TEST
  loadFullTestStatus() {
    console.log('🔄 Loading full test status...');
    
    this.examService.getFullTestStatus(this.examId).subscribe({
      next: (statusData) => {
        console.log('✅ Full test status loaded:', statusData);
        
        // Convert từ API status sang format skills của frontend
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
        
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('🔴 Skills built from API:', this.skills);
      },
      error: (err) => {
        console.error('❌ Error loading full test status:', err);
        // Fallback: nếu API lỗi, dữ liệu cũ từ localStorage
        this.loadLegacyProgress();
      }
    });
  }

  // Fallback cũ (giữ lại để tương thích)
  loadLegacyProgress() {
    console.log('🔄 Using legacy progress loading...');
    
    this.skills = [
      { skillType: 'reading', skillName: '📖 Reading', duration: 60, status: 'available', score: undefined, examId: this.exam?.readingExerciseId },
      { skillType: 'listening', skillName: '🎧 Listening', duration: 35, status: 'locked', score: undefined, examId: this.exam?.listeningExerciseId },
      { skillType: 'writing', skillName: '✍️ Writing', duration: 60, status: 'locked', score: undefined, examId: this.exam?.writingExerciseId },
      { skillType: 'speaking', skillName: '🎙️ Speaking', duration: 17, status: 'locked', score: undefined, examId: this.exam?.speakingExerciseId }
    ];
    
    // Đọc kết quả từ localStorage
    this.skills.forEach(skill => {
      if (skill.examId) {
        const storageKey = `${skill.skillType}_result_${skill.examId}_${this.userId}`;
        const savedResult = localStorage.getItem(storageKey);
        if (savedResult) {
          const result = JSON.parse(savedResult);
          skill.status = 'completed';
          skill.score = result.totalScore;
          
          // Mở khóa kỹ năng tiếp theo
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

  startSkill(skillType: string) {
    console.log('🚀 Starting skill:', skillType);
    const skill = this.skills.find(s => s.skillType === skillType);
    const targetExamId = skill?.examId || this.examId;
    
    // Nếu là Full Test, truyền fullTestId qua state
    if (this.exam?.isFullTest) {
      this.router.navigate(['/exam', targetExamId, skillType], {
        state: { fullTestId: this.examId }
      });
    } else {
      this.router.navigate(['/exam', targetExamId, skillType]);
    }
  }
}