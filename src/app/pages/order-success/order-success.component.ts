import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.scss',
})
export class OrderSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);

  readonly isProcessing = signal(false);
  readonly isCompleted = signal(false);
  readonly errorMessage = signal('');
  readonly orderCode = signal('');

  ngOnInit(): void {
    const orderCode = this.route.snapshot.queryParamMap.get('orderCode');

    const paypalOrderId = this.route.snapshot.queryParamMap.get('token');

    if (!orderCode || !paypalOrderId) {
      this.errorMessage.set('Không tìm thấy thông tin thanh toán trong URL.');
      return;
    }

    this.orderCode.set(orderCode);
    this.captureOrder(orderCode, paypalOrderId);
  }

  private captureOrder(orderCode: string, paypalOrderId: string): void {
    if (this.isProcessing()) {
      return;
    }

    this.isProcessing.set(true);
    this.isCompleted.set(false);
    this.errorMessage.set('');

    this.paymentService
      .captureOrder({
        orderCode,
        paypalOrderId,
      })
      .subscribe({
        next: (response) => {
          console.log('Capture thành công:', response);

          this.isProcessing.set(false);
          this.isCompleted.set(true);
          this.errorMessage.set('');
        },

        error: (error: HttpErrorResponse) => {
          console.error('Capture thất bại:', error);

          this.isProcessing.set(false);
          this.isCompleted.set(false);
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error && typeof error.error === 'object') {
      const message = error.error.message ?? error.error.Message;

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
      replaceUrl: true,
    });
  }
}
