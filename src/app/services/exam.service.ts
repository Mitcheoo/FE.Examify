// 📁 src/app/services/exam.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// ============================================================
// INTERFACES
// ============================================================

export interface Exercise {
  id: string;
  title: string;
  description: string;
  vstepLevel: number;
  price: number;
  duration: number;
  createdAt: Date;
  isFullTest?: boolean;
  attemptCount?: number;
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
  status: string; // 'locked' | 'available' | 'completed'
  score?: number;
  examId?: string;
  attempts?: number;
  message?: string;
}

export interface SubmitReadingCommand {
  exerciseId: string;
  answers: { [key: string]: string };
  timeSpentSeconds: number;
  sessionId?: string;
}

export interface SubmitListeningCommand {
  exerciseId: string;
  answers: { [key: string]: string };
  timeSpentSeconds: number;
  sessionId?: string;
}

export interface SubmitWritingCommand {
  exerciseId: string;
  answers: { [key: string]: string };
  timeSpentSeconds: number;
  sessionId?: string;
}

export interface SubmitSpeakingCommand {
  exerciseId: string;
  answers: { [key: string]: string };
  audioUrls: string[];
  timeSpentSeconds: number;
  sessionId?: string;
}

export interface SaveDraftAnswersRequest {
  sessionId: string;
  answers: {
    questionId: string;
    skillType: number;
    userAnswer: string;
  }[];
}

export interface CloseSessionResponse {
  success: boolean;
  message: string;
  sessionId: string;
  fullTestId: string;
  attemptCount: number;
}

export interface NewSessionResponse {
  success: boolean;
  message: string;
  sessionId: string;
  fullTestId: string;
}

// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:7241/api';

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : '',
      'Content-Type': 'application/json'
    });
  }

  private getFormDataHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
  }
 previewTranscript(formData: FormData): Observable<any> {
  console.log('📡 API CALL: POST /speaking/preview-transcript');
  const headers = this.getFormDataHeaders();  // ✅ THÊM DÒNG NÀY
  return this.http.post(`${this.apiUrl}/speaking/preview-transcript`, formData, { headers });
}
  // ============================================================
  // EXERCISE APIs
  // ============================================================
getExercisesList(page: number = 1, pageSize: number = 50, skill?: number, search?: string): Observable<any> {
  const headers = this.getAuthHeaders();
  let url = `${this.apiUrl}/exercises/list?page=${page}&pageSize=${pageSize}`;
  if (skill !== undefined && skill !== null) {
    url += `&skill=${skill}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return this.http.get(url, { headers });
}

  getExerciseById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exercises/${id}`, { headers });
  }

  getExerciseProgress(exerciseId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/exercises/${exerciseId}/progress`, { headers });
  }

  getExerciseStats(skill?: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const url = skill !== undefined 
      ? `${this.apiUrl}/exercises/stats?skill=${skill}`
      : `${this.apiUrl}/exercises/stats`;
    return this.http.get<any[]>(url, { headers });
  }

  // ============================================================
  // READING APIs
  // ============================================================

  getReadingExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /reading/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/reading/exam/${id}`, { headers });
  }

  submitReading(data: SubmitReadingCommand): Observable<any> {
    console.log('📡 API CALL: POST /reading/submit');
    console.log('📤 Data:', data);
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/reading/submit`, data, { headers });
  }

  // ============================================================
  // LISTENING APIs
  // ============================================================

  getListeningExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /listening/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/listening/exam/${id}`, { headers });
  }

  submitListening(data: SubmitListeningCommand): Observable<any> {
    console.log('📡 API CALL: POST /listening/submit');
    console.log('📤 Data:', data);
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/listening/submit`, data, { headers });
  }

  // ============================================================
  // WRITING APIs
  // ============================================================

  getWritingExam(id: string): Observable<any> {
    console.log('📡 API CALL: GET /writing/exam/' + id);
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/writing/exam/${id}`, { headers });
  }

  submitWriting(data: SubmitWritingCommand): Observable<any> {
    console.log('📡 API CALL: POST /writing/submit');
    console.log('📤 Data:', data);
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/writing/submit`, data, { headers });
  }

  // ============================================================
  // SPEAKING APIs
  // ============================================================

getSpeakingExam(id: string): Observable<any> {
  console.log('📡 API CALL: GET /speaking/exam/' + id);
  const headers = this.getAuthHeaders();
  return this.http.get(`${this.apiUrl}/speaking/exam/${id}`, { headers });
}
submitSpeaking(data: FormData): Observable<any> {
  console.log('📡 API CALL: POST /speaking/submit');
  const headers = this.getFormDataHeaders();
  return this.http.post(`${this.apiUrl}/speaking/submit`, data, { headers });
}

  // ============================================================
  // FULL TEST APIs - HIỆN CÓ
  // ============================================================

  startFullTestSession(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/start');
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/fulltest/start`, { fullTestId }, { headers });
  }

  getFullTestStatus(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: GET /fulltest/' + fullTestId + '/status');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/fulltest/${fullTestId}/status`, { headers });
  }

  getFullTestResult(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: GET /fulltest/' + fullTestId + '/result');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/fulltest/${fullTestId}/result`, { headers });
  }

  submitFullTest(sessionId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/fulltest/submit`, { sessionId }, { headers });
  }

  savePartResult(sessionId: string, skillType: string, submissionId: string): Observable<any> {
    console.log('📡 API CALL: POST /fulltest/save-part');
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/fulltest/save-part`, { sessionId, skillType, submissionId }, { headers });
  }
  

  // ============================================================
  // FULL TEST APIs - MỚI ⭐
  // ============================================================

  /**
   * Đóng session và tăng attempt count
   */
  closeFullTestSession(fullTestId: string): Observable<CloseSessionResponse> {
    console.log('📡 API CALL: POST /fulltest/' + fullTestId + '/close-session');
    const headers = this.getAuthHeaders();
    return this.http.post<CloseSessionResponse>(`${this.apiUrl}/fulltest/${fullTestId}/close-session`, {}, { headers });
  }
  uploadAudio(formData: FormData): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : ''
    });
    // KHÔNG set Content-Type cho FormData
    return this.http.post(this.apiUrl + '/admin/upload/audio', formData, { headers });}
  /**
   * Tạo session mới để làm lại full test
   */
  createNewFullTestSession(fullTestId: string): Observable<NewSessionResponse> {
    console.log('📡 API CALL: POST /fulltest/' + fullTestId + '/new-session');
    const headers = this.getAuthHeaders();
    return this.http.post<NewSessionResponse>(`${this.apiUrl}/fulltest/${fullTestId}/new-session`, {}, { headers });
  }

  /**
   * Kiểm tra xem có session active không
   */
  getActiveSession(fullTestId: string): Observable<any> {
    console.log('📡 API CALL: GET /fulltest/' + fullTestId + '/session/active');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/fulltest/${fullTestId}/session/active`, { headers });
  }

  /**
   * Xóa session (nếu cần)
   */
  deleteSession(fullTestId: string, sessionId: string): Observable<any> {
    console.log('📡 API CALL: DELETE /fulltest/' + fullTestId + '/session/' + sessionId);
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/fulltest/${fullTestId}/session/${sessionId}`, { headers });
  }

  // ============================================================
  // SESSION APIs (DRAFT ANSWERS)
  // ============================================================

  /**
   * Lưu câu trả lời tạm (draft) - Gửi nhiều câu 1 lần
   */
  saveDraftAnswers(data: SaveDraftAnswersRequest): Observable<any> {
    console.log('📡 API CALL: POST /session/answer');
    console.log('📤 Data:', data);
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/session/answer`, data, { headers });
  }

  /**
   * Lưu câu trả lời tạm (draft) cho 1 câu hỏi
   */
  saveSingleDraftAnswer(sessionId: string, questionId: string, skillType: number, userAnswer: string): Observable<any> {
    console.log('📡 API CALL: POST /session/answer/single');
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/session/answer/single`, {
      sessionId,
      questionId,
      skillType,
      userAnswer
    }, { headers });
  }

  /**
   * Lấy tất cả câu trả lời tạm của session
   */
  getDraftAnswers(sessionId: string): Observable<any> {
    console.log('📡 API CALL: GET /session/' + sessionId + '/answers');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/session/${sessionId}/answers`, { headers });
  }

  /**
   * Xóa tất cả câu trả lời tạm của session
   */
  clearDraftAnswers(sessionId: string): Observable<any> {
    console.log('📡 API CALL: DELETE /session/' + sessionId + '/answers');
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/session/${sessionId}/answers`, { headers });
  }

  /**
   * Nộp bài và chấm điểm (cho 1 kỹ năng)
   */
  submitSession(sessionId: string): Observable<any> {
    console.log('📡 API CALL: POST /session/submit');
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/session/submit`, { sessionId }, { headers });
  }

  // ============================================================
  // SUBMISSION APIs
  // ============================================================

  /**
   * Lấy kết quả chi tiết của 1 submission
   */
  getSubmissionResult(submissionId: string): Observable<any> {
    console.log('📡 API CALL: GET /submissions/' + submissionId);
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/submissions/${submissionId}`, { headers });
  }

  /**
   * Lấy lịch sử các submission của user
   */
  getMySubmissions(exerciseId?: string): Observable<any> {
    console.log('📡 API CALL: GET /submissions/my' + (exerciseId ? '?exerciseId=' + exerciseId : ''));
    const headers = this.getAuthHeaders();
    const url = exerciseId 
      ? `${this.apiUrl}/submissions/my?exerciseId=${exerciseId}`
      : `${this.apiUrl}/submissions/my`;
    return this.http.get(url, { headers });
  }

  // ============================================================
  // SUBMISSION DETAIL APIs
  // ============================================================

  /**
   * Lấy chi tiết bài nộp
  //  */
  // getSubmissionDetail(submissionId: string): Observable<any> {
  //   console.log('📡 API CALL: GET /submissions/detail/' + submissionId);
  //   const headers = this.getAuthHeaders();
  //   return this.http.get(`${this.apiUrl}/submissions/detail/${submissionId}`, { headers });
  // }
getSubmissionDetail(submissionId: string): Observable<any> {
    console.log('📡 API CALL: GET /submissions/' + submissionId);
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/submissions/${submissionId}`, { headers });
}
  // ============================================================
  // DASHBOARD APIs
  // ============================================================

  /**
   * Lấy thống kê dashboard
   */
  getDashboardStats(): Observable<any> {
    console.log('📡 API CALL: GET /dashboard/stats');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard/stats`, { headers });
  }

  /**
   * Lấy dữ liệu biểu đồ tiến độ
   */
  getProgressChart(): Observable<any> {
    console.log('📡 API CALL: GET /dashboard/progress');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard/progress`, { headers });
  }

  /**
   * Lấy bảng xếp hạng
   */
  getLeaderboard(skillType?: number): Observable<any> {
    console.log('📡 API CALL: GET /dashboard/leaderboard' + (skillType !== undefined ? '?skillType=' + skillType : ''));
    const headers = this.getAuthHeaders();
    const url = skillType !== undefined 
      ? `${this.apiUrl}/dashboard/leaderboard?skillType=${skillType}`
      : `${this.apiUrl}/dashboard/leaderboard`;
    return this.http.get(url, { headers });
  }

  /**
   * Lấy phân tích điểm yếu
   */
  getWeaknessAnalysis(): Observable<any> {
    console.log('📡 API CALL: GET /dashboard/weakness');
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard/weakness`, { headers });
  }
}