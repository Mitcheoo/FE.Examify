// 📁 src/app/pages/vocabulary/vocabulary.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// ✅ Import Header và Footer
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

import { AuthService } from '../../services/auth.service';

// ============================================================
// INTERFACES
// ============================================================

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  partOfSpeech: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  audioUrl?: string;
  imageUrl?: string;
  vietnameseExample?: string;
  createdAt: Date;
  // Progress
  isMastered: boolean;
  reviewCount: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  masteryPercentage?: number;
}

interface VocabularyStats {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  wordsNeedReview: number;
  masteryRate: number;
  weeklyProgress: DailyStats[];
  monthlyProgress: DailyStats[];
  topicStats: TopicStats[];
}

interface DailyStats {
  date: Date;
  wordsLearned: number;
  wordsMastered: number;
  reviews: number;
}

interface TopicStats {
  topic: string;
  total: number;
  mastered: number;
  learning: number;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './vocabulary.component.html',
  styleUrls: ['./vocabulary.component.scss']
})
export class VocabularyComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); // ✅ THÊM ChangeDetectorRef

  // Base URL
  private apiUrl = 'https://localhost:7241/api';

  // Data
  words: VocabularyWord[] = [];
  filteredWords: VocabularyWord[] = [];
  stats: VocabularyStats | null = null;
  
  // Filters
  searchTerm: string = '';
  selectedLevel: string = 'all';
  selectedTopic: string = 'all';
  selectedStatus: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;
  
  // Modal
  selectedWord: VocabularyWord | null = null;
  
  // Loading states
  isLoading: boolean = false;
  isLoadingStats: boolean = false;
  
  // Math
  Math = Math;

  // Topics
  topics: string[] = [];

  // Toast message
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  showToast: boolean = false;

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  ngOnInit() {
    this.loadVocabulary();
    this.loadStats();
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get paginatedWords(): VocabularyWord[] {
    return this.filteredWords;
  }

  // ============================================================
  // API CALLS
  // ============================================================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async loadVocabulary() {
    this.isLoading = true;
    // ✅ FORCE UPDATE UI - Hiển thị loading
    this.cdr.detectChanges();
    
    try {
      // Build query params
      let params = new URLSearchParams();
      params.set('page', this.currentPage.toString());
      params.set('pageSize', this.pageSize.toString());

      if (this.searchTerm) params.set('search', this.searchTerm);
      if (this.selectedLevel !== 'all') params.set('level', this.selectedLevel);
      if (this.selectedTopic !== 'all') params.set('topic', this.selectedTopic);
      if (this.selectedStatus !== 'all') params.set('status', this.selectedStatus);

      const url = `${this.apiUrl}/Vocabulary?${params.toString()}`;
      
      const response = await firstValueFrom(
        this.http.get<PagedResult<VocabularyWord>>(url, {
          headers: this.getHeaders()
        })
      );

      this.words = response.items || [];
      this.filteredWords = this.words;
      this.totalCount = response.totalCount;
      this.totalPages = response.totalPages;

      // Update topics
      const allTopics = this.words.map(w => w.topic).filter(t => t);
      this.topics = [...new Set(allTopics)];

      // ✅ FORCE UPDATE UI - Cập nhật danh sách
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error('❌ Load vocabulary error:', error);
      this.showToastMessage('Không thể tải danh sách từ vựng', 'error');
      // ✅ FORCE UPDATE UI - Cập nhật lỗi
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
      // ✅ FORCE UPDATE UI - Tắt loading
      this.cdr.detectChanges();
    }
  }

  async loadStats() {
    this.isLoadingStats = true;
    // ✅ FORCE UPDATE UI - Hiển thị loading stats
    this.cdr.detectChanges();
    
    try {
      const response = await firstValueFrom(
        this.http.get<VocabularyStats>(`${this.apiUrl}/Vocabulary/stats?days=30`, {
          headers: this.getHeaders()
        })
      );
      this.stats = response;
      
      // ✅ FORCE UPDATE UI - Cập nhật stats
      this.cdr.detectChanges();
      
    } catch (error: any) {
      console.error('❌ Load stats error:', error);
    } finally {
      this.isLoadingStats = false;
      // ✅ FORCE UPDATE UI - Tắt loading stats
      this.cdr.detectChanges();
    }
  }

  async toggleMastered(word: VocabularyWord) {
    // ✅ Lưu trạng thái cũ để rollback nếu lỗi
    const oldStatus = word.isMastered;
    const oldReviewCount = word.reviewCount;
    
    // ✅ FORCE UPDATE UI - Cập nhật trạng thái ngay lập tức (Optimistic UI)
    word.isMastered = !word.isMastered;
    word.reviewCount++;
    word.lastReviewedAt = new Date();
    this.cdr.detectChanges();

    try {
      const newStatus = word.isMastered;
      const response = await firstValueFrom(
        this.http.patch<VocabularyWord>(
          `${this.apiUrl}/Vocabulary/${word.id}/mastered`,
          newStatus,
          { headers: this.getHeaders() }
        )
      );

      // Update local data với dữ liệu từ server
      word.isMastered = response.isMastered;
      word.reviewCount = response.reviewCount || 0;
      word.lastReviewedAt = response.lastReviewedAt;
      word.nextReviewAt = response.nextReviewAt;
      word.masteryPercentage = response.masteryPercentage;

      this.showToastMessage(
        newStatus ? '✅ Đã đánh dấu thành thạo!' : '🔄 Đã đánh dấu chưa thuộc!',
        'success'
      );

      // Refresh stats
      await this.loadStats();
      this.filterWords();

      // ✅ FORCE UPDATE UI - Cập nhật cuối cùng
      this.cdr.detectChanges();

    } catch (error: any) {
      console.error('❌ Toggle mastered error:', error);
      
      // ✅ ROLLBACK UI - Khôi phục trạng thái cũ nếu lỗi
      word.isMastered = oldStatus;
      word.reviewCount = oldReviewCount;
      
      this.showToastMessage('Không thể cập nhật trạng thái', 'error');
      
      // ✅ FORCE UPDATE UI - Cập nhật rollback
      this.cdr.detectChanges();
    }
  }

  async reloadData() {
    // ✅ FORCE UPDATE UI - Reset dữ liệu
    this.words = [];
    this.filteredWords = [];
    this.stats = null;
    this.cdr.detectChanges();
    
    await this.loadVocabulary();
    await this.loadStats();
    
    // ✅ FORCE UPDATE UI - Cập nhật sau khi reload
    this.cdr.detectChanges();
  }

  // ============================================================
  // FILTER & SEARCH
  // ============================================================

  filterWords() {
    let filtered = [...this.words];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(w =>
        w.word.toLowerCase().includes(term) ||
        w.meaning.toLowerCase().includes(term) ||
        (w.example && w.example.toLowerCase().includes(term))
      );
    }

    // Level filter
    if (this.selectedLevel !== 'all') {
      filtered = filtered.filter(w => w.level === this.selectedLevel);
    }

    // Topic filter
    if (this.selectedTopic !== 'all') {
      filtered = filtered.filter(w => w.topic === this.selectedTopic);
    }

    // Status filter
    if (this.selectedStatus === 'mastered') {
      filtered = filtered.filter(w => w.isMastered);
    } else if (this.selectedStatus === 'learning') {
      filtered = filtered.filter(w => !w.isMastered);
    } else if (this.selectedStatus === 'need_review') {
      const today = new Date();
      filtered = filtered.filter(w =>
        !w.isMastered &&
        w.nextReviewAt &&
        new Date(w.nextReviewAt) <= today
      );
    }

    this.filteredWords = filtered;
    this.currentPage = 1;
    
    // ✅ FORCE UPDATE UI - Cập nhật sau khi filter
    this.cdr.detectChanges();
  }

  onFilterChange() {
    this.filterWords();
    this.loadVocabulary();
  }

  // ============================================================
  // STATS HELPERS
  // ============================================================

  getMasteredCount(): number {
    return this.stats?.masteredWords || 0;
  }

  getLearningCount(): number {
    return this.stats?.learningWords || 0;
  }

  getMasteryRate(): number {
    return this.stats?.masteryRate || 0;
  }

  getNeedReviewCount(): number {
    return this.stats?.wordsNeedReview || 0;
  }

  getTotalWords(): number {
    return this.stats?.totalWords || 0;
  }

  // ============================================================
  // UI HELPERS
  // ============================================================

  getLevelColor(level: string): string {
    const colors: Record<string, string> = {
      'A1': 'bg-green-100 text-green-700',
      'A2': 'bg-blue-100 text-blue-700',
      'B1': 'bg-amber-100 text-amber-700',
      'B2': 'bg-orange-100 text-orange-700',
      'C1': 'bg-red-100 text-red-700'
    };
    return colors[level] || 'bg-slate-100 text-slate-700';
  }

  getMasteryColor(percentage: number): string {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  }

  getMasteryWidth(percentage: number): string {
    return `${Math.min(percentage, 100)}%`;
  }

  showExample(word: VocabularyWord) {
    this.selectedWord = word;
    document.body.style.overflow = 'hidden';
    // ✅ FORCE UPDATE UI - Hiển thị modal
    this.cdr.detectChanges();
  }

  closeModal() {
    this.selectedWord = null;
    document.body.style.overflow = '';
    // ✅ FORCE UPDATE UI - Đóng modal
    this.cdr.detectChanges();
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  get totalPagesCalc(): number {
    return Math.ceil(this.filteredWords.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredWords.length);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVocabulary();
      // ✅ FORCE UPDATE UI - Cập nhật trang
      this.cdr.detectChanges();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPagesCalc) {
      this.currentPage++;
      this.loadVocabulary();
      // ✅ FORCE UPDATE UI - Cập nhật trang
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPagesCalc) {
      this.currentPage = page;
      this.loadVocabulary();
      // ✅ FORCE UPDATE UI - Cập nhật trang
      this.cdr.detectChanges();
    }
  }

  get pageNumbers(): number[] {
    const total = this.totalPagesCalc;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // ...
      for (let i = Math.max(2, current - 1); i <= Math.min(current + 1, total - 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1); // ...
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
    
    // ✅ FORCE UPDATE UI - Hiển thị toast
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showToast = false;
      // ✅ FORCE UPDATE UI - Ẩn toast
      this.cdr.detectChanges();
    }, 3000);
  }

  closeToast() {
    this.showToast = false;
    // ✅ FORCE UPDATE UI - Đóng toast
    this.cdr.detectChanges();
  }
}