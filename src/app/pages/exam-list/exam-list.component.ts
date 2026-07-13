// src/app/pages/exam-list/exam-list.component.ts

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { WalletService } from '../../services/wallet.service';
import { Exercise } from '../../models/exam/exam.model';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

type SortOption = 'newest' | 'oldest' | 'popular' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc' | 'most-questions';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    HeaderComponent, 
    FooterComponent, 
    ConfirmationModalComponent
  ],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss']
})
export class ExamListComponent implements OnInit {
  private examService = inject(ExamService);
  private walletService = inject(WalletService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  exams: Exercise[] = [];
  filteredExams: Exercise[] = [];
  allExams: Exercise[] = [];
  isLoading = true;
  
  Math = Math;
  
  // ✅ PHÂN TRANG
  currentPage: number = 1;
  pageSize: number = 9;
  totalItems: number = 0;
  totalPages: number = 0;
  
  // ✅ SEARCH
  searchKeyword: string = '';
  private searchTimeout: any = null;
  
  // ✅ SORT
  showSortDropdown: boolean = false;
  currentSort: SortOption = 'newest';
  sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'newest', label: 'Mới nhất', icon: '🔥' },
    { value: 'oldest', label: 'Cũ nhất', icon: '📅' },
    { value: 'popular', label: 'Phổ biến', icon: '⭐' },
    { value: 'price-asc', label: 'Giá tăng dần', icon: '💰' },
    { value: 'price-desc', label: 'Giá giảm dần', icon: '💎' },
    { value: 'title-asc', label: 'Tên A-Z', icon: '🔤' },
    { value: 'title-desc', label: 'Tên Z-A', icon: '🔤' },
    { value: 'most-questions', label: 'Nhiều câu nhất', icon: '📝' }
  ];
  
  purchasedMap: Map<string, boolean> = new Map();
  isProcessingPurchase: Map<string, boolean> = new Map();

  // ✅ MODAL STATE
  showModal: boolean = false;
  modalData: {
    exam: Exercise | null;
    balance: number;
    title: string;
    message: string;
    icon: string;
    confirmText: string;
    showCancelButton: boolean;
    details: { label: string; value: string }[];
  } = {
    exam: null,
    balance: 0,
    title: 'Xác nhận mua bài',
    message: '',
    icon: '💰',
    confirmText: 'Mua ngay',
    showCancelButton: true,
    details: []
  };
  isProcessingModal: boolean = false;

  ngOnInit() {
    console.log('🔵 ExamListComponent initialized');
    this.loadExams();
  }

  // ✅ LOAD EXAMS
  loadExams() {
    console.log('🔄 Loading Full Tests...');
    this.isLoading = true;
    
    this.examService.getExercisesList(1, 1000).subscribe({
      next: (response) => {
        console.log('📦 Response received:', response);
        
        let allExams = response.items || [];
        
        // ✅ LỌC FULL TEST
        let fullTests = allExams.filter((exam: Exercise) => exam.isFullTest === true);
        
        console.log('📦 Full Tests found:', fullTests.length);
        
        // ✅ LƯU TẤT CẢ ĐỂ TÌM KIẾM
        this.allExams = [...fullTests];
        this.exams = [...fullTests];
        
        // ✅ SẮP XẾP TRƯỚC KHI ÁP DỤNG TÌM KIẾM
        const sorted = this.applySort(fullTests);
        this.exams = sorted;
        
        // ✅ ÁP DỤNG TÌM KIẾM NẾU CÓ
        if (this.searchKeyword) {
          this.applySearch();
        } else {
          this.applyPagination(sorted);
        }
        
        this.checkPurchasedStatuses();
      },
      error: (err) => {
        console.error('❌ Error loading exams:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // ✅ SORT METHODS
  // ============================================================

  applySort(exams: Exercise[]): Exercise[] {
    const sorted = [...exams];
    
    switch (this.currentSort) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
        
      case 'popular':
        return sorted.sort((a, b) => (b.attemptCount || 0) - (a.attemptCount || 0));
        
      case 'price-asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        
      case 'price-desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        
      case 'title-asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        
      case 'title-desc':
        return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        
      case 'most-questions':
        return sorted.sort((a, b) => (b.totalQuestions || 0) - (a.totalQuestions || 0));
        
      default:
        return sorted;
    }
  }

  changeSort(sortOption: SortOption) {
    if (this.currentSort === sortOption) return;
    
    this.currentSort = sortOption;
    console.log(`📊 Sorting by: ${sortOption}`);
    
    // Áp dụng sắp xếp cho danh sách hiện tại
    const sorted = this.applySort(this.exams);
    this.exams = sorted;
    
    // Nếu đang tìm kiếm, áp dụng tìm kiếm trên danh sách đã sắp xếp
    if (this.searchKeyword) {
      this.applySearch();
    } else {
      this.applyPagination(sorted);
    }
    
    this.cdr.detectChanges();
  }

  getCurrentSortLabel(): string {
    const option = this.sortOptions.find(opt => opt.value === this.currentSort);
    return option ? `${option.icon} ${option.label}` : 'Sắp xếp';
  }

  // ============================================================
  // ✅ SEARCH METHODS
  // ============================================================
  
  onSearch() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.applySearch();
    }, 300);
  }

  applySearch() {
  if (!this.searchKeyword || this.searchKeyword.trim() === '') {
    // Nếu không có từ khóa, hiển thị tất cả (có phân trang)
    this.applyPagination(this.exams);
    return;
  }
  
  const keyword = this.searchKeyword.toLowerCase().trim();
  
  const filtered = this.exams.filter((exam: Exercise) => {
    if (exam.title && exam.title.toLowerCase().includes(keyword)) {
      return true;
    }
    if (exam.description && exam.description.toLowerCase().includes(keyword)) {
      return true;
    }
    return false;
  });
  
  // ✅ Nếu không có kết quả, set filteredExams = [] và không hiển thị gì
  if (filtered.length === 0) {
    this.filteredExams = [];
    this.totalItems = 0;
    this.totalPages = 0;
    this.currentPage = 1;
    console.log(`🔍 No results found for "${keyword}"`);
  } else {
    // Có kết quả, hiển thị tất cả (không phân trang)
    this.filteredExams = filtered;
    this.totalItems = filtered.length;
    this.totalPages = 1;
    this.currentPage = 1;
    console.log(`🔍 Search results for "${keyword}": ${filtered.length} found`);
  }
  
  this.isLoading = false;
  this.cdr.detectChanges();
}

clearSearch() {
  this.searchKeyword = '';
  // Reset về trang 1 và load lại
  this.currentPage = 1;
  this.loadExams();
}
  // ============================================================
  // ✅ PAGINATION METHODS
  // ============================================================
  
  applyPagination(exams: Exercise[]) {
    this.totalItems = exams.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pagedExams = exams.slice(startIndex, endIndex);
    
    console.log(`📄 Page ${this.currentPage}/${this.totalPages}, Showing ${pagedExams.length} exams`);
    
    this.filteredExams = [...pagedExams];
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    if (page === this.currentPage) return;
    
    this.currentPage = page;
    this.loadExams();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }
    
    const pages: number[] = [];
    const current = this.currentPage;
    const total = this.totalPages;
    
    pages.push(1);
    
    if (current > 3) {
      pages.push(-1);
    }
    
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    
    if (current < total - 2) {
      pages.push(-1);
    }
    
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  }

  // ============================================================
  // GIỮ NGUYÊN CÁC METHOD CŨ
  // ============================================================

  checkPurchasedStatuses() {
    this.filteredExams.forEach(exam => {
      this.walletService.checkPurchased(exam.id).subscribe({
        next: (result) => {
          this.purchasedMap.set(exam.id, result.isPurchased);
          this.cdr.detectChanges();
        },
        error: () => {
          this.purchasedMap.set(exam.id, false);
        }
      });
    });
  }

  isPurchased(examId: string): boolean {
    return this.purchasedMap.get(examId) || false;
  }

  isProcessing(examId: string): boolean {
    return this.isProcessingPurchase.get(examId) || false;
  }

  async openPurchaseModal(exam: Exercise, event: Event) {
    event?.stopPropagation();
    
    if (this.isProcessing(exam.id)) return;
    
    try {
      const balanceData = await this.walletService.getBalance().toPromise();
      const currentBalance = balanceData?.balance || 0;
      
      if (currentBalance < exam.price) {
        this.showModal = true;
        this.modalData = {
          exam: exam,
          balance: currentBalance,
          title: '⚠️ Số dư không đủ',
          message: `Bạn cần thêm ${(exam.price - currentBalance).toLocaleString()}đ để mua bài thi này.`,
          icon: '⚠️',
          confirmText: 'Nạp tiền',
          showCancelButton: true,
          details: [
            { label: '💰 Số dư hiện tại', value: `${currentBalance.toLocaleString()}đ` },
            { label: '💳 Giá bài thi', value: `${exam.price.toLocaleString()}đ` },
            { label: '📉 Cần thêm', value: `${(exam.price - currentBalance).toLocaleString()}đ` }
          ]
        };
        this.cdr.detectChanges();
        return;
      }
      
      this.showModal = true;
      this.modalData = {
        exam: exam,
        balance: currentBalance,
        title: '💰 Xác nhận mua bài',
        message: `Bạn có chắc chắn muốn mua bài thi "${exam.title}" không?`,
        icon: '💰',
        confirmText: 'Mua ngay',
        showCancelButton: true,
        details: [
          { label: '📖 Bài thi', value: exam.title },
          { label: '💰 Số dư hiện tại', value: `${currentBalance.toLocaleString()}đ` },
          { label: '💳 Giá bài thi', value: `${exam.price.toLocaleString()}đ` },
          { label: '📉 Số dư sau khi mua', value: `${(currentBalance - exam.price).toLocaleString()}đ` }
        ]
      };
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('❌ Lỗi khi mở modal:', error);
    }
  }

  async confirmPurchase() {
    const exam = this.modalData.exam;
    if (!exam) return;
    
    this.isProcessingModal = true;
    this.cdr.detectChanges();
    
    this.isProcessingPurchase.set(exam.id, true);
    
    this.examService.purchaseExercise(exam.id).subscribe({
      next: (result) => {
        console.log('✅ Mua bài thành công:', result);
        
        this.purchasedMap.set(exam.id, true);
        this.isProcessingPurchase.set(exam.id, false);
        
        this.isProcessingModal = false;
        this.modalData = {
          exam: exam,
          balance: result.newBalance || 0,
          title: '✅ Mua bài thành công!',
          message: `Bạn đã mua thành công bài thi "${exam.title}". Chúc bạn học tốt! 🎉`,
          icon: '🎉',
          confirmText: 'Làm bài ngay',
          showCancelButton: false,
          details: [
            { label: '📖 Bài thi', value: exam.title },
            { label: '💰 Số dư mới', value: `${(result.newBalance || 0).toLocaleString()}đ` },
            { label: '💳 Đã trả', value: `${exam.price.toLocaleString()}đ` }
          ]
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Mua bài thất bại:', err);
        this.isProcessingPurchase.set(exam.id, false);
        this.isProcessingModal = false;
        
        this.modalData = {
          exam: exam,
          balance: this.modalData.balance || 0,
          title: '❌ Mua bài thất bại',
          message: err.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!',
          icon: '❌',
          confirmText: 'Thử lại',
          showCancelButton: true,
          details: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.isProcessingModal = false;
    this.cdr.detectChanges();
  }

  onModalConfirm() {
    const exam = this.modalData.exam;
    
    if (this.modalData.title?.includes('thành công')) {
      this.closeModal();
      if (exam) {
        this.router.navigate(['/exam', exam.id]);
      }
    } else if (this.modalData.title?.includes('không đủ')) {
      this.closeModal();
      this.router.navigate(['/deposit']);
    } else {
      this.confirmPurchase();
    }
  }

  onModalCancel() {
    this.closeModal();
  }

  purchaseExam(exam: Exercise, event: Event) {
    this.openPurchaseModal(exam, event);
  }

  startExam(exam: Exercise, event: Event) {
    event?.stopPropagation();
    this.router.navigate(['/exam', exam.id]);
  }

  onExamClick(exam: Exercise) {
    console.log('📌 Clicked exam:', exam.title);
    
    if (exam.isFree || exam.price === 0) {
      this.router.navigate(['/exam', exam.id]);
      return;
    }
    
    if (exam.price && exam.price > 0 && !this.isPurchased(exam.id) && !exam.isFree) {
      this.openPurchaseModal(exam, new Event('click'));
      return;
    }
    
    this.router.navigate(['/exam', exam.id]);
  }
}