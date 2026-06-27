import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  CaptureOrderResponse,
  PaymentService
} from '../../services/payment.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.scss'
})
export class OrderSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  isProcessing = false;
  isCompleted = false;
  errorMessage = '';
  orderCode = '';

  ngOnInit(): void {
    const orderCode =
      this.route.snapshot.queryParamMap.get('orderCode');

    const paypalOrderId =
      this.route.snapshot.queryParamMap.get('token');

    if (!orderCode || !paypalOrderId) {
      this.errorMessage =
        'Không tìm thấy thông tin thanh toán trong URL.';
      return;
    }

    this.orderCode = orderCode;
    this.captureOrder(orderCode, paypalOrderId);
  }

  private captureOrder(
    orderCode: string,
    paypalOrderId: string
  ): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.isCompleted = false;
    this.errorMessage = '';

    this.paymentService
      .captureOrder({
        orderCode,
        paypalOrderId
      })
      .pipe(
        finalize(() => {
          this.isProcessing = false;
        })
      )
      .subscribe({
        next: (response: CaptureOrderResponse) => {
          const orderCompleted =
            response.status?.toUpperCase() === 'COMPLETED';

          const captureCompleted =
            response.captureStatus?.toUpperCase() === 'COMPLETED';

          if (!orderCompleted || !captureCompleted) {
            this.isCompleted = false;
            this.errorMessage =
              'Giao dịch chưa được PayPal xác nhận hoàn tất.';
            return;
          }

          this.errorMessage = '';
          this.isCompleted = true;
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            this.getErrorMessage(error);
        }
      });
  }

  private getErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      error.error &&
      typeof error.error === 'object'
    ) {
      const message = error.error.message
        ?? error.error.Message;

      if (typeof message === 'string') {
        return message;
      }
    }

    if (error.status === 400) {
      return 'Thông tin thanh toán không hợp lệ.';
    }

    if (error.status === 401) {
      return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.';
    }

    if (error.status === 404) {
      return 'Không tìm thấy đơn hàng.';
    }

    return 'Không thể xác nhận thanh toán.';
  }

  goHome(): void {
    void this.router.navigate(['/'], {
      replaceUrl: true
    });
  }
}