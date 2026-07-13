// src/app/shared/components/confirmation-modal/confirmation-modal.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fadeIn" (click)="onOverlayClick($event)">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn relative">
        
        <!-- Close button -->
        <button 
          (click)="onCancel()"
          class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
          ✕
        </button>
        
        <!-- Icon -->
        <div class="text-center mb-4">
          <div class="text-5xl mb-2">{{ icon || '💰' }}</div>
          <h3 class="text-xl font-bold text-slate-800">{{ title || 'Xác nhận' }}</h3>
        </div>
        
        <!-- Content -->
        <div class="space-y-3 text-center">
          <p class="text-slate-600">{{ message }}</p>
          
          <!-- Thông tin thêm -->
          <div *ngIf="details && details.length > 0" class="bg-slate-50 rounded-xl p-4 text-left space-y-1">
            <div *ngFor="let detail of details" class="text-sm text-slate-600 flex justify-between">
              <span class="font-medium">{{ detail.label }}:</span>
              <span class="text-slate-800">{{ detail.value }}</span>
            </div>
          </div>
        </div>
        
        <!-- Buttons -->
        <div class="flex gap-3 mt-6">
          <button 
            (click)="onCancel()"
            *ngIf="showCancelButton"
            class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition">
            {{ cancelText || 'Hủy' }}
          </button>
          <button 
            (click)="onConfirm()"
            [disabled]="isLoading"
            class="flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition flex items-center justify-center gap-2"
            [class]="confirmColor || 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg'"
            [class.opacity-50]="isLoading">
            <span *ngIf="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ isLoading ? 'Đang xử lý...' : (confirmText || 'Xác nhận') }}
          </button>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
    .animate-scaleIn {
      animation: scaleIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Xác nhận';
  @Input() message: string = '';
  @Input() icon: string = '💰';
  @Input() confirmText: string = 'Xác nhận';
  @Input() cancelText: string = 'Hủy';
  @Input() confirmColor: string = 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg';
  @Input() isLoading: boolean = false;
  @Input() showCancelButton: boolean = true;
  @Input() details: { label: string; value: string }[] = [];
  
  @Output() onConfirmEvent = new EventEmitter<void>();
  @Output() onCancelEvent = new EventEmitter<void>();

  onConfirm() {
    this.onConfirmEvent.emit();
  }

  onCancel() {
    this.onCancelEvent.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}