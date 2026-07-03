// 📁 src/app/pages/grammar/grammar.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';

import { FooterComponent } from '../../shared/footer/footer.component';

interface GrammarTopic {
  id: string;
  title: string;
  description: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category: string;
  icon: string;
  totalLessons: number;
  completedLessons: number;
  isCompleted: boolean;
  progress: number;
}

interface GrammarLesson {
  id: string;
  topicId: string;
  title: string;
  content: string;
  examples: string[];
  exercises: GrammarExercise[];
  isCompleted: boolean;
}

interface GrammarExercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
  isCorrect?: boolean;
}

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>

    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-24 pb-12">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl md:text-4xl font-bold text-slate-800">
            📚 Ngữ Pháp VSTEP
          </h1>
          <p class="text-slate-600 mt-2">Học ngữ pháp tiếng Anh theo trình độ VSTEP</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-primary">{{ grammarTopics.length }}</div>
            <div class="text-sm text-slate-600">Tổng số chủ đề</div>
          </div>
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-emerald-500">{{ getCompletedTopics() }}</div>
            <div class="text-sm text-slate-600">Đã hoàn thành</div>
          </div>
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-amber-500">{{ getInProgressTopics() }}</div>
            <div class="text-sm text-slate-600">Đang học</div>
          </div>
          <div class="bg-white rounded-xl shadow-card p-4 text-center">
            <div class="text-2xl font-bold text-vstep">{{ getOverallProgress() }}%</div>
            <div class="text-sm text-slate-600">Tiến độ chung</div>
          </div>
        </div>

        <!-- Filter -->
        <div class="bg-white rounded-xl shadow-card p-4 mb-6">
          <div class="flex flex-col md:flex-row gap-4">
            <select 
              [(ngModel)]="selectedLevel"
              (ngModelChange)="filterTopics()"
              class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">📊 Tất cả trình độ</option>
              <option value="A1">A1 - Sơ cấp</option>
              <option value="A2">A2 - Sơ trung cấp</option>
              <option value="B1">B1 - Trung cấp</option>
              <option value="B2">B2 - Trung cao cấp</option>
              <option value="C1">C1 - Cao cấp</option>
            </select>

            <select 
              [(ngModel)]="selectedCategory"
              (ngModelChange)="filterTopics()"
              class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">📂 Tất cả danh mục</option>
              <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
            </select>

            <select 
              [(ngModel)]="selectedStatus"
              (ngModelChange)="filterTopics()"
              class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="all">📋 Tất cả trạng thái</option>
              <option value="completed">✅ Đã hoàn thành</option>
              <option value="in-progress">📖 Đang học</option>
              <option value="not-started">⏳ Chưa bắt đầu</option>
            </select>

            <input 
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="filterTopics()"
              placeholder="🔍 Tìm kiếm chủ đề..."
              class="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
          </div>
        </div>

        <!-- Grammar Topics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let topic of filteredTopics" 
               class="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
               [class.opacity-60]="topic.isCompleted">
            
            <!-- Header with icon -->
            <div class="h-24 bg-gradient-to-r from-primary to-blue-600 flex items-center justify-between px-6">
              <span class="text-4xl">{{ topic.icon }}</span>
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                {{ topic.level }}
              </span>
            </div>

            <!-- Content -->
            <div class="p-6">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-bold text-slate-800 flex-1">{{ topic.title }}</h3>
                <span class="px-2 py-1 rounded-full text-xs font-medium"
                      [class]="getStatusColor(topic)">
                  {{ getStatusText(topic) }}
                </span>
              </div>
              
              <p class="text-sm text-slate-600 mb-4 line-clamp-2">{{ topic.description }}</p>

              <!-- Progress -->
              <div class="mb-4">
                <div class="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Tiến độ</span>
                  <span>{{ topic.progress }}%</span>
                </div>
                <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500"
                       [style.width.%]="topic.progress"
                       [class]="topic.progress === 100 ? 'bg-emerald-500' : 'bg-primary'">
                  </div>
                </div>
                <div class="text-xs text-slate-500 mt-1">
                  {{ topic.completedLessons }}/{{ topic.totalLessons }} bài học
                </div>
              </div>

              <button 
                (click)="openTopic(topic)"
                class="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                [class]="topic.isCompleted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary text-white hover:bg-primary-dark'">
                {{ topic.isCompleted ? '📖 Xem lại' : topic.progress > 0 ? '⏳ Tiếp tục' : '🚀 Bắt đầu học' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredTopics.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📭</div>
          <h3 class="text-xl font-semibold text-slate-800">Không tìm thấy chủ đề</h3>
          <p class="text-slate-600 mt-2">Vui lòng thử lại với bộ lọc khác!</p>
        </div>

      </div>
    </div>

    <app-footer></app-footer>

    <!-- Lesson Modal -->
    <div *ngIf="selectedTopic" 
         class="fixed inset-0 bg-black/50 backdrop-blur z-[1000] flex items-center justify-center p-4 overflow-y-auto"
         (click)="closeLesson()">
      <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-800">{{ selectedTopic.title }}</h3>
          <button class="text-slate-400 hover:text-slate-600 text-2xl" (click)="closeLesson()">✕</button>
        </div>
        
        <div class="p-6">
          <div class="mb-6">
            <p class="text-slate-600">{{ selectedTopic.description }}</p>
            <div class="flex gap-4 mt-3 text-sm">
              <span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700">{{ selectedTopic.level }}</span>
              <span class="px-3 py-1 rounded-full bg-purple-100 text-purple-700">{{ selectedTopic.category }}</span>
              <span class="px-3 py-1 rounded-full bg-green-100 text-green-700">{{ selectedTopic.totalLessons }} bài học</span>
            </div>
          </div>

          <!-- Lessons -->
          <div class="space-y-4">
            <div *ngFor="let lesson of getLessons(selectedTopic.id)" 
                 class="border border-slate-200 rounded-xl overflow-hidden">
              <div class="p-4 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition"
                   (click)="toggleLesson(lesson.id)">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{{ lesson.isCompleted ? '✅' : '📖' }}</span>
                  <div>
                    <h4 class="font-semibold text-slate-800">{{ lesson.title }}</h4>
                    <p class="text-sm text-slate-500 line-clamp-1">{{ lesson.content.substring(0, 80) }}...</p>
                  </div>
                </div>
                <span class="text-slate-400">{{ lesson.isCompleted ? 'Đã hoàn thành' : 'Click để mở' }}</span>
              </div>
              
              <!-- Lesson Content -->
              <div *ngIf="expandedLesson === lesson.id" class="p-4 border-t border-slate-200 bg-white">
                <div class="prose prose-sm max-w-none">
                  <p class="text-slate-700 whitespace-pre-wrap">{{ lesson.content }}</p>
                  
                  <div *ngIf="lesson.examples.length > 0" class="mt-4">
                    <h5 class="font-semibold text-slate-700">📝 Ví dụ:</h5>
                    <ul class="list-disc pl-5 space-y-1">
                      <li *ngFor="let example of lesson.examples" class="text-slate-600">{{ example }}</li>
                    </ul>
                  </div>

                  <!-- Exercises -->
                  <div *ngIf="lesson.exercises.length > 0" class="mt-6">
                    <h5 class="font-semibold text-slate-700 mb-3">✍️ Bài tập:</h5>
                    <div *ngFor="let exercise of lesson.exercises; let i = index" class="mb-4 p-4 bg-slate-50 rounded-xl">
                      <p class="text-slate-700 font-medium mb-2">{{ i + 1 }}. {{ exercise.question }}</p>
                      <div class="space-y-2">
                        <label *ngFor="let option of exercise.options; let j = index" 
                               class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                          <input type="radio" 
                                 [name]="'exercise_' + lesson.id + '_' + exercise.id"
                                 [value]="j"
                                 [(ngModel)]="exercise.userAnswer"
                                 (change)="checkExercise(exercise, lesson)"
                                 class="w-4 h-4 text-primary">
                          <span class="text-slate-700">{{ option }}</span>
                        </label>
                      </div>
                      <div *ngIf="exercise.isCorrect !== undefined" class="mt-2 p-3 rounded-lg"
                           [class]="exercise.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                        <span class="font-medium">{{ exercise.isCorrect ? '✅ Đúng!' : '❌ Sai!' }}</span>
                        <span class="ml-2 text-sm">{{ exercise.explanation }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    .line-clamp-1 {
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .prose {
      max-width: 100%;
    }
  `]
})
export class GrammarComponent implements OnInit {
  private router = inject(Router);

  grammarTopics: GrammarTopic[] = [];
  filteredTopics: GrammarTopic[] = [];
  selectedTopic: GrammarTopic | null = null;
  expandedLesson: string | null = null;

  // Filters
  selectedLevel: string = 'all';
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';
  searchTerm: string = '';

  categories: string[] = [];

  // Mock lessons data
  private lessonsMap: { [key: string]: GrammarLesson[] } = {};

  ngOnInit() {
    this.loadGrammarTopics();
  }

  loadGrammarTopics() {
    // Mock data
    this.grammarTopics = [
      {
        id: '1',
        title: 'Thì Hiện Tại Đơn',
        description: 'Cách dùng và cấu trúc của thì hiện tại đơn trong tiếng Anh',
        level: 'A1',
        category: 'Thì',
        icon: '⏰',
        totalLessons: 3,
        completedLessons: 1,
        isCompleted: false,
        progress: 33
      },
      {
        id: '2',
        title: 'Thì Quá Khứ Đơn',
        description: 'Cách dùng và cấu trúc của thì quá khứ đơn',
        level: 'A1',
        category: 'Thì',
        icon: '🕰️',
        totalLessons: 3,
        completedLessons: 0,
        isCompleted: false,
        progress: 0
      },
      {
        id: '3',
        title: 'Thì Tương Lai Đơn',
        description: 'Cách dùng và cấu trúc của thì tương lai đơn',
        level: 'A2',
        category: 'Thì',
        icon: '🔮',
        totalLessons: 3,
        completedLessons: 3,
        isCompleted: true,
        progress: 100
      },
      {
        id: '4',
        title: 'Câu Điều Kiện Loại 1',
        description: 'Cấu trúc và cách dùng câu điều kiện loại 1',
        level: 'B1',
        category: 'Câu điều kiện',
        icon: '📝',
        totalLessons: 4,
        completedLessons: 2,
        isCompleted: false,
        progress: 50
      },
      {
        id: '5',
        title: 'Câu Điều Kiện Loại 2',
        description: 'Cấu trúc và cách dùng câu điều kiện loại 2',
        level: 'B2',
        category: 'Câu điều kiện',
        icon: '📝',
        totalLessons: 4,
        completedLessons: 0,
        isCompleted: false,
        progress: 0
      },
      {
        id: '6',
        title: 'Câu Bị Động',
        description: 'Cấu trúc và cách dùng câu bị động trong tiếng Anh',
        level: 'B1',
        category: 'Câu bị động',
        icon: '🔄',
        totalLessons: 4,
        completedLessons: 4,
        isCompleted: true,
        progress: 100
      },
      {
        id: '7',
        title: 'Mệnh Đề Quan Hệ',
        description: 'Cách dùng who, which, that, whom trong mệnh đề quan hệ',
        level: 'B2',
        category: 'Mệnh đề',
        icon: '🔗',
        totalLessons: 5,
        completedLessons: 3,
        isCompleted: false,
        progress: 60
      },
      {
        id: '8',
        title: 'Câu Gián Tiếp',
        description: 'Cách chuyển đổi câu trực tiếp sang gián tiếp',
        level: 'B2',
        category: 'Câu gián tiếp',
        icon: '🗣️',
        totalLessons: 4,
        completedLessons: 1,
        isCompleted: false,
        progress: 25
      },
      {
        id: '9',
        title: 'So Sánh Hơn và Nhất',
        description: 'Cấu trúc so sánh hơn và so sánh nhất của tính từ và trạng từ',
        level: 'A2',
        category: 'So sánh',
        icon: '📊',
        totalLessons: 3,
        completedLessons: 3,
        isCompleted: true,
        progress: 100
      }
    ];

    this.categories = [...new Set(this.grammarTopics.map(t => t.category))];
    this.filterTopics();
    this.initMockLessons();
  }

  initMockLessons() {
    // Mock lessons for each topic
    this.grammarTopics.forEach(topic => {
      this.lessonsMap[topic.id] = [
        {
          id: `${topic.id}_1`,
          topicId: topic.id,
          title: 'Bài 1: Giới thiệu',
          content: 'Nội dung bài học 1...',
          examples: ['Ví dụ 1', 'Ví dụ 2'],
          exercises: [
            {
              id: `${topic.id}_1_1`,
              question: 'Câu hỏi 1?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              explanation: 'Giải thích đáp án...'
            }
          ],
          isCompleted: false
        },
        {
          id: `${topic.id}_2`,
          topicId: topic.id,
          title: 'Bài 2: Cấu trúc',
          content: 'Nội dung bài học 2...',
          examples: ['Ví dụ 1', 'Ví dụ 2'],
          exercises: [],
          isCompleted: false
        },
        {
          id: `${topic.id}_3`,
          topicId: topic.id,
          title: 'Bài 3: Thực hành',
          content: 'Nội dung bài học 3...',
          examples: ['Ví dụ 1', 'Ví dụ 2'],
          exercises: [],
          isCompleted: false
        }
      ];
    });
  }

  getLessons(topicId: string): GrammarLesson[] {
    return this.lessonsMap[topicId] || [];
  }

  filterTopics() {
    let filtered = this.grammarTopics;

    if (this.selectedLevel !== 'all') {
      filtered = filtered.filter(t => t.level === this.selectedLevel);
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === this.selectedCategory);
    }

    if (this.selectedStatus === 'completed') {
      filtered = filtered.filter(t => t.isCompleted);
    } else if (this.selectedStatus === 'in-progress') {
      filtered = filtered.filter(t => !t.isCompleted && t.progress > 0);
    } else if (this.selectedStatus === 'not-started') {
      filtered = filtered.filter(t => t.progress === 0);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    }

    this.filteredTopics = filtered;
  }

  getCompletedTopics(): number {
    return this.grammarTopics.filter(t => t.isCompleted).length;
  }

  getInProgressTopics(): number {
    return this.grammarTopics.filter(t => !t.isCompleted && t.progress > 0).length;
  }

  getOverallProgress(): number {
    if (this.grammarTopics.length === 0) return 0;
    const total = this.grammarTopics.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / this.grammarTopics.length);
  }

  getStatusColor(topic: GrammarTopic): string {
    if (topic.isCompleted) return 'bg-emerald-100 text-emerald-700';
    if (topic.progress > 0) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  }

  getStatusText(topic: GrammarTopic): string {
    if (topic.isCompleted) return '✅ Hoàn thành';
    if (topic.progress > 0) return '📖 Đang học';
    return '⏳ Chưa học';
  }

  openTopic(topic: GrammarTopic) {
    this.selectedTopic = topic;
    this.expandedLesson = null;
    document.body.style.overflow = 'hidden';
  }

  closeLesson() {
    this.selectedTopic = null;
    this.expandedLesson = null;
    document.body.style.overflow = '';
  }

  toggleLesson(lessonId: string) {
    this.expandedLesson = this.expandedLesson === lessonId ? null : lessonId;
  }

  checkExercise(exercise: GrammarExercise, lesson: GrammarLesson) {
    if (exercise.userAnswer !== undefined) {
      exercise.isCorrect = exercise.userAnswer === exercise.correctAnswer;
      // Cập nhật tiến độ bài học
      if (exercise.isCorrect) {
        const allExercises = lesson.exercises;
        const allCorrect = allExercises.every(e => e.isCorrect === true);
        if (allCorrect) {
          lesson.isCompleted = true;
          // Cập nhật tiến độ topic
          const topic = this.grammarTopics.find(t => t.id === lesson.topicId);
          if (topic) {
            const lessons = this.getLessons(topic.id);
            const completed = lessons.filter(l => l.isCompleted).length;
            topic.completedLessons = completed;
            topic.progress = Math.round((completed / topic.totalLessons) * 100);
            if (topic.progress === 100) {
              topic.isCompleted = true;
            }
          }
        }
      }
    }
  }
}