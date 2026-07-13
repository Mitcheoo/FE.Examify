// src/app/pages/deposit/deposit.component.ts
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentService, CreateOrderResponse } from '../../services/payment.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>

    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-12">
      <div class="max-w-md mx-auto px-4">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-slate-800">💳 Nạp tiền vào ví</h1>
          <p class="text-slate-500">Chọn số tiền bạn muốn nạp</p>
        </div>

        <!-- Amount Selection -->
        <div class="bg-white rounded-2xl shadow-card p-6 mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Số tiền (VND)
          </label>
          
          <div class="grid grid-cols-3 gap-3 mb-4">
            <button 
              *ngFor="let amount of suggestedAmounts"
              (click)="selectedAmount = amount"
              class="py-3 border rounded-xl font-medium transition"
              [class]="selectedAmount === amount ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-blue-300'">
              {{ amount | number:'1.0-0' }}đ
            </button>
          </div>

          <input 
            type="number"
            [(ngModel)]="selectedAmount"
            placeholder="Nhập số tiền khác..."
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <!-- PayPal Button -->
        <button 
          (click)="deposit()"
          [disabled]="!selectedAmount || selectedAmount < 10000 || isProcessing"
          class="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition">
          <span *ngIf="!isProcessing">
            💳 Nạp {{ selectedAmount | number:'1.0-0' }}đ qua PayPal
          </span>
          <span *ngIf="isProcessing" class="flex items-center justify-center gap-2">
            <span class="spinner-border animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            Đang xử lý...
          </span>
        </button>

        <!-- Info -->
        <div class="mt-4 text-center text-sm text-slate-500">
          <p>💰 Bạn sẽ được chuyển đến PayPal để thanh toán</p>
          <p>🔄 Sau khi thanh toán, tiền sẽ tự động được cập nhật vào ví</p>
        </div>

        <!-- Error -->
        <div *ngIf="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          ⚠️ {{ error }}
        </div>

        <!-- Success -->
        <div *ngIf="success" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
          ✅ {{ success }}
        </div>

      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    .shadow-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .spinner-border {
      width: 1.2rem;
      height: 1.2rem;
      border-width: 2px;
    }
  `]
})
export class DepositComponent {
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // ✅ THÊM ChangeDetectorRef

  suggestedAmounts = [20000, 50000, 100000, 200000, 500000, 1000000];
  selectedAmount: number = 50000;
  isProcessing = false;
  error = '';
  success = '';
  private checkInterval: any = null;
  private maxCheckAttempts = 10;
  private checkAttempts = 0;

  deposit() {
    // ✅ LOG
    console.log('💰 [Deposit] Bắt đầu nạp tiền:', this.selectedAmount);

    // Validate
    if (!this.selectedAmount || this.selectedAmount < 10000) {
      this.error = 'Số tiền tối thiểu là 10,000 VND';
      this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
      return;
    }

    // Reset states
    this.error = '';
    this.success = '';
    this.isProcessing = true;
    this.checkAttempts = 0;
    this.cdr.detectChanges(); // ✅ FORCE UPDATE UI

    this.paymentService.createOrder({ amountVND: this.selectedAmount }).subscribe({
      next: (response) => {
        console.log('✅ [Deposit] Order created:', response);
        
        this.isProcessing = false;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
        
        // Lưu thông tin để xử lý callback
        localStorage.setItem('pendingDeposit', JSON.stringify({
          orderCode: response.orderCode,
          payPalOrderId: response.payPalOrderId,
          amount: this.selectedAmount,
          timestamp: new Date().toISOString()
        }));

        // Mở PayPal trong tab mới
        window.open(response.approvalUrl, '_blank');
        
        // Hiển thị hướng dẫn
        this.success = `Đã tạo đơn hàng ${this.selectedAmount.toLocaleString()}đ. Vui lòng hoàn tất thanh toán trên PayPal.`;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
        
        // ✅ CHỜ 5s RỒI BẮT ĐẦU CHECK
        setTimeout(() => {
          this.startCheckingStatus(response.orderCode);
        }, 5000);
      },
      error: (err) => {
        console.error('❌ [Deposit] Create order failed:', err);
        this.isProcessing = false;
        this.error = err.error?.message || 'Có lỗi xảy ra, vui lòng thử lại!';
        this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
      }
    });
  }

  // ✅ BẮT ĐẦU CHECK TRẠNG THÁI
  startCheckingStatus(orderCode: string) {
    console.log('🔍 [Deposit] Bắt đầu check status:', orderCode);
    
    // Xóa interval cũ nếu có
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // ✅ CHECK NGAY LẬP TỨC
    this.checkPaymentStatus(orderCode);

    // ✅ CHECK MỖI 5 GIÂY
    this.checkInterval = setInterval(() => {
      this.checkPaymentStatus(orderCode);
    }, 5000);
  }

  checkPaymentStatus(orderCode: string) {
    this.checkAttempts++;
    console.log(`🔍 [Deposit] Check attempt ${this.checkAttempts}/${this.maxCheckAttempts}`);

    this.paymentService.getTransactionStatus(orderCode).subscribe({
      next: (data) => {
        console.log(`📊 [Deposit] Status:`, data);
        
        if (data.status === 'Success') {
          this.success = '✅ Nạp tiền thành công! Số dư đã được cập nhật.';
          this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
          
          // Dừng check
          this.stopChecking();
          
          // Chuyển về wallet sau 2s
          setTimeout(() => {
            this.router.navigate(['/wallet']);
          }, 2000);
          
        } else if (data.status === 'Pending') {
          // Vẫn đang chờ, tiếp tục check
          console.log('⏳ [Deposit] Vẫn đang chờ thanh toán...');
          
          // Nếu quá số lần check
          if (this.checkAttempts >= this.maxCheckAttempts) {
            this.stopChecking();
            this.error = '⏰ Quá thời gian chờ thanh toán. Vui lòng kiểm tra lại sau!';
            this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
          }
          
        } else {
          // Failed hoặc status khác
          this.stopChecking();
          this.error = `❌ Giao dịch thất bại: ${data.status}`;
          this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
        }
      },
      error: (err) => {
        console.error('❌ [Deposit] Check status error:', err);
        
        // Nếu API bị 404, có thể transaction chưa được tạo
        if (err.status === 404) {
          console.warn('⚠️ [Deposit] Transaction not found, may need manual check');
          // Không làm gì, tiếp tục check
        } else if (this.checkAttempts >= this.maxCheckAttempts) {
          this.stopChecking();
          this.error = '⏰ Không thể kiểm tra trạng thái. Vui lòng kiểm tra lại sau!';
          this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
        }
      }
    });
  }

  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isProcessing = false;
    this.cdr.detectChanges(); // ✅ FORCE UPDATE UI
    console.log('🛑 [Deposit] Stopped checking status');
  }

  // ✅ CLEANUP
  ngOnDestroy() {
    this.stopChecking();
  }
}