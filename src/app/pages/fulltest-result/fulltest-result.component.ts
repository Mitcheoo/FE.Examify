import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

interface SkillResult {
  skillType: number;
  skillName: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  submittedAt: string;
  status: string;
}

interface FullTestResult {
  fullTestId: string;
  fullTestTitle: string;
  totalScore: number;
  vstepBand: string;
  totalTimeSpentSeconds: number;
  completedAt: string;
  skills: SkillResult[];
}

@Component({
  selector: 'app-fulltest-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fulltest-result.component.html',
  styleUrls: ['./fulltest-result.component.scss']
})
export class FulltestResultComponent implements OnInit {
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  result: FullTestResult | null = null;
  isLoading = true;
  errorMessage = '';
  fullTestId = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.fullTestId = params['id'];
      console.log('📊 Full Test Result ID:', this.fullTestId);
      this.loadFullTestResult();
    });
  }

  loadFullTestResult() {
    this.isLoading = true;
    this.examService.getFullTestResult(this.fullTestId).subscribe({
      next: (data: any) => {
        console.log('✅ Full Test Result (raw):', data);
        
        // ✅ Lấy skillResults từ API
        const skillResults = data.skillResults || [];
        
        // ✅ Format lại dữ liệu
        const formattedSkills: SkillResult[] = skillResults.map((skill: any) => ({
          skillType: skill.skill,
          skillName: skill.skillName,
          examId: skill.exerciseId,
          examTitle: skill.examTitle || skill.skillName,
          score: skill.score || 0,
          totalQuestions: skill.totalQuestions || 0,
          correctCount: skill.correctCount || 0,
          submittedAt: skill.submittedAt,
          status: skill.status || (skill.score !== undefined ? 'completed' : 'pending')
        }));
        
        this.result = {
          fullTestId: data.fullTestId,
          fullTestTitle: data.fullTestTitle,
          totalScore: data.totalScore,
          vstepBand: this.getVstepBand(data.totalScore),
          totalTimeSpentSeconds: data.totalTimeSpentSeconds,
          completedAt: data.completedAt,
          skills: formattedSkills
        };
        
        console.log('📊 Formatted result:', this.result);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error loading full test result:', err);
        this.errorMessage = 'Không thể tải kết quả bài thi. Vui lòng thử lại!';
        this.isLoading = false;
      }
    });
  }

  getVstepBand(score: number): string {
    if (score >= 8.5) return 'Bậc 5 (Thành thạo)';
    if (score >= 7.0) return 'Bậc 4 (Khá tốt)';
    if (score >= 5.5) return 'Bậc 3 (Trung bình khá)';
    if (score >= 4.0) return 'Bậc 2 (Trung bình)';
    return 'Bậc 1 (Sơ cấp)';
  }

  getSkillIcon(skillName: string): string {
    const icons: Record<string, string> = {
      'Reading': '📖',
      'Listening': '🎧',
      'Writing': '✍️',
      'Speaking': '🎙️'
    };
    return icons[skillName] || '📚';
  }

  getSkillColor(score: number): string {
    if (score >= 7) return '#27ae60';
    if (score >= 5) return '#f39c12';
    return '#e74c3c';
  }

  getScorePercent(score: number): number {
    return (score / 10) * 100;
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  }

  viewSkillDetail(skillType: number, examId: string) {
    const skillNames = ['reading', 'listening', 'writing', 'speaking'];
    const skillName = skillNames[skillType] || 'reading';
    this.router.navigate(['/result', skillName, examId]);
  }

  retakeFullTest() {
    this.router.navigate(['/fulltest', this.fullTestId]);
  }

  goBack() {
    this.router.navigate(['/exam', this.fullTestId]);
  }
}