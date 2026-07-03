// 📁 src/app/app.routes.ts

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
import { UserDetailComponent } from './pages/admin/pages/user-detail/user-detail.component';
import { ReadingComponent } from './pages/reading/reading.component';
import { ResultReadingComponent } from './pages/result-reading/result-reading.component';
import { FulltestResultComponent } from './pages/fulltest-result/fulltest-result.component';

// Admin Layout
import { AdminDashboardLayoutComponent } from './pages/admin/layout/dashboard-layout/dashboard-layout.component';
import { AdminDashboardPageComponent } from './pages/admin/pages/dashboard/dashboard.component';
import { SubmissionsComponent } from './pages/admin/pages/submissions/submissions.component';
import { UsersComponent } from './pages/admin/pages/users/users.component';
import { PaymentsComponent } from './pages/admin/pages/payments/payments.component';

// Manage Exams
import { ManageExamsPageComponent } from './pages/admin/pages/manage-exams/manage-exams.component';
import { CreateExamComponent } from './pages/admin/pages/manage-exams/create-exam/create-exam.component';
import { CreateFullTestComponent } from './pages/admin/pages/manage-exams/create-fulltest/create-fulltest.component';

// ✅ Import VocabularyComponent
import { VocabularyComponent } from './pages/vocabulary/vocabulary.component';
import { GrammarComponent } from './pages/grammar/grammar.component';
import { MySubmissionsComponent } from './pages/my-submissions/my-submissions.component';
import { SubmissionDetailComponent } from './pages/submission-detail/submission-detail.component'; 

// Guards
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // ============================================================
  // PUBLIC ROUTES
  // ============================================================
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // ============================================================
  // PROTECTED ROUTES (Cần đăng nhập)
  // ============================================================
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'exam-list', component: ExamListComponent, canActivate: [authGuard] },
  
  // ============================================================
  // TRANG EXERCISES THEO KỸ NĂNG
  // ============================================================
  { path: 'reading', component: ReadingComponent, canActivate: [authGuard] },
  { path: 'result/reading/:id', component: ResultReadingComponent, canActivate: [authGuard] },
  { path: 'result/reading', component: ResultReadingComponent, canActivate: [authGuard] },
  
  // ============================================================
  // TRANG EXERCISES TỔNG HỢP
  // ============================================================
  { path: 'exercises', component: ExamListComponent, canActivate: [authGuard] },
  
  // ============================================================
  // TRANG LÀM BÀI THEO KỸ NĂNG
  // ============================================================
  { path: 'exam/:id', component: ExamDetailComponent, canActivate: [authGuard] },
  { path: 'exam/:id/reading', component: ExamReadingComponent, canActivate: [authGuard] },
  { path: 'exam/:id/listening', component: ExamListeningComponent, canActivate: [authGuard] },
  { path: 'exam/:id/writing', component: ExamWritingComponent, canActivate: [authGuard] },
  { path: 'exam/:id/speaking', component: ExamSpeakingComponent, canActivate: [authGuard] },
  
  // ============================================================
  // TRANG KẾT QUẢ FULL TEST
  // ============================================================
  { path: 'fulltest/:id/result', component: FulltestResultComponent, canActivate: [authGuard] },
  
  // ============================================================
  // ✅ THÊM VOCABULARY (ĐƯA RA NGOÀI ADMIN)
  // ============================================================
  { path: 'vocabulary', component: VocabularyComponent, canActivate: [authGuard] },
 { path: 'my-submissions', component: MySubmissionsComponent, canActivate: [authGuard] },
{ path: 'submission/:id', component: SubmissionDetailComponent, canActivate: [authGuard] },
{ path: 'grammar', 
  component: GrammarComponent, 
  canActivate: [authGuard] 
},
  // ============================================================
  // ADMIN ROUTES
  // ============================================================
  {
    path: 'admin',
    component: AdminDashboardLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      // Dashboard
      { path: '', component: AdminDashboardPageComponent, pathMatch: 'full' },
      
      // Manage Exams
      { path: 'manage-exams', component: ManageExamsPageComponent },
      { path: 'manage-exams/create', component: CreateExamComponent },
      
      // Full Test questions
      { path: 'fulltest/:fullTestId/questions', component: CreateFullTestComponent },
      
      // Other admin pages
      { path: 'submissions', component: SubmissionsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'user/:id', component: UserDetailComponent },
      { path: 'payments', component: PaymentsComponent }
    ]
  },
  
  // ============================================================
  // REDIRECT
  // ============================================================
  { path: 'dashboard', redirectTo: 'admin', pathMatch: 'full' },
  
  // ============================================================
  // 404 - NOT FOUND
  // ============================================================
  { path: '**', redirectTo: '' }
];