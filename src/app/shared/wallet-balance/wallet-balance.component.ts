// src/app/shared/wallet-balance/wallet-balance.component.ts

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, timeout, catchError, of } from 'rxjs';

import { WalletService } from '../../services/wallet.service'; 

@Component({
  selector: 'app-wallet-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wallet-balance" (click)="goToWallet()" title="Xem ví">
      <span class="wallet-icon">💰</span>
      <span class="balance-text" *ngIf="!isLoading">{{ balance | number:'1.0-0' }}đ</span>
      <span class="balance-text" *ngIf="isLoading">...</span>
      <span class="wallet-label">Ví</span>
    </div>
  `,
  styles: [`
    .wallet-balance {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #f0fdf4;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #bbf7d0;
      user-select: none;
      min-width: 80px;
      justify-content: center;
    }
    .wallet-balance:hover {
      background: #dcfce7;
      border-color: #86efac;
      transform: scale(1.02);
    }
    .wallet-balance:active {
      transform: scale(0.98);
    }
    .wallet-icon {
      font-size: 18px;
    }
    .balance-text {
      font-weight: 600;
      color: #15803d;
      font-size: 15px;
      min-width: 30px;
      text-align: center;
    }
    .wallet-label {
      font-size: 12px;
      color: #6b7280;
    }
  `]
})
export class WalletBalanceComponent implements OnInit, OnDestroy {
  private walletService = inject(WalletService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  balance: number = 0;
  isLoading: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  ngOnInit() {
    console.log('💰 [WalletBalance] Component initialized');
    this.loadBalance();
  }

  loadBalance() {
    // ✅ SỬA: ĐỔI 'accessToken' THÀNH 'access_token' (KHỚP VỚI AUTH SERVICE)
    const token = localStorage.getItem('access_token');
    
    // ✅ LOG ĐỂ DEBUG
    console.log('🔑 [WalletBalance] Token exists:', !!token);
    console.log('🔑 [WalletBalance] Token:', token ? token.substring(0, 30) + '...' : 'null');
    
    if (!token) {
      console.warn('⚠️ [WalletBalance] No token found, skipping balance load');
      this.isLoading = false;
      this.balance = 0;
      this.cdr.detectChanges();
      return;
    }

    console.log('📤 [WalletBalance] Loading balance...');
    this.isLoading = true;
    this.cdr.detectChanges();

    this.walletService.getBalance()
      .pipe(
        takeUntil(this.destroy$),
        timeout(10000),
        catchError((err) => {
          console.error('❌ [WalletBalance] Error loading balance:', err);
          
          // ✅ NẾU LỖI 401, CHUYỂN HƯỚNG ĐẾN LOGIN
          if (err.status === 401) {
            console.warn('⚠️ [WalletBalance] Token expired, redirecting to login...');
            this.router.navigate(['/login']);
            return of({ balance: 0, totalDeposited: 0, totalSpent: 0 });
          }
          
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 [WalletBalance] Retry ${this.retryCount}/${this.maxRetries}...`);
            setTimeout(() => {
              this.loadBalance();
            }, 2000);
          }
          
          return of({ balance: 0, totalDeposited: 0, totalSpent: 0 });
        })
      )
      .subscribe({
        next: (data) => {
          console.log('✅ [WalletBalance] Balance loaded:', data.balance);
          this.balance = data.balance || 0;
          this.isLoading = false;
          this.retryCount = 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ [WalletBalance] Final error:', err);
          this.isLoading = false;
          this.balance = 0;
          this.cdr.detectChanges();
        }
      });
  }

  refreshBalance(): void {
    console.log('🔄 [WalletBalance] Refreshing balance...');
    this.loadBalance();
  }

  goToWallet() {
    console.log('🔀 [WalletBalance] Navigating to wallet...');
    this.router.navigate(['/wallet']);
  }

  ngOnDestroy() {
    console.log('💰 [WalletBalance] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}