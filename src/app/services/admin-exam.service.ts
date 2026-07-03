// src/app/services/admin-exam.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminExamService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:7241/api';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : '',
      'Content-Type': 'application/json'
    });
  }

  // ============ EXERCISE ============
  createExercise(data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/admin/exercises', data, { headers: this.getAuthHeaders() });
  }

  getExercisesBySkill(skill: number): Observable<any> {
    return this.http.get(this.apiUrl + '/admin/exercises?skill=' + skill, { headers: this.getAuthHeaders() });
  }

  // ✅ THÊM: Lấy chi tiết Exercise theo ID
  getExerciseById(exerciseId: string): Observable<any> {
    return this.http.get(this.apiUrl + '/exercises/' + exerciseId, { headers: this.getAuthHeaders() });
  }
deleteExercise(exerciseId: string): Observable<any> {
  return this.http.delete(this.apiUrl + '/admin/exercises/' + exerciseId, { headers: this.getAuthHeaders() });
}
  // ============ READING QUESTIONS ============
// 📁 admin-exam.service.ts

createReadingQuestions(exerciseId: string, questions: any[]): Observable<any> {
    // ✅ LOG KIỂM TRA TRƯỚC KHI GỬI
    console.log('📤 Sending Reading Questions:', JSON.stringify({ questions }, null, 2));
    
    return this.http.post(
        this.apiUrl + '/admin/exercises/' + exerciseId + '/reading-questions/batch',
        { questions }, 
        { headers: this.getAuthHeaders() }
    );
}
  uploadAudio(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
    // KHÔNG set Content-Type cho FormData
    return this.http.post(this.apiUrl + '/admin/upload/audio', formData, { headers });
  }
  // ============ LISTENING QUESTIONS ============
  createListeningQuestions(exerciseId: string, questions: any[]): Observable<any> {
    return this.http.post(this.apiUrl + '/admin/exercises/' + exerciseId + '/listening-questions/batch',
      { questions }, { headers: this.getAuthHeaders() });
  }

  // ============ WRITING QUESTIONS ============
  createWritingQuestions(exerciseId: string, questions: any[]): Observable<any> {
    return this.http.post(this.apiUrl + '/admin/exercises/' + exerciseId + '/writing-questions/batch',
      { questions }, { headers: this.getAuthHeaders() });
  }

  // ============ SPEAKING QUESTIONS ============
  createSpeakingQuestions(exerciseId: string, questions: any[]): Observable<any> {
    return this.http.post(this.apiUrl + '/admin/exercises/' + exerciseId + '/speaking-questions/batch',
      { questions }, { headers: this.getAuthHeaders() });
  }

  // ============ FULL TEST ============
  createFullTest(data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/admin/full-tests', data, { headers: this.getAuthHeaders() });
  }

  updateFullTest(fullTestId: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/admin/full-tests/' + fullTestId, data, { headers: this.getAuthHeaders() });
  }

  // ✅ THÊM: Lấy chi tiết Full Test (bao gồm child exercises)
  getFullTestById(fullTestId: string): Observable<any> {
    return this.http.get(this.apiUrl + '/exercises/' + fullTestId, { headers: this.getAuthHeaders() });
  }

  // ============ GET EXERCISES ============
  getExercises(): Observable<any> {
    return this.http.get(this.apiUrl + '/exercises/list', { headers: this.getAuthHeaders() });
  }
}