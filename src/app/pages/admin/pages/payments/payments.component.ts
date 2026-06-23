// src/app/pages/admin/pages/payments/payments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Payment {
  id: string;
  transactionId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: 'PayPal' | 'Credit Card' | 'Bank Transfer';
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  description: string;
  paidAt: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule ],  
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">💳 Payments</h1>
          <p class="mt-1 text-gray-600">Manage all payment transactions.</p>
        </div>
        <div class="flex gap-3">
          <button class="inline-flex items-center rounded-3xl bg-emerald-600 px-5 py-3 text-white shadow-sm hover:bg-emerald-700 transition">
            📊 Reports
          </button>
          <button class="inline-flex items-center rounded-3xl bg-gray-600 px-5 py-3 text-white shadow-sm hover:bg-gray-700 transition">
            📥 Export
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Total Revenue</p>
          <p class="text-2xl font-bold text-emerald-600">$12,450</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Total Transactions</p>
          <p class="text-2xl font-bold text-blue-600">1,284</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">This Month</p>
          <p class="text-2xl font-bold text-purple-600">$1,230</p>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p class="text-sm text-gray-500">Pending</p>
          <p class="text-2xl font-bold text-yellow-600">12</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="flex flex-wrap gap-4">
        <input type="text" placeholder="Search transactions..." 
               class="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
        <select class="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Status</option>
          <option>Completed</option>
          <option>Pending</option>
          <option>Failed</option>
          <option>Refunded</option>
        </select>
        <select class="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>All Methods</option>
          <option>PayPal</option>
          <option>Credit Card</option>
          <option>Bank Transfer</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Transaction</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">User</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Amount</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Method</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Status</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Description</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Date</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr *ngFor="let payment of payments" class="hover:bg-slate-50 transition">
                <td class="px-4 py-4">
                  <p class="font-mono text-xs text-gray-600">{{ payment.transactionId }}</p>
                </td>
                <td class="px-4 py-4">
                  <div>
                    <p class="font-medium text-gray-900">{{ payment.userName }}</p>
                    <p class="text-xs text-gray-500">{{ payment.userEmail }}</p>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <p class="font-semibold text-gray-900">{{ payment.amount }} {{ payment.currency }}</p>
                </td>
                <td class="px-4 py-4">
                  <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                        [class]="getMethodBadge(payment.method)">
                    {{ payment.method }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                        [class]="getStatusClass(payment.status)">
                    {{ payment.status }}
                  </span>
                </td>
                <td class="px-4 py-4 text-gray-600 text-sm">{{ payment.description }}</td>
                <td class="px-4 py-4 text-gray-500 text-sm">{{ payment.paidAt }}</td>
                <td class="px-4 py-4">
                  <div class="flex gap-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm">Details</button>
                    <button *ngIf="payment.status === 'Pending'" class="text-emerald-600 hover:text-emerald-800 text-sm">Approve</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];

  ngOnInit() {
    this.payments = [
      {
        id: '1',
        transactionId: 'TXN-2026-001',
        userName: 'Nguyễn Văn A',
        userEmail: 'vana@email.com',
        amount: 15.00,
        currency: 'USD',
        method: 'PayPal',
        status: 'Completed',
        description: 'VSTEP Full Test 2',
        paidAt: '2026-06-17 14:30'
      },
      {
        id: '2',
        transactionId: 'TXN-2026-002',
        userName: 'Trần Thị B',
        userEmail: 'thib@email.com',
        amount: 10.00,
        currency: 'USD',
        method: 'Credit Card',
        status: 'Pending',
        description: 'Reading Test 1',
        paidAt: '2026-06-17 13:15'
      },
      {
        id: '3',
        transactionId: 'TXN-2026-003',
        userName: 'Lê Văn C',
        userEmail: 'vanc@email.com',
        amount: 15.00,
        currency: 'USD',
        method: 'Bank Transfer',
        status: 'Failed',
        description: 'Writing Test 2',
        paidAt: '2026-06-17 11:00'
      },
      {
        id: '4',
        transactionId: 'TXN-2026-004',
        userName: 'Phạm Thị D',
        userEmail: 'thid@email.com',
        amount: 20.00,
        currency: 'USD',
        method: 'PayPal',
        status: 'Refunded',
        description: 'Full Test Package',
        paidAt: '2026-06-16 09:20'
      }
    ];
  }

  getMethodBadge(method: string): string {
    const map: Record<string, string> = {
      'PayPal': 'bg-blue-100 text-blue-700',
      'Credit Card': 'bg-purple-100 text-purple-700',
      'Bank Transfer': 'bg-orange-100 text-orange-700'
    };
    return map[method] || 'bg-gray-100 text-gray-700';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Completed': 'bg-emerald-100 text-emerald-700',
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Failed': 'bg-red-100 text-red-700',
      'Refunded': 'bg-gray-100 text-gray-700'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }
}