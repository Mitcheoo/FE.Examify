import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="logo">🎓 Examify</div>
          <h2>Đăng ký tài khoản</h2>
          <p>Tham gia ngay để bắt đầu luyện thi VSTEP</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- Full Name -->
          <div class="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              formControlName="fullName"
              placeholder="Nhập họ và tên của bạn"
              [class.error]="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched"
            >
            <div class="error-message" *ngIf="registerForm.get('fullName')?.touched && registerForm.get('fullName')?.invalid">
              <span *ngIf="registerForm.get('fullName')?.errors?.['required']">Họ và tên không được để trống</span>
              <span *ngIf="registerForm.get('fullName')?.errors?.['minlength']">Họ và tên phải có ít nhất 3 ký tự</span>
            </div>
          </div>

          <!-- Username -->
          <div class="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              formControlName="userName"
              placeholder="Chọn tên đăng nhập"
              [class.error]="registerForm.get('userName')?.invalid && registerForm.get('userName')?.touched"
            >
            <div class="error-message" *ngIf="registerForm.get('userName')?.touched && registerForm.get('userName')?.invalid">
              <span *ngIf="registerForm.get('userName')?.errors?.['required']">Tên đăng nhập không được để trống</span>
              <span *ngIf="registerForm.get('userName')?.errors?.['minlength']">Tên đăng nhập phải có ít nhất 3 ký tự</span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              formControlName="email"
              placeholder="example@email.com"
              [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            >
            <div class="error-message" *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">Email không được để trống</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">Email không hợp lệ</span>
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label>Mật khẩu</label>
            <div class="password-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
              >
              <button type="button" class="toggle-password" (click)="togglePassword()">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div class="error-message" *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid">
              <span *ngIf="registerForm.get('password')?.errors?.['required']">Mật khẩu không được để trống</span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Mật khẩu phải có ít nhất 6 ký tự</span>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label>Xác nhận mật khẩu</label>
            <div class="password-wrapper">
              <input
                [type]="showConfirmPassword ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
              >
              <button type="button" class="toggle-password" (click)="toggleConfirmPassword()">
                {{ showConfirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div class="error-message" *ngIf="registerForm.get('confirmPassword')?.touched && registerForm.get('confirmPassword')?.invalid">
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">Vui lòng xác nhận mật khẩu</span>
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['mismatch']">Mật khẩu xác nhận không khớp</span>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="agreeTerms">
              <span>Tôi đồng ý với <a href="#">Điều khoản sử dụng</a></span>
            </label>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-register" [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="!isLoading">Đăng ký</span>
            <span *ngIf="isLoading" class="spinner"></span>
          </button>

          <!-- Error Message -->
          <div class="alert alert-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div class="alert alert-success" *ngIf="successMessage">
            {{ successMessage }}
          </div>
        </form>

        <div class="register-footer">
          <p>Đã có tài khoản? <a routerLink="/login">Đăng nhập ngay</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .register-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.5s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      font-size: 2rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }

    .register-header h2 {
      font-size: 1.8rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .register-header p {
      color: #666;
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
      transition: all 0.3s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
    }

    .form-group input.error {
      border-color: #e74c3c;
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .form-options {
      margin-bottom: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #666;
    }

    .checkbox-label a {
      color: #667eea;
      text-decoration: none;
    }

    .btn-register {
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

    .btn-register:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102,126,234,0.4);
    }

    .btn-register:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert {
      padding: 0.75rem;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .alert-error {
      background: #fef3f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #d5f5e3;
      color: #27ae60;
      border: 1px solid #a9dfbf;
    }

    .register-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }

    .register-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = {
      fullName: this.registerForm.value.fullName,
      userName: this.registerForm.value.userName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Register success:', response);
        this.successMessage = 'Đăng ký thành công! Vui lòng đăng nhập.';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
