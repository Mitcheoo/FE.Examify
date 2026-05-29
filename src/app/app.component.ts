import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Test interceptor
    const token = this.authService.getToken();
    console.log('AppComponent - Token on init:', !!token);
    
    if (token) {
      this.http.get('https://localhost:7241/api/auth/profile').subscribe({
        next: (res) => console.log('Profile loaded from AppComponent:', res),
        error: (err) => console.error('Profile error from AppComponent:', err.status)
      });
    }
  }
}
