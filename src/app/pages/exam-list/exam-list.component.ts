import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamCardComponent } from '../../shared/exam-card/exam-card.component';
import { Exam, VstepLevel } from '../../models/exam/exam.model';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, ExamCardComponent],
  template: `
    <div class="exam-list-container">
      <div class="page-header"><h1>📚 Danh sách đề thi VSTEP</h1><p>Chọn đề thi phù hợp với trình độ của bạn</p></div>
      <div class="filters-section">
        <div class="filter-group">
          <label>Lọc theo bậc:</label>
          <div class="level-filters">
            <button class="level-filter" [class.active]="selectedLevel === null" (click)="filterByLevel(null)">Tất cả</button>
            <button *ngFor="let level of levels" class="level-filter level-' + '{{level}}' + '" [class.active]="selectedLevel === level" (click)="filterByLevel(level)">Bậc {{ level }}</button>
          </div>
        </div>
      </div>
      <div class="loading" *ngIf="isLoading"><div class="spinner"></div><p>Đang tải đề thi...</p></div>
      <div class="exam-grid" *ngIf="!isLoading"><app-exam-card *ngFor="let exam of filteredExams" [exam]="exam" (examClick)="onExamClick(exam)"></app-exam-card></div>
      <div class="empty-state" *ngIf="!isLoading && filteredExams.length === 0"><p>Không tìm thấy đề thi</p></div>
    </div>
  `,
  styles: [`
    .exam-list-container { max-width: 1200px; margin: 0 auto; padding: 2rem; margin-top: 80px; }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; color: #1a1a2e; }
    .filters-section { background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; }
    .filter-group label { font-weight: 600; margin-bottom: 0.5rem; display: block; }
    .level-filters { display: flex; gap: 1rem; flex-wrap: wrap; }
    .level-filter { padding: 0.5rem 1.5rem; border: none; border-radius: 20px; cursor: pointer; }
    .level-filter.active { color: white; }
    .level-filter.level-3.active { background: #2ecc71; }
    .level-filter.level-4.active { background: #3498db; }
    .level-filter.level-5.active { background: #9b59b6; }
    .exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .loading { text-align: center; padding: 3rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 3rem; }
  `]
})
export class ExamListComponent implements OnInit {
  private examService = inject(ExamService);
  private router = inject(Router);
  exams: Exam[] = [];
  filteredExams: Exam[] = [];
  isLoading = true;
  levels: VstepLevel[] = [3, 4, 5];
  selectedLevel: VstepLevel | null = null;

  ngOnInit() { this.loadExams(); }
  loadExams() {
    this.isLoading = true;
    setTimeout(() => {
      this.exams = this.examService.getMockExams();
      this.filteredExams = this.exams;
      this.isLoading = false;
    }, 500);
  }
  filterByLevel(level: VstepLevel | null) {
    this.selectedLevel = level;
    this.filteredExams = level ? this.exams.filter(e => e.vstepLevel === level) : this.exams;
  }
  onExamClick(exam: Exam) { this.router.navigate(['/exam', exam.id]); }
}
