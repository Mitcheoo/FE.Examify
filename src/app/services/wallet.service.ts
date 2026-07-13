// src/app/services/wallet.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WalletDto {
  id: string;
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionDto {
  id: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: 'Deposit' | 'Purchase' | 'Refund';
  status: 'Pending' | 'Success' | 'Failed';
  description: string;
  paymentMethod: string;
  createdAt: string;
}

export interface PurchasedExerciseDto {
  id: string;
  exerciseId: string;
  title: string;
  skill: number;
  isFullTest: boolean;
  paidAmount: number;
  purchasedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/wallet`;

  /**
   * ✅ TẠO HEADERS VỚI TOKEN (DÙNG CHUNG)
   */
  private getHeaders(): HttpHeaders {
    // ✅ LẤY TOKEN VỚI KEY ĐÚNG (access_token)
    const token = localStorage.getItem('access_token');
    
    console.log('🔑 [WalletService] getHeaders - Token:', token ? '✅ Có' : '❌ Không');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * ✅ LẤY THÔNG TIN VÍ
   */
  getWallet(): Observable<WalletDto> {
    console.log('📤 [WalletService] getWallet');
    return this.http.get<WalletDto>(this.baseUrl, { headers: this.getHeaders() });
  }

  /**
   * ✅ LẤY SỐ DƯ
   */
  getBalance(): Observable<{ balance: number; totalDeposited: number; totalSpent: number }> {
    console.log('📤 [WalletService] getBalance');
    return this.http.get<{ balance: number; totalDeposited: number; totalSpent: number }>(
      `${this.baseUrl}/balance`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * ✅ LẤY LỊCH SỬ GIAO DỊCH
   */
  getTransactions(
    page: number = 1,
    pageSize: number = 10,
    type?: string
  ): Observable<PagedResult<TransactionDto>> {
    console.log('📤 [WalletService] getTransactions');
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<PagedResult<TransactionDto>>(
      `${this.baseUrl}/transactions`,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * ✅ LẤY DANH SÁCH BÀI ĐÃ MUA
   */
  getPurchasedExercises(): Observable<PurchasedExerciseDto[]> {
    console.log('📤 [WalletService] getPurchasedExercises');
    return this.http.get<PurchasedExerciseDto[]>(
      `${this.baseUrl}/purchased`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * ✅ KIỂM TRA BÀI ĐÃ MUA CHƯA
   */
  checkPurchased(exerciseId: string): Observable<{ isPurchased: boolean; purchasedAt?: string; paidAmount?: number }> {
    console.log('📤 [WalletService] checkPurchased:', exerciseId);
    return this.http.get<{ isPurchased: boolean; purchasedAt?: string; paidAmount?: number }>(
      `${this.baseUrl}/purchased/${exerciseId}`,
      { headers: this.getHeaders() }
    );
  }
}