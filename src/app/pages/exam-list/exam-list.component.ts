import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService, Exercise } from '../../services/exam.service';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-list.component.html',
  styleUrls: ['./exam-list.component.scss']
})
export class ExamListComponent implements OnInit {
  private examService = inject(ExamService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  exams: Exercise[] = [];
  filteredExams: Exercise[] = [];
  isLoading = true;

  ngOnInit() {
    console.log('🔵 ExamListComponent initialized');
    this.loadExams();
  }

  loadExams() {
    console.log('🔄 Loading exams...');
    this.isLoading = true;
    
    this.examService.getExercisesList().subscribe({
      next: (response: any) => {
        console.log('📦 Response received:', response);
        
        let allExams = response.items || [];
        
        // Chỉ lấy Full Test
        let fullTests = allExams.filter((exam: any) => exam.isFullTest === true);
        
        console.log('📦 Full Tests found:', fullTests.length);
        
        this.exams = [...fullTests];
        this.filteredExams = [...this.exams];
        this.isLoading = false;
        
        console.log('✅ Assigned:', this.exams.length, 'exams');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading exams:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onExamClick(exam: Exercise) {
    console.log('📌 Clicked exam:', exam.title);
    this.router.navigate(['/exam', exam.id]);
  }
}