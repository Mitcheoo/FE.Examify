// src/app/pages/wallet/wallet.component.ts
import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService, WalletDto, TransactionDto, PurchasedExerciseDto } from '../../services/wallet.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>

    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-12">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">💰 Ví của tôi</h1>
            <p class="text-slate-500">Quản lý số dư và lịch sử giao dịch</p>
          </div>
          <div class="flex gap-2">
            <button 
              (click)="refreshData()"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              🔄 Làm mới
            </button>
            <button 
              (click)="goToDeposit()"
              class="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition">
              + Nạp tiền
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="spinner-border animate-spin inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p class="mt-3 text-slate-500">Đang tải dữ liệu...</p>
        </div>

        <!-- Content -->
        <ng-container *ngIf="!isLoading">
          <!-- Balance Card -->
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-blue-100 text-sm">Số dư hiện tại</p>
                <p class="text-3xl font-bold">{{ getBalance() | number:'1.0-0' }}đ</p>
              </div>
              <div class="text-right">
                <p class="text-blue-100 text-sm">Đã nạp</p>
                <p class="text-lg font-semibold">{{ getTotalDeposited() | number:'1.0-0' }}đ</p>
                <p class="text-blue-100 text-sm">Đã tiêu</p>
                <p class="text-lg font-semibold">{{ getTotalSpent() | number:'1.0-0' }}đ</p>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-2 mb-6 border-b border-slate-200">
            <button 
              class="px-4 py-2 font-medium transition"
              [class]="activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'"
              (click)="switchTab('transactions')">
              📜 Lịch sử giao dịch ({{ totalCount }})
            </button>
            <button 
              class="px-4 py-2 font-medium transition"
              [class]="activeTab === 'purchased' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'"
              (click)="switchTab('purchased')">
              📚 Bài đã mua ({{ purchasedExercises.length }})
            </button>
          </div>

          <!-- Transactions -->
          <div *ngIf="activeTab === 'transactions'" class="bg-white rounded-xl shadow-card overflow-hidden">
            <div *ngIf="transactions.length === 0" class="p-8 text-center text-slate-500">
              📭 Chưa có giao dịch nào
            </div>
            <div *ngFor="let tx of transactions" class="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50">
              <div class="flex items-center gap-3">
                <span class="text-2xl">
                  {{ tx.type === 'Deposit' ? '📥' : tx.type === 'Purchase' ? '📤' : '🔄' }}
                </span>
                <div>
                  <div class="font-medium text-slate-800">{{ tx.description || tx.type }}</div>
                  <div class="text-sm text-slate-500">
                    {{ tx.createdAt ? (tx.createdAt | date:'dd/MM/yyyy HH:mm') : '' }}
                    <span class="ml-2 px-2 py-0.5 rounded-full text-xs"
                          [class]="getStatusClass(tx.status)">
                      {{ tx.status || 'Unknown' }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold" [class.text-green-600]="tx.type === 'Deposit'" [class.text-red-600]="tx.type === 'Purchase'">
                  {{ tx.type === 'Deposit' ? '+' : '' }}{{ tx.amount | number:'1.0-0' }}đ
                </div>
                <div class="text-xs text-slate-400">Số dư: {{ tx.balanceAfter | number:'1.0-0' }}đ</div>
              </div>
            </div>
          </div>

          <!-- Purchased Exercises -->
          <div *ngIf="activeTab === 'purchased'" class="bg-white rounded-xl shadow-card overflow-hidden">
            <div *ngIf="purchasedExercises.length === 0" class="p-8 text-center text-slate-500">
              📭 Chưa mua bài thi nào
            </div>
            <div *ngFor="let item of purchasedExercises" class="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50">
              <div>
                <div class="font-medium text-slate-800">{{ item.title || 'Không tên' }}</div>
                <div class="text-sm text-slate-500">
                  {{ getSkillName(item.skill) }}
                  <span *ngIf="item.isFullTest" class="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">Full Test</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-slate-500">Đã mua: {{ item.purchasedAt ? (item.purchasedAt | date:'dd/MM/yyyy') : '' }}</div>
                <div class="text-sm font-medium text-slate-700">{{ item.paidAmount | number:'1.0-0' }}đ</div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="activeTab === 'transactions' && totalPages > 1" class="flex justify-between items-center mt-4">
            <div class="text-sm text-slate-500">
              Hiển thị {{ (currentPage - 1) * pageSize + 1 }} - 
              {{ Math.min(currentPage * pageSize, totalCount) }} / {{ totalCount }}
            </div>
            <div class="flex gap-2">
              <button 
                (click)="prevPage()"
                [disabled]="currentPage === 1"
                class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                ←
              </button>
              <button 
                (click)="nextPage()"
                [disabled]="currentPage === totalPages"
                class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                →
              </button>
            </div>
          </div>
        </ng-container>

      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    .shadow-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .spinner-border {
      width: 2.5rem;
      height: 2.5rem;
      border-width: 4px;
    }
  `]
})
// ✅ SỬA THÀNH WalletComponent
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  wallet: WalletDto | null = null;
  transactions: TransactionDto[] = [];
  purchasedExercises: PurchasedExerciseDto[] = [];
  activeTab: 'transactions' | 'purchased' = 'transactions';
  isLoading = true;
  isRefreshing = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  Math = Math;

  ngOnInit() {
    console.log('💰 [Wallet] Component initialized');
    this.loadAllData();
  }

  getBalance(): number {
    return this.wallet?.balance ?? 0;
  }

  getTotalDeposited(): number {
    return this.wallet?.totalDeposited ?? 0;
  }

  getTotalSpent(): number {
    return this.wallet?.totalSpent ?? 0;
  }

  loadAllData() {
    console.log('🔄 [Wallet] Loading all data...');
    this.isLoading = true;
    this.cdr.detectChanges();

    this.walletService.getWallet().subscribe({
      next: (data) => {
        console.log('✅ [Wallet] Wallet loaded:', data);
        this.wallet = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [Wallet] Load wallet error:', err);
        this.cdr.detectChanges();
      }
    });

    this.walletService.getTransactions(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        console.log('✅ [Wallet] Transactions loaded:', data.items?.length || 0);
        this.transactions = data.items || [];
        this.totalCount = data.totalCount || 0;
        this.totalPages = data.totalPages || Math.ceil(this.totalCount / this.pageSize);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [Wallet] Load transactions error:', err);
        this.cdr.detectChanges();
      }
    });

    this.walletService.getPurchasedExercises().subscribe({
      next: (data) => {
        console.log('✅ [Wallet] Purchased loaded:', data?.length || 0);
        this.purchasedExercises = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [Wallet] Load purchased error:', err);
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        console.log('✅ [Wallet] All data loaded complete');
      }
    });
  }

  refreshData() {
    console.log('🔄 [Wallet] Refreshing data...');
    this.isRefreshing = true;
    this.cdr.detectChanges();
    this.loadAllData();
    setTimeout(() => {
      this.isRefreshing = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  switchTab(tab: 'transactions' | 'purchased') {
    console.log('📌 [Wallet] Switch tab:', tab);
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'Success': 'bg-green-100 text-green-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Failed': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getSkillName(skill: number): string {
    const names: Record<number, string> = {
      0: 'Reading',
      1: 'Listening',
      2: 'Writing',
      3: 'Speaking',
      4: 'Full Test'
    };
    return names[skill] || 'Unknown';
  }

  goToDeposit() {
    console.log('🔀 [Wallet] Navigate to deposit');
    this.router.navigate(['/deposit']);
  }

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

  loadTransactions() {
    console.log('📄 [Wallet] Loading transactions page:', this.currentPage);
    
    this.walletService.getTransactions(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        this.transactions = data.items || [];
        this.totalCount = data.totalCount || 0;
        this.totalPages = data.totalPages || Math.ceil(this.totalCount / this.pageSize);
        this.cdr.detectChanges();
        console.log('✅ [Wallet] Transactions page loaded');
      },
      error: (err) => {
        console.error('❌ [Wallet] Load transactions error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}