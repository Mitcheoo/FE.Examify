import { Component, inject, OnInit } from '@angular/core';
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
  
  exams: Exercise[] = [];
  filteredExams: Exercise[] = [];
  isLoading = true;
  levels: number[] = [3, 4, 5];
  selectedLevel: number | null = null;

  // Thứ tự ưu tiên hiển thị: Reading → Listening → Writing → Speaking
  private skillOrder: Record<string, number> = {
    'Reading': 1,
    'Listening': 2,
    'Writing': 3,
    'Speaking': 4
  };

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.isLoading = true;
    this.examService.getExercisesList().subscribe({
      next: (response: any) => {
        let exams = response.items || response;
        
        // Sắp xếp theo thứ tự ưu tiên: Reading trước, sau đó Listening, Writing, Speaking
        exams = exams.sort((a: any, b: any) => {
          const orderA = this.skillOrder[a.skillName] || 99;
          const orderB = this.skillOrder[b.skillName] || 99;
          return orderA - orderB;
        });
        
        this.exams = exams;
        this.filteredExams = exams;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  filterByLevel(level: number | null) {
    this.selectedLevel = level;
    this.filteredExams = level ? this.exams.filter(e => e.vstepLevel === level) : this.exams;
  }

  onExamClick(exam: Exercise) {
    this.router.navigate(['/exam', exam.id]);
  }
}