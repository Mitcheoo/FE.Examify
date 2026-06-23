// src/app/pages/admin/pages/users/users.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';  // ✅ THÊM ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService, User } from '../../../../services/admin-user.service';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private userService = inject(AdminUserService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);  // ✅ THÊM DÒNG NÀY

  users: User[] = [];
  isLoading = false;
  totalUsers = 0;
  activeUsers = 0;
  adminCount = 0;
  avgExams = 0;

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  searchTerm = '';
  filterRole = '';
  filterStatus = '';

  showModal = false;
  isEditing = false;
  isSaving = false;
  formError = '';
  selectedUserId: string | null = null;

  formData = {
    userName: '',
    email: '',
    password: '',
    fullName: '',
    roles: ['User'] as string[]
  };

  roleOptions = ['User', 'Admin'];
  Math = Math;

  ngOnInit(): void {
    this.loadUsers();
  }

  viewUser(id: string): void {
    console.log('🔍 viewUser called with id:', id);
    this.router.navigate(['/admin/user', id]).then(
      (success) => console.log('✅ Navigation success:', success),
      (error) => console.error('❌ Navigation error:', error)
    );
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU LOAD

    this.userService.getUsers(this.page, this.pageSize, this.searchTerm).subscribe({
      next: (result: any) => {
        this.users = result.items || [];
        this.totalCount = result.totalCount || 0;
        this.totalPages = result.totalPages || 1;
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ DỮ LIỆU
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
      }
    });
  }

  calculateStats(): void {
    this.totalUsers = this.totalCount;
    this.activeUsers = this.users.filter((u: User) => u.isActive).length;
    this.adminCount = this.users.filter((u: User) => u.roles && u.roles.includes('Admin')).length;
    this.avgExams = 0;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CẬP NHẬT STATS
  }

  onSearch(): void {
    this.page = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterRole = '';
    this.filterStatus = '';
    this.page = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadUsers();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.selectedUserId = null;
    this.formData = {
      userName: '',
      email: '',
      password: '',
      fullName: '',
      roles: ['User']
    };
    this.formError = '';
    this.showModal = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - MỞ MODAL
  }

  openEditModal(user: User): void {
    this.isEditing = true;
    this.selectedUserId = user.id;
    this.formData = {
      userName: user.userName,
      email: user.email,
      password: '',
      fullName: user.fullName,
      roles: user.roles || ['User']
    };
    this.formError = '';
    this.showModal = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - MỞ MODAL EDIT
  }

  closeModal(): void {
    this.showModal = false;
    this.isSaving = false;
    this.formError = '';
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - ĐÓNG MODAL
  }

  toggleRole(role: string): void {
    const index = this.formData.roles.indexOf(role);
    if (index > -1) {
      this.formData.roles.splice(index, 1);
    } else {
      this.formData.roles.push(role);
    }
    if (this.formData.roles.length === 0) {
      this.formData.roles.push('User');
    }
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - THAY ĐỔI ROLE
  }

  saveUser(): void {
    this.isSaving = true;
    this.formError = '';
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU LƯU

    if (this.isEditing && this.selectedUserId) {
      const updateData = {
        fullName: this.formData.fullName,
        email: this.formData.email,
        isActive: true,
        roles: this.formData.roles
      };

      this.userService.updateUser(this.selectedUserId, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.isSaving = false;
          this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - LƯU THÀNH CÔNG
        },
        error: (err: any) => {
          this.formError = err.error?.message || 'Update failed';
          this.isSaving = false;
          this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
        }
      });
    } else {
      this.userService.createUser(this.formData).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          this.isSaving = false;
          this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - TẠO THÀNH CÔNG
        },
        error: (err: any) => {
          this.formError = err.error?.message || 'Create failed';
          this.isSaving = false;
          this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
        }
      });
    }
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.isActive;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} user "${user.userName}"?`)) return;

    const updateData = {
      fullName: user.fullName,
      email: user.email,
      isActive: newStatus,
      roles: user.roles
    };

    this.isLoading = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU CẬP NHẬT STATUS

    this.userService.updateUser(user.id, updateData).subscribe({
      next: () => {
        this.loadUsers();
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CẬP NHẬT STATUS THÀNH CÔNG
      },
      error: (err: any) => {
        console.error('Error updating status:', err);
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete user "${user.userName}"? This action cannot be undone!`)) return;

    this.isLoading = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU XÓA

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - XÓA THÀNH CÔNG
      },
      error: (err: any) => {
        console.error('Error deleting user:', err);
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
      }
    });
  }
}