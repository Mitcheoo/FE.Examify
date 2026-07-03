// profile.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserProfile, UpdateProfileDto, ChangePasswordDto } from '../../services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  // Services
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // State
  profile: UserProfile | null = null;
  activeTab: 'info' | 'password' | 'wallet' = 'info';
  isLoading = true;
  isEditing = false;
  isSaving = false;
  isChangingPassword = false;
  editFullName = '';
  
  // Messages
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  
  // Wallet
  walletBalance = 0;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Form
  passwordForm!: FormGroup;

  // ==================== LIFECYCLE ====================
  
  ngOnInit(): void {
    console.log('🟢 ProfileComponent initialized');
    this.initPasswordForm();
    this.loadProfileFromStorage();
    this.loadProfile();
    this.loadWalletBalance();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ==================== INITIALIZATION ====================

  initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(6),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: [this.passwordMatchValidator] 
    });
  }

  // ==================== LOAD DATA ====================

  loadProfileFromStorage(): void {
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('📦 Loaded profile from storage:', user);
        this.profile = user;
        this.editFullName = user.fullName || '';
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Error parsing user from storage:', error);
    }
  }

  loadProfile(): void {
    console.log('🔄 Calling API to get latest profile...');
    const sub = this.authService.getProfile().subscribe({
      next: (profile) => {
        console.log('✅ Profile from API:', profile);
        this.profile = profile;
        this.editFullName = profile.fullName || '';
        this.isLoading = false;
        this.updateLocalStorage(profile);
      },
      error: (error) => {
        console.error('❌ Error loading profile from API:', error);
        if (!this.profile) {
          this.errorMessage = 'Không thể tải thông tin profile. Vui lòng thử lại sau.';
          this.isLoading = false;
        }
        // Nếu có lỗi nhưng đã có dữ liệu từ storage, vẫn hiển thị
      }
    });
    this.subscriptions.push(sub);
  }

  loadWalletBalance(): void {
    // Giả lập - sau này tích hợp với PaymentService
    // this.paymentService.getWallet().subscribe(...)
    this.walletBalance = 0;
  }

  // ==================== COMPUTED PROPERTIES ====================

  get userInitial(): string {
    if (this.profile?.fullName) {
      return this.profile.fullName.charAt(0).toUpperCase();
    }
    if (this.profile?.userName) {
      return this.profile.userName.charAt(0).toUpperCase();
    }
    return '?';
  }

  get userDisplayName(): string {
    return this.profile?.fullName || this.profile?.userName || 'Người dùng';
  }

  // ==================== PROFILE CRUD ====================

  startEdit(): void {
    this.isEditing = true;
    this.editFullName = this.profile?.fullName || '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editFullName = this.profile?.fullName || '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    const trimmedName = this.editFullName?.trim();
    if (!trimmedName) {
      this.errorMessage = 'Họ và tên không được để trống';
      this.clearMessageAfterDelay('errorMessage');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateProfileDto = {
      fullName: trimmedName
    };

    const sub = this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Cập nhật thông tin thành công!';
        if (this.profile) {
          this.profile.fullName = trimmedName;
          this.updateLocalStorage(this.profile);
        }
        this.isEditing = false;
        this.isSaving = false;
        this.clearMessageAfterDelay('successMessage');
      },
      error: (error) => {
        this.errorMessage = error.message || 'Cập nhật thất bại. Vui lòng thử lại.';
        this.isSaving = false;
        this.clearMessageAfterDelay('errorMessage');
      }
    });
    this.subscriptions.push(sub);
  }

  // ==================== PASSWORD ====================

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isChangingPassword = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    const passwordData: ChangePasswordDto = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    const sub = this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.passwordSuccessMessage = response.message || 'Đổi mật khẩu thành công!';
        this.passwordForm.reset();
        this.isChangingPassword = false;
        this.clearMessageAfterDelay('passwordSuccessMessage');
      },
      error: (error) => {
        this.passwordErrorMessage = error.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.';
        this.isChangingPassword = false;
        this.clearMessageAfterDelay('passwordErrorMessage');
      }
    });
    this.subscriptions.push(sub);
  }

  // ==================== PASSWORD VALIDATORS ====================

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!newPassword || !confirmPassword) {
      return null;
    }
    
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough]
      .filter(Boolean).length;
    
    if (strength < 3) {
      return { weak: true };
    }
    
    return null;
  }

  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (!password) return 0;
    
    let score = 0;
    if (password.length >= 6) score += 20;
    if (password.length >= 10) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    
    return Math.min(score, 100);
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength === 0) return '';
    if (strength < 33) return 'Yếu';
    if (strength < 66) return 'Trung bình';
    return 'Mạnh';
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    if (strength === 0) return 'bg-gray-200';
    if (strength < 33) return 'bg-red-500';
    if (strength < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  // ==================== UTILITY METHODS ====================

  private updateLocalStorage(profile: UserProfile): void {
    try {
      localStorage.setItem('current_user', JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessageAfterDelay(messageKey: 'successMessage' | 'errorMessage' | 'passwordSuccessMessage' | 'passwordErrorMessage'): void {
    setTimeout(() => {
      this[messageKey] = '';
    }, 5000);
  }

  // ==================== WALLET ====================

  navigateToDeposit(): void {
    this.router.navigate(['/payment/deposit']);
  }

  // ==================== AVATAR ====================

  onAvatarError(): void {
    if (this.profile) {
      this.profile.avatarUrl = null;
    }
  }

  // ==================== TAB SWITCHING ====================

  switchTab(tab: 'info' | 'password' | 'wallet'): void {
    this.activeTab = tab;
    // Reset messages khi chuyển tab
    this.successMessage = '';
    this.errorMessage = '';
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';
    
    if (tab === 'wallet') {
      this.loadWalletBalance();
    }
  }

  // ==================== RELOAD ====================

  refreshProfile(): void {
    this.isLoading = true;
    this.loadProfile();
  }
}