// 📁 src/app/pages/login/login.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      userName: this.loginForm.value.userName,
      password: this.loginForm.value.password
    };

    console.log('🔐 Login attempt:', credentials.userName);

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Login success:', response);
        
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem('saved_username', credentials.userName);
        } else {
          localStorage.removeItem('saved_username');
        }
        
        const returnUrl = localStorage.getItem('returnUrl') || '/';
        localStorage.removeItem('returnUrl');
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        this.errorMessage = error.error?.message || error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập hoặc mật khẩu.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}