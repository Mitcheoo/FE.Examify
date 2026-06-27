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
  attempts?: number;      // ✅ THÊM
  message?: string;       // ✅ THÊM
}
interface SubmitReadingCommand {
  exerciseId: string;
  answers: { [key: string]: string };
  timeSpentSeconds: number;
  sessionId?: string;  // ✅ OPTIONAL
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

  getExercisesList(page: number = 1, pageSize: number = 50): Observable<any> {
      const headers = this.getAuthHeaders();
      return this.http.get(`${this.apiUrl}/exercises/list?page=${page}&pageSize=${pageSize}`, { headers });
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
     console.log('📡 API CALL: POST /reading/submit');
  console.log('📤 Data being sent:', data);  // ✅ THÊM LOG
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/reading/submit', data, { headers });
  }

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

  getSpeakingExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /speaking/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(this.apiUrl + '/speaking/exam/' + id, { headers });
  }

  submitSpeaking(data: FormData): Observable<any> {
    console.log('📡 API CALL: POST /speaking/submit');
    const headers = this.getAuthHeaders();
    // KHÔNG set Content-Type cho FormData
    return this.http.post(this.apiUrl + '/speaking/submit', data, { headers });
  }

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

  startFullTestSession(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/start');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/fulltest/start', { fullTestId }, { headers });
  }

  savePartResult(sessionId: string, skillType: string, submissionId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/save-part');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/fulltest/save-part', { sessionId, skillType, submissionId }, { headers });
  }

  submitFullTest(sessionId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl + '/fulltest/submit', { sessionId }, { headers });
  }
  // Thêm vào class ExamService

/**
 * Lưu câu trả lời tạm (draft) - Gửi nhiều câu 1 lần
 */
saveDraftAnswers(data: any): Observable<any> {
  console.log('📡 API CALL: POST /session/answer');
  const headers = this.getAuthHeaders();
  return this.http.post(this.apiUrl + '/session/answer', data, { headers });
}

/**
 * Lấy tất cả câu trả lời tạm của session
 */
getDraftAnswers(sessionId: string): Observable<any> {
  console.log('📡 API CALL: GET /session/' + sessionId + '/answers');
  const headers = this.getAuthHeaders();
  return this.http.get(this.apiUrl + '/session/' + sessionId + '/answers', { headers });
}

/**
 * Nộp bài và chấm điểm
 */
submitSession(sessionId: string): Observable<any> {
  console.log('📡 API CALL: POST /session/submit');
  const headers = this.getAuthHeaders();
  return this.http.post(this.apiUrl + '/session/submit', { sessionId }, { headers });
}
// src/app/services/exam.service.ts

// ✅ THÊM PHƯƠNG THỨC getExerciseStats (nếu chưa có)
 getExerciseStats(skill?: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const url = skill !== undefined 
      ? `${this.apiUrl}/exercises/stats?skill=${skill}`
      : `${this.apiUrl}/exercises/stats`;
    return this.http.get<any[]>(url, { headers });
  }
  getSubmissionResult(submissionId: string): Observable<any> {
  console.log('📡 API CALL: GET /submissions/' + submissionId);
  const headers = this.getAuthHeaders();
  return this.http.get(this.apiUrl + '/submissions/' + submissionId, { headers });
}
clearDraftAnswers(sessionId: string): Observable<any> {
  console.log('📡 API CALL: DELETE /session/' + sessionId + '/answers');
  const headers = this.getAuthHeaders();
  return this.http.delete(this.apiUrl + '/session/' + sessionId + '/answers', { headers });
}
}