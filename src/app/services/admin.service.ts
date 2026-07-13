// src/app/services/admin.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface AdminTransactionDto {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: string;
  status: string;
  description: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  walletBalance: number;
}

export interface AdminTransactionResponse {
  items: AdminTransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  thisMonthRevenue: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  last7Days: { date: string; revenue: number; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // ✅ SỬA: DÙNG CHUNG BASE URL
  private apiUrl = 'https://localhost:7241/api';
  private adminUrl = 'https://localhost:7241/api/admin';
  private paymentUrl = 'https://localhost:7241/api/payment';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : '',
      'Content-Type': 'application/json'
    });
  }

  // ============================================================
  // 👤 USER MANAGEMENT
  // ============================================================

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.adminUrl}/users`, { headers: this.getAuthHeaders() });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.adminUrl}/users/${id}`, { headers: this.getAuthHeaders() });
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/users/${id}`, data, { headers: this.getAuthHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/users/${id}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // 📚 EXERCISE MANAGEMENT
  // ============================================================

  getAllExercises(): Observable<any> {
    return this.http.get(`${this.adminUrl}/exercises`, { headers: this.getAuthHeaders() });
  }

  createExercise(data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/exercises`, data, { headers: this.getAuthHeaders() });
  }

  updateExercise(id: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/exercises/${id}`, data, { headers: this.getAuthHeaders() });
  }

  deleteExercise(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/exercises/${id}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // 📖 PART MANAGEMENT
  // ============================================================

  createPart(exerciseId: string, data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/exercises/${exerciseId}/parts`, data, { headers: this.getAuthHeaders() });
  }

  updatePart(exerciseId: string, partNumber: number, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/exercises/${exerciseId}/parts/${partNumber}`, data, { headers: this.getAuthHeaders() });
  }

  deletePart(exerciseId: string, partNumber: number): Observable<any> {
    return this.http.delete(`${this.adminUrl}/exercises/${exerciseId}/parts/${partNumber}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // ❓ READING QUESTIONS
  // ============================================================

  createReadingQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/exercises/${exerciseId}/reading-questions`, data, { headers: this.getAuthHeaders() });
  }

  updateReadingQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/exercises/${exerciseId}/reading-questions/${questionId}`, data, { headers: this.getAuthHeaders() });
  }

  deleteReadingQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/exercises/${exerciseId}/reading-questions/${questionId}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // 🎧 LISTENING QUESTIONS
  // ============================================================

  createListeningQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/exercises/${exerciseId}/listening-questions`, data, { headers: this.getAuthHeaders() });
  }

  updateListeningQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/exercises/${exerciseId}/listening-questions/${questionId}`, data, { headers: this.getAuthHeaders() });
  }

  deleteListeningQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/exercises/${exerciseId}/listening-questions/${questionId}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // ✍️ WRITING QUESTIONS
  // ============================================================

  createWritingQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/exercises/${exerciseId}/writing-questions`, data, { headers: this.getAuthHeaders() });
  }

  updateWritingQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/exercises/${exerciseId}/writing-questions/${questionId}`, data, { headers: this.getAuthHeaders() });
  }

  deleteWritingQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/exercises/${exerciseId}/writing-questions/${questionId}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // 🎙️ SPEAKING QUESTIONS
  // ============================================================

  createSpeakingQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/exercises/${exerciseId}/speaking-questions`, data, { headers: this.getAuthHeaders() });
  }

  updateSpeakingQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/exercises/${exerciseId}/speaking-questions/${questionId}`, data, { headers: this.getAuthHeaders() });
  }

  deleteSpeakingQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/exercises/${exerciseId}/speaking-questions/${questionId}`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // 📊 STATISTICS
  // ============================================================

  getStatistics(): Observable<any> {
    return this.http.get(`${this.adminUrl}/statistics`, { headers: this.getAuthHeaders() });
  }

  // ============================================================
  // 💳 PAYMENT MANAGEMENT (THÊM MỚI)
  // ============================================================

  /**
   * Lấy tất cả giao dịch của toàn bộ user (Admin)
   */
  getAllTransactions(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    type?: string,
    search?: string
  ): Observable<AdminTransactionResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (search) params = params.set('search', search);

    return this.http.get<AdminTransactionResponse>(
      `${this.paymentUrl}/admin/all-transactions`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /**
   * Lấy thống kê thanh toán (Admin)
   */
  getPaymentStats(): Observable<PaymentStats> {
    return this.http.get<PaymentStats>(
      `${this.paymentUrl}/admin/stats`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Lấy giao dịch của một user cụ thể (Admin)
   */
  getUserTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get(
      `${this.paymentUrl}/admin/user/${userId}/transactions`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  /**
   * Duyệt giao dịch đang chờ (Admin)
   */
  approveTransaction(transactionId: string): Observable<any> {
    return this.http.put(
      `${this.paymentUrl}/admin/transaction/${transactionId}/approve`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}