// 📁 src/app/pages/vocabulary/vocabulary.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// ✅ Import Header và Footer
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

import { ExamService } from '../../services/exam.service';
import { AuthService } from '../../services/auth.service';

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  partOfSpeech: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  mastered: boolean;
  reviewCount: number;
  lastReviewed?: Date;
}

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    HeaderComponent,   // ✅ Thêm Header
    FooterComponent    // ✅ Thêm Footer
  ],
  template: `
    <!-- ✅ HEADER -->
    <app-header></app-header>

    <!-- MAIN CONTENT -->
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-12">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-slate-800">
            📝 Từ Vựng VSTEP
          </h1>
          <p class="text-slate-600 mt-2">Học từ vựng theo chủ đề và trình độ</p>
        </div>

        <!-- Search & Filter -->
        <div class="bg-white rounded-xl shadow-card p-4 mb-6">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1 relative">
              <input 
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="filterWords()"
                placeholder="Tìm kiếm từ vựng..."
                class="w-full px-4 py-2 pl-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
              <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
            </div>
            
            <!-- Level Filter -->
            <select 
              [(ngModel)]="selectedLevel"
              (ngModelChange)="filterWords()"
              class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">📊 Tất cả trình độ</option>
              <option value="A1">A1 - Sơ cấp</option>
              <option value="A2">A2 - Sơ trung cấp</option>
              <option value="B1">B1 - Trung cấp</option>
              <option value="B2">B2 - Trung cao cấp</option>
              <option value="C1">C1 - Cao cấp</option>
            </select>

            <!-- Topic Filter -->
            <select 
              [(ngModel)]="selectedTopic"
              (ngModelChange)="filterWords()"
              class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">📂 Tất cả chủ đề</option>
              <option *ngFor="let topic of topics" [value]="topic">{{ topic }}</option>
            </select>

            <!-- Status Filter -->
            <select 
              [(ngModel)]="selectedStatus"
              (ngModelChange)="filterWords()"
              class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">📋 Tất cả trạng thái</option>
              <option value="mastered">✅ Đã thành thạo</option>
              <option value="learning">📖 Đang học</option>
            </select>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-primary">{{ words.length }}</div>
            <div class="text-sm text-slate-600">Tổng số từ</div>
          </div>
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-emerald-500">{{ getMasteredCount() }}</div>
            <div class="text-sm text-slate-600">Đã thành thạo</div>
          </div>
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-amber-500">{{ getLearningCount() }}</div>
            <div class="text-sm text-slate-600">Đang học</div>
          </div>
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-vstep">{{ getMasteryRate() }}%</div>
            <div class="text-sm text-slate-600">Tỷ lệ thành thạo</div>
          </div>
        </div>

        <!-- Vocabulary List -->
        <div class="bg-white rounded-xl shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Từ vựng</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nghĩa</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phiên âm</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trình độ</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Chủ đề</th>
               <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-36">Trạng thái</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr *ngFor="let word of paginatedWords" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-semibold text-slate-800">{{ word.word }}</div>
                    <div class="text-xs text-slate-500">{{ word.partOfSpeech }}</div>
                  </td>
                  <td class="px-6 py-4 text-slate-700">{{ word.meaning }}</td>
                  <td class="px-6 py-4 text-slate-500 text-sm">{{ word.pronunciation }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class]="getLevelColor(word.level)">
                      {{ word.level }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {{ word.topic }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class]="word.mastered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                      {{ word.mastered ? '✅ Thành thạo' : '📖 Đang học' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button 
                        (click)="toggleMastered(word)"
                        class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        [class]="word.mastered ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'">
                        {{ word.mastered ? '🔄 Chưa thuộc' : '✅ Đã Thuộc' }}
                      </button>
                      <button 
                        (click)="showExample(word)"
                        class="px-1 py-1 rounded-lg text-sm font-medium bg-vstep-lighter text-vstep hover:bg-vstep-light transition-colors">
                        📖 Ví dụ
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredWords.length === 0">
                  <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                    📭 Không tìm thấy từ vựng nào. Vui lòng thử lại!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-slate-600">
            Hiển thị {{ (currentPage - 1) * pageSize + 1 }} - 
            {{ Math.min(currentPage * pageSize, filteredWords.length) }} 
            / {{ filteredWords.length }} từ
          </div>
          <div class="flex gap-2">
            <button 
              (click)="prevPage()"
              [disabled]="currentPage === 1"
              class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              ← Trước
            </button>
            <button 
              (click)="nextPage()"
              [disabled]="currentPage === totalPages"
              class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Sau →
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ✅ FOOTER -->
    <app-footer></app-footer>

    <!-- Example Modal -->
    <div *ngIf="selectedWord" 
         class="fixed inset-0 bg-black/50 backdrop-blur z-[1000] flex items-center justify-center p-4"
         (click)="closeModal()">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6" (click)="$event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-slate-800">📖 Ví dụ</h3>
          <button class="text-slate-400 hover:text-slate-600 text-2xl" (click)="closeModal()">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <div class="font-semibold text-primary">{{ selectedWord.word }}</div>
            <div class="text-slate-500 text-sm">{{ selectedWord.partOfSpeech }} - {{ selectedWord.pronunciation }}</div>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl">
            <div class="text-slate-700 font-medium">📝 Ví dụ:</div>
            <div class="text-slate-800 mt-1">{{ selectedWord.example }}</div>
            <div class="text-slate-600 mt-2 text-sm">{{ selectedWord.meaning }}</div>
          </div>
          <button 
            (click)="closeModal()"
            class="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition">
            Đóng
          </button>
        </div>
      </div>
    </div>

  `,
  styles: [`
    .shadow-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    .shadow-card-hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
    }
  `]
})
export class VocabularyComponent implements OnInit {
  private examService = inject(ExamService);
  private authService = inject(AuthService);

  // Data
  words: VocabularyWord[] = [];
  filteredWords: VocabularyWord[] = [];
  
  // Filters
  searchTerm: string = '';
  selectedLevel: string = 'all';
  selectedTopic: string = 'all';
  selectedStatus: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  
  // Modal
  selectedWord: VocabularyWord | null = null;
  
  // Math
  Math = Math;

  // Topics
  topics: string[] = [];

  ngOnInit() {
    this.loadVocabulary();
  }

  get paginatedWords(): VocabularyWord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredWords.slice(start, end);
  }

  loadVocabulary() {
    // Mock data - sẽ thay thế bằng API call sau
    this.words = this.getMockVocabulary();
    this.topics = [...new Set(this.words.map(w => w.topic))];
    this.filterWords();
  }

  filterWords() {
    let filtered = this.words;

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(w => 
        w.word.toLowerCase().includes(term) ||
        w.meaning.toLowerCase().includes(term) ||
        w.example.toLowerCase().includes(term)
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
      filtered = filtered.filter(w => w.mastered);
    } else if (this.selectedStatus === 'learning') {
      filtered = filtered.filter(w => !w.mastered);
    }

    this.filteredWords = filtered;
    this.currentPage = 1;
  }

  getMasteredCount(): number {
    return this.words.filter(w => w.mastered).length;
  }

  getLearningCount(): number {
    return this.words.filter(w => !w.mastered).length;
  }

  getMasteryRate(): number {
    if (this.words.length === 0) return 0;
    return Math.round((this.getMasteredCount() / this.words.length) * 100);
  }

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

  toggleMastered(word: VocabularyWord) {
    word.mastered = !word.mastered;
    word.reviewCount++;
    word.lastReviewed = new Date();
    this.filterWords();
  }

  showExample(word: VocabularyWord) {
    this.selectedWord = word;
  }

  closeModal() {
    this.selectedWord = null;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredWords.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // ============================================================
  // MOCK DATA
  // ============================================================

  private getMockVocabulary(): VocabularyWord[] {
    return [
      {
        id: '1',
        word: 'Abandon',
        meaning: 'Từ bỏ, bỏ rơi',
        pronunciation: '/əˈbændən/',
        example: 'The mother had to abandon her child during the war.',
        partOfSpeech: 'verb',
        level: 'B1',
        topic: 'Emotions',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '2',
        word: 'Benefit',
        meaning: 'Lợi ích, lợi thế',
        pronunciation: '/ˈbenɪfɪt/',
        example: 'Regular exercise has many health benefits.',
        partOfSpeech: 'noun',
        level: 'A2',
        topic: 'Health',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '3',
        word: 'Challenge',
        meaning: 'Thách thức',
        pronunciation: '/ˈtʃælɪndʒ/',
        example: 'Learning a new language is a great challenge.',
        partOfSpeech: 'noun',
        level: 'B1',
        topic: 'Education',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '4',
        word: 'Dedicate',
        meaning: 'Cống hiến, dành riêng',
        pronunciation: '/ˈdedɪkeɪt/',
        example: 'She dedicated her life to helping others.',
        partOfSpeech: 'verb',
        level: 'B2',
        topic: 'Work',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '5',
        word: 'Environment',
        meaning: 'Môi trường',
        pronunciation: '/ɪnˈvaɪrənmənt/',
        example: 'We need to protect the environment for future generations.',
        partOfSpeech: 'noun',
        level: 'A2',
        topic: 'Nature',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '6',
        word: 'Fascinate',
        meaning: 'Mê hoặc, cuốn hút',
        pronunciation: '/ˈfæsɪneɪt/',
        example: 'The ancient history of Vietnam fascinates me.',
        partOfSpeech: 'verb',
        level: 'B2',
        topic: 'Interests',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '7',
        word: 'Generate',
        meaning: 'Tạo ra, sinh ra',
        pronunciation: '/ˈdʒenəreɪt/',
        example: 'Solar panels generate electricity from sunlight.',
        partOfSpeech: 'verb',
        level: 'B1',
        topic: 'Technology',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '8',
        word: 'Hesitate',
        meaning: 'Do dự, lưỡng lự',
        pronunciation: '/ˈhezɪteɪt/',
        example: 'Don\'t hesitate to ask if you have any questions.',
        partOfSpeech: 'verb',
        level: 'B1',
        topic: 'Communication',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '9',
        word: 'Impact',
        meaning: 'Tác động, ảnh hưởng',
        pronunciation: '/ˈɪmpækt/',
        example: 'Technology has a huge impact on our daily lives.',
        partOfSpeech: 'noun',
        level: 'B2',
        topic: 'Technology',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '10',
        word: 'Journey',
        meaning: 'Hành trình, chuyến đi',
        pronunciation: '/ˈdʒɜːrni/',
        example: 'Life is a beautiful journey full of surprises.',
        partOfSpeech: 'noun',
        level: 'A2',
        topic: 'Travel',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '11',
        word: 'Knowledge',
        meaning: 'Kiến thức, sự hiểu biết',
        pronunciation: '/ˈnɑːlɪdʒ/',
        example: 'Knowledge is power, so keep learning every day.',
        partOfSpeech: 'noun',
        level: 'A2',
        topic: 'Education',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '12',
        word: 'Language',
        meaning: 'Ngôn ngữ',
        pronunciation: '/ˈlæŋɡwɪdʒ/',
        example: 'English is the most widely spoken language in the world.',
        partOfSpeech: 'noun',
        level: 'A1',
        topic: 'Education',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '13',
        word: 'Motivate',
        meaning: 'Động viên, thúc đẩy',
        pronunciation: '/ˈmoʊtɪveɪt/',
        example: 'Good teachers motivate their students to learn.',
        partOfSpeech: 'verb',
        level: 'B2',
        topic: 'Education',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '14',
        word: 'Negotiate',
        meaning: 'Đàm phán, thương lượng',
        pronunciation: '/nɪˈɡoʊʃieɪt/',
        example: 'We need to negotiate a better price for this product.',
        partOfSpeech: 'verb',
        level: 'C1',
        topic: 'Business',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '15',
        word: 'Opportunity',
        meaning: 'Cơ hội',
        pronunciation: '/ˌɑːpərˈtuːnəti/',
        example: 'This is a great opportunity to improve your skills.',
        partOfSpeech: 'noun',
        level: 'B1',
        topic: 'Work',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '16',
        word: 'Persuade',
        meaning: 'Thuyết phục',
        pronunciation: '/pərˈsweɪd/',
        example: 'She managed to persuade him to change his mind.',
        partOfSpeech: 'verb',
        level: 'B2',
        topic: 'Communication',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '17',
        word: 'Qualify',
        meaning: 'Đủ tiêu chuẩn, đáp ứng',
        pronunciation: '/ˈkwɑːlɪfaɪ/',
        example: 'You need to qualify for the scholarship to study abroad.',
        partOfSpeech: 'verb',
        level: 'B2',
        topic: 'Education',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '18',
        word: 'Research',
        meaning: 'Nghiên cứu',
        pronunciation: '/rɪˈsɜːrtʃ/',
        example: 'Scientists conduct research to find solutions to problems.',
        partOfSpeech: 'noun',
        level: 'B1',
        topic: 'Science',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '19',
        word: 'Sustainable',
        meaning: 'Bền vững',
        pronunciation: '/səˈsteɪnəbl/',
        example: 'We need to develop more sustainable energy sources.',
        partOfSpeech: 'adjective',
        level: 'C1',
        topic: 'Environment',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '20',
        word: 'Technology',
        meaning: 'Công nghệ',
        pronunciation: '/tekˈnɑːlədʒi/',
        example: 'Technology is changing the way we live and work.',
        partOfSpeech: 'noun',
        level: 'A2',
        topic: 'Technology',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '21',
        word: 'Understand',
        meaning: 'Hiểu, nắm bắt',
        pronunciation: '/ˌʌndərˈstænd/',
        example: 'I don\'t understand why he did that.',
        partOfSpeech: 'verb',
        level: 'A1',
        topic: 'Communication',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '22',
        word: 'Value',
        meaning: 'Giá trị, coi trọng',
        pronunciation: '/ˈvæljuː/',
        example: 'We should value our time and use it wisely.',
        partOfSpeech: 'noun',
        level: 'B1',
        topic: 'Work',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '23',
        word: 'Wellness',
        meaning: 'Sức khỏe tốt, an lạc',
        pronunciation: '/ˈwelnəs/',
        example: 'Yoga and meditation promote mental wellness.',
        partOfSpeech: 'noun',
        level: 'B2',
        topic: 'Health',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '24',
        word: 'Examine',
        meaning: 'Xem xét, kiểm tra',
        pronunciation: '/ɪɡˈzæmɪn/',
        example: 'The doctor will examine you to find the cause of the pain.',
        partOfSpeech: 'verb',
        level: 'B1',
        topic: 'Health',
        mastered: false,
        reviewCount: 0
      },
      {
        id: '25',
        word: 'Yield',
        meaning: 'Tạo ra, mang lại; nhường bước',
        pronunciation: '/jiːld/',
        example: 'This investment yields a high return.',
        partOfSpeech: 'verb',
        level: 'C1',
        topic: 'Business',
        mastered: false,
        reviewCount: 0
      }
    ];
  }
}