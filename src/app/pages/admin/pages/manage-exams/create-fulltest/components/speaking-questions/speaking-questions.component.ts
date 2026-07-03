// 📁 src/app/pages/admin/pages/manage-exams/create-fulltest/components/speaking-questions/speaking-questions.component.ts

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SpeakingQuestion {
  id: string;
  partNumber: number;
  orderNumber: number;
  questionText: string;
  preparationTime: number;
  speakingTime: number;
  sampleAnswer?: string;
  audioUrl?: string;
}

@Component({
  selector: 'app-speaking-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './speaking-questions.component.html',
  styleUrls: ['./speaking-questions.component.scss']
})
export class SpeakingQuestionsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() exerciseId: string = '';
  @Input() questions: SpeakingQuestion[] = [];
  @Output() questionsChange = new EventEmitter<SpeakingQuestion[]>();

  // ============================================================
  // STATE
  // ============================================================

  showQuestionForm: boolean = false;
  editingIndex: number | null = null;

  newQuestion: SpeakingQuestion = {
    id: '',
    partNumber: 1,
    orderNumber: 1,
    questionText: '',
    preparationTime: 30,
    speakingTime: 60,
    sampleAnswer: '',
    audioUrl: ''
  };

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    console.log('🎙️ SpeakingQuestionsComponent initialized with exerciseId:', this.exerciseId);
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
    // Validate
    if (!this.newQuestion.questionText.trim()) {
      alert('⚠️ Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (this.newQuestion.preparationTime < 0) {
      alert('⚠️ Thời gian chuẩn bị không hợp lệ!');
      return;
    }

    if (this.newQuestion.speakingTime < 0) {
      alert('⚠️ Thời gian nói không hợp lệ!');
      return;
    }

    if (this.editingIndex !== null) {
      // Update
      this.questions[this.editingIndex] = { ...this.newQuestion };
    } else {
      // Add new
      this.newQuestion.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      this.newQuestion.orderNumber = this.questions.length + 1;
      this.questions.push({ ...this.newQuestion });
    }

    this.questionsChange.emit(this.questions);
    this.cancelQuestionForm();
    this.cdr.detectChanges();
  }

  deleteQuestion(index: number): void {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      this.questions.splice(index, 1);
      // Cập nhật order number
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
      preparationTime: 30,
      speakingTime: 60,
      sampleAnswer: '',
      audioUrl: ''
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return seconds + ' giây';
    }
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    if (remainSeconds === 0) {
      return minutes + ' phút';
    }
    return minutes + ' phút ' + remainSeconds + ' giây';
  }
}