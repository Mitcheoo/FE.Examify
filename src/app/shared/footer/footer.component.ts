import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-section">
            <h3>📚 Examify</h3>
            <p>Nền tảng luyện thi IELTS trực tuyến hàng đầu Việt Nam</p>
            <div class="social-links">
              <a href="#" class="social-link">Facebook</a>
              <a href="#" class="social-link">Youtube</a>
              <a href="#" class="social-link">Zalo</a>
            </div>
          </div>
          
          <div class="footer-section">
            <h4>Khóa học</h4>
            <ul>
              <li><a href="#">Listening</a></li>
              <li><a href="#">Reading</a></li>
              <li><a href="#">Speaking</a></li>
              <li><a href="#">Writing</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><a href="#">Trung tâm trợ giúp</a></li>
              <li><a href="#">Hướng dẫn thanh toán</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Liên hệ</h4>
            <ul>
              <li>📞 Hotline: 1900 1234</li>
              <li>📧 Email: support@examify.vn</li>
              <li>📍 Địa chỉ: Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2024 Examify. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #1a1a2e;
      color: white;
      padding: 3rem 0 1rem;
      margin-top: 4rem;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .footer-section h4 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: #667eea;
    }

    .footer-section p {
      color: #a0a0a0;
      line-height: 1.6;
    }

    .footer-section ul {
      list-style: none;
    }

    .footer-section ul li {
      margin-bottom: 0.5rem;
    }

    .footer-section ul li a {
      color: #a0a0a0;
      text-decoration: none;
      transition: color 0.3s;
    }

    .footer-section ul li a:hover {
      color: #667eea;
    }

    .social-links {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .social-link {
      color: white;
      text-decoration: none;
      padding: 0.25rem 0.5rem;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }

    .footer-bottom {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #a0a0a0;
    }
  `]
})
export class FooterComponent {}