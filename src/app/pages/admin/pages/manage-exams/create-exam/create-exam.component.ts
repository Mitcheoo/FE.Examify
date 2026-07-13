// 📁 src/app/pages/admin/pages/manage-exams/create-exam/create-exam.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminExamService } from '../../../../../services/admin-exam.service';

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

  // ✅ THÊM: Dữ liệu giá tiền cho Full Test
  fullTestPriceData = {
    isFree: true,
    price: 0,
    priceDisplay: ''
  };

  // ============ EXERCISE DATA ============
  exerciseData = {
    skill: 0
  };

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

  // ============ BAREM CỐ ĐỊNH ============
  readonly skillBarem = {
    0: { name: 'Reading', parts: 3, questions: 30, defaultTime: 3600 },
    1: { name: 'Listening', parts: 3, questions: 35, defaultTime: 2400 },
    2: { name: 'Writing', parts: 2, questions: 2, defaultTime: 3600 }
  };

  skillLabels = ['📖 Reading', '🎧 Listening', '✍️ Writing'];
  difficultyLabels = ['Dễ', 'Trung bình', 'Khó'];

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

  getSkillEmoji(skill: number): string {
    const emojis: { [key: number]: string } = {
      0: '📖',
      1: '🎧',
      2: '✍️'
    };
    return emojis[skill] || '📝';
  }

  getSkillInfo(skill: number): { parts: number; questions: number; defaultTime: number } {
    return this.skillBarem[skill as keyof typeof this.skillBarem] || { parts: 3, questions: 30, defaultTime: 3600 };
  }

  // ============ ON SKILL CHANGE ============
  onSkillChange(): void {
    const info = this.getSkillInfo(this.exerciseData.skill);
    this.examData.timeLimitSeconds = info.defaultTime;
  }

  // ✅ THÊM: HÀM XỬ LÝ GIÁ TIỀN CHO FULL TEST
  onFullTestFreeChange(): void {
    if (this.fullTestPriceData.isFree) {
      this.fullTestPriceData.price = 0;
      this.fullTestPriceData.priceDisplay = '';
    }
  }

  formatPrice(value: number): string {
    return value ? value.toLocaleString('vi-VN') : '';
  }

  onFullTestPriceInput(value: string): void {
    const cleanValue = value.replace(/,/g, '');
    const numValue = parseInt(cleanValue);
    if (!isNaN(numValue) && numValue > 0) {
      this.fullTestPriceData.price = numValue;
      this.fullTestPriceData.priceDisplay = this.formatPrice(numValue);
    } else {
      this.fullTestPriceData.price = 0;
      this.fullTestPriceData.priceDisplay = '';
    }
  }

  // ============ VALIDATION ============
  validateForm(): boolean {
    this.validationErrors = [];
    let isValid = true;

    if (!this.examData.title.trim()) {
      this.validationErrors.push('Vui lòng nhập tiêu đề bài thi');
      isValid = false;
    }

    if (this.mode === 'exercise' && this.exerciseData.skill === undefined) {
      this.validationErrors.push('Vui lòng chọn kỹ năng');
      isValid = false;
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

  // ============ CREATE EXERCISE (GIỮ NGUYÊN) ============
  createExercise(): void {
    this.isCreating = true;
    this.isLoading = true;

    const skill = this.exerciseData.skill;
    const info = this.getSkillInfo(skill);
    const skillName = this.getSkillName(skill);

    const data = {
      title: this.examData.title.trim(),
      description: this.examData.description.trim(),
      skill: skill,
      totalParts: info.parts,
      totalQuestions: info.questions,
      timeLimitSeconds: this.examData.timeLimitSeconds,
      difficulty: this.examData.difficulty
    };

    console.log('📤 Creating Exercise:', data);

    this.adminExamService.createExercise(data).subscribe({
      next: (result: any) => {
        console.log('✅ Exercise created:', result);
        const exerciseId = result.id;
        
        this.isCreating = false;
        this.isLoading = false;

        const message = `✅ Tạo bài thi "${this.examData.title}" thành công!\n` +
                       `📌 Kỹ năng: ${skillName}\n` +
                       `📊 Số Parts: ${info.parts}\n` +
                       `📊 Số câu hỏi: ${info.questions}`;
        
        this.successMessage = message;
        this.showNotification(message, 'success');

        localStorage.setItem('exam_created_notification', message);
        localStorage.setItem('exam_created_notification_type', 'success');

        setTimeout(() => {
          this.router.navigate(['/admin/exercises', exerciseId, 'add-questions'], {
            queryParams: { skill: skill }
          });
        }, 1500);
      },
      error: (err: any) => {
        console.error('❌ Create exercise error:', err);
        const errorMsg = err.error?.message || 'Có lỗi xảy ra khi tạo bài thi';
        this.errorMessage = errorMsg;
        this.showNotification('❌ ' + errorMsg, 'error');
        this.isCreating = false;
        this.isLoading = false;
      }
    });
  }

  // ============ CREATE FULL TEST (SỬA: XÓA THỜI GIAN + THÊM GIÁ) ============
  createFullTest(): void {
    this.isCreating = true;
    this.isLoading = true;

    const data = {
      title: this.examData.title.trim(),
      description: this.examData.description.trim(),
      timeLimitSeconds: 7200, // ✅ Mặc định cố định, không lấy từ UI
      difficulty: this.examData.difficulty,
      // ✅ THÊM: Giá tiền
      isFree: this.fullTestPriceData.isFree,
      price: this.fullTestPriceData.price,
      readingExerciseId: this.fullTestData.readingExerciseId || null,
      listeningExerciseId: this.fullTestData.listeningExerciseId || null,
      writingExerciseId: this.fullTestData.writingExerciseId || null,
      speakingExerciseId: this.fullTestData.speakingExerciseId || null
    };

    console.log('📤 Creating Full Test:', data);

    this.adminExamService.createFullTest(data).subscribe({
      next: (result: any) => {
        console.log('✅ Full Test created:', result);
        
        const fullTestId = result.id;
        const readingId = result.readingExerciseId || '';
        const listeningId = result.listeningExerciseId || '';
        const writingId = result.writingExerciseId || '';
        const speakingId = result.speakingExerciseId || '';

        this.isCreating = false;
        this.isLoading = false;

        const priceText = this.fullTestPriceData.isFree 
          ? '🆓 Miễn phí' 
          : this.formatPrice(this.fullTestPriceData.price) + ' ₫';
        
        const message = `✅ Tạo Full Test "${this.examData.title}" thành công!\n` +
                       `💰 Giá: ${priceText}`;
        this.successMessage = message;
        this.showNotification(message, 'success');

        localStorage.setItem('exam_created_notification', message);
        localStorage.setItem('exam_created_notification_type', 'success');

        setTimeout(() => {
          this.router.navigate(['/admin/fulltest', fullTestId, 'questions'], {
            queryParams: {
              readingId: readingId,
              listeningId: listeningId,
              writingId: writingId,
              speakingId: speakingId
            }
          });
        }, 1500);
      },
      error: (err: any) => {
        console.error('❌ Create full test error:', err);
        const errorMsg = err.error?.message || 'Có lỗi xảy ra khi tạo Full Test';
        this.errorMessage = errorMsg;
        this.showNotification('❌ ' + errorMsg, 'error');
        this.isCreating = false;
        this.isLoading = false;
      }
    });
  }
  onFullTestPriceChange(): void {
  // Format để hiển thị preview
  if (this.fullTestPriceData.price > 0) {
    this.fullTestPriceData.priceDisplay = this.formatPrice(this.fullTestPriceData.price);
  } else {
    this.fullTestPriceData.priceDisplay = '';
  }
}

  // ============ NOTIFICATION ============
  notificationMessage: string = '';
  notificationType: 'success' | 'error' = 'success';
  showNotificationFlag: boolean = false;

  showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationFlag = true;

    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  hideNotification(): void {
    this.showNotificationFlag = false;
    this.notificationMessage = '';
  }

  // ============ CANCEL ============
  cancel(): void {
    this.router.navigate(['/admin/manage-exams']);
  }
}