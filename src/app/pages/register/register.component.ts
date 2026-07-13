// 📁 src/app/pages/register/register.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
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

  // ✅ HÀM VALIDATOR: KIỂM TRA MẬT KHẨU KHỚP NHAU
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

  // ✅ HÀM XỬ LÝ SUBMIT - CÓ LOG ĐỂ DEBUG
  onSubmit(): void {
    console.log('🔄 [Register] Submit form...');
    console.log('📋 Form valid:', this.registerForm.valid);
    console.log('📋 Form values:', this.registerForm.value);
    
    // ✅ KIỂM TRA FORM INVALID TRƯỚC
    if (this.registerForm.invalid) {
      console.warn('⚠️ [Register] Form invalid, marking all fields as touched');
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      
      // ✅ HIỂN THỊ LỖI CỤ THỂ
      const errors: string[] = [];
      
      // Kiểm tra từng field
      const fields = ['fullName', 'userName', 'email', 'password', 'confirmPassword', 'agreeTerms'];
      fields.forEach(field => {
        const control = this.registerForm.get(field);
        if (control?.invalid) {
          const fieldName: Record<string, string> = {
            'fullName': 'Họ và tên',
            'userName': 'Tên đăng nhập',
            'email': 'Email',
            'password': 'Mật khẩu',
            'confirmPassword': 'Xác nhận mật khẩu',
            'agreeTerms': 'Đồng ý điều khoản'
          };
          errors.push(`⚠️ ${fieldName[field] || field} không hợp lệ`);
        }
      });
      
      // Kiểm tra mismatch
      if (this.registerForm.errors?.['mismatch']) {
        errors.push('⚠️ Mật khẩu xác nhận không khớp');
      }
      
      if (errors.length > 0) {
        this.errorMessage = errors.join('\n');
        console.warn('⚠️ [Register] Errors:', errors);
      }
      
      return;
    }

    // ✅ THỰC HIỆN ĐĂNG KÝ
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = {
      fullName: this.registerForm.value.fullName,
      userName: this.registerForm.value.userName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    console.log('📝 [Register] Attempt:', userData.userName);

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('✅ [Register] Success:', response);
        this.successMessage = '🎉 Đăng ký thành công! Vui lòng đăng nhập.';
        this.isLoading = false;
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (error) => {
        console.error('❌ [Register] Error:', error);
        
        // ✅ XỬ LÝ LỖI TỪ SERVER
        if (error.error?.errors) {
          // Validation errors từ .NET
          const messages = Object.values(error.error.errors).flat();
          this.errorMessage = messages.join('\n');
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
        }
        
        this.isLoading = false;
      }
    });
  }

  // ✅ HÀM LẤY LỖI TỪ FORM
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';
    
    const errors = control.errors;
    const messages: Record<string, string> = {
      'required': '⚠️ Không được để trống',
      'minlength': `⚠️ Tối thiểu ${control.errors?.['minlength']?.requiredLength || 0} ký tự`,
      'email': '⚠️ Email không hợp lệ',
      'mismatch': '⚠️ Mật khẩu không khớp'
    };
    
    const firstError = Object.keys(errors)[0];
    return messages[firstError] || '⚠️ Không hợp lệ';
  }
}