// ============================================
// LOGIN COMPONENT - Đăng nhập bằng Username
// Vị trí: src/app/pages/login/login.component.ts
// ============================================

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">🎓 VSTEP Master</div>
          <h2>Đăng nhập</h2>
          <p>Chào mừng bạn trở lại!</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Username Field -->
          <div class="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              formControlName="userName"
              placeholder="nhập tên đăng nhập của bạn"
              [class.error]="loginForm.get('userName')?.invalid && loginForm.get('userName')?.touched"
            >
            <div class="error-message" *ngIf="loginForm.get('userName')?.touched && loginForm.get('userName')?.invalid">
              <span *ngIf="loginForm.get('userName')?.errors?.['required']">Tên đăng nhập không được để trống</span>
              <span *ngIf="loginForm.get('userName')?.errors?.['minlength']">Tên đăng nhập phải có ít nhất 3 ký tự</span>
            </div>
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label>Mật khẩu</label>
            <div class="password-wrapper">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              >
              <button type="button" class="toggle-password" (click)="togglePassword()">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div class="error-message" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Mật khẩu không được để trống</span>
              <span *ngIf="loginForm.get('password')?.errors?.['minlength']">Mật khẩu phải có ít nhất 6 ký tự</span>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe">
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a routerLink="/forgot-password" class="forgot-link">Quên mật khẩu?</a>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-login" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Đăng nhập</span>
            <span *ngIf="isLoading" class="spinner"></span>
          </button>

          <!-- Error Message -->
          <div class="alert alert-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>

        <div class="login-footer">
          <p>Chưa có tài khoản? <a routerLink="/register">Đăng ký ngay</a></p>
        </div>

        <!-- Demo Account Info -->
        <div class="demo-info">
          <p style="font-weight: bold; margin-bottom: 8px;">📝 Tài khoản demo:</p>
          <p><strong>Tên đăng nhập:</strong> zizindz</p>
          <p><strong>Mật khẩu:</strong> 123456</p>
          <button class="btn-demo" (click)="fillDemoAccount()">🔑 Điền tài khoản demo</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 450px;
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

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      font-size: 2rem;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    .login-header h2 {
      font-size: 1.8rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .login-header p {
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #666;
    }

    .forgot-link {
      color: #667eea;
      text-decoration: none;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .btn-login {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102,126,234,0.4);
    }

    .btn-login:disabled {
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

    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }

    .login-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .demo-info {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .demo-info p {
      margin: 0.25rem 0;
      color: #666;
    }

    .btn-demo {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      width: 100%;
      transition: all 0.3s;
    }

    .btn-demo:hover {
      background: #5a67d8;
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  ngOnInit(): void {
    this.initForm();
    this.loadSavedUsername();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  private loadSavedUsername(): void {
    const savedUsername = localStorage.getItem('saved_username');
    if (savedUsername) {
      this.loginForm.patchValue({ userName: savedUsername, rememberMe: true });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  fillDemoAccount(): void {
    this.loginForm.patchValue({
      userName: 'zizindz',
      password: '123456'
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ SỬA LỖI: Lấy đúng giá trị từ form
    const credentials = {
      userName: this.loginForm.value.userName,  // ← Đã sửa từ 'username' thành 'userName'
      password: this.loginForm.value.password
    };

    console.log('Sending credentials:', credentials); // Debug

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login success:', response); // Debug
        
        // Save username if remember me is checked
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem('saved_username', credentials.userName);
        } else {
          localStorage.removeItem('saved_username');
        }
        
        // Redirect to home or previous page
        const returnUrl = localStorage.getItem('returnUrl') || '/';
        localStorage.removeItem('returnUrl');
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        console.error('Login error:', error); // Debug
        this.errorMessage = error.error?.message || error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập hoặc mật khẩu.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}