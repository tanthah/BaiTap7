# 🔒 Tài liệu Bảo mật - React Bootstrap Cart Library

## Tổng quan

Thư viện này được xây dựng với nhiều lớp bảo mật để bảo vệ ứng dụng khỏi các lỗ hổng phổ biến.

## 🛡️ Các biện pháp bảo mật Frontend

### 1. XSS Protection (Cross-Site Scripting)

**Triển khai:**
- Sử dụng DOMPurify để sanitize mọi input
- Validate và encode dữ liệu trước khi render
- Không sử dụng `dangerouslySetInnerHTML` trừ khi cần thiết

**Files liên quan:**
- `src/security/sanitizer.js`
- `src/security/xssProtection.js`

**Ví dụ sử dụng:**
```javascript
import { sanitize } from './security/sanitizer';

// Sanitize text input
const cleanName = sanitize.text(userInput);

// Sanitize URL
const cleanURL = sanitize.url(imageURL);

// Sanitize object
const cleanData = sanitize.object(formData);
```

### 2. Input Validation

**Các rule validation:**
- Product ID: 1 - MAX_SAFE_INTEGER
- Product Name: 1-200 ký tự
- Price: 0 - 10,000,000
- Quantity: 1 - 999
- Discount: 0 - 100%

**Files liên quan:**
- `src/security/sanitizer.js` (validators object)

**Ví dụ:**
```javascript
import { validators } from './security/sanitizer';

// Validate cart item
try {
  const validItem = validators.cartItem({
    id: 1,
    name: 'Product',
    price: 99.99,
    quantity: 2
  });
} catch (error) {
  console.error('Validation failed:', error);
}
```

### 3. CSRF Protection

**Triển khai:**
- Token-based protection cho forms
- Token được tạo tự động và lưu trong sessionStorage
- Token được thêm vào headers của mọi request

**Files liên quan:**
- `src/security/csrfProtection.js`

**Ví dụ sử dụng:**
```javascript
import CSRFProtection from './security/csrfProtection';

// Add CSRF token to form
<form>
  <CSRFTokenField />
  {/* form fields */}
</form>

// Protected fetch request
const response = await CSRFProtection.protectedFetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### 4. Rate Limiting

**Mục đích:**
- Ngăn chặn spam requests
- Bảo vệ khỏi DoS attacks
- Giới hạn số lượng actions trong 1 phút

**Cấu hình mặc định:**
- Tối đa 20 requests/phút
- Tự động reset sau time window

**Files liên quan:**
- `src/security/sanitizer.js` (RateLimiter class)
- `src/context/CartContext.enhanced.jsx`

**Ví dụ:**
```javascript
import { RateLimiter } from './security/sanitizer';

const limiter = new RateLimiter(20, 60000);

try {
  limiter.canMakeRequest('addToCart');
  // Process request
} catch (error) {
  console.error('Rate limit exceeded:', error);
}
```

### 5. Storage Security

**Biện pháp:**
- Validate data trước khi save
- Size limits: max 50 items, 5MB storage
- Auto-cleanup corrupted data
- Encryption-ready (có thể thêm encryption layer)

**Files liên quan:**
- `src/core/cartCore.secure.js`

**Limits:**
```javascript
MAX_CART_SIZE = 50 items
MAX_STORAGE_SIZE = 5MB
```

### 6. Content Security Policy (CSP)

**Headers được khuyến nghị:**
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
```

**Files liên quan:**
- `src/security/securityHeaders.js`

**Cách sử dụng:**
```javascript
// Express.js
import { expressSecurityMiddleware } from './security/securityHeaders';
app.use(expressSecurityMiddleware);

// React component
import { SecurityMetaTags } from './security/securityHeaders';
<Head>
  <SecurityMetaTags />
</Head>
```

### 7. File Upload Protection

**Validation:**
- Allowed types: JPEG, PNG, GIF, WEBP
- Max size: 5MB
- Extension validation
- MIME type validation
- Content validation (actual image check)

**Files liên quan:**
- `src/security/xssProtection.js` (FileUploadProtection class)

**Ví dụ:**
```javascript
import { FileUploadProtection } from './security/xssProtection';

try {
  // Validate file type and size
  FileUploadProtection.validateImage(file);
  
  // Validate actual image content
  await FileUploadProtection.validateImageContent(file);
  
  // File is safe to upload
} catch (error) {
  console.error('File validation failed:', error);
}
```

## 🚨 Lưu ý quan trọng

### Frontend Security Limitations

**Frontend security KHÔNG THỂ thay thế backend security!**

Frontend chỉ là lớp bảo vệ đầu tiên. Bạn VẪN CẦN:

1. **Backend Validation**
   - Validate lại mọi input từ client
   - Không tin tưởng dữ liệu từ frontend
   - Implement proper authentication/authorization

2. **API Security**
   - Use HTTPS
   - Implement proper CORS
   - Rate limiting ở server-side
   - API key authentication
   - JWT tokens

3. **Database Security**
   - Parameterized queries (prevent SQL injection)
   - Encrypt sensitive data
   - Proper access controls
   - Regular backups

4. **Server Configuration**
   - Set security headers
   - Keep dependencies updated
   - Use environment variables for secrets
   - Regular security audits

## 📋 Checklist Triển khai Backend

- [ ] Validate mọi input từ client
- [ ] Implement authentication (JWT, OAuth)
- [ ] Implement authorization (role-based)
- [ ] Rate limiting ở server
- [ ] HTTPS enforcement
- [ ] CORS configuration
- [ ] SQL injection prevention
- [ ] Session management
- [ ] Secure password hashing (bcrypt, argon2)
- [ ] Audit logging
- [ ] Error handling (không leak info)
- [ ] Input sanitization ở backend
- [ ] File upload validation ở server
- [ ] Payment security (PCI DSS compliance)
- [ ] Regular security updates
- [ ] Penetration testing

## 🔐 Best Practices

### 1. Discount Codes

**Frontend:**
- Validate format
- Sanitize input
- Rate limit attempts

**Backend (BẮT BUỘC):**
- Verify code exists
- Check expiration
- Verify usage limits
- Log all attempts
- Prevent brute force

### 2. Checkout Process

**Frontend:**
- Validate all fields
- Sanitize inputs
- CSRF protection
- Use HTTPS

**Backend (BẮT BUỘC):**
- Re-calculate totals
- Verify inventory
- Validate payment
- Prevent race conditions
- Transaction logging
- Fraud detection

### 3. User Data

**Frontend:**
- Minimal data storage
- No sensitive data in localStorage
- Sanitize before display

**Backend (BẮT BUỘC):**
- Encrypt sensitive data
- Hash passwords
- Secure session management
- GDPR compliance
- Data retention policies

## 🧪 Testing Security

### Manual Testing

1. **XSS Testing:**
```javascript
// Try these inputs
<script>alert('XSS')</script>
javascript:alert('XSS')
<img src=x onerror=alert('XSS')>
```

2. **SQL Injection (nếu có backend):**
```sql
' OR '1'='1
'; DROP TABLE users; --
```

3. **Rate Limiting:**
- Spam add to cart button
- Multiple discount code attempts

### Automated Testing

```bash
# Install security audit tools
npm audit
npm audit fix

# OWASP ZAP for penetration testing
# Burp Suite for API testing
```

## 📚 Tài liệu tham khảo

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

## 🐛 Báo cáo lỗ hổng bảo mật

Nếu phát hiện lỗ hổng bảo mật, vui lòng:
1. **KHÔNG** public issue trên GitHub
2. Email trực tiếp đến: security@yourdomain.com
3. Cung cấp chi tiết và PoC (Proof of Concept)

## 📝 Changelog

### Version 1.0.0
- ✅ XSS Protection với DOMPurify
- ✅ Input validation và sanitization
- ✅ CSRF token protection
- ✅ Rate limiting
- ✅ Storage security
- ✅ File upload validation
- ✅ CSP headers configuration

## ⚖️ License

MIT License - See LICENSE file for details

---

**LƯU Ý:** Tài liệu này chỉ áp dụng cho frontend security. Backend security là TRÁCH NHIỆM của developer khi triển khai production.