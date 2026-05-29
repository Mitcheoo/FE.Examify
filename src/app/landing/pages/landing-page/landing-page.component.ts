import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  template: '<div style="text-align:center;padding:2rem"><h1>Welcome to Examify</h1><p>Your exam management solution</p><button (click)="startNow()" style="padding:10px 20px;background:#3f51b5;color:white;border:none;border-radius:4px">Get Started</button></div>',
  styles: []
})
export class LandingPageComponent {
  startNow() {
    alert('Feature coming soon!');
  }
}
