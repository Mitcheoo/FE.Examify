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
import { ListeningComponent } from './pages/listening/listening.component';
import { WritingComponent } from './pages/writing/writing.component';
import { ResultReadingComponent } from './pages/result-reading/result-reading.component';
import { ResultListeningComponent } from './pages/result-listening/result-listening.component';
import { ResultWritingComponent } from './pages/result-writing/result-writing.component';
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
import { AddQuestionsComponent } from './pages/admin/pages/manage-exams/add-questions/add-questions.component';

// ✅ Admin Vocabulary
import { AdminVocabularyComponent } from './pages/admin/pages/vocabulary/vocabulary.component';

// Vocabulary & Grammar (User)
import { VocabularyComponent } from './pages/vocabulary/vocabulary.component';
import { GrammarComponent } from './pages/grammar/grammar.component';
import { MySubmissionsComponent } from './pages/my-submissions/my-submissions.component';
import { SubmissionDetailComponent } from './pages/submission-detail/submission-detail.component';

// PAYMENT & WALLET
import { WalletComponent } from './pages/wallet/wallet.component';
import { DepositComponent } from './pages/deposit/deposit.component';
import { PaymentCallbackComponent } from './pages/payment/payment-callback.component';

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
  { path: 'listening', component: ListeningComponent, canActivate: [authGuard] },
  { path: 'writing', component: WritingComponent, canActivate: [authGuard] },

  // ============================================================
  // TRANG KẾT QUẢ
  // ============================================================
  { path: 'result/reading/:id', component: ResultReadingComponent, canActivate: [authGuard] },
  { path: 'result/reading', component: ResultReadingComponent, canActivate: [authGuard] },
  { path: 'result/listening/:id', component: ResultListeningComponent, canActivate: [authGuard] },
  { path: 'result/listening', component: ResultListeningComponent, canActivate: [authGuard] },
  { path: 'result/writing/:id', component: ResultWritingComponent, canActivate: [authGuard] },
  { path: 'result/writing', component: ResultWritingComponent, canActivate: [authGuard] },

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
  // VOCABULARY & GRAMMAR (USER)
  // ============================================================
  { path: 'vocabulary', component: VocabularyComponent, canActivate: [authGuard] },
  { path: 'my-submissions', component: MySubmissionsComponent, canActivate: [authGuard] },
  { path: 'submission/:id', component: SubmissionDetailComponent, canActivate: [authGuard] },
  { path: 'grammar', component: GrammarComponent, canActivate: [authGuard] },

  // ============================================================
  // WALLET & PAYMENT
  // ============================================================
  { path: 'wallet', component: WalletComponent, canActivate: [authGuard] },
  { path: 'deposit', component: DepositComponent, canActivate: [authGuard] },
  { path: 'payment/success', component: PaymentCallbackComponent, canActivate: [authGuard] },
  { path: 'payment/cancel', redirectTo: '/wallet' },

  // ============================================================
  // ADMIN ROUTES
  // ============================================================
  {
    path: 'admin',
    component: AdminDashboardLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      // ==========================================================
      // DASHBOARD
      // ==========================================================
      { path: '', component: AdminDashboardPageComponent, pathMatch: 'full' },
      
      // ==========================================================
      // QUẢN LÝ BÀI THI
      // ==========================================================
      { path: 'manage-exams', component: ManageExamsPageComponent },
      { path: 'manage-exams/create', component: CreateExamComponent },
      { path: 'exercises/:id/add-questions', component: AddQuestionsComponent },
      { path: 'fulltest/:fullTestId/questions', component: CreateFullTestComponent },
      
      // ==========================================================
      // QUẢN LÝ TỪ VỰNG
      // ==========================================================
      { path: 'vocabulary', component: AdminVocabularyComponent },
      { path: 'vocabulary/create', component: AdminVocabularyComponent },
      { path: 'vocabulary/:id/edit', component: AdminVocabularyComponent },
      
      // ==========================================================
      // QUẢN LÝ NGƯỜI DÙNG
      // ==========================================================
      { path: 'users', component: UsersComponent },
      { path: 'user/:id', component: UserDetailComponent },
      
      // ==========================================================
      // QUẢN LÝ BÀI NỘP ✅ ĐÃ CẬP NHẬT
      // ==========================================================
      { path: 'submissions', component: SubmissionsComponent },
      { path: 'submissions/:id', component: SubmissionsComponent }, // Chi tiết bài nộp
      
      // ==========================================================
      // QUẢN LÝ THANH TOÁN
      // ==========================================================
      { path: 'payments', component: PaymentsComponent },
      { path: 'payments/:id', component: PaymentsComponent },
      
      // ==========================================================
      // REDIRECT
      // ==========================================================
      { path: 'dashboard', redirectTo: '/admin', pathMatch: 'full' },
    ]
  },

  // ============================================================
  // 404 - NOT FOUND
  // ============================================================
  { path: '**', redirectTo: '' },
];