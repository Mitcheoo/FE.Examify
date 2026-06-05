import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    console.log('🔍 INTERCEPTOR - URL:', req.url);
    console.log('🔍 INTERCEPTOR - Token exists:', !!token);
    
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: 'Bearer ' + token
        }
      });
      console.log('✅ INTERCEPTOR - Added Authorization header');
      return next.handle(cloned);
    }
    
    console.log('⚠️ INTERCEPTOR - No token, sending without auth');
    return next.handle(req);
  }
}
