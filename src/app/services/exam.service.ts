import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Exam, VstepLevel, SubmitAnswerDto, SubmitResponseDto } from '../models/exam/exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7241/api';

  getExams(params?: { level?: VstepLevel; search?: string }): Observable<Exam[]> {
    let httpParams = new HttpParams();
    if (params?.level) httpParams = httpParams.set('level', params.level.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    
    return this.http.get<Exam[]>(`${this.apiUrl}/Exams`, { params: httpParams })
      .pipe(catchError(() => of(this.getMockExams())));
  }

  getExamDetail(examId: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/Exams/${examId}`)
      .pipe(catchError(() => {
        const exam = this.getMockExams().find(e => e.id === examId);
        return of(exam as Exam);
      }));
  }

  // Mock data cho development
  getMockExams(): Exam[] {
    return [
      { id: '1', title: 'Đề thi VSTEP Bậc 3 - Số 1', description: 'Đề thi chuẩn cấu trúc Bộ GD&ĐT, phù hợp cho trình độ sơ cấp', vstepLevel: 3, price: 50000, duration: 167, status: 'not_purchased', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', title: 'Đề thi VSTEP Bậc 3 - Số 2', description: 'Đề thi mô phỏng sát với đề thi thật, có đáp án chi tiết', vstepLevel: 3, price: 50000, duration: 167, status: 'not_purchased', createdAt: new Date(), updatedAt: new Date() },
      { id: '3', title: 'Đề thi VSTEP Bậc 4 - Số 1', description: 'Đề thi trình độ trung cấp, dành cho sinh viên đại học', vstepLevel: 4, price: 60000, duration: 167, status: 'not_purchased', createdAt: new Date(), updatedAt: new Date() },
      { id: '4', title: 'Đề thi VSTEP Bậc 4 - Số 2', description: 'Luyện tập với đề thi cập nhật mới nhất', vstepLevel: 4, price: 60000, duration: 167, status: 'not_purchased', createdAt: new Date(), updatedAt: new Date() },
      { id: '5', title: 'Đề thi VSTEP Bậc 5 - Số 1', description: 'Trình độ cao cấp, dành cho giảng viên, nghiên cứu sinh', vstepLevel: 5, price: 70000, duration: 167, status: 'not_purchased', createdAt: new Date(), updatedAt: new Date() }
    ];
  }
}
