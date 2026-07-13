// src/app/pages/admin/pages/manage-exams/add-questions/add-questions.component.ts

import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminExamService } from '../../../../../services/admin-exam.service';

import { ReadingQuestionsComponent } from '../create-fulltest/components/reading-questions/reading-questions.component';
import { ListeningQuestionsComponent } from '../create-fulltest/components/listening-questions/listening-questions.component';
import { WritingQuestionsComponent } from '../create-fulltest/components/writing-questions/writing-questions.component';

@Component({
  selector: 'app-add-questions',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReadingQuestionsComponent,
    ListeningQuestionsComponent,
    WritingQuestionsComponent
  ],
  templateUrl: './add-questions.component.html',
  styleUrls: ['./add-questions.component.scss']
})
export class AddQuestionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminExamService = inject(AdminExamService);
  private cdr = inject(ChangeDetectorRef);

  // ============================================================
  // DATA
  // ============================================================

  exerciseId: string = '';
  exercise: any = null;
  skill: number = 0;
  skillName: string = '';
  isLoading: boolean = false;
  isSaving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  validationErrors: string[] = [];

  // ============================================================
  // QUESTIONS (từ component con)
  // ============================================================

  questions: any[] = [];

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.exerciseId = params['id'];
      console.log('📌 Exercise ID:', this.exerciseId);
    });

    this.route.queryParams.subscribe(params => {
      if (params['skill']) {
        this.skill = parseInt(params['skill']);
        this.skillName = this.getSkillName(this.skill);
        console.log('📌 Skill:', this.skillName);
      }
    });

    this.loadExercise();
  }

  // ============================================================
  // LOAD EXERCISE
  // ============================================================

  loadExercise(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminExamService.getExerciseById(this.exerciseId).subscribe({
      next: (data: any) => {
        console.log('✅ Exercise loaded:', data);
        this.exercise = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Error loading exercise:', err);
        this.errorMessage = 'Không thể tải thông tin bài thi. Vui lòng thử lại!';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getSkillName(skill: number): string {
    const names: { [key: number]: string } = {
      0: 'Reading',
      1: 'Listening',
      2: 'Writing'
    };
    return names[skill] || 'Unknown';
  }

  getSkillEmoji(skill: number): string {
    const emojis: { [key: number]: string } = {
      0: '📖',
      1: '🎧',
      2: '✍️'
    };
    return emojis[skill] || '📝';
  }

  // ============================================================
  // QUESTIONS CHANGE (từ component con)
  // ============================================================

  onQuestionsChange(questions: any[]): void {
    this.questions = questions;
    console.log('📦 Questions updated:', this.questions.length);
    this.cdr.detectChanges();
  }

  // ============================================================
  // SAVE TO SERVER
  // ============================================================

  async saveToServer(): Promise<void> {
    if (this.questions.length === 0) {
      alert('⚠️ Vui lòng thêm ít nhất 1 câu hỏi!');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let questionsToSave: any[] = [];

      switch (this.skill) {
        case 0: // Reading
          questionsToSave = this.questions.map((q: any) => ({
            partNumber: q.partNumber || 1,
            orderNumber: q.orderNumber || 1,
            questionType: q.questionType || 'multiple_choice',
            questionText: q.questionText || '',
            options: {
              A: q.optionA || '',
              B: q.optionB || '',
              C: q.optionC || '',
              D: q.optionD || ''
            },
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || '',
            passage: q.passage || ''
          }));
          
          console.log('📤 Saving Reading questions:', questionsToSave);
          await this.adminExamService.createReadingQuestions(this.exerciseId, questionsToSave).toPromise();
          break;

        case 1: // Listening
          questionsToSave = this.questions.map((q: any) => ({
            partNumber: q.partNumber || 1,
            orderNumber: q.orderNumber || 1,
            questionText: q.questionText || '',
            optionA: q.optionA || '',
            optionB: q.optionB || '',
            optionC: q.optionC || '',
            optionD: q.optionD || '',
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || '',
            audioUrl: q.audioUrl || '/uploads/audio/TESTEXAMIFY.mp3'
          }));
          
          console.log('📤 Saving Listening questions:', questionsToSave);
          await this.adminExamService.createListeningQuestions(this.exerciseId, questionsToSave).toPromise();
          break;

        case 2: // Writing
          questionsToSave = this.questions.map((q: any) => ({
            taskType: q.taskType || 1,
            orderNumber: q.orderNumber || 1,
            promptText: q.promptText || '',
            minWords: q.minWords || 150,
            maxWords: q.maxWords || 300,
            recommendedTimeMinutes: q.recommendedTimeMinutes || 30
          }));
          
          console.log('📤 Saving Writing questions:', questionsToSave);
          await this.adminExamService.createWritingQuestions(this.exerciseId, questionsToSave).toPromise();
          break;
      }

      this.successMessage = `✅ Đã lưu thành công ${this.questions.length} câu hỏi!`;
      this.isSaving = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/admin/manage-exams']);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Error saving questions:', error);
      this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi lưu câu hỏi!';
      this.isSaving = false;
      this.cdr.detectChanges();

      if (error.error?.errors) {
        this.validationErrors = Object.values(error.error.errors).flat() as string[];
      }
    }
  }

  // ============================================================
  // CANCEL
  // ============================================================

  cancel(): void {
    this.router.navigate(['/admin/manage-exams']);
  }
}