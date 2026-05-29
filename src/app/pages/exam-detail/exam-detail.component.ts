import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { Exam } from '../../models/exam/exam.model';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="exam-detail-container">
      <div class="back-link"><a routerLink="/exam-list">← Quay lại danh sách đề thi</a></div>
      <div *ngIf="isLoading" class="loading"><div class="spinner"></div><p>Đang tải chi tiết đề thi...</p></div>
      <div *ngIf="!isLoading && exam" class="exam-content">
        <div class="exam-header"><h1>{{ exam.title }}</h1><div class="exam-badge" [class]="'level-' + exam.vstepLevel">Bậc {{ exam.vstepLevel }}</div></div>
        <p class="exam-description">{{ exam.description }}</p>
        <div class="skills-overview"><h2>📋 Cấu trúc đề thi</h2><div class="skills-grid">
          <div class="skill-card listening"><div class="skill-icon">🎧</div><h3>Listening</h3><p>35 phút - 35 câu</p></div>
          <div class="skill-card reading"><div class="skill-icon">📖</div><h3>Reading</h3><p>60 phút - 40 câu</p></div>
          <div class="skill-card writing"><div class="skill-icon">✍️</div><h3>Writing</h3><p>60 phút - 2 tasks</p></div>
          <div class="skill-card speaking"><div class="skill-icon">🎙️</div><h3>Speaking</h3><p>12 phút - 3 parts</p></div>
        </div></div>
        <div class="price-section"><div class="price">💰 {{ exam.price | number }}đ</div><button class="btn-purchase" (click)="purchaseExam()">Mua đề thi ngay</button></div>
      </div>
    </div>
  `,
  styles: [`
    .exam-detail-container { max-width: 1000px; margin: 0 auto; padding: 2rem; margin-top: 80px; }
    .back-link a { color: #667eea; text-decoration: none; }
    .loading { text-align: center; padding: 3rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .exam-header h1 { font-size: 1.8rem; }
    .exam-badge { padding: 0.25rem 1rem; border-radius: 20px; color: white; }
    .exam-badge.level-3 { background: #2ecc71; }
    .exam-badge.level-4 { background: #3498db; }
    .exam-badge.level-5 { background: #9b59b6; }
    .exam-description { color: #666; margin-bottom: 2rem; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0 2rem; }
    .skill-card { padding: 1.5rem; text-align: center; border-radius: 12px; background: #f8f9fa; }
    .skill-card.listening { border-top: 4px solid #3498db; }
    .skill-card.reading { border-top: 4px solid #2ecc71; }
    .skill-card.writing { border-top: 4px solid #e74c3c; }
    .skill-card.speaking { border-top: 4px solid #f39c12; }
    .skill-icon { font-size: 2rem; }
    .price-section { background: linear-gradient(135deg, #667eea, #764ba2); padding: 2rem; border-radius: 12px; text-align: center; color: white; }
    .price { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
    .btn-purchase { padding: 0.75rem 2rem; background: white; color: #667eea; border: none; border-radius: 8px; cursor: pointer; }
  `]
})
export class ExamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private examService = inject(ExamService);
  private router = inject(Router);
  examId!: string;
  exam: Exam | null = null;
  isLoading = true;

  ngOnInit() {
    this.examId = this.route.snapshot.params['id'];
    setTimeout(() => {
      const exams = this.examService.getMockExams();
      this.exam = exams.find(e => e.id === this.examId) || null;
      this.isLoading = false;
    }, 300);
  }
  purchaseExam() { this.router.navigate(['/checkout', this.examId]); }
}
