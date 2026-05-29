import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Exam } from '../../models/exam/exam.model';

@Component({
  selector: 'app-exam-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="exam-card" (click)="onCardClick()">
      <div class="exam-level" [class]="'level-' + exam.vstepLevel">
        Bậc {{ exam.vstepLevel }}
      </div>
      <div class="exam-info">
        <h3 class="exam-title">{{ exam.title }}</h3>
        <p class="exam-description">{{ exam.description }}</p>
        <div class="exam-meta">
          ⏱️ {{ exam.duration }} phút | 🎧📖✍️🎙️ 4 kỹ năng
        </div>
        <div class="exam-footer">
          <div class="exam-price">💰 {{ exam.price | number }}đ</div>
          <button class="btn-primary">{{ getButtonText() }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.3s;
      margin-bottom: 1rem;
    }
    .exam-card:hover {
      transform: translateY(-4px);
    }
    .exam-level {
      display: inline-block;
      padding: 4px 12px;
      margin: 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }
    .level-3 { background: #2ecc71; }
    .level-4 { background: #3498db; }
    .level-5 { background: #9b59b6; }
    .exam-info {
      padding: 16px;
    }
    .exam-title {
      font-size: 1.1rem;
      margin-bottom: 8px;
      color: #1a1a2e;
    }
    .exam-description {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 12px;
    }
    .exam-meta {
      font-size: 0.75rem;
      color: #888;
      margin-bottom: 16px;
    }
    .exam-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .exam-price {
      font-size: 1.2rem;
      font-weight: bold;
      color: #e67e22;
    }
    .btn-primary {
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
    }
  `]
})
export class ExamCardComponent {
  @Input() exam!: Exam;
  @Output() examClick = new EventEmitter<Exam>();

  onCardClick(): void {
    this.examClick.emit(this.exam);
  }

  getButtonText(): string {
    return this.exam.status === 'not_purchased' ? '💰 Mua ngay' : '▶️ Làm bài';
  }
}
