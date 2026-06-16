import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  timeSpentSeconds: number;
  aiFeedback?: string;
}

interface FullTestResult {
  fullTestId: string;
  fullTestTitle: string;
  totalScore: number;
  vstepBand: string;
  vstepLevel: number;
  totalTimeSpentSeconds: number;
  completedAt: string;
  startedAt: string;
  skills: SkillResult[];
  sessionId: string;
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
  private cdr = inject(ChangeDetectorRef);

  result: FullTestResult | null = null;
  isLoading = true;
  errorMessage = '';
  fullTestId = '';
  userId = '';

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.params.subscribe(params => {
      this.fullTestId = params['id'];
      console.log('📊 Full Test Result ID:', this.fullTestId);
      this.loadFullTestResult();
    });
  }

  loadFullTestResult() {
    this.isLoading = true;
    console.log('🔄 Loading full test result...');
    
    this.examService.getFullTestResult(this.fullTestId).subscribe({
      next: (data: any) => {
        console.log('✅ Full Test Result (raw):', data);
        
        const skillResults = data.skillResults || [];
        
        const formattedSkills: SkillResult[] = skillResults.map((skill: any) => ({
          skillType: skill.skill,
          skillName: skill.skillName,
          examId: skill.exerciseId,
          examTitle: skill.examTitle || skill.skillName,
          score: skill.score || 0,
          totalQuestions: skill.totalQuestions || 0,
          correctCount: skill.correctCount || 0,
          submittedAt: skill.submittedAt,
          status: skill.status || (skill.score !== undefined ? 'completed' : 'pending'),
          timeSpentSeconds: skill.timeSpentSeconds || 0,
          aiFeedback: skill.aiFeedback
        }));
        
        const totalScore = data.totalScore || 0;
        
        this.result = {
          fullTestId: data.fullTestId,
          fullTestTitle: data.fullTestTitle || 'VSTEP Full Test',
          totalScore: totalScore,
          vstepBand: this.getVstepBand(totalScore),
          vstepLevel: this.getVstepLevel(totalScore),
          totalTimeSpentSeconds: data.totalTimeSpentSeconds || 0,
          completedAt: data.completedAt,
          startedAt: data.startedAt,
          skills: formattedSkills,
          sessionId: data.sessionId
        };
        
        console.log('📊 Formatted result:', this.result);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading full test result:', err);
        this.loadFromLocalStorage();
      }
    });
  }

  loadFromLocalStorage() {
    const storageKey = `fulltest_result_${this.fullTestId}_${this.userId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        console.log('📊 Loaded from localStorage:', data);
        
        const skillResults = data.skillResults || [];
        const formattedSkills: SkillResult[] = skillResults.map((skill: any) => ({
          skillType: skill.skill,
          skillName: skill.skillName,
          examId: skill.exerciseId,
          examTitle: skill.examTitle || skill.skillName,
          score: skill.score || 0,
          totalQuestions: skill.totalQuestions || 0,
          correctCount: skill.correctCount || 0,
          submittedAt: skill.submittedAt,
          status: 'completed',
          timeSpentSeconds: skill.timeSpentSeconds || 0
        }));
        
        this.result = {
          fullTestId: data.fullTestId || this.fullTestId,
          fullTestTitle: data.fullTestTitle || 'VSTEP Full Test',
          totalScore: data.totalScore || 0,
          vstepBand: this.getVstepBand(data.totalScore || 0),
          vstepLevel: this.getVstepLevel(data.totalScore || 0),
          totalTimeSpentSeconds: data.totalTimeSpentSeconds || 0,
          completedAt: data.completedAt || new Date().toISOString(),
          startedAt: data.startedAt || new Date().toISOString(),
          skills: formattedSkills,
          sessionId: data.sessionId || ''
        };
        
        console.log('📊 Formatted from localStorage:', this.result);
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
    
    this.errorMessage = 'Không thể tải kết quả bài thi. Vui lòng thử lại!';
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  // ========== CÁC HÀM GET ==========

  getVstepBand(score: number): string {
    if (score >= 8.5) return 'Bậc 5 (Thành thạo)';
    if (score >= 7.0) return 'Bậc 4 (Khá tốt)';
    if (score >= 5.5) return 'Bậc 3 (Trung bình khá)';
    if (score >= 4.0) return 'Bậc 2 (Trung bình)';
    return 'Bậc 1 (Sơ cấp)';
  }

  getVstepLevel(score: number): number {
    if (score >= 8.5) return 5;
    if (score >= 7.0) return 4;
    if (score >= 5.5) return 3;
    if (score >= 4.0) return 2;
    return 1;
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
    if (score >= 3) return '#e67e22';
    return '#e74c3c';
  }

  getSkillColorClass(score: number): string {
    if (score >= 7) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 3) return 'average';
    return 'poor';
  }

  getScorePercent(score: number): number {
    return Math.min((score / 10) * 100, 100);
  }

  getScoreText(score: number): string {
    if (score >= 8) return 'Xuất sắc';
    if (score >= 7) return 'Tốt';
    if (score >= 5) return 'Khá';
    if (score >= 3) return 'Trung bình';
    return 'Cần cải thiện';
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return '0 phút';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}g ${minutes}p`;
    }
    if (minutes > 0) {
      return `${minutes}p ${secs}s`;
    }
    return `${secs}s`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Hôm nay, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (days === 1) {
      return `Hôm qua, ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (days < 7) {
      return `${days} ngày trước`;
    }
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  // ========== CÁC HÀM TÍNH TOÁN ==========

  getTotalQuestions(): number {
    if (!this.result) return 0;
    return this.result.skills.reduce((sum, skill) => sum + skill.totalQuestions, 0);
  }

  getTotalCorrect(): number {
    if (!this.result) return 0;
    return this.result.skills.reduce((sum, skill) => sum + skill.correctCount, 0);
  }

  getCompletedSkills(): number {
    if (!this.result) return 0;
    return this.result.skills.filter(s => s.status === 'completed').length;
  }

  getCompletionDate(): string {
    if (!this.result) return '';
    const date = new Date(this.result.completedAt);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAverageScore(): number {
    if (!this.result) return 0;
    const completed = this.result.skills.filter(s => s.status === 'completed');
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, s) => acc + s.score, 0);
    return Math.round((sum / completed.length) * 10) / 10;
  }

  hasDetailedResults(): boolean {
    if (!this.result) return false;
    return this.result.skills.some(s => s.status === 'completed');
  }

  // ========== ĐIỀU HƯỚNG ==========

  viewSkillDetail(skillType: number, examId: string) {
    const skillNames = ['reading', 'listening', 'writing', 'speaking'];
    const skillName = skillNames[skillType] || 'reading';
    this.router.navigate(['/result', skillName, examId]);
  }

  retakeFullTest() {
    this.router.navigate(['/exam', this.fullTestId]);
  }

  goBack() {
    this.router.navigate(['/exam', this.fullTestId]);
  }
}