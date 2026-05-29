import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    console.log('Class Interceptor - URL:', req.url);
    console.log('Class Interceptor - Token exists:', !!token);
    
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: 'Bearer ' + token
        }
      });
      console.log('Class Interceptor - Added token to:', req.url);
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}
