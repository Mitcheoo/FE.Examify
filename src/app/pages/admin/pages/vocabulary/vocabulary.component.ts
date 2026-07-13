// 📁 src/app/pages/admin/pages/vocabulary/vocabulary.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AdminVocabularyService, VocabularyWordDto, CreateVocabularyWordDto, UpdateVocabularyWordDto } from '../../../../services/admin-vocabulary.service';
import { AuthService } from '../../../../services/auth.service';

export interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  partOfSpeech: string;
  level: string;
  topic: string;
  audioUrl?: string;
  imageUrl?: string;
  vietnameseExample?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  // Progress stats (từ progress)
  totalUsers: number;
  masteredCount: number;
  learningCount: number;
  masteryRate: number;
}

@Component({
  selector: 'app-admin-vocabulary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.scss']
})
export class AdminVocabularyComponent implements OnInit {
  private adminVocabularyService = inject(AdminVocabularyService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  vocabularyWords: VocabularyWord[] = [];
  filteredWords: VocabularyWord[] = [];
  isLoading = true;
  Math = Math;

  // Filters
  searchTerm: string = '';
  levelFilter: string = '';
  topicFilter: string = '';
  statusFilter: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;

  // Stats
  totalWords: number = 0;
  totalMastered: number = 0;
  totalLearning: number = 0;
  averageMasteryRate: number = 0;

  // Modal
  showModal: boolean = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  selectedWord: VocabularyWord | null = null;
  isSubmitting: boolean = false;

  // Form data
  formData: CreateVocabularyWordDto = {
    word: '',
    meaning: '',
    pronunciation: '',
    example: '',
    partOfSpeech: '',
    level: 'B1',
    topic: '',
    audioUrl: '',
    imageUrl: '',
    vietnameseExample: ''
  };

  // Dropdown options
  levelOptions = ['A1', 'A2', 'B1', 'B2', 'C1'];
  topicOptions: string[] = [];
  partOfSpeechOptions = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection'];

  // Toast
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  showToast: boolean = false;

  ngOnInit() {
    console.log('📚 [AdminVocabularyComponent] Initialized');
    this.loadVocabulary();
  }

  // ============================================================
  // LOAD DATA
  // ============================================================

  loadVocabulary() {
    this.isLoading = true;
    this.cdr.detectChanges();

    const params: any = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.searchTerm) params.search = this.searchTerm;
    if (this.levelFilter) params.level = this.levelFilter;
    if (this.topicFilter) params.topic = this.topicFilter;
    if (this.statusFilter) params.status = this.statusFilter;

    this.adminVocabularyService.getVocabularyList(params).subscribe({
      next: (data: any) => {
        console.log('✅ [AdminVocabularyComponent] Vocabulary loaded:', data);
        
        this.vocabularyWords = data.items.map((item: any) => this.mapToWord(item));
        this.filteredWords = [...this.vocabularyWords];
        this.totalCount = data.totalCount || 0;
        this.totalPages = data.totalPages || Math.ceil(this.totalCount / this.pageSize);
        
        // Update topic options
        const allTopics = this.vocabularyWords
          .map(w => w.topic)
          .filter(t => t && t.trim() !== '');
        this.topicOptions = [...new Set(allTopics)];

        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [AdminVocabularyComponent] Error loading vocabulary:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.showToastMessage('Không thể tải danh sách từ vựng', 'error');
      }
    });
  }

  mapToWord(item: any): VocabularyWord {
    // Tính toán thống kê từ progress (nếu có)
    const masteredCount = item.masteredCount || 0;
    const learningCount = item.learningCount || 0;
    const totalUsers = masteredCount + learningCount;
    const masteryRate = totalUsers > 0 ? Math.round((masteredCount / totalUsers) * 100) : 0;

    return {
      id: item.id,
      word: item.word,
      meaning: item.meaning,
      pronunciation: item.pronunciation || '',
      example: item.example,
      partOfSpeech: item.partOfSpeech || '',
      level: item.level || 'B1',
      topic: item.topic || '',
      audioUrl: item.audioUrl,
      imageUrl: item.imageUrl,
      vietnameseExample: item.vietnameseExample,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isDeleted: item.isDeleted || false,
      totalUsers: totalUsers,
      masteredCount: masteredCount,
      learningCount: learningCount,
      masteryRate: masteryRate
    };
  }

  calculateStats() {
    this.totalWords = this.vocabularyWords.length;
    this.totalMastered = this.vocabularyWords.filter(w => w.masteredCount > 0).length;
    this.totalLearning = this.totalWords - this.totalMastered;
    
    const totalMastery = this.vocabularyWords.reduce((sum, w) => sum + w.masteryRate, 0);
    this.averageMasteryRate = this.totalWords > 0 ? Math.round(totalMastery / this.totalWords) : 0;
  }

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  openCreateModal() {
    this.modalMode = 'create';
    this.selectedWord = null;
    this.formData = {
      word: '',
      meaning: '',
      pronunciation: '',
      example: '',
      partOfSpeech: '',
      level: 'B1',
      topic: '',
      audioUrl: '',
      imageUrl: '',
      vietnameseExample: ''
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(word: VocabularyWord) {
    this.modalMode = 'edit';
    this.selectedWord = word;
    this.formData = {
      word: word.word,
      meaning: word.meaning,
      pronunciation: word.pronunciation || '',
      example: word.example,
      partOfSpeech: word.partOfSpeech || '',
      level: word.level || 'B1',
      topic: word.topic || '',
      audioUrl: word.audioUrl || '',
      imageUrl: word.imageUrl || '',
      vietnameseExample: word.vietnameseExample || ''
    };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openViewModal(word: VocabularyWord) {
    this.modalMode = 'view';
    this.selectedWord = word;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.selectedWord = null;
    this.isSubmitting = false;
    this.cdr.detectChanges();
  }

  submitForm() {
    // Validate
    if (!this.formData.word || !this.formData.meaning || !this.formData.example) {
      this.showToastMessage('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    if (this.modalMode === 'create') {
      this.adminVocabularyService.createWord(this.formData).subscribe({
        next: (result) => {
          console.log('✅ Word created:', result);
          this.showToastMessage('Tạo từ vựng thành công!', 'success');
          this.closeModal();
          this.loadVocabulary();
        },
        error: (err) => {
          console.error('❌ Create error:', err);
          this.showToastMessage(err.error?.message || 'Không thể tạo từ vựng', 'error');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.modalMode === 'edit' && this.selectedWord) {
      const updateData: UpdateVocabularyWordDto = this.formData;
      this.adminVocabularyService.updateWord(this.selectedWord.id, updateData).subscribe({
        next: (result) => {
          console.log('✅ Word updated:', result);
          this.showToastMessage('Cập nhật từ vựng thành công!', 'success');
          this.closeModal();
          this.loadVocabulary();
        },
        error: (err) => {
          console.error('❌ Update error:', err);
          this.showToastMessage(err.error?.message || 'Không thể cập nhật từ vựng', 'error');
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteWord(word: VocabularyWord) {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ vựng "${word.word}"?`)) {
      return;
    }

    this.adminVocabularyService.deleteWord(word.id).subscribe({
      next: () => {
        console.log('✅ Word deleted:', word.id);
        this.showToastMessage(`Đã xóa từ vựng "${word.word}"`, 'success');
        this.loadVocabulary();
      },
      error: (err) => {
        console.error('❌ Delete error:', err);
        this.showToastMessage(err.error?.message || 'Không thể xóa từ vựng', 'error');
      }
    });
  }

  toggleStatus(word: VocabularyWord) {
    // Admin không toggle mastery, chỉ xem thống kê
    this.openViewModal(word);
  }

  // ============================================================
  // FILTERS & SEARCH
  // ============================================================

  applyFilters() {
    this.currentPage = 1;
    this.loadVocabulary();
  }

  clearFilters() {
    this.searchTerm = '';
    this.levelFilter = '';
    this.topicFilter = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadVocabulary();
  }

  refreshData() {
    this.loadVocabulary();
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVocabulary();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVocabulary();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadVocabulary();
    }
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(current + 1, total - 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }

    return pages;
  }

  // ============================================================
  // TOAST
  // ============================================================

  showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  closeToast() {
    this.showToast = false;
    this.cdr.detectChanges();
  }

  // ============================================================
  // HELPERS
  // ============================================================

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'A1': 'badge-level-a1',
      'A2': 'badge-level-a2',
      'B1': 'badge-level-b1',
      'B2': 'badge-level-b2',
      'C1': 'badge-level-c1'
    };
    return colors[level] || 'badge-level-default';
  }

  getStatusClass(masteryRate: number): string {
    if (masteryRate >= 80) return 'badge-success';
    if (masteryRate >= 50) return 'badge-warning';
    return 'badge-danger';
  }

  getStatusText(masteryRate: number): string {
    if (masteryRate >= 80) return '✅ Tốt';
    if (masteryRate >= 50) return '📖 Trung bình';
    return 'Cần Cải Thiện';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}