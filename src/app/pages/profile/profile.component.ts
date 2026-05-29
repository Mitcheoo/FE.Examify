import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserProfileDto, UpdateProfileDto, ChangePasswordDto } from '../../models/auth/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-card">
        <div class="profile-header">
          <h2>Thông tin cá nhân</h2>
          <p>Quản lý thông tin tài khoản của bạn</p>
        </div>

        <div class="profile-tabs">
          <button class="tab" [class.active]="activeTab === 'info'" (click)="activeTab = 'info'">
            Thông tin
          </button>
          <button class="tab" [class.active]="activeTab === 'password'" (click)="activeTab = 'password'">
            Đổi mật khẩu
          </button>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'info'">
          <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
            <div class="form-group">
              <label>Họ và tên</label>
              <input type="text" formControlName="fullName" placeholder="Nhập họ và tên">
            </div>

            <div class="form-group">
              <label>Tên đăng nhập</label>
              <input type="text" [value]="profile?.userName || ''" disabled>
            </div>

            <div class="form-group">
              <label>Email</label>
              <input type="email" [value]="profile?.email || ''" disabled>
            </div>

            <button type="submit" class="btn-save" [disabled]="profileForm.invalid || isSaving">
              {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>

            <div class="message success" *ngIf="successMessage">{{ successMessage }}</div>
            <div class="message error" *ngIf="errorMessage">{{ errorMessage }}</div>
          </form>
        </div>

        <div class="tab-content" *ngIf="activeTab === 'password'">
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label>Mật khẩu hiện tại</label>
              <input type="password" formControlName="currentPassword" placeholder="Nhập mật khẩu hiện tại">
            </div>

            <div class="form-group">
              <label>Mật khẩu mới</label>
              <input type="password" formControlName="newPassword" placeholder="Nhập mật khẩu mới">
            </div>

            <div class="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" formControlName="confirmPassword" placeholder="Xác nhận mật khẩu mới">
            </div>

            <button type="submit" class="btn-save" [disabled]="passwordForm.invalid || isChangingPassword">
              {{ isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
            </button>

            <div class="message success" *ngIf="passwordSuccessMessage">{{ passwordSuccessMessage }}</div>
            <div class="message error" *ngIf="passwordErrorMessage">{{ passwordErrorMessage }}</div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 100px 2rem 2rem;
    }
    .profile-card {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .profile-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 2rem;
      text-align: center;
      color: white;
    }
    .profile-header h2 {
      margin: 0 0 0.5rem;
    }
    .profile-header p {
      margin: 0;
      opacity: 0.8;
    }
    .profile-tabs {
      display: flex;
      border-bottom: 1px solid #eee;
    }
    .tab {
      flex: 1;
      padding: 1rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      color: #666;
      transition: all 0.3s;
    }
    .tab:hover {
      background: #f5f5f5;
    }
    .tab.active {
      color: #667eea;
      border-bottom: 2px solid #667eea;
    }
    .tab-content {
      padding: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }
    .form-group input:disabled {
      background: #f5f5f5;
      color: #999;
    }
    .btn-save {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-save:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .message {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: 8px;
      text-align: center;
    }
    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  profile: UserProfileDto | null = null;
  activeTab: 'info' | 'password' = 'info';
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isSaving = false;
  isChangingPassword = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
    this.loadProfile();
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue({ fullName: data.fullName });
      },
      error: () => {
        this.errorMessage = 'Không thể tải thông tin profile';
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateProfileDto = {
      fullName: this.profileForm.value.fullName
    };

    this.authService.updateProfile(updateData).subscribe({
      next: () => {
        this.successMessage = 'Cập nhật thông tin thành công!';
        if (this.profile) {
          this.profile.fullName = updateData.fullName!;
        }
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
        this.isSaving = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Cập nhật thông tin thất bại';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
        this.isSaving = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.isChangingPassword = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    const passwordData: ChangePasswordDto = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: () => {
        this.passwordSuccessMessage = 'Đổi mật khẩu thành công!';
        this.passwordForm.reset();
        setTimeout(() => {
          this.passwordSuccessMessage = '';
        }, 3000);
        this.isChangingPassword = false;
      },
      error: (error) => {
        this.passwordErrorMessage = error.message || 'Đổi mật khẩu thất bại';
        setTimeout(() => {
          this.passwordErrorMessage = '';
        }, 3000);
        this.isChangingPassword = false;
      }
    });
  }
}
