// src/app/pages/writing/writing.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-writing',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './writing.component.html',
  styleUrls: ['./writing.component.scss']
})
export class WritingComponent implements OnInit {
  private readonly SKILL_WRITING = 2; // Writing skill code
  private statsCache: any[] | null = null;
  private exercisesData: any[] | null = null;
  
  private cdr = inject(ChangeDetectorRef);
  
  exercises: any[] = [];
  isLoading = true;
  error = '';

  constructor(
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWritingExercises();
  }

  loadWritingExercises() {
    console.log('🔍 loadWritingExercises STARTED');
    this.isLoading = true;
    this.error = '';

    this.examService.getExercisesList(1, 100).subscribe({
      next: (list: any) => {
        console.log('🔍 getExercisesList SUCCESS');
        const items = list?.items || list || [];
        const writingList = items.filter((ex: any) => ex.skill === this.SKILL_WRITING);
        
        this.exercises = writingList;
        this.exercisesData = writingList;
        
        this.loadStats();
      },
      error: (err: any) => {
        console.error('❌ getExercisesList ERROR:', err);
        this.error = 'Không thể tải danh sách bài Writing';
        this.isLoading = false;
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
      this.cdr.detectChanges();
      return;
    }

    this.examService.getExerciseStats(this.SKILL_WRITING).subscribe({
      next: (stats: any) => {
        console.log('🔍 getExerciseStats SUCCESS:', stats?.length);
        this.statsCache = stats;
        this.mergeStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ getExerciseStats ERROR:', err);
        this.isLoading = false;
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
        lastScore: stat?.lastScore ?? null,
        wordLimit: ex.wordLimit || '150-300'
      };
    });
    
    console.log('🔍 Merged exercises:', this.exercises.length);
  }

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
    this.router.navigate(['/exam', exerciseId, 'writing']);
  }
  
  retry() {
    this.loadWritingExercises();
  }
}