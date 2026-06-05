import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    const token = this.authService.getToken();
    const currentUser = this.authService.getCurrentUser();
    
    console.log('🚀 AppComponent - Token exists:', !!token);
    console.log('🚀 AppComponent - User from storage:', currentUser?.fullName || 'No user');
    console.log('🚀 AppComponent - isLoggedIn:', this.authService.isLoggedIn());
    
    // Không cần gọi API ở đây nữa vì AuthService đã tự động load profile
    // Nếu muốn kiểm tra, có thể subscribe vào currentUser$
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('✅ AppComponent - User loaded:', user.fullName);
      }
    });
  }
}