import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ExamListComponent } from './pages/exam-list/exam-list.component';
import { ExamDetailComponent } from './pages/exam-detail/exam-detail.component';
import { ExamReadingComponent } from './pages/exam-reading/exam-reading.component';
import { ExamListeningComponent } from './pages/exam-listening/exam-listening.component';
import { ExamWritingComponent } from './pages/exam-writing/exam-writing.component';
import { ExamSpeakingComponent } from './pages/exam-speaking/exam-speaking.component';
import { AdminDashboardLayoutComponent } from './pages/admin/layout/dashboard-layout/dashboard-layout.component';
import { AdminDashboardPageComponent } from './pages/admin/pages/dashboard/dashboard.component';
import { ManageExamsPageComponent } from './pages/admin/pages/manage-exams/manage-exams.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'dashboard', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'exam-list', component: ExamListComponent },
  { path: 'exam/:id', component: ExamDetailComponent },
  { path: 'exam/:id/reading', component: ExamReadingComponent, canActivate: [authGuard] },
  { path: 'exam/:id/listening', component: ExamListeningComponent, canActivate: [authGuard] },
  { path: 'exam/:id/writing', component: ExamWritingComponent, canActivate: [authGuard] },
  { path: 'exam/:id/speaking', component: ExamSpeakingComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminDashboardLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', component: AdminDashboardPageComponent, pathMatch: 'full' },
      { path: 'manage-exams', component: ManageExamsPageComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
