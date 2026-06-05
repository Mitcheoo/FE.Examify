import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  
  console.log('🔐 AuthGuard - Token exists:', !!token);
  
  if (token) {
    console.log('✅ AuthGuard - Access granted');
    return true;
  }
  
  console.log('❌ AuthGuard - No token, redirect to login');
  router.navigate(['/login']);
  return false;
};