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
  examId?: string;
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

  // READING
  getReadingExam(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/reading/exam/' + id, { headers });
  }

  submitReading(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/reading/submit', data, { headers });
  }

  // LISTENING
  getListeningExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /listening/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/listening/exam/' + id, { headers });
  }

  submitListening(data: any): Observable<any> {
    console.log('📡 API CALL: POST /listening/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/listening/submit', data, { headers });
  }

  // WRITING
  getWritingExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /writing/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/writing/exam/' + id, { headers });
  }

  submitWriting(data: any): Observable<any> {
    console.log('📡 API CALL: POST /writing/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/writing/submit', data, { headers });
  }

  // SPEAKING
  getSpeakingExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /speaking/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/speaking/exam/' + id, { headers });
  }

  submitSpeaking(data: FormData): Observable<any> {
    console.log('📡 API CALL: POST /speaking/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/speaking/submit', data, { headers });
  }

  // FULL TEST
  getFullTestStatus(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: GET /fulltest/' + fullTestId + '/status');
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/fulltest/' + fullTestId + '/status', { headers });
  }

  getFullTestResult(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: GET /fulltest/' + fullTestId + '/result');
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/fulltest/' + fullTestId + '/result', { headers });
  }

  // ✅ API TẠO SESSION CHO FULL TEST
  startFullTestSession(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/start');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/fulltest/start', { fullTestId }, { headers });
  }

  // ✅ API LƯU KẾT QUẢ TỪNG PHẦN
  savePartResult(sessionId: string, skillType: string, submissionId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/save-part');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/fulltest/save-part', { sessionId, skillType, submissionId }, { headers });
  }

  // ✅ API HOÀN THÀNH FULL TEST
  submitFullTest(sessionId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/fulltest/submit', { sessionId }, { headers });
  }
}