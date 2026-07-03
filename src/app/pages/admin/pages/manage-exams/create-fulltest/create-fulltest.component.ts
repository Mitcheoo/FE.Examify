// 📁 src/app/pages/admin/pages/manage-exams/create-fulltest/create-fulltest.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminExamService } from '../../../../../services/admin-exam.service';
import { AuthService } from '../../../../../services/auth.service';

// Import các component con
import { ReadingQuestionsComponent } from './components/reading-questions/reading-questions.component';
import { ListeningQuestionsComponent } from './components/listening-questions/listening-questions.component';
import { WritingQuestionsComponent } from './components/writing-questions/writing-questions.component';
import { SpeakingQuestionsComponent } from './components/speaking-questions/speaking-questions.component';

interface Tab {
  key: string;
  name: string;
  icon: string;
  exerciseId: string;
}

@Component({
  selector: 'app-create-fulltest',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReadingQuestionsComponent,
    ListeningQuestionsComponent,
    WritingQuestionsComponent,
    SpeakingQuestionsComponent
  ],
  templateUrl: './create-fulltest.component.html',
  styleUrls: ['./create-fulltest.component.scss']
})
export class CreateFullTestComponent implements OnInit {
  private adminExamService = inject(AdminExamService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // STATE
  fullTestId: string = '';
  fullTestTitle: string = '';

  readingExerciseId: string = '';
  listeningExerciseId: string = '';
  writingExerciseId: string = '';
  speakingExerciseId: string = '';

  readingQuestions: any[] = [];
  listeningQuestions: any[] = [];
  writingQuestions: any[] = [];
  speakingQuestions: any[] = [];

  // ✅ PASSAGE - LƯU CHO TỪNG PART
  readingPassages: { [key: number]: string } = {
    1: '',
    2: '',
    3: '',
    4: ''
  };

  activeTab: string = 'reading';
  isSaving: boolean = false;
  isComplete: boolean = false;

  tabs: Tab[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.fullTestId = params['fullTestId'];
      console.log('📌 FullTest ID:', this.fullTestId);
    });

    this.route.queryParams.subscribe(params => {
      this.readingExerciseId = params['readingId'] || '';
      this.listeningExerciseId = params['listeningId'] || '';
      this.writingExerciseId = params['writingId'] || '';
      this.speakingExerciseId = params['speakingId'] || '';

      console.log('📌 Reading Exercise ID:', this.readingExerciseId);
      console.log('📌 Listening Exercise ID:', this.listeningExerciseId);
      console.log('📌 Writing Exercise ID:', this.writingExerciseId);
      console.log('📌 Speaking Exercise ID:', this.speakingExerciseId);

      this.initTabs();
      this.loadFullTestInfo();
    });
  }

  initTabs(): void {
    this.tabs = [
      { key: 'reading', name: 'Reading', icon: '📖', exerciseId: this.readingExerciseId },
      { key: 'listening', name: 'Listening', icon: '🎧', exerciseId: this.listeningExerciseId },
      { key: 'writing', name: 'Writing', icon: '✍️', exerciseId: this.writingExerciseId },
      { key: 'speaking', name: 'Speaking', icon: '🎙️', exerciseId: this.speakingExerciseId }
    ];
  }

  loadFullTestInfo(): void {
    if (!this.fullTestId) return;

    this.adminExamService.getExerciseById(this.fullTestId).subscribe({
      next: (data: any) => {
        this.fullTestTitle = data.title || 'Full Test';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading full test info:', err);
      }
    });
  }

  switchTab(tabKey: string): void {
    this.activeTab = tabKey;
  }

  getQuestionCount(tabKey: string): number {
    switch (tabKey) {
      case 'reading': return this.readingQuestions.length;
      case 'listening': return this.listeningQuestions.length;
      case 'writing': return this.writingQuestions.length;
      case 'speaking': return this.speakingQuestions.length;
      default: return 0;
    }
  }

  getTotalQuestions(): number {
    return this.readingQuestions.length +
           this.listeningQuestions.length +
           this.writingQuestions.length +
           this.speakingQuestions.length;
  }

  // ============================================================
  // HANDLE QUESTIONS CHANGE
  // ============================================================

  onReadingQuestionsChange(questions: any[]): void {
    this.readingQuestions = questions;
    console.log('📝 Reading questions updated:', questions.length);
  }

  // ✅ HÀM NHẬN PASSAGES TỪ READING COMPONENT
  onReadingPassagesChange(passages: { [key: number]: string }): void {
    this.readingPassages = passages;
    console.log('📄 Reading passages updated:', passages);
  }

  onListeningQuestionsChange(questions: any[]): void {
    this.listeningQuestions = questions;
    console.log('📝 Listening questions updated:', questions.length);
  }

  onWritingQuestionsChange(questions: any[]): void {
    this.writingQuestions = questions;
    console.log('📝 Writing questions updated:', questions.length);
  }

  onSpeakingQuestionsChange(questions: any[]): void {
    this.speakingQuestions = questions;
    console.log('📝 Speaking questions updated:', questions.length);
  }

  // ============================================================
  // SAVE DRAFT
  // ============================================================

  saveDraft(): void {
    this.isSaving = true;

    const savePromises: Promise<any>[] = [];

    // 1. READING
    if (this.readingQuestions.length > 0 && this.readingExerciseId) {
      const formattedQuestions = this.readingQuestions.map(q => {
        // ✅ LẤY PASSAGE THEO PART
        const passage = this.readingPassages[q.partNumber] || '';
        
        return {
          partNumber: q.partNumber || 1,
          orderNumber: q.orderNumber || 1,
          questionType: q.questionType || 'multiple_choice',
          questionText: q.questionText,
          passage: passage,
          options: {
            A: q.optionA || '',
            B: q.optionB || '',
            C: q.optionC || '',
            D: q.optionD || ''
          },
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || ''
        };
      });

      console.log('📤 Reading questions with passages:', formattedQuestions.length);
      savePromises.push(
        this.adminExamService.createReadingQuestions(
          this.readingExerciseId,
          formattedQuestions
        ).toPromise()
      );
    }

    // 2. LISTENING
    if (this.listeningQuestions.length > 0 && this.listeningExerciseId) {
      const formattedQuestions = this.listeningQuestions.map(q => ({
        partNumber: q.partNumber || 1,
        orderNumber: q.orderNumber || 1,
        questionText: q.questionText,
        optionA: q.optionA || '',
        optionB: q.optionB || '',
        optionC: q.optionC || '',
        optionD: q.optionD || '',
        correctAnswer: q.correctAnswer || 'A',
        audioUrl: q.audioUrl || '',
        explanation: q.explanation || ''
      }));

      console.log('📤 Listening questions:', formattedQuestions.length);
      savePromises.push(
        this.adminExamService.createListeningQuestions(
          this.listeningExerciseId,
          formattedQuestions
        ).toPromise()
      );
    }

    // 3. WRITING
    if (this.writingQuestions.length > 0 && this.writingExerciseId) {
      const formattedQuestions = this.writingQuestions.map(q => ({
        taskType: q.taskType || 1,
        orderNumber: q.orderNumber || 1,
        promptText: q.promptText || '',
        minWords: q.minWords || 150,
        maxWords: q.maxWords || 300,
        recommendedTimeMinutes: q.recommendedTimeMinutes || 20,
        modelAnswer: q.modelAnswer || '',
        sampleImageUrl: q.sampleImageUrl || '',
        rubricJson: q.rubricJson || ''
      }));

      console.log('📤 Writing questions:', formattedQuestions.length);
      savePromises.push(
        this.adminExamService.createWritingQuestions(
          this.writingExerciseId,
          formattedQuestions
        ).toPromise()
      );
    }

    // 4. SPEAKING
    if (this.speakingQuestions.length > 0 && this.speakingExerciseId) {
      const formattedQuestions = this.speakingQuestions.map(q => ({
        partNumber: q.partNumber || 1,
        orderNumber: q.orderNumber || 1,
        questionText: q.questionText || '',
        preparationTime: q.preparationTime || 30,
        speakingTime: q.speakingTime || 60,
        sampleAnswer: q.sampleAnswer || '',
        audioUrl: q.audioUrl || ''
      }));

      console.log('📤 Speaking questions:', formattedQuestions.length);
      savePromises.push(
        this.adminExamService.createSpeakingQuestions(
          this.speakingExerciseId,
          formattedQuestions
        ).toPromise()
      );
    }

    if (savePromises.length === 0) {
      alert('⚠️ Chưa có câu hỏi nào để lưu!');
      this.isSaving = false;
      return;
    }

    Promise.all(savePromises)
      .then(() => {
        console.log('✅ All questions saved successfully!');
        alert('💾 Đã lưu tất cả câu hỏi thành công!');
        this.isSaving = false;
      })
      .catch((error) => {
        console.error('❌ Error saving questions:', error);
        alert('❌ Có lỗi xảy ra khi lưu câu hỏi. Vui lòng thử lại!');
        this.isSaving = false;
      });
  }

  // ============================================================
  // COMPLETE FULL TEST
  // ============================================================

  completeFullTest(): void {
    const totalQuestions = this.getTotalQuestions();

    if (totalQuestions === 0) {
      alert('⚠️ Vui lòng thêm ít nhất 1 câu hỏi trước khi hoàn tất!');
      return;
    }

    if (this.writingQuestions.length < 2) {
      alert('⚠️ Writing cần có 2 câu hỏi (Task 1 và Task 2)!');
      return;
    }

    const confirmComplete = confirm(
      `📊 Xác nhận hoàn tất Full Test\n\n` +
      `📖 Reading: ${this.readingQuestions.length} câu hỏi\n` +
      `🎧 Listening: ${this.listeningQuestions.length} câu hỏi\n` +
      `✍️ Writing: ${this.writingQuestions.length} câu hỏi\n` +
      `🎙️ Speaking: ${this.speakingQuestions.length} câu hỏi\n\n` +
      `Tổng: ${totalQuestions} câu hỏi\n\n` +
      `Bạn có chắc muốn hoàn tất?`
    );

    if (!confirmComplete) return;

    this.isComplete = true;
    this.saveDraft();

    setTimeout(() => {
      this.router.navigate(['/admin/manage-exams']);
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/admin/manage-exams']);
  }
}