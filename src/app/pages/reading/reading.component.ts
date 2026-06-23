// src/app/pages/reading/reading.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reading.component.html',
})
export class ReadingComponent implements OnInit {
  private readonly SKILL_READING = 0;
  private statsCache: any[] | null = null;
  private exercisesData: any[] | null = null;
  
  // ✅ THÊM ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);
  
  exercises: any[] = [];
  isLoading = true;
  error = '';

  constructor(
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadReadingExercises();
  }

  loadReadingExercises() {
    console.log('🔍 loadReadingExercises STARTED');
    this.isLoading = true;
    this.error = '';

    this.examService.getExercisesList(1, 100).subscribe({
      next: (list: any) => {
        console.log('🔍 getExercisesList SUCCESS');
        const items = list?.items || list || [];
        const readingList = items.filter((ex: any) => ex.skill === this.SKILL_READING);
        
        this.exercises = readingList;
        this.exercisesData = readingList;
        
        // ✅ GỌI LOAD STATS
        this.loadStats();
      },
      error: (err: any) => {
        console.error('❌ getExercisesList ERROR:', err);
        this.error = 'Không thể tải danh sách bài Reading';
        this.isLoading = false;
        // ✅ FORCE UPDATE UI
        this.cdr.detectChanges();
      }
    });
  }

  loadStats() {
    console.log('🔍 loadStats STARTED');
    
    if (this.statsCache) {
      console.log('🔍 Using cached stats');
      this.mergeStats();
      this.isLoading = false;
      // ✅ FORCE UPDATE UI
      this.cdr.detectChanges();
      return;
    }

    this.examService.getExerciseStats(this.SKILL_READING).subscribe({
      next: (stats: any) => {
        console.log('🔍 getExerciseStats SUCCESS:', stats?.length);
        this.statsCache = stats;
        this.mergeStats();
        this.isLoading = false;
        // ✅ FORCE UPDATE UI - QUAN TRỌNG!
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ getExerciseStats ERROR:', err);
        this.isLoading = false;
        // ✅ VẪN FORCE UPDATE UI DÙ CÓ LỖI
        this.cdr.detectChanges();
      }
    });
  }

  mergeStats() {
    if (!this.exercisesData) {
      console.log('⚠️ No exercisesData to merge');
      return;
    }
    
    this.exercises = this.exercisesData.map((ex: any) => {
      const stat = this.statsCache?.find((s: any) => s.exerciseId === ex.id);
      return {
        ...ex,
        attemptCount: stat?.attemptCount || 0,
        bestScore: stat?.bestScore ?? null,
        averageScore: stat?.averageScore ?? null,
        lastScore: stat?.lastScore ?? null
      };
    });
    
    console.log('🔍 Merged exercises:', this.exercises.length);
  }
  

  // ✅ NHÓM THEO SOURCE
  get groupedExercises(): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};
    this.exercises.forEach((ex: any) => {
      const source = ex.source || 'Hệ thống';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(ex);
    });
    return grouped;
  }

  get sourceKeys(): string[] {
    const priority = ['Đà Nẵng 2026', 'ĐH Ngoại ngữ Đà Nẵng', 'VSTEP', 'Hệ thống'];
    const keys = Object.keys(this.groupedExercises);
    return keys.sort((a, b) => {
      const indexA = priority.indexOf(a);
      const indexB = priority.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  startExercise(exerciseId: string) {
    this.router.navigate(['/exam', exerciseId, 'reading']);
  }
  
  retry() {
    this.loadReadingExercises();
  }
}