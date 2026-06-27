// app.routes.ts

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

// ✅ THÊM IMPORTS CHO TRANG DANH SÁCH THEO KỸ NĂNG
import { ReadingComponent } from './pages/reading/reading.component';
// import { ListeningComponent } from './pages/listening/listening.component';
// import { WritingComponent } from './pages/writing/writing.component';
// import { SpeakingComponent } from './pages/speaking/speaking.component';

// Admin
import { AdminDashboardLayoutComponent } from './pages/admin/layout/dashboard-layout/dashboard-layout.component';
import { AdminDashboardPageComponent } from './pages/admin/pages/dashboard/dashboard.component';
import { ManageExamsPageComponent } from './pages/admin/pages/manage-exams/manage-exams.component';
import { CreateExamComponent } from './pages/admin/pages/manage-exams/create-exam/create-exam.component';
import { SubmissionsComponent } from './pages/admin/pages/submissions/submissions.component';
import { UsersComponent } from './pages/admin/pages/users/users.component';
import { PaymentsComponent } from './pages/admin/pages/payments/payments.component';
import { ResultReadingComponent } from './pages/result-reading/result-reading.component';

import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { FulltestResultComponent } from './pages/fulltest-result/fulltest-result.component';
import { OrderSuccessComponent } from './pages/order-success/order-success.component';

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
  // TRANG EXERCISES THEO KỸ NĂNG ✅ THÊM MỚI
  // ============================================================
  { path: 'reading', component: ReadingComponent, canActivate: [authGuard] },
    { path: 'result/reading/:id', component: ResultReadingComponent, canActivate: [authGuard] },
      { path: 'result/reading', component: ResultReadingComponent, canActivate: [authGuard] },
  // { path: 'listening', component: ListeningComponent, canActivate: [authGuard] },
  // { path: 'writing', component: WritingComponent, canActivate: [authGuard] },
  // { path: 'speaking', component: SpeakingComponent, canActivate: [authGuard] },
  
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
  // TRANG KẾT QUẢ FULL TEST
  // ============================================================
  { path: 'ordersuccess', component: OrderSuccessComponent, canActivate: [authGuard] },
  
  // ============================================================
  // ADMIN ROUTES
  // ============================================================
  {
    path: 'admin',
    component: AdminDashboardLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', component: AdminDashboardPageComponent, pathMatch: 'full' },
      { path: 'manage-exams', component: ManageExamsPageComponent },
      { path: 'manage-exams/create', component: CreateExamComponent },
      { path: 'submissions', component: SubmissionsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'user/:id', component: UserDetailComponent },
      { path: 'payments', component: PaymentsComponent }
    ]
  },
  
  // ============================================================
  // REDIRECT 404
  // ============================================================
  { path: 'dashboard', redirectTo: 'admin', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];