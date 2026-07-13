// src/app/pages/admin/pages/manage-exams/add-questions/components/listening-questions/listening-questions.component.ts

import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminExamService } from '@services/admin-exam.service';
interface ListeningQuestion {
  id: string;
  partNumber: number;
  orderNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  audioUrl: string;
  explanation: string;
}

@Component({
  selector: 'app-listening-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listening-questions.component.html',
  styleUrls: ['./listening-questions.component.scss']
})
export class ListeningQuestionsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private adminExamService = inject(AdminExamService);

  @Input() exerciseId: string = '';
  @Input() questions: ListeningQuestion[] = [];
  @Output() questionsChange = new EventEmitter<ListeningQuestion[]>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ============================================================
  // STATE
  // ============================================================

  // Audio
  audioFile: File | null = null;
  audioUrl: string = '';
  audioUrlInput: string = '';
  audioInputType: 'upload' | 'url' = 'upload';
  isUploading: boolean = false;
  uploadedAudioUrl: string = '';

  // Question form
  showQuestionForm: boolean = false;
  editingIndex: number | null = null;

  newQuestion: ListeningQuestion = {
    id: '',
    partNumber: 1,
    orderNumber: 1,
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    audioUrl: '',
    explanation: ''
  };

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    console.log('🎧 ListeningQuestionsComponent initialized with exerciseId:', this.exerciseId);
  }

  // ============================================================
  // AUDIO - UPLOAD FILE
  // ============================================================

  async onAudioSelected(event: Event): Promise<void> {
    console.log('🎵 onAudioSelected triggered!');
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.audioFile = input.files[0];
      this.audioUrl = URL.createObjectURL(this.audioFile);
      console.log('🎵 Audio file selected:', this.audioFile.name);

      await this.uploadAudioFile(this.audioFile);
      this.cdr.detectChanges();
    }
  }

  async uploadAudioFile(file: File): Promise<void> {
    this.isUploading = true;
    console.log('📤 Uploading audio file:', file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'listening-audios');

      const result = await this.adminExamService.uploadAudio(formData).toPromise();
      console.log('✅ Upload result:', result);

      if (result && result.url) {
        this.uploadedAudioUrl = result.url;
        this.audioUrl = result.url;
        this.audioUrlInput = result.url;
        console.log('🎵 Audio URL from server:', this.uploadedAudioUrl);
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert('⚠️ Không thể upload file audio. Vui lòng thử lại!');
    } finally {
      this.isUploading = false;
    }
  }

  // ============================================================
  // AUDIO - DÁN URL
  // ============================================================

  onAudioUrlInput(): void {
    if (this.audioUrlInput && this.audioUrlInput.trim()) {
      this.audioUrl = this.audioUrlInput.trim();
      this.audioFile = null;
      console.log('🎵 Audio URL entered:', this.audioUrl);
      this.cdr.detectChanges();
    }
  }

  previewAudioUrl(): void {
    if (this.audioUrlInput && this.audioUrlInput.trim()) {
      this.audioUrl = this.audioUrlInput.trim();
      this.audioFile = null;
      console.log('🎵 Preview audio URL:', this.audioUrl);
      this.cdr.detectChanges();
    }
  }

  // ============================================================
  // AUDIO - REMOVE
  // ============================================================

  removeAudio(): void {
    this.audioFile = null;
    this.audioUrl = '';
    this.audioUrlInput = '';
    this.uploadedAudioUrl = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.detectChanges();
  }

  openFilePicker(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  // ============================================================
  // QUESTION MANAGEMENT
  // ============================================================

  addQuestion(): void {
    this.showQuestionForm = true;
    this.editingIndex = null;
    this.resetNewQuestion();
    this.audioUrl = '';
    this.audioFile = null;
    this.audioUrlInput = '';
    this.uploadedAudioUrl = '';
    this.audioInputType = 'upload';
  }

  editQuestion(index: number): void {
    this.showQuestionForm = true;
    this.editingIndex = index;
    this.newQuestion = { ...this.questions[index] };
    if (this.newQuestion.audioUrl) {
      this.audioUrl = this.newQuestion.audioUrl;
      this.audioUrlInput = this.newQuestion.audioUrl;
      this.uploadedAudioUrl = this.newQuestion.audioUrl;
    }
    this.audioInputType = this.newQuestion.audioUrl ? 'url' : 'upload';
  }

  saveQuestion(): void {
    // Validate
    if (!this.newQuestion.questionText.trim()) {
      alert('⚠️ Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (!this.newQuestion.optionA.trim() || !this.newQuestion.optionB.trim() ||
        !this.newQuestion.optionC.trim() || !this.newQuestion.optionD.trim()) {
      alert('⚠️ Vui lòng nhập đầy đủ 4 đáp án A, B, C, D!');
      return;
    }

    // ✅ LƯU AUDIO URL
    if (this.uploadedAudioUrl) {
      this.newQuestion.audioUrl = this.uploadedAudioUrl;
    } else if (this.audioUrlInput && this.audioUrlInput.trim().startsWith('http')) {
      this.newQuestion.audioUrl = this.audioUrlInput.trim();
    } else if (this.audioUrl && this.audioUrl.startsWith('http')) {
      this.newQuestion.audioUrl = this.audioUrl;
    }

    if (this.editingIndex !== null) {
      this.questions[this.editingIndex] = { ...this.newQuestion };
    } else {
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
      this.questions.forEach((q, i) => q.orderNumber = i + 1);
      this.questionsChange.emit(this.questions);
      this.cdr.detectChanges();
    }
  }

  cancelQuestionForm(): void {
    this.showQuestionForm = false;
    this.editingIndex = null;
    this.resetNewQuestion();
    this.audioUrl = '';
    this.audioFile = null;
    this.audioUrlInput = '';
    this.uploadedAudioUrl = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  resetNewQuestion(): void {
    this.newQuestion = {
      id: '',
      partNumber: 1,
      orderNumber: this.questions.length + 1,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      audioUrl: '',
      explanation: ''
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getTotalQuestions(): number {
    return this.questions.length;
  }
}