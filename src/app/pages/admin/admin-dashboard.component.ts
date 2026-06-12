import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private examService = inject(ExamService);
  private authService = inject(AuthService);

  users: any[] = [];
  exercises: any[] = [];
  statistics: any = null;
  selectedUser: any = null;
  selectedExercise: any = null;

  activeTab: string = 'dashboard';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showUserModal = false;
  showExerciseModal = false;
  isEditing = false;

  userForm: any = { fullName: '', email: '', userName: '', role: 'User', isActive: true };
  exerciseForm: any = { title: '', skill: 0, description: '', totalParts: 3, totalQuestions: 0, timeLimitSeconds: 3600, difficulty: 2, isFullTest: false };

  statsCards = [
    { icon: '👥', label: 'Tổng người dùng', value: 0, color: '#667eea' },
    { icon: '📚', label: 'Tổng bài thi', value: 0, color: '#27ae60' },
    { icon: '📝', label: 'Tổng bài làm', value: 0, color: '#3498db' },
    { icon: '⭐', label: 'Điểm TB', value: 0, color: '#f39c12' }
  ];

  skills = [
    { value: 0, name: 'Reading' },
    { value: 1, name: 'Listening' },
    { value: 2, name: 'Writing' },
    { value: 3, name: 'Speaking' },
    { value: 4, name: 'Full Test' }
  ];

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    Promise.all([
      this.adminService.getAllUsers().toPromise(),
      this.examService.getExercisesList().toPromise(),
      this.adminService.getStatistics().toPromise()
    ]).then(([users, exercises, stats]) => {
      this.users = users?.items || users || [];
      this.exercises = exercises?.items || exercises || [];
      this.statistics = stats;
      this.statsCards[0].value = this.users.length;
      this.statsCards[1].value = this.exercises.length;
      this.statsCards[2].value = this.statistics?.totalSubmissions || 0;
      this.statsCards[3].value = this.statistics?.averageScore || 0;
      this.isLoading = false;
    }).catch((err: any) => {
      console.error('Error loading data:', err);
      this.errorMessage = 'Không thể tải dữ liệu';
      this.isLoading = false;
    });
  }

  openCreateUser() {
    this.isEditing = false;
    this.userForm = { fullName: '', email: '', userName: '', role: 'User', isActive: true };
    this.showUserModal = true;
  }

  openEditUser(user: any) {
    this.isEditing = true;
    this.selectedUser = user;
    this.userForm = { ...user };
    this.showUserModal = true;
  }

  saveUser() {
    this.isLoading = true;
    // TODO: Call API update user (backend chưa có)
    this.successMessage = this.isEditing ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!';
    this.showUserModal = false;
    this.isLoading = false;
    setTimeout(() => this.successMessage = '', 3000);
  }

  deleteUser(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          this.successMessage = 'Xóa người dùng thành công!';
          this.loadAllData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => {
          this.errorMessage = err.error?.message || 'Xóa thất bại';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  openCreateExercise() {
    this.isEditing = false;
    this.exerciseForm = { title: '', skill: 0, description: '', totalParts: 3, totalQuestions: 0, timeLimitSeconds: 3600, difficulty: 2, isFullTest: false };
    this.showExerciseModal = true;
  }

  openEditExercise(exercise: any) {
    this.isEditing = true;
    this.selectedExercise = exercise;
    this.exerciseForm = { ...exercise };
    this.showExerciseModal = true;
  }

  saveExercise() {
    this.isLoading = true;
    const obs = this.isEditing
      ? this.adminService.updateExercise(this.selectedExercise.id, this.exerciseForm)
      : this.adminService.createExercise(this.exerciseForm);

    obs.subscribe({
      next: () => {
        this.successMessage = this.isEditing ? 'Cập nhật bài thi thành công!' : 'Thêm bài thi thành công!';
        this.showExerciseModal = false;
        this.loadAllData();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteExercise(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa bài thi này?')) {
      this.adminService.deleteExercise(id).subscribe({
        next: () => {
          this.successMessage = 'Xóa bài thi thành công!';
          this.loadAllData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => {
          this.errorMessage = err.error?.message || 'Xóa thất bại';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  getSkillName(skill: number): string {
    const names: any = { 0: 'Reading', 1: 'Listening', 2: 'Writing', 3: 'Speaking', 4: 'Full Test' };
    return names[skill] || 'Unknown';
  }

  getRoleBadge(role: string): string {
    if (role === 'Admin') return '🔴 Admin';
    return '🟢 User';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  getStatusBadge(isActive: boolean): string {
    return isActive ? '🟢 Hoạt động' : '🔴 Khóa';
  }
}
