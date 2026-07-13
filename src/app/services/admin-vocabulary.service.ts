// 📁 src/app/services/admin-vocabulary.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface VocabularyWordDto {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  example: string;
  partOfSpeech?: string;
  level: string;
  topic?: string;
  audioUrl?: string;
  imageUrl?: string;
  vietnameseExample?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  masteredCount?: number;
  learningCount?: number;
  masteryRate?: number;
}

export interface CreateVocabularyWordDto {
  word: string;
  meaning: string;
  pronunciation?: string;
  example: string;
  partOfSpeech?: string;
  level: string;
  topic?: string;
  audioUrl?: string;
  imageUrl?: string;
  vietnameseExample?: string;
}

export interface UpdateVocabularyWordDto {
  word?: string;
  meaning?: string;
  pronunciation?: string;
  example?: string;
  partOfSpeech?: string;
  level?: string;
  topic?: string;
  audioUrl?: string;
  imageUrl?: string;
  vietnameseExample?: string;
}

export interface VocabularyListResponse {
  items: VocabularyWordDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminVocabularyService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'https://localhost:7241/api/Vocabulary';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // GET /api/Vocabulary
  getVocabularyList(params: any): Observable<VocabularyListResponse> {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.apiUrl}${queryString ? '?' + queryString : ''}`;
    return this.http.get<VocabularyListResponse>(url, { headers: this.getHeaders() });
  }

  // GET /api/Vocabulary/{id}
  getWordById(id: string): Observable<VocabularyWordDto> {
    return this.http.get<VocabularyWordDto>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  // POST /api/Vocabulary
  createWord(data: CreateVocabularyWordDto): Observable<VocabularyWordDto> {
    return this.http.post<VocabularyWordDto>(this.apiUrl, data, { 
      headers: this.getHeaders() 
    });
  }

  // PUT /api/Vocabulary/{id}
  updateWord(id: string, data: UpdateVocabularyWordDto): Observable<VocabularyWordDto> {
    return this.http.put<VocabularyWordDto>(`${this.apiUrl}/${id}`, data, { 
      headers: this.getHeaders() 
    });
  }

  // DELETE /api/Vocabulary/{id}
  deleteWord(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    });
  }

  // GET /api/Vocabulary/stats
  getStats(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats?days=${days}`, { 
      headers: this.getHeaders() 
    });
  }

  // POST /api/Vocabulary/import
  importWords(words: CreateVocabularyWordDto[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/import`, words, { 
      headers: this.getHeaders() 
    });
  }
}