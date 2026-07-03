// src/app/pages/admin/pages/manage-exams/create-exam/create-exam.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminExamService } from '../../../../../services/admin-exam.service';

interface Question {
  id: string;
  partNumber: number;
  orderNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

@Component({
  selector: 'app-create-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-exam.component.html',
  styleUrls: ['./create-exam.component.scss']
})
export class CreateExamComponent implements OnInit {
  private adminExamService = inject(AdminExamService);
  private router = inject(Router);

  // ============ MODE ============
  mode: 'exercise' | 'fulltest' = 'exercise';

  // ============ COMMON DATA ============
  examData = {
    title: '',
    description: '',
    timeLimitSeconds: 3600,
    difficulty: 2
  };

  // ============ EXERCISE DATA ============
  exerciseData = {
    skill: 0,
    totalParts: 3,
    totalQuestions: 15
  };

  // ============ QUESTIONS ============
  questions: Question[] = [];
  editingQuestion: Question | null = null;
  showQuestionForm = false;

  // ============ FULL TEST DATA ============
  fullTestData: any = {
    readingExerciseId: '',
    listeningExerciseId: '',
    writingExerciseId: '',
    speakingExerciseId: ''
  };

  availableExercises: any = {
    reading: [],
    listening: [],
    writing: [],
    speaking: []
  };

  // ============ UI STATES ============
  isLoading = false;
  isCreating = false;
  errorMessage = '';
  successMessage = '';
  validationErrors: string[] = [];

  skillLabels = ['📖 Reading', '🎧 Listening', '✍️ Writing', '🎙️ Speaking'];
  difficultyLabels = ['Dễ', 'Trung bình', 'Khó'];
  correctAnswerOptions = ['A', 'B', 'C', 'D'];

  // New question template
  newQuestion: Question = {
    id: '',
    partNumber: 1,
    orderNumber: 1,
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: ''
  };

  ngOnInit(): void {
    this.loadAvailableExercises();
  }

  // ============ LOAD AVAILABLE EXERCISES ============
  loadAvailableExercises(): void {
    const skills = [0, 1, 2, 3];
    const skillNames = ['reading', 'listening', 'writing', 'speaking'];
    
    skills.forEach((skill, index) => {
      this.adminExamService.getExercisesBySkill(skill).subscribe({
        next: (data: any) => {
          this.availableExercises[skillNames[index]] = data.items || [];
        },
        error: () => {
          this.availableExercises[skillNames[index]] = [];
        }
      });
    });
  }

  // ============ SWITCH MODE ============
  switchMode(mode: 'exercise' | 'fulltest'): void {
    this.mode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];
  }

  // ============ GET AVAILABLE EXERCISES ============
  getAvailableExercises(skillName: string): any[] {
    return this.availableExercises[skillName] || [];
  }

  // ============ GET LABELS ============
  getSkillName(skill: number): string {
    return this.skillLabels[skill] || 'Unknown';
  }

  // ============ QUESTION MANAGEMENT ============
  addQuestion(): void {
    this.showQuestionForm = true;
    this.editingQuestion = null;
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
      explanation: ''
    };
  }

  editQuestion(index: number): void {
    this.showQuestionForm = true;
    this.editingQuestion = { ...this.questions[index] };
    this.newQuestion = { ...this.questions[index] };
  }

  saveQuestion(): void {
    if (!this.newQuestion.questionText.trim()) {
      this.errorMessage = 'Vui lòng nhập nội dung câu hỏi';
      return;
    }

    if (this.editingQuestion) {
      // Update existing
      const index = this.questions.findIndex(q => q.id === this.editingQuestion!.id);
      if (index !== -1) {
        this.questions[index] = { ...this.newQuestion, id: this.editingQuestion.id };
      }
    } else {
      // Add new
      this.newQuestion.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      this.newQuestion.orderNumber = this.questions.length + 1;
      this.questions.push({ ...this.newQuestion });
    }

    this.showQuestionForm = false;
    this.editingQuestion = null;
    this.errorMessage = '';
    this.resetNewQuestion();
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
      explanation: ''
    };
  }

  cancelQuestionForm(): void {
    this.showQuestionForm = false;
    this.editingQuestion = null;
    this.errorMessage = '';
  }

  deleteQuestion(index: number): void {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      this.questions.splice(index, 1);
      // Update order numbers
      this.questions.forEach((q, i) => q.orderNumber = i + 1);
    }
  }

  // ============ GET QUESTION COUNT ============
  getQuestionCount(): number {
    return this.questions.length;
  }

  // ============ VALIDATION ============
  validateForm(): boolean {
    this.validationErrors = [];
    let isValid = true;

    if (!this.examData.title.trim()) {
      this.validationErrors.push('Vui lòng nhập tiêu đề bài thi');
      isValid = false;
    }

    if (this.mode === 'exercise') {
      if (this.questions.length === 0) {
        this.validationErrors.push('Vui lòng thêm ít nhất 1 câu hỏi');
        isValid = false;
      }
    }

    if (this.mode === 'fulltest') {
      if (!this.fullTestData.readingExerciseId) {
        this.validationErrors.push('Vui lòng chọn bài Reading');
        isValid = false;
      }
      if (!this.fullTestData.listeningExerciseId) {
        this.validationErrors.push('Vui lòng chọn bài Listening');
        isValid = false;
      }
      if (!this.fullTestData.writingExerciseId) {
        this.validationErrors.push('Vui lòng chọn bài Writing');
        isValid = false;
      }
      if (!this.fullTestData.speakingExerciseId) {
        this.validationErrors.push('Vui lòng chọn bài Speaking');
        isValid = false;
      }
    }

    return isValid;
  }

  // ============ CREATE EXAM ============
  createExam(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];

    if (!this.validateForm()) {
      this.errorMessage = 'Vui lòng sửa các lỗi sau:';
      return;
    }
    
    if (this.mode === 'exercise') {
      this.createExercise();
    } else {
      this.createFullTest();
    }
  }

  // ============ CREATE EXERCISE ============
  createExercise(): void {
    this.isCreating = true;
    this.isLoading = true;

    const data = {
      title: this.examData.title.trim(),
      description: this.examData.description.trim(),
      skill: this.exerciseData.skill,
      totalParts: this.exerciseData.totalParts,
      totalQuestions: this.questions.length,
      timeLimitSeconds: this.examData.timeLimitSeconds,
      difficulty: this.examData.difficulty
    };

    console.log('📤 Creating Exercise:', data);

    this.adminExamService.createExercise(data).subscribe({
      next: (result: any) => {
        console.log('✅ Exercise created:', result);
        const exerciseId = result.id;
        
        // Tạo câu hỏi
        this.createQuestions(exerciseId, () => {
          this.successMessage = `✅ Tạo bài thi "${this.examData.title}" thành công! (${this.questions.length} câu hỏi)`;
          this.isCreating = false;
          this.isLoading = false;
          
          setTimeout(() => {
            this.router.navigate(['/admin/manage-exams']);
          }, 2000);
        });
      },
      error: (err: any) => {
        console.error('❌ Create exercise error:', err);
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi tạo bài thi';
        this.isCreating = false;
        this.isLoading = false;
      }
    });
  }

  createQuestions(exerciseId: string, callback: () => void): void {
    const skill = this.exerciseData.skill;
    let questionsToCreate: any[] = [];

    switch (skill) {
      case 0: // Reading
        questionsToCreate = this.questions.map(q => ({
          partNumber: q.partNumber,
          orderNumber: q.orderNumber,
          questionType: 'multiple_choice',
          questionText: q.questionText,
          options: {
            'A': q.optionA,
            'B': q.optionB,
            'C': q.optionC,
            'D': q.optionD
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
        this.adminExamService.createReadingQuestions(exerciseId, questionsToCreate).subscribe({
          next: () => { callback(); },
          error: (err) => {
            console.error('Error creating reading questions:', err);
            callback();
          }
        });
        break;
      case 1: // Listening
        questionsToCreate = this.questions.map(q => ({
          partNumber: q.partNumber,
          orderNumber: q.orderNumber,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          audioUrl: '/uploads/audio/TESTEXAMIFY.mp3'
        }));
        this.adminExamService.createListeningQuestions(exerciseId, questionsToCreate).subscribe({
          next: () => { callback(); },
          error: (err) => {
            console.error('Error creating listening questions:', err);
            callback();
          }
        });
        break;
      case 2: // Writing
        questionsToCreate = this.questions.map(q => ({
          taskType: q.partNumber,
          orderNumber: q.orderNumber,
          promptText: q.questionText,
          minWords: 150,
          maxWords: 300,
          recommendedTimeMinutes: 20
        }));
        this.adminExamService.createWritingQuestions(exerciseId, questionsToCreate).subscribe({
          next: () => { callback(); },
          error: (err) => {
            console.error('Error creating writing questions:', err);
            callback();
          }
        });
        break;
      case 3: // Speaking
        questionsToCreate = this.questions.map(q => ({
          partNumber: q.partNumber,
          orderNumber: q.orderNumber,
          questionText: q.questionText,
          preparationTime: 30,
          speakingTime: 60,
          sampleAnswer: q.explanation || ''
        }));
        this.adminExamService.createSpeakingQuestions(exerciseId, questionsToCreate).subscribe({
          next: () => { callback(); },
          error: (err) => {
            console.error('Error creating speaking questions:', err);
            callback();
          }
        });
        break;
      default:
        callback();
    }
  }

  // ============ CREATE FULL TEST ============
  async createFullTest(): Promise<void> {
    this.isCreating = true;
    this.isLoading = true;

    try {
      // Bước 1: Tạo Full Test
      const fullTestData = {
        title: this.examData.title.trim(),
        description: this.examData.description.trim(),
        timeLimitSeconds: this.examData.timeLimitSeconds,
        difficulty: this.examData.difficulty
      };

      const fullTest: any = await this.adminExamService.createFullTest(fullTestData).toPromise();
      const fullTestId = fullTest.id;

      // Bước 2: Cập nhật Full Test
      const updateData = {
        title: this.examData.title.trim(),
        description: this.examData.description.trim(),
        timeLimitSeconds: this.examData.timeLimitSeconds,
        difficulty: this.examData.difficulty,
        readingExerciseId: this.fullTestData.readingExerciseId,
        listeningExerciseId: this.fullTestData.listeningExerciseId,
        writingExerciseId: this.fullTestData.writingExerciseId,
        speakingExerciseId: this.fullTestData.speakingExerciseId
      };

      await this.adminExamService.updateFullTest(fullTestId, updateData).toPromise();

      this.successMessage = `✅ Tạo Full Test "${this.examData.title}" thành công!`;
      this.isCreating = false;
      this.isLoading = false;

      setTimeout(() => {
        this.router.navigate(['/admin/manage-exams']);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Create full test error:', error);
      this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi tạo Full Test';
      this.isCreating = false;
      this.isLoading = false;
    }
  }

  // ============ CANCEL ============
  cancel(): void {
    this.router.navigate(['/admin/manage-exams']);
  }
}