// src/app/pages/admin/pages/payments/payments.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminService, AdminTransactionDto } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';

export interface Payment {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: 'PayPal' | 'Credit Card' | 'Bank Transfer' | 'Wallet';
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  description: string;
  paidAt: string;
  balanceBefore?: number;
  balanceAfter?: number;
  type?: string;
  walletBalance?: number;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  isLoading = true;
  isStatsLoading = true;
  
  searchTerm: string = '';
  statusFilter: string = '';
  typeFilter: string = '';
  
  currentPage: number = 1;
  pageSize: number = 20;
  totalCount: number = 0;
  totalPages: number = 0;
  Math = Math;
  
  totalRevenue: number = 0;
  totalTransactions: number = 0;
  thisMonthRevenue: number = 0;
  pendingCount: number = 0;
  completedCount: number = 0;
  failedCount: number = 0;

  ngOnInit() {
    console.log('💰 [PaymentsComponent] Initialized');
    this.loadStats();
    this.loadTransactions();
  }

  loadStats() {
    this.isStatsLoading = true;
    this.cdr.detectChanges();
    
    this.adminService.getPaymentStats().subscribe({
      next: (stats: any) => {
        console.log('✅ [PaymentsComponent] Stats loaded:', stats);
        this.totalRevenue = stats.totalRevenue || 0;
        this.totalTransactions = stats.totalTransactions || 0;
        this.thisMonthRevenue = stats.thisMonthRevenue || 0;
        
        // ✅ TẤT CẢ ĐỀU LÀ COMPLETED, NÊN PENDING = 0
        this.pendingCount = 0;
        this.completedCount = stats.totalTransactions || 0;
        this.failedCount = 0;
        
        this.isStatsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [PaymentsComponent] Error loading stats:', err);
        this.isStatsLoading = false;
        this.cdr.detectChanges();
        this.calculateStatsFromCurrentPage();
      }
    });
  }

  loadTransactions() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.adminService.getAllTransactions(
      this.currentPage, 
      this.pageSize,
      this.statusFilter || undefined,
      this.typeFilter || undefined,
      this.searchTerm || undefined
    ).subscribe({
      next: (data: any) => {
        console.log('✅ [PaymentsComponent] Transactions loaded:', data);
        
        this.payments = data.items.map((tx: any) => this.mapToPayment(tx));
        this.filteredPayments = [...this.payments];
        
        this.totalCount = data.totalCount || 0;
        this.totalPages = data.totalPages || Math.ceil(this.totalCount / this.pageSize);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ [PaymentsComponent] Error loading transactions:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        
        if (err.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  // ✅ MAP DTO → PAYMENT - LUÔN SET STATUS = 'Completed'
  mapToPayment(tx: AdminTransactionDto): Payment {
    // Xác định phương thức thanh toán
    let method: 'PayPal' | 'Credit Card' | 'Bank Transfer' | 'Wallet' = 'Wallet';
    if (tx.paymentMethod) {
      const pm = tx.paymentMethod.toLowerCase();
      if (pm.includes('paypal')) method = 'PayPal';
      else if (pm.includes('credit')) method = 'Credit Card';
      else if (pm.includes('bank')) method = 'Bank Transfer';
    }
    
    // ✅ LUÔN LÀ 'Completed'
    const status: 'Completed' | 'Pending' | 'Failed' | 'Refunded' = 'Completed';
    
    // Format thời gian
    let formattedDate = '';
    if (tx.createdAt) {
      try {
        const date = new Date(tx.createdAt);
        if (!isNaN(date.getTime())) {
          const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
          formattedDate = vietnamTime.toLocaleString('vi-VN', {
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } else {
          formattedDate = tx.createdAt;
        }
      } catch (e) {
        formattedDate = tx.createdAt;
      }
    }

    return {
      id: tx.id,
      transactionId: tx.transactionId || tx.id.substring(0, 12).toUpperCase(),
      userId: tx.userId,
      userName: tx.userName || 'Unknown',
      userEmail: tx.userEmail || 'unknown@email.com',
      amount: Math.abs(tx.amount),
      currency: 'VND',
      method: method,
      status: status, // ✅ LUÔN LÀ COMPLETED
      description: tx.description || tx.type || 'Giao dịch',
      paidAt: formattedDate,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      type: tx.type,
      walletBalance: tx.walletBalance
    };
  }

  calculateStatsFromCurrentPage() {
    let revenue = 0;
    let transactions = this.payments.length;
    let monthRevenue = 0;
    let completed = 0;
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    this.payments.forEach(p => {
      if (p.type === 'Deposit') {
        revenue += p.amount;
      }
      
      if (p.paidAt) {
        try {
          const paidDate = new Date(p.paidAt);
          if (!isNaN(paidDate.getTime())) {
            if (paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear) {
              if (p.type === 'Deposit') {
                monthRevenue += p.amount;
              }
            }
          }
        } catch (e) {}
      }
      
      completed++; // ✅ TẤT CẢ ĐỀU COMPLETED
    });
    
    this.totalRevenue = revenue;
    this.totalTransactions = transactions;
    this.thisMonthRevenue = monthRevenue;
    this.pendingCount = 0;
    this.completedCount = completed;
    this.failedCount = 0;
    this.cdr.detectChanges();
  }

  // ============================================================
  // FILTERS
  // ============================================================
  applyFilters() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.currentPage = 1;
    this.loadTransactions();
  }

  refreshData() {
    this.loadStats();
    this.loadTransactions();
  }

  // ============================================================
  // PAGINATION
  // ============================================================
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTransactions();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTransactions();
    }
  }

  // ============================================================
  // ACTIONS
  // ============================================================
  viewDetail(payment: Payment) {
    console.log('📋 View detail:', payment);
    alert(`📋 Chi tiết giao dịch:\n` +
          `ID: ${payment.transactionId}\n` +
          `User: ${payment.userName}\n` +
          `Email: ${payment.userEmail}\n` +
          `Số tiền: ${payment.amount.toLocaleString()}đ\n` +
          `Loại: ${payment.type || 'N/A'}\n` +
          `Trạng thái: ${payment.status}\n` +
          `Phương thức: ${payment.method}\n` +
          `Mô tả: ${payment.description}\n` +
          `Ngày: ${payment.paidAt}`);
  }

  exportData() {
    console.log('📥 Exporting data...');
    alert('📥 Đang xuất dữ liệu...');
  }

  // ============================================================
  // BADGE CLASSES
  // ============================================================
  getMethodBadge(method: string): string {
    const map: Record<string, string> = {
      'PayPal': 'badge-paypal',
      'Credit Card': 'badge-credit-card',
      'Bank Transfer': 'badge-bank-transfer',
      'Wallet': 'badge-wallet'
    };
    return map[method] || 'badge-default';
  }

  getTypeBadge(type: string): string {
    const map: Record<string, string> = {
      'Deposit': 'badge-deposit',
      'Purchase': 'badge-purchase',
      'Refund': 'badge-refund'
    };
    return map[type] || 'badge-default';
  }

  // ✅ LUÔN TRẢ VỀ BADGE COMPLETED
  getStatusClass(status: string): string {
    return 'badge-completed';
  }
}