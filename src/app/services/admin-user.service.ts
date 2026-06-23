// src/app/services/admin-user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // ✅ THÊM HttpHeaders
import { Observable } from 'rxjs';

export interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
}

export interface CreateUserDto {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  roles: string[];
}

export interface UpdateUserDto {
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private apiUrl = 'https://localhost:7241/api/admin/users';

  constructor(private http: HttpClient) {}

  // ✅ HÀM LẤY HEADER VỚI TOKEN
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // ✅ LẤY DANH SÁCH USERS (CÓ TOKEN)
  getUsers(page = 1, pageSize = 10, search = ''): Observable<PagedResult<User>> {
    let url = `${this.apiUrl}?page=${page}&pageSize=${pageSize}`;
    if (search) url += `&search=${search}`;
    
    // ✅ THÊM HEADER VÀO REQUEST
    return this.http.get<PagedResult<User>>(url, { headers: this.getAuthHeaders() });
  }

  // ✅ LẤY USER THEO ID (CÓ TOKEN)
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // ✅ TẠO USER MỚI (CÓ TOKEN)
  createUser(data: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, data, { headers: this.getAuthHeaders() });
  }

  // ✅ CẬP NHẬT USER (CÓ TOKEN)
  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
  }

  // ✅ XÓA USER (CÓ TOKEN)
  deleteUser(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // ✅ GÁN ROLE CHO USER (CÓ TOKEN)
  assignRoles(id: string, roles: string[]): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/roles`, { roles }, { headers: this.getAuthHeaders() });
  }
}