// 📁 src/app/pages/fulltest-result/fulltest-result.component.ts

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

// ============================================================
// EXISTING INTERFACES
// ============================================================

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
  parts?: PartResult[];
  isAutoGraded?: boolean;
  submissionId?: string;
}

interface PartResult {
  partNumber: number;
  totalQuestions: number;
  correctCount: number;
  score: number;
  questions: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  orderNumber: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  partNumber?: number;
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
  averageScore: number;
  ranking: string;
}

// ============================================================
// AI FEEDBACK INTERFACES - ĐÚNG VỚI DỮ LIỆU TỪ BE
// ============================================================

interface WritingDetailedFeedback {
  issue: string;
  sentence: string;
  suggestion: string;
}

interface WritingAiResult {
  TaskResponseScore: number;
  CoherenceCohesionScore: number;
  LexicalResourceScore: number;
  GrammarRangeScore: number;
  TotalScore: number;
  Strengths: string;
  Weaknesses: string;
  Suggestions: string;
  DetailedFeedback: WritingDetailedFeedback[];
}

interface SpeakingErrorAnalysis {
  transcript: string;
  issue: string;
  correction: string;
}

interface SpeakingAiResult {
  ContentScore: number;
  OrganizationScore: number;
  GrammarScore: number;
  VocabularyScore: number;
  TotalScore: number;
  Strengths: string;
  Weaknesses: string;
  Suggestions: string;
  ErrorAnalysis: SpeakingErrorAnalysis[];
}

// ============================================================
// COMPONENT
// ============================================================

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

  // ============================================================
  // DATA PROPERTIES
  // ============================================================

  result: FullTestResult | null = null;
  isLoading = true;
  errorMessage = '';
  fullTestId = '';
  userId = '';

  // ============================================================
  // AI FEEDBACK PROPERTIES
  // ============================================================

  writingFeedback: WritingAiResult | null = null;
  speakingFeedback: SpeakingAiResult | null = null;

  // ============================================================
  // MODAL PROPERTIES
  // ============================================================

  showAnswerDetail = false;
  showAiFeedbackModal = false;
  selectedSkill: SkillResult | null = null;
  showShareModal = false;
  showPdfModal = false;
  showAchievementModal = false;
  selectedRating = 0;

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.id || 'anonymous';
    
    this.route.params.subscribe(params => {
      this.fullTestId = params['id'];
      console.log('📊 Full Test Result ID:', this.fullTestId);
      this.loadFullTestResult();
    });
  }

  // ============================================================
  // LOAD DATA
  // ============================================================

  loadFullTestResult() {
    this.isLoading = true;
    console.log('🔄 Loading full test result...');
    
    this.examService.getFullTestResult(this.fullTestId).subscribe({
      next: (data: any) => {
        console.log('✅ Full Test Result (raw):', data);
        this.processResult(data);
      },
      error: (err) => {
        console.error('❌ Error loading full test result:', err);
        this.loadFromLocalStorage();
      }
    });
  }

  processResult(data: any) {
    const skillResults = data.skillResults || [];
    
    const formattedSkills: SkillResult[] = skillResults.map((skill: any) => {
      const skillName = skill.skillName || '';
      const isAutoGraded = ['Reading', 'Listening'].includes(skillName);
      
      return {
        skillType: skill.skill,
        skillName: skillName,
        examId: skill.exerciseId,
        examTitle: skill.examTitle || skillName,
        score: skill.score || 0,
        totalQuestions: skill.totalQuestions || 0,
        correctCount: skill.correctCount || 0,
        submittedAt: skill.submittedAt,
        status: skill.status || (skill.score !== undefined ? 'completed' : 'pending'),
        timeSpentSeconds: skill.timeSpentSeconds || 0,
        aiFeedback: skill.aiFeedback,
        parts: skill.parts || this.generateMockParts(skill),
        isAutoGraded: isAutoGraded,
        submissionId: skill.submissionId
      };
    });
    
    const completedSkills = formattedSkills.filter(s => s.status === 'completed');
    const totalScore = completedSkills.length > 0 
      ? Math.round(completedSkills.reduce((sum, s) => sum + s.score, 0) * 10) / 10
      : 0;
    
    const autoGradedSkills = formattedSkills.filter(s => s.isAutoGraded && s.status === 'completed');
    const totalCorrect = autoGradedSkills.reduce((sum, s) => sum + s.correctCount, 0);
    const totalQuestions = autoGradedSkills.reduce((sum, s) => sum + s.totalQuestions, 0);
    
    const averageScore = completedSkills.length > 0 
      ? Math.round((completedSkills.reduce((sum, s) => sum + s.score, 0) / completedSkills.length) * 10) / 10
      : 0;
    const ranking = this.getVstepBand(averageScore);
    
    this.result = {
      fullTestId: data.fullTestId,
      fullTestTitle: data.fullTestTitle || 'VSTEP Full Test',
      totalScore: totalScore,
      vstepBand: this.getVstepBand(averageScore),
      vstepLevel: this.getVstepLevel(averageScore),
      totalTimeSpentSeconds: data.totalTimeSpentSeconds || 0,
      completedAt: data.completedAt || new Date().toISOString(),
      startedAt: data.startedAt || new Date().toISOString(),
      skills: formattedSkills,
      sessionId: data.sessionId || '',
      averageScore: averageScore,
      ranking: ranking
    };
    
    console.log('📊 Total Score (sum of 4 skills):', totalScore);
    console.log('📊 Average Score:', averageScore);
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  loadFromLocalStorage() {
    const storageKey = `fulltest_result_${this.fullTestId}_${this.userId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        console.log('📊 Loaded from localStorage:', data);
        this.processResult(data);
        return;
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
    }
    
    this.errorMessage = 'Không thể tải kết quả bài thi. Vui lòng thử lại!';
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  // ============================================================
  // AI FEEDBACK METHODS
  // ============================================================

  /**
   * Lấy và parse AI Feedback cho Writing
   */
  getWritingFeedback(skill: SkillResult): WritingAiResult | null {
    if (!skill.aiFeedback) {
      return null;
    }
    
    try {
      const parsed = typeof skill.aiFeedback === 'string' 
        ? JSON.parse(skill.aiFeedback) 
        : skill.aiFeedback;
      
      const results = parsed.Results || parsed.results;
      if (results && results.length > 0) {
        const result = results[0];
        if (!result.DetailedFeedback) {
          result.DetailedFeedback = [];
        }
        return result;
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing writing feedback:', error);
      return null;
    }
  }

  /**
   * Lấy và parse AI Feedback cho Speaking
   */
  getSpeakingFeedback(skill: SkillResult): SpeakingAiResult | null {
    if (!skill.aiFeedback) {
      return null;
    }
    
    try {
      const parsed = typeof skill.aiFeedback === 'string' 
        ? JSON.parse(skill.aiFeedback) 
        : skill.aiFeedback;
      
      const results = parsed.Results || parsed.results;
      if (results && results.length > 0) {
        const allErrors: SpeakingErrorAnalysis[] = [];
        results.forEach((result: any) => {
          if (result.ErrorAnalysis && result.ErrorAnalysis.length > 0) {
            allErrors.push(...result.ErrorAnalysis);
          }
        });
        
        const firstResult = results[0];
        firstResult.ErrorAnalysis = allErrors;
        return firstResult;
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing speaking feedback:', error);
      return null;
    }
  }

  /**
   * Mở modal AI Feedback
   */
  openAiFeedbackModal(skill: SkillResult) {
    this.selectedSkill = skill;
    
    if (skill.skillName === 'Writing') {
      this.writingFeedback = this.getWritingFeedback(skill);
    } else if (skill.skillName === 'Speaking') {
      this.speakingFeedback = this.getSpeakingFeedback(skill);
    }
    
    this.showAiFeedbackModal = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Đóng modal AI Feedback
   */
  closeAiFeedbackModal() {
    this.showAiFeedbackModal = false;
    this.selectedSkill = null;
    this.writingFeedback = null;
    this.speakingFeedback = null;
    document.body.style.overflow = '';
  }

  // ============================================================
  // TRACK BY - GIÚP ANGULAR CẬP NHẬT UI
  // ============================================================

  trackBySkillId(index: number, skill: SkillResult): string {
    return skill.skillName + skill.submissionId + skill.score;
  }

  // ============================================================
  // CALCULATIONS
  // ============================================================

  getVstepBand(score: number): string {
    if (score >= 8.0) return '🥇 Bậc 3 (C1) - Cao cấp';
    if (score >= 6.0) return '🥈 Bậc 2 (B2) - Trung cấp';
    if (score >= 4.0) return '🥉 Bậc 1 (B1) - Sơ cấp';
    return '⭐ Chưa xếp hạng - Cần cải thiện';
  }

  getVstepLevel(score: number): number {
    if (score >= 8.0) return 3;
    if (score >= 6.0) return 2;
    if (score >= 4.0) return 1;
    return 0;
  }

  getShortVstepBand(score: number): string {
    if (score >= 8.0) return 'C1';
    if (score >= 6.0) return 'B2';
    if (score >= 4.0) return 'B1';
    return 'Chưa xếp hạng';
  }

  getVstepColor(score: number): string {
    if (score >= 8.0) return 'border-emerald-500';
    if (score >= 6.0) return 'border-amber-500';
    if (score >= 4.0) return 'border-orange-500';
    return 'border-gray-400';
  }

  getVstepBgColor(score: number): string {
    if (score >= 8.0) return 'bg-emerald-500';
    if (score >= 6.0) return 'bg-amber-500';
    if (score >= 4.0) return 'bg-orange-500';
    return 'bg-gray-400';
  }

  getVstepProgress(score: number): number {
    return Math.min((score / 10) * 100, 100);
  }

  getNextTarget(score: number): string {
    if (score >= 8.0) return '🎉 Bạn đã đạt C1! Hãy duy trì và phát huy!';
    if (score >= 6.0) return '🎯 Mục tiêu tiếp theo: C1 (≥ 8.0) - Cần thêm ' + (8.0 - score).toFixed(1) + ' điểm';
    if (score >= 4.0) return '🎯 Mục tiêu tiếp theo: B2 (≥ 6.0) - Cần thêm ' + (6.0 - score).toFixed(1) + ' điểm';
    return '🎯 Mục tiêu tiếp theo: B1 (≥ 4.0) - Cần thêm ' + (4.0 - score).toFixed(1) + ' điểm';
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

  getSkillColorClass(score: number): string {
    if (score >= 8) return 'border-l-emerald-500';
    if (score >= 6) return 'border-l-amber-500';
    if (score >= 4) return 'border-l-orange-500';
    return 'border-l-red-500';
  }

  getScorePercent(score: number): number {
    return Math.min((score / 10) * 100, 100);
  }

  getScoreText(score: number): string {
    if (score >= 8) return 'Xuất sắc 🌟';
    if (score >= 7) return 'Tốt 👍';
    if (score >= 5) return 'Khá 💪';
    if (score >= 3) return 'Trung bình 📚';
    return 'Cần cải thiện 🚀';
  }

  getVstepBandEmoji(score: number): string {
    if (score >= 8.0) return '🥇';
    if (score >= 6.0) return '🥈';
    if (score >= 4.0) return '🥉';
    return '⭐';
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return '0s';
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

  // ============================================================
  // AGGREGATION
  // ============================================================

  getTotalQuestions(): number {
    if (!this.result) return 0;
    return this.result.skills
      .filter(s => s.isAutoGraded && s.status === 'completed')
      .reduce((sum, s) => sum + s.totalQuestions, 0);
  }

  getTotalCorrect(): number {
    if (!this.result) return 0;
    return this.result.skills
      .filter(s => s.isAutoGraded && s.status === 'completed')
      .reduce((sum, s) => sum + s.correctCount, 0);
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

  isFullComplete(): boolean {
    if (!this.result) return false;
    return this.result.skills.every(s => s.status === 'completed');
  }

  // ============================================================
  // HELPER FUNCTIONS FOR TEMPLATE
  // ============================================================

  hasSkill(index: number): boolean {
    if (!this.result || !this.result.skills) {
      return false;
    }
    return this.result.skills.length > index && this.result.skills[index] !== null;
  }

  getSkillScore(index: number): number {
    if (!this.result || !this.result.skills || this.result.skills.length <= index) {
      return 0;
    }
    const skill = this.result.skills[index];
    return skill ? skill.score || 0 : 0;
  }

  getSkillName(index: number): string {
    if (!this.result || !this.result.skills || this.result.skills.length <= index) {
      return '';
    }
    const skill = this.result.skills[index];
    return skill ? skill.skillName || '' : '';
  }

  getSkillIconByIndex(index: number): string {
    const name = this.getSkillName(index);
    const icons: Record<string, string> = {
      'Reading': '📖',
      'Listening': '🎧',
      'Writing': '✍️',
      'Speaking': '🎙️'
    };
    return icons[name] || '📚';
  }

  // ============================================================
  // MODAL ACTIONS
  // ============================================================

  openAnswerDetail(skill: SkillResult) {
    this.selectedSkill = skill;
    this.showAnswerDetail = true;
    document.body.style.overflow = 'hidden';
  }

  closeAnswerDetail() {
    this.showAnswerDetail = false;
    this.selectedSkill = null;
    document.body.style.overflow = '';
  }

  openShareModal() {
    this.showShareModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeShareModal() {
    this.showShareModal = false;
    document.body.style.overflow = '';
  }

  openPdfModal() {
    this.showPdfModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePdfModal() {
    this.showPdfModal = false;
    document.body.style.overflow = '';
  }

  openAchievementModal() {
    this.showAchievementModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAchievementModal() {
    this.showAchievementModal = false;
    document.body.style.overflow = '';
  }

  selectRating(rating: number) {
    this.selectedRating = rating;
    console.log('⭐ Rating selected:', rating);
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  viewSkillDetail(skillType: number, examId: string) {
    if (!examId) return;
    const skillNames = ['reading', 'listening', 'writing', 'speaking'];
    const skillName = skillNames[skillType] || 'reading';
    this.router.navigate(['/result', skillName, examId]);
  }

  viewSkillSubmission(skillType: number, examId: string) {
    if (!examId) return;
    const skill = this.result?.skills.find(s => s.skillType === skillType);
    if (skill?.submissionId) {
      this.router.navigate(['/submission', skill.submissionId]);
    } else {
      const skillNames = ['reading', 'listening', 'writing', 'speaking'];
      const skillName = skillNames[skillType] || 'reading';
      this.router.navigate(['/exam', skillName, examId], {
        queryParams: {
          viewMode: 'submission',
          sessionId: this.result?.sessionId,
          fullTestId: this.fullTestId
        }
      });
    }
  }

  retakeSkill(skillType: number, examId: string) {
    if (!examId) return;
    const skillNames = ['reading', 'listening', 'writing', 'speaking'];
    const skillName = skillNames[skillType] || 'reading';
    this.router.navigate(['/exam', skillName, examId], {
      queryParams: {
        sessionId: this.result?.sessionId,
        fullTestId: this.fullTestId
      }
    });
  }

  continueFullTest() {
    if (!this.result) return;
    const pendingSkill = this.result.skills.find(s => s.status !== 'completed');
    if (pendingSkill) {
      const skillNames = ['reading', 'listening', 'writing', 'speaking'];
      const skillName = skillNames[pendingSkill.skillType] || 'reading';
      this.router.navigate(['/exam', skillName, pendingSkill.examId], {
        queryParams: {
          sessionId: this.result?.sessionId,
          fullTestId: this.fullTestId
        }
      });
    } else {
      this.retakeFullTest();
    }
  }

  retakeFullTest() {
    this.router.navigate(['/exam', this.fullTestId]);
  }

  goBack() {
    this.router.navigate(['/exam', this.fullTestId]);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  // ============================================================
  // SHARE FUNCTIONS
  // ============================================================

  shareOnFacebook() {
    const url = window.location.href;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  shareOnTwitter() {
    const text = `🎯 Tôi vừa hoàn thành VSTEP Full Test với điểm ${this.result?.totalScore}/10!`;
    const url = window.location.href;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  shareOnLinkedIn() {
    const url = window.location.href;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('✅ Đã sao chép link!');
    }).catch(() => {
      alert('❌ Không thể sao chép link. Vui lòng thử lại.');
    });
  }

  shareEmail() {
    const subject = '📊 Kết quả VSTEP Full Test của tôi';
    const body = `Tôi vừa hoàn thành VSTEP Full Test với kết quả:\n\n` +
                 `📊 Tổng điểm: ${this.result?.totalScore}/10\n` +
                 `🏅 Xếp hạng: ${this.result?.vstepBand}\n` +
                 (this.result?.skills[0] ? `📖 Reading: ${this.result.skills[0]?.score}/10\n` : '') +
                 (this.result?.skills[1] ? `🎧 Listening: ${this.result.skills[1]?.score}/10\n` : '') +
                 (this.result?.skills[2] ? `✍️ Writing: ${this.result.skills[2]?.score}/10\n` : '') +
                 (this.result?.skills[3] ? `🎙️ Speaking: ${this.result.skills[3]?.score}/10\n` : '') +
                 `\nXem chi tiết tại: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  downloadPDF() {
    alert('📄 Đang tạo file PDF... (Tính năng đang phát triển)');
    this.closePdfModal();
  }

  printResult() {
    window.print();
  }

  generateMockParts(skill: any): PartResult[] {
    const partCounts = {
      1: { total: 5, correct: 3 },
      2: { total: 5, correct: 4 },
      3: { total: 5, correct: 1 },
      4: { total: 5, correct: 0 }
    };
    
    return Object.entries(partCounts).map(([part, data]) => ({
      partNumber: parseInt(part),
      totalQuestions: data.total,
      correctCount: data.correct,
      score: Math.round((data.correct / data.total) * 10 * 10) / 10,
      questions: Array.from({ length: data.total }, (_, i) => ({
        questionId: `q_${part}_${i}`,
        orderNumber: i + 1,
        questionText: `Câu hỏi ${i + 1} - Part ${part}`,
        userAnswer: i < data.correct ? 'Đáp án A' : 'Đáp án B',
        correctAnswer: 'Đáp án A',
        isCorrect: i < data.correct,
        explanation: 'Giải thích cho câu hỏi này...',
        partNumber: parseInt(part)
      }))
    }));
  }

  getLearningPath(): string[] {
    if (!this.result) return [];
    const recommendations: string[] = [];
    
    this.result.skills.forEach(skill => {
      if (skill.status === 'completed' && skill.score < 6.0) {
        const messages: Record<string, string> = {
          'Reading': '📖 Luyện 3 bài Reading/tuần - Tập trung Part 3, 4',
          'Listening': '🎧 Nghe podcast 15 phút/ngày - Tập trung Part 2',
          'Writing': '✍️ Viết 2 bài Writing/tuần - Cải thiện cấu trúc',
          'Speaking': '🎙️ Luyện 3 chủ đề Speaking/tuần - Phát triển ý'
        };
        recommendations.push(messages[skill.skillName] || `📚 Cải thiện ${skill.skillName}`);
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('🌟 Duy trì phong độ và luyện tập thường xuyên!');
    }
    
    return recommendations;
  }
}