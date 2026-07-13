// src/app/pages/payment/payment-callback.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        
        <!-- ✅ LOADING -->
        <div *ngIf="status === 'loading'" class="py-8">
          <div class="spinner-border animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p class="mt-4 text-slate-600">Đang xác nhận thanh toán...</p>
          <p class="mt-2 text-sm text-slate-400">Vui lòng không đóng trang này</p>
        </div>

        <!-- ✅ SUCCESS -->
        <div *ngIf="status === 'success'" class="py-8">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-2xl font-bold text-green-600">Thanh toán thành công!</h2>
          <p class="text-slate-600 mt-2">{{ amount | number:'1.0-0' }}đ đã được cộng vào ví của bạn</p>
          <button 
            (click)="goToWallet()"
            class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            💰 Xem ví
          </button>
        </div>

        <!-- ✅ ERROR -->
        <div *ngIf="status === 'error'" class="py-8">
          <div class="text-6xl mb-4">❌</div>
          <h2 class="text-2xl font-bold text-red-600">Thanh toán thất bại!</h2>
          <p class="text-slate-600 mt-2">{{ errorMessage || 'Có lỗi xảy ra, vui lòng thử lại!' }}</p>
          <button 
            (click)="goToDeposit()"
            class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            🔄 Thử lại
          </button>
        </div>

        <!-- ✅ TIMEOUT (Nếu quá 30s vẫn chưa xong) -->
        <div *ngIf="status === 'timeout'" class="py-8">
          <div class="text-6xl mb-4">⏰</div>
          <h2 class="text-2xl font-bold text-orange-600">Đang xử lý...</h2>
          <p class="text-slate-600 mt-2">Thanh toán của bạn đang được xử lý.</p>
          <p class="text-slate-500 text-sm mt-1">Vui lòng kiểm tra số dư sau vài phút</p>
          <button 
            (click)="goToWallet()"
            class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            💰 Kiểm tra ví
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .spinner-border {
      width: 3rem;
      height: 3rem;
      border-width: 4px;
    }
  `]
})
export class PaymentCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private walletService = inject(WalletService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // ✅ THÊM ChangeDetectorRef

  status: 'loading' | 'success' | 'error' | 'timeout' = 'loading';
  amount: number = 0;
  errorMessage: string = '';
  private timeoutId: any = null;

  ngOnInit() {
    console.log('🚀 [PaymentCallback] Component initialized');
    console.log('🔍 [PaymentCallback] Checking URL params...');
    
    // ✅ LOG TOKEN ĐỂ DEBUG
    const token = localStorage.getItem('accessToken');
    console.log('🔑 [PaymentCallback] Token exists:', !!token);
    
    if (!token) {
      console.warn('⚠️ [PaymentCallback] No token found!');
      this.status = 'error';
      this.errorMessage = 'Vui lòng đăng nhập lại để tiếp tục';
      this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
      return;
    }

    // ✅ ĐẶT TIMEOUT 30s NẾU CHƯA XONG
    this.timeoutId = setTimeout(() => {
      if (this.status === 'loading') {
        console.warn('⏰ [PaymentCallback] Timeout after 30s');
        this.status = 'timeout';
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
      }
    }, 30000);

    this.route.queryParams.subscribe({
      next: (params) => {
        const orderCode = params['orderCode'];
        const payPalOrderId = params['token'];
        const payerId = params['PayerID'];
        
        console.log('📥 [PaymentCallback] Params:', { orderCode, payPalOrderId, payerId });
        
        if (orderCode && payPalOrderId) {
          this.captureOrder(orderCode, payPalOrderId);
        } else {
          console.error('❌ [PaymentCallback] Missing required params');
          this.status = 'error';
          this.errorMessage = 'Không tìm thấy thông tin đơn hàng';
          this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
        }
      },
      error: (err) => {
        console.error('❌ [PaymentCallback] Error reading params:', err);
        this.status = 'error';
        this.errorMessage = 'Có lỗi khi đọc thông tin thanh toán';
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
      }
    });
  }

  captureOrder(orderCode: string, payPalOrderId: string) {
    console.log('📤 [PaymentCallback] Capturing order...');
    console.log(`📋 Order Code: ${orderCode}`);
    console.log(`🆔 PayPal Order ID: ${payPalOrderId}`);
    
    // ✅ CẬP NHẬT UI LẦN 1
    this.status = 'loading';
    this.cdr.detectChanges();

    this.paymentService.captureOrder(orderCode, { payPalOrderId }).subscribe({
      next: (response) => {
        console.log('✅ [PaymentCallback] Capture success:', response);
        
        this.amount = response.amountVND;
        this.status = 'success';
        
        // Xóa pending deposit
        localStorage.removeItem('pendingDeposit');
        
        // ✅ CẬP NHẬT SỐ DƯ TRÊN HEADER (NẾU CẦN)
        // Có thể gọi event hoặc reload wallet balance
        this.walletService.getBalance().subscribe({
          next: (balance) => {
            console.log('💰 [PaymentCallback] New balance:', balance);
          }
        });
        
        // ✅ FORCE UPDATE UI LẦN 2
        this.cdr.detectChanges();
        
        // ✅ CLEAR TIMEOUT
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
      },
      error: (err) => {
        console.error('❌ [PaymentCallback] Capture failed:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.error?.message || err.message);
        
        this.status = 'error';
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi xác nhận thanh toán';
        
        // ✅ FORCE UPDATE UI LẦN 2
        this.cdr.detectChanges();
        
        // ✅ CLEAR TIMEOUT
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
      }
    });
  }

  // ✅ HÀM ĐIỀU HƯỚNG - CÓ THỂ THÊM LOG
  goToWallet() {
    console.log('🔀 [PaymentCallback] Navigating to wallet...');
    this.router.navigate(['/wallet']);
  }

  goToDeposit() {
    console.log('🔀 [PaymentCallback] Navigating to deposit...');
    this.router.navigate(['/deposit']);
  }

  // ✅ CLEANUP
  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}