// 📁 src/app/pages/admin/pages/manage-exams/create-fulltest/components/writing-questions/writing-questions.component.ts

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WritingQuestion {
  id: string;
  orderNumber: number;
  taskType: number; // 1 = Letter/Email, 2 = Essay
  promptText: string;
  minWords: number;
  maxWords: number;
  recommendedTimeMinutes: number;
  sampleImageUrl?: string;
  modelAnswer?: string;
  rubricJson?: string;
}

@Component({
  selector: 'app-writing-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './writing-questions.component.html',
  styleUrls: ['./writing-questions.component.scss']
})
export class WritingQuestionsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() exerciseId: string = '';
  @Input() questions: WritingQuestion[] = [];
  @Output() questionsChange = new EventEmitter<WritingQuestion[]>();

  // ============================================================
  // STATE - CỐ ĐỊNH 2 CÂU HỎI
  // ============================================================

  // Task 1: Letter/Email
  task1: WritingQuestion = {
    id: '',
    orderNumber: 1,
    taskType: 1,
    promptText: '',
    minWords: 150,
    maxWords: 200,
    recommendedTimeMinutes: 20,
    sampleImageUrl: '',
    modelAnswer: '',
    rubricJson: ''
  };

  // Task 2: Essay
  task2: WritingQuestion = {
    id: '',
    orderNumber: 2,
    taskType: 2,
    promptText: '',
    minWords: 250,
    maxWords: 300,
    recommendedTimeMinutes: 40,
    sampleImageUrl: '',
    modelAnswer: '',
    rubricJson: ''
  };

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    console.log('✍️ WritingQuestionsComponent initialized with exerciseId:', this.exerciseId);
    this.loadExistingQuestions();
  }

  // ============================================================
  // LOAD EXISTING QUESTIONS
  // ============================================================

  loadExistingQuestions(): void {
    if (this.questions.length > 0) {
      const task1Data = this.questions.find(q => q.taskType === 1);
      const task2Data = this.questions.find(q => q.taskType === 2);

      if (task1Data) {
        this.task1 = { ...task1Data };
      }
      if (task2Data) {
        this.task2 = { ...task2Data };
      }
    }
  }

  // ============================================================
  // SAVE TASK
  // ============================================================

  saveTask1(): void {
    if (!this.task1.promptText.trim()) {
      alert('⚠️ Vui lòng nhập đề bài cho Task 1 (Letter/Email)!');
      return;
    }

    if (this.task1.minWords <= 0 || this.task1.maxWords <= 0) {
      alert('⚠️ Vui lòng nhập số từ hợp lệ!');
      return;
    }

    if (this.task1.minWords >= this.task1.maxWords) {
      alert('⚠️ Số từ tối thiểu phải nhỏ hơn số từ tối đa!');
      return;
    }

    const existingIndex = this.questions.findIndex(q => q.taskType === 1);
    const taskData = { ...this.task1 };

    if (existingIndex !== -1) {
      this.questions[existingIndex] = taskData;
    } else {
      this.task1.id = 'writing_task1_' + Date.now();
      this.questions.push(taskData);
    }

    this.questionsChange.emit(this.questions);
    this.cdr.detectChanges();
    alert('✅ Đã lưu Task 1 thành công!');
  }

  saveTask2(): void {
    if (!this.task2.promptText.trim()) {
      alert('⚠️ Vui lòng nhập đề bài cho Task 2 (Essay)!');
      return;
    }

    if (this.task2.minWords <= 0 || this.task2.maxWords <= 0) {
      alert('⚠️ Vui lòng nhập số từ hợp lệ!');
      return;
    }

    if (this.task2.minWords >= this.task2.maxWords) {
      alert('⚠️ Số từ tối thiểu phải nhỏ hơn số từ tối đa!');
      return;
    }

    const existingIndex = this.questions.findIndex(q => q.taskType === 2);
    const taskData = { ...this.task2 };

    if (existingIndex !== -1) {
      this.questions[existingIndex] = taskData;
    } else {
      this.task2.id = 'writing_task2_' + Date.now();
      this.questions.push(taskData);
    }

    this.questionsChange.emit(this.questions);
    this.cdr.detectChanges();
    alert('✅ Đã lưu Task 2 thành công!');
  }

  // ============================================================
  // SAVE ALL
  // ============================================================

  saveAll(): void {
    if (!this.task1.promptText.trim()) {
      alert('⚠️ Vui lòng nhập đề bài cho Task 1 (Letter/Email)!');
      return;
    }

    if (!this.task2.promptText.trim()) {
      alert('⚠️ Vui lòng nhập đề bài cho Task 2 (Essay)!');
      return;
    }

    this.saveTask1();
    this.saveTask2();
    alert('✅ Đã lưu tất cả câu hỏi Writing!');
  }

  // ============================================================
  // CHECK VALID
  // ============================================================

  isTask1Valid(): boolean {
    return this.task1.promptText.trim().length > 0 &&
           this.task1.minWords > 0 &&
           this.task1.maxWords > 0 &&
           this.task1.minWords < this.task1.maxWords;
  }

  isTask2Valid(): boolean {
    return this.task2.promptText.trim().length > 0 &&
           this.task2.minWords > 0 &&
           this.task2.maxWords > 0 &&
           this.task2.minWords < this.task2.maxWords;
  }

  isAllValid(): boolean {
    return this.isTask1Valid() && this.isTask2Valid();
  }

  // ============================================================
  // GET TASK TYPE LABEL
  // ============================================================

  getTaskTypeLabel(taskType: number): string {
    return taskType === 1 ? 'Letter/Email' : 'Essay';
  }

  // ============================================================
  // ✅ THÊM MỚI: GET QUESTIONS DATA (CHO add-questions.component)
  // ============================================================

  getQuestionsData(): WritingQuestion[] {
    const result: WritingQuestion[] = [];
    
    if (this.task1.promptText.trim()) {
      result.push({ ...this.task1 });
    }
    
    if (this.task2.promptText.trim()) {
      result.push({ ...this.task2 });
    }
    
    return result;
  }

  // ============================================================
  // ✅ THÊM MỚI: RESET (CHO add-questions.component)
  // ============================================================

  resetQuestions(): void {
    this.task1 = {
      id: '',
      orderNumber: 1,
      taskType: 1,
      promptText: '',
      minWords: 150,
      maxWords: 200,
      recommendedTimeMinutes: 20,
      sampleImageUrl: '',
      modelAnswer: '',
      rubricJson: ''
    };

    this.task2 = {
      id: '',
      orderNumber: 2,
      taskType: 2,
      promptText: '',
      minWords: 250,
      maxWords: 300,
      recommendedTimeMinutes: 40,
      sampleImageUrl: '',
      modelAnswer: '',
      rubricJson: ''
    };
    
    this.questions = [];
    this.questionsChange.emit(this.questions);
    this.cdr.detectChanges();
  }
}