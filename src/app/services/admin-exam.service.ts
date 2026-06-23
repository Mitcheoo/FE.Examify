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

  // ============ READING QUESTIONS ============
  createReadingQuestions(exerciseId: string, questions: any[]): Observable<any> {
    return this.http.post(this.apiUrl + '/admin/exercises/' + exerciseId + '/reading-questions/batch',
      { questions }, { headers: this.getAuthHeaders() });
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

  // ============ GET EXERCISES ============
  getExercises(): Observable<any> {
    return this.http.get(this.apiUrl + '/exercises/list', { headers: this.getAuthHeaders() });
  }
}