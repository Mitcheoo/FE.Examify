import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  // const authService = inject(AuthService);
  // const router = inject(Router);
  
  // // Lấy user và kiểm tra role từ localStorage
  // const userStr = localStorage.getItem('current_user');
  // let isAdmin = false;
  
  // if (userStr) {
  //   try {
  //     const user = JSON.parse(userStr);
  //     isAdmin = user.roles?.includes('Admin') || user.role === 'User';
  //   } catch(e) {
  //     console.error('Error parsing user:', e);
  //   }
  // }
  
  // if (isAdmin) {
  //   return true;
  // }
  
  // router.navigate(['/']);
  // return false;

  return true;

};
