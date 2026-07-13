// src/app/services/payment.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateOrderRequest {
  amountVND: number;
  exerciseId?: string;
}

export interface CreateOrderResponse {
  orderCode: string;
  payPalOrderId: string;
  approvalUrl: string;
  status: string;
  amountVND: number;
  amountUSD: number;
}

export interface CaptureOrderRequest {
  payPalOrderId: string;
}

export interface CaptureOrderResponse {
  payPalOrderId: string;
  status: string;
  captureId: string;
  captureStatus: string;
  amountVND: number;
  amountUSD: number;
  newBalance: number;
}

export interface PurchaseRequest {
  exerciseId: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  newBalance: number;
  exerciseId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payment`;

  /**
   * ✅ TẠO HEADERS VỚI TOKEN (DÙNG CHUNG)
   */
  private getHeaders(): HttpHeaders {
    // ✅ SỬA: LẤY TOKEN VỚI KEY 'access_token' (KHỚP VỚI AUTH SERVICE)
    const token = localStorage.getItem('access_token');
    
    console.log('🔑 [PaymentService] getHeaders - Token:', token ? '✅ Có' : '❌ Không');
    console.log('🔑 [PaymentService] getHeaders - Token value:', token ? token.substring(0, 30) + '...' : 'null');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Tạo đơn hàng PayPal
   */
  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    console.log('📤 [PaymentService] CreateOrder - Amount:', request.amountVND);
    
    return this.http.post<CreateOrderResponse>(
      `${this.baseUrl}/create-order`, 
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Capture thanh toán PayPal
   */
  captureOrder(orderCode: string, request: CaptureOrderRequest): Observable<CaptureOrderResponse> {
    console.log('📤 [PaymentService] CaptureOrder - OrderCode:', orderCode);
    
    return this.http.post<CaptureOrderResponse>(
      `${this.baseUrl}/capture-order/${orderCode}`, 
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Kiểm tra trạng thái giao dịch
   */
  getTransactionStatus(orderCode: string): Observable<{
    id: string;
    status: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }> {
    console.log('📤 [PaymentService] getTransactionStatus - OrderCode:', orderCode);
    
    return this.http.get<{
      id: string;
      status: string;
      amount: number;
      type: string;
      description: string;
      createdAt: string;
    }>(`${this.baseUrl}/transaction/${orderCode}`, { headers: this.getHeaders() });
  }

  /**
   * Mua bài thi
   */
  purchaseExercise(request: PurchaseRequest): Observable<PurchaseResponse> {
    console.log('📤 [PaymentService] PurchaseExercise - ExerciseId:', request.exerciseId);
    
    return this.http.post<PurchaseResponse>(
      `${this.baseUrl}/purchase`, 
      request,
      { headers: this.getHeaders() }
    );
  }
}