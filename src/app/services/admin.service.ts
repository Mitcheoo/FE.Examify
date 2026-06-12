import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:7241/api/admin';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': token ? 'Bearer ' + token : '',
      'Content-Type': 'application/json'
    });
  }

  // User Management
  getAllUsers(): Observable<any> {
    return this.http.get(this.apiUrl + '/users', { headers: this.getAuthHeaders() });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(this.apiUrl + '/users/' + id, { headers: this.getAuthHeaders() });
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/users/' + id, data, { headers: this.getAuthHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(this.apiUrl + '/users/' + id, { headers: this.getAuthHeaders() });
  }

  // Exercise Management
  getAllExercises(): Observable<any> {
    return this.http.get(this.apiUrl + '/exercises', { headers: this.getAuthHeaders() });
  }

  createExercise(data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/exercises', data, { headers: this.getAuthHeaders() });
  }

  updateExercise(id: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/exercises/' + id, data, { headers: this.getAuthHeaders() });
  }

  deleteExercise(id: string): Observable<any> {
    return this.http.delete(this.apiUrl + '/exercises/' + id, { headers: this.getAuthHeaders() });
  }

  // Part Management
  createPart(exerciseId: string, data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/exercises/' + exerciseId + '/parts', data, { headers: this.getAuthHeaders() });
  }

  updatePart(exerciseId: string, partNumber: number, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/exercises/' + exerciseId + '/parts/' + partNumber, data, { headers: this.getAuthHeaders() });
  }

  deletePart(exerciseId: string, partNumber: number): Observable<any> {
    return this.http.delete(this.apiUrl + '/exercises/' + exerciseId + '/parts/' + partNumber, { headers: this.getAuthHeaders() });
  }

  // Reading Questions
  createReadingQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/exercises/' + exerciseId + '/reading-questions', data, { headers: this.getAuthHeaders() });
  }

  updateReadingQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/exercises/' + exerciseId + '/reading-questions/' + questionId, data, { headers: this.getAuthHeaders() });
  }

  deleteReadingQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(this.apiUrl + '/exercises/' + exerciseId + '/reading-questions/' + questionId, { headers: this.getAuthHeaders() });
  }

  // Listening Questions
  createListeningQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/exercises/' + exerciseId + '/listening-questions', data, { headers: this.getAuthHeaders() });
  }

  updateListeningQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/exercises/' + exerciseId + '/listening-questions/' + questionId, data, { headers: this.getAuthHeaders() });
  }

  deleteListeningQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(this.apiUrl + '/exercises/' + exerciseId + '/listening-questions/' + questionId, { headers: this.getAuthHeaders() });
  }

  // Writing Questions
  createWritingQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/exercises/' + exerciseId + '/writing-questions', data, { headers: this.getAuthHeaders() });
  }

  updateWritingQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/exercises/' + exerciseId + '/writing-questions/' + questionId, data, { headers: this.getAuthHeaders() });
  }

  deleteWritingQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(this.apiUrl + '/exercises/' + exerciseId + '/writing-questions/' + questionId, { headers: this.getAuthHeaders() });
  }

  // Speaking Questions
  createSpeakingQuestion(exerciseId: string, data: any): Observable<any> {
    return this.http.post(this.apiUrl + '/exercises/' + exerciseId + '/speaking-questions', data, { headers: this.getAuthHeaders() });
  }

  updateSpeakingQuestion(exerciseId: string, questionId: string, data: any): Observable<any> {
    return this.http.put(this.apiUrl + '/exercises/' + exerciseId + '/speaking-questions/' + questionId, data, { headers: this.getAuthHeaders() });
  }

  deleteSpeakingQuestion(exerciseId: string, questionId: string): Observable<any> {
    return this.http.delete(this.apiUrl + '/exercises/' + exerciseId + '/speaking-questions/' + questionId, { headers: this.getAuthHeaders() });
  }

  // Statistics
  getStatistics(): Observable<any> {
    return this.http.get(this.apiUrl + '/statistics', { headers: this.getAuthHeaders() });
  }
}
