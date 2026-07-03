// 📁 src/app/pages/admin/pages/manage-exams/create-fulltest/components/reading-questions/reading-questions.component.ts

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReadingQuestion {
  id: string;
  partNumber: number;
  orderNumber: number;
  questionText: string;
  questionType: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
  passage?: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

@Component({
  selector: 'app-reading-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reading-questions.component.html',
  styleUrls: ['./reading-questions.component.scss']
})
export class ReadingQuestionsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() exerciseId: string = '';
  @Input() questions: ReadingQuestion[] = [];
  @Output() questionsChange = new EventEmitter<ReadingQuestion[]>();
  @Output() passagesChange = new EventEmitter<{ [key: number]: string }>();

  // ============================================================
  // STATE - 4 PASSAGES
  // ============================================================

  // ✅ 4 ĐOẠN VĂN RIÊNG BIỆT
  partPassages: { [key: number]: string } = {
    1: '',
    2: '',
    3: '',
    4: ''
  };

  // ============================================================
  // QUESTION FORM STATE
  // ============================================================

  showQuestionForm: boolean = false;
  editingIndex: number | null = null;
  partOptions: number[] = [1, 2, 3, 4];

  newQuestion: ReadingQuestion = {
    id: '',
    partNumber: 1,
    orderNumber: 1,
    questionText: '',
    questionType: 'multiple_choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    passage: ''
  };

  questionTypes: string[] = ['multiple_choice', 'true_false', 'matching'];

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    console.log('📖 ReadingQuestionsComponent initialized with exerciseId:', this.exerciseId);
  }

  // ============================================================
  // PASSAGE HANDLING
  // ============================================================

  onPassageChange(partNumber: number): void {
    this.passagesChange.emit(this.partPassages);
    console.log(`📄 Part ${partNumber} passage changed`);
  }

  getPassage(partNumber: number): string {
    return this.partPassages[partNumber] || '';
  }

  // ============================================================
  // QUESTION MANAGEMENT
  // ============================================================

  addQuestion(): void {
    this.showQuestionForm = true;
    this.editingIndex = null;
    this.resetNewQuestion();
  }

  editQuestion(index: number): void {
    this.showQuestionForm = true;
    this.editingIndex = index;
    this.newQuestion = { ...this.questions[index] };
  }

  saveQuestion(): void {
    if (!this.newQuestion.questionText.trim()) {
      alert('⚠️ Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (!this.newQuestion.optionA.trim() || !this.newQuestion.optionB.trim() ||
        !this.newQuestion.optionC.trim() || !this.newQuestion.optionD.trim()) {
      alert('⚠️ Vui lòng nhập đầy đủ 4 đáp án A, B, C, D!');
      return;
    }

    const options = {
      A: this.newQuestion.optionA.trim(),
      B: this.newQuestion.optionB.trim(),
      C: this.newQuestion.optionC.trim(),
      D: this.newQuestion.optionD.trim()
    };

    const partNumber = this.newQuestion.partNumber || 1;
    const questionToSave = {
      ...this.newQuestion,
      passage: this.partPassages[partNumber] || '',
      options: options
    };

    if (this.editingIndex !== null) {
      // Update
      this.questions[this.editingIndex] = questionToSave;
    } else {
      // Add new
      questionToSave.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      questionToSave.orderNumber = this.questions.length + 1;
      this.questions.push(questionToSave);
    }

    this.questionsChange.emit(this.questions);
    this.cancelQuestionForm();
    this.cdr.detectChanges();
  }

  deleteQuestion(index: number): void {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      this.questions.splice(index, 1);
      this.questions.forEach((q, i) => q.orderNumber = i + 1);
      this.questionsChange.emit(this.questions);
      this.cdr.detectChanges();
    }
  }

  cancelQuestionForm(): void {
    this.showQuestionForm = false;
    this.editingIndex = null;
    this.resetNewQuestion();
  }

  resetNewQuestion(): void {
    this.newQuestion = {
      id: '',
      partNumber: 1,
      orderNumber: this.questions.length + 1,
      questionText: '',
      questionType: 'multiple_choice',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      passage: ''
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getQuestionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'multiple_choice': 'Trắc nghiệm',
      'true_false': 'Đúng/Sai',
      'matching': 'Nối'
    };
    return labels[type] || type;
  }

  getTotalQuestions(): number {
    return this.questions.length;
  }
}