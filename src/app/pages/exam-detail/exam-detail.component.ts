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
        
        // Xử lý theo loại bài thi
        if (data.isFullTest) {
          // Full Test: 4 kỹ năng
          this.skills = [
            { 
              skillType: 'reading', 
              skillName: '📖 Reading', 
              duration: 60, 
              status: 'available', 
              score: undefined,
              examId: data.readingExerciseId
            },
            { 
              skillType: 'listening', 
              skillName: '🎧 Listening', 
              duration: 35, 
              status: 'locked', 
              score: undefined,
              examId: data.listeningExerciseId
            },
            { 
              skillType: 'writing', 
              skillName: '✍️ Writing', 
              duration: 60, 
              status: 'locked', 
              score: undefined,
              examId: data.writingExerciseId
            },
            { 
              skillType: 'speaking', 
              skillName: '🎙️ Speaking', 
              duration: 17, 
              status: 'locked', 
              score: undefined,
              examId: data.speakingExerciseId
            }
          ];
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
        }
        
        this.loadProgress();
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('🔴 isLoading set to false');
      },
      error: (err) => {
        console.error('❌ Error loading exam detail:', err);
        this.errorMessage = 'Có lỗi xảy ra khi tải đề thi';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProgress() {
    console.log('🔄 Loading progress for skills:', this.skills);
    
    // Đọc kết quả từ localStorage cho từng kỹ năng
    this.skills.forEach(skill => {
      if (skill.examId) {
        const storageKey = `${skill.skillType}_result_${skill.examId}_${this.userId}`;
        const savedResult = localStorage.getItem(storageKey);
        
        if (savedResult) {
          const result = JSON.parse(savedResult);
          skill.status = 'completed';
          skill.score = result.totalScore;
          console.log(`✅ ${skill.skillType} completed with score:`, result.totalScore);
          
          // Mở khóa kỹ năng tiếp theo
          const currentIndex = this.skills.findIndex(s => s.skillType === skill.skillType);
          const nextSkill = this.skills[currentIndex + 1];
          if (nextSkill && nextSkill.status === 'locked') {
            nextSkill.status = 'available';
            console.log(`✅ ${nextSkill.skillType} unlocked`);
          }
        }
      }
    });
    
    // ✅ XỬ LÝ WRITING (đặt đúng vị trí)
    if (this.exam?.writingExerciseId) {
      const savedWritingResult = localStorage.getItem(`writing_result_${this.exam.writingExerciseId}_${this.userId}`);
      if (savedWritingResult) {
        const result = JSON.parse(savedWritingResult);
        const writingSkill = this.skills.find(s => s.skillType === 'writing');
        if (writingSkill) {
          writingSkill.status = 'completed';
          writingSkill.score = result.totalScore;
          console.log(`✅ writing completed with score:`, result.totalScore);
        }
        const speakingSkill = this.skills.find(s => s.skillType === 'speaking');
        if (speakingSkill && speakingSkill.status === 'locked') {
          speakingSkill.status = 'available';
          console.log(`✅ speaking unlocked`);
        }
      }
    }
    
    // ✅ XỬ LÝ SPEAKING (đặt đúng vị trí)
    if (this.exam?.speakingExerciseId) {
      const savedSpeakingResult = localStorage.getItem(`speaking_result_${this.exam.speakingExerciseId}_${this.userId}`);
      if (savedSpeakingResult) {
        const result = JSON.parse(savedSpeakingResult);
        const speakingSkill = this.skills.find(s => s.skillType === 'speaking');
        if (speakingSkill) {
          speakingSkill.status = 'completed';
          speakingSkill.score = result.totalScore;
          console.log(`✅ speaking completed with score:`, result.totalScore);
        }
      }
    }
    
    // Gọi API để lấy tiến độ từ server
    this.examService.getExerciseProgress(this.examId).subscribe({
      next: (progress) => {
        console.log('✅ Progress loaded from API:', progress);
      },
      error: (err) => {
        console.error('❌ Error loading progress from API:', err);
      }
    });
    
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