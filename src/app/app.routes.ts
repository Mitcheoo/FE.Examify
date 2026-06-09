import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ExamListComponent } from './pages/exam-list/exam-list.component';
import { ExamDetailComponent } from './pages/exam-detail/exam-detail.component';          //reading
import { ExamReadingComponent } from './pages/exam-reading/exam-reading.component';
import { authGuard } from './guards/auth.guard';

import { ExamListeningComponent } from './pages/exam-listening/exam-listening.component'; // listening

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'exam-list', component: ExamListComponent },
  { path: 'exam/:id', component: ExamDetailComponent },
  { path: 'exam/:id/reading', component: ExamReadingComponent, canActivate: [authGuard] },
 
  { path: 'exam/:id/listening', component: ExamListeningComponent, canActivate: [authGuard] },
   { path: '**', redirectTo: '' }
];