import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService, SkillProgress } from '../../services/exam.service';

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

  exam: any = null;
  skills: SkillProgress[] = [];
  examId: string = '';
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.examId = params['id'];
      console.log('📌 Exam ID from URL:', this.examId);
      
      if (this.examId) {
        this.loadExamDetail();
        this.loadProgress();
      } else {
        this.errorMessage = 'Không tìm thấy ID đề thi';
        this.isLoading = false;
      }
    });
  }

  loadExamDetail() {
    console.log('🔄 Loading exam detail...');
    this.examService.getExerciseById(this.examId).subscribe({
      next: (data) => {
        console.log('✅ Exam detail loaded:', data);
        this.exam = data;
        
        this.skills = [
          { skillType: 'reading', skillName: '📖 Reading', duration: 60, status: 'available', score: undefined },
          { skillType: 'listening', skillName: '🎧 Listening', duration: 35, status: 'locked', score: undefined },
          { skillType: 'writing', skillName: '✍️ Writing', duration: 60, status: 'locked', score: undefined },
          { skillType: 'speaking', skillName: '🎙️ Speaking', duration: 17, status: 'locked', score: undefined }
        ];
        
        // 🔴 QUAN TRỌNG: TẮT LOADING
        this.isLoading = false;
        console.log('🔴 isLoading set to false');
      },
      error: (err) => {
        console.error('❌ Error loading exam detail:', err);
        this.errorMessage = 'Có lỗi xảy ra khi tải đề thi';
        this.isLoading = false;
      }
    });
  }

  loadProgress() {
    this.examService.getExerciseProgress(this.examId).subscribe({
      next: (progress) => {
        console.log('✅ Progress loaded:', progress);
        if (progress?.skills?.reading?.isCompleted) {
          const skill = this.skills.find(s => s.skillType === 'reading');
          if (skill) { skill.status = 'completed'; skill.score = progress.skills.reading.score; }
        }
        if (progress?.skills?.listening?.isCompleted) {
          const skill = this.skills.find(s => s.skillType === 'listening');
          if (skill) { skill.status = 'completed'; skill.score = progress.skills.listening.score; }
        }
        if (progress?.skills?.writing?.isCompleted) {
          const skill = this.skills.find(s => s.skillType === 'writing');
          if (skill) { skill.status = 'completed'; skill.score = progress.skills.writing.score; }
        }
        if (progress?.skills?.speaking?.isCompleted) {
          const skill = this.skills.find(s => s.skillType === 'speaking');
          if (skill) { skill.status = 'completed'; skill.score = progress.skills.speaking.score; }
        }
      },
      error: (err) => {
        console.error('❌ Error loading progress:', err);
      }
    });
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
    this.router.navigate(['/exam', this.examId, skillType]);
  }
}
