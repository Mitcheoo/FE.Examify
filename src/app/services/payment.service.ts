import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CreateOrder {
  orderCode: string;
  exerciseId: string;
  totalAmount: number;
  currency: string;
}

export interface CaptureOrder {
  orderCode: string;
  paypalOrderId: string;
}

export interface CreateOrderResponse {
  orderCode: string;
  payPalOrderId: string;
  status: string;
  approvalUrl: string;
}

export interface CaptureOrderResponse {
  payPalOrderId: string;
  status: string;
  captureId?: string;
  captureStatus: string;
  rawResponse?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = 'https://localhost:7241/api/payment';

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
        'Authorization': token ? 'Bearer ' + token : ''
        });
    }

    createOrder(data: CreateOrder): Observable<CreateOrderResponse> {
        const headers = this.getAuthHeaders();
        return this.http.post<CreateOrderResponse>(this.apiUrl + '/create-order', data, { headers });
    }

    
  captureOrder(data: CaptureOrder): Observable<CaptureOrderResponse> {
    const url =
      `${this.apiUrl}/capture-order/` +
      encodeURIComponent(data.orderCode);

    const body = {
      paypalOrderId: data.paypalOrderId
    };

    return this.http.post<CaptureOrderResponse>(
      url,
      body,
      {
        headers: this.getAuthHeaders()
      }
    );
  }
}
