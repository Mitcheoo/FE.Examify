// src/app/pages/admin/pages/user-detail/user-detail.component.ts

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';  // ✅ THÊM ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminUserService, User } from '../../../../services/admin-user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(AdminUserService);
  private cdr = inject(ChangeDetectorRef);  // ✅ THÊM DÒNG NÀY

  user: User | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    console.log('🔍 UserDetailComponent initialized');
    
    const id = this.route.snapshot.paramMap.get('id');
    console.log('📌 User ID from URL:', id);
    
    if (id) {
      this.loadUser(id);
    } else {
      this.isLoading = false;
      this.errorMessage = 'Không tìm thấy ID người dùng';
      this.cdr.detectChanges();  // ✅ FORCE UPDATE UI
    }
  }

  loadUser(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU LOAD

    this.userService.getUser(id).subscribe({
      next: (user) => {
        console.log('✅ User loaded:', user);
        this.user = user;
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ DỮ LIỆU
      },
      error: (err) => {
        console.error('❌ Error loading user:', err);
        this.errorMessage = err.error?.message || 'Không thể tải thông tin người dùng';
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  editUser(): void {
    // TODO: Mở modal edit hoặc chuyển đến trang edit
    alert('Chức năng đang phát triển');
  }

  toggleStatus(): void {
    if (!this.user) return;
    
    const newStatus = !this.user.isActive;
    const action = newStatus ? 'MỞ KHÓA' : 'KHÓA';
    const confirmMsg = `Bạn có chắc muốn ${action} tài khoản "${this.user.userName}"?`;
    
    if (!confirm(confirmMsg)) return;

    const updateData = {
      fullName: this.user.fullName,
      email: this.user.email,
      isActive: newStatus,
      roles: this.user.roles
    };
    
    this.isLoading = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU CẬP NHẬT

    this.userService.updateUser(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CẬP NHẬT THÀNH CÔNG
        alert(newStatus ? '✅ Đã mở khóa tài khoản!' : '✅ Đã khóa tài khoản!');
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
        alert(err.error?.message || '❌ Cập nhật trạng thái thất bại!');
      }
    });
  }

  deleteUser(): void {
    if (!this.user) return;
    
    if (!confirm(`Bạn có chắc muốn XÓA vĩnh viễn tài khoản "${this.user.userName}"?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    if (!confirm(`Xác nhận xóa tài khoản "${this.user.userName}" một lần nữa?`)) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - BẮT ĐẦU XÓA

    this.userService.deleteUser(this.user.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - XÓA THÀNH CÔNG
        alert('✅ Đã xóa tài khoản thành công!');
        this.goBack();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.isLoading = false;
        this.cdr.detectChanges();  // ✅ FORCE UPDATE UI - CÓ LỖI
        alert(err.error?.message || '❌ Xóa tài khoản thất bại!');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'Admin') {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-blue-100 text-blue-700';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Đang hoạt động' : 'Đã khóa';
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700';
  }

  getStatusDotClass(isActive: boolean): string {
    return isActive ? 'bg-emerald-500' : 'bg-gray-500';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}