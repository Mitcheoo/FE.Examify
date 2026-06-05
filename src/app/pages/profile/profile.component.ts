import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, UserProfile, UpdateProfileDto, ChangePasswordDto } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  profile: UserProfile | null = null;
  activeTab: 'info' | 'password' = 'info';
  isLoading = true;
  isEditing = false;
  isSaving = false;
  isChangingPassword = false;
  editFullName = '';
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  passwordForm!: FormGroup;

  ngOnInit(): void {
    console.log('🟢 ProfileComponent initialized');
    this.initPasswordForm();
    this.loadProfileFromStorage(); // Load từ storage trước
    this.loadProfile(); // Sau đó gọi API để cập nhật
  }

  // Thêm method này để load từ localStorage ngay lập tức
  loadProfileFromStorage(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('📦 Loaded profile from storage:', user);
        this.profile = user;
        this.editFullName = user.fullName;
        this.isLoading = false;
      } catch(e) {
        console.error('Error parsing user from storage:', e);
      }
    }
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  loadProfile(): void {
    console.log('🔄 Calling API to get latest profile...');
    this.authService.getProfile().subscribe({
      next: (profile) => {
        console.log('✅ Profile from API:', profile);
        this.profile = profile;
        this.editFullName = profile.fullName;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading profile from API:', error);
        // Nếu API lỗi nhưng đã có dữ liệu từ storage, vẫn giữ isLoading = false
        if (!this.profile) {
          this.errorMessage = 'Không thể tải thông tin profile';
          this.isLoading = false;
        }
      }
    });
  }

  get userInitial(): string {
    return this.profile?.fullName?.charAt(0).toUpperCase() || '?';
  }

  startEdit(): void {
    this.isEditing = true;
    this.editFullName = this.profile?.fullName || '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editFullName = this.profile?.fullName || '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    if (!this.editFullName.trim()) {
      this.errorMessage = 'Họ và tên không được để trống';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateProfileDto = {
      fullName: this.editFullName
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Cập nhật thông tin thành công!';
        if (this.profile) {
          this.profile.fullName = this.editFullName;
          // Cập nhật lại localStorage
          localStorage.setItem('current_user', JSON.stringify(this.profile));
        }
        this.isEditing = false;
        this.isSaving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Cập nhật thất bại';
        this.isSaving = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        const control = this.passwordForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isChangingPassword = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    const passwordData: ChangePasswordDto = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.passwordSuccessMessage = response.message || 'Đổi mật khẩu thành công!';
        this.passwordForm.reset();
        this.isChangingPassword = false;
        setTimeout(() => this.passwordSuccessMessage = '', 3000);
      },
      error: (error) => {
        this.passwordErrorMessage = error.message || 'Đổi mật khẩu thất bại';
        this.isChangingPassword = false;
        setTimeout(() => this.passwordErrorMessage = '', 3000);
      }
    });
  }
}