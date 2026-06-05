import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  vstepLevel: number;
  price: number;
  duration: number;
  createdAt: Date;
}

export interface ExamDetail {
  id: string;
  title: string;
  description: string;
  vstepLevel: number;
  price: number;
  duration: number;
  skills: SkillProgress[];
}

export interface SkillProgress {
  skillType: string;
  skillName: string;
  duration: number;
  status: string;
  score?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:7241/api';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
  }

  getExercisesList(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/exercises/list', { headers });
  }

  getExerciseById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/exercises/' + id, { headers });
  }

  getExerciseProgress(exerciseId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/exercises/' + exerciseId + '/progress', { headers });
  }

  getReadingExam(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/reading/exam/' + id, { headers });
  }

  submitReading(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/reading/submit', data, { headers });
  }
}