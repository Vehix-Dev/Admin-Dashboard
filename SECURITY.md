# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Vehix Admin CRM seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **vehixapp@gmail.com**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Security Considerations

### Authentication & Authorization

- The application uses a permission-based access control system
- User permissions are stored in SQLite database
- All admin routes should be protected with proper authentication
- Session management should be implemented securely

### Data Protection

- **Database**: SQLite database files contain sensitive user data
  - Ensure `vehix.db` and `permissions.db` are not publicly accessible
  - Regular backups should be encrypted
  - Database files should have restricted file permissions

- **File Uploads**: User-uploaded files are stored in `public/uploads/`
  - Implement file type validation
  - Scan uploaded files for malware
  - Limit file sizes to prevent DoS attacks
  - Consider moving uploads outside the public directory

- **Environment Variables**: Sensitive configuration should be in `.env`
  - Never commit `.env` files to version control
  - Use strong, unique values for production
  - Rotate secrets regularly

### API Security

- **Input Validation**: All API endpoints should validate input
  - Use Zod schemas for request validation
  - Sanitize user input to prevent XSS attacks
  - Implement rate limiting to prevent abuse

- **SQL Injection**: Using better-sqlite3 with prepared statements
  - Always use parameterized queries
  - Never concatenate user input into SQL strings

- **CSRF Protection**: Implement CSRF tokens for state-changing operations

### Best Practices

1. **Dependencies**
   - Regularly update npm packages: `npm audit`
   - Review security advisories for dependencies
   - Use `npm audit fix` to automatically fix vulnerabilities

2. **HTTPS**
   - Always use HTTPS in production
   - Implement HSTS headers
   - Use secure cookies (httpOnly, secure, sameSite)

3. **Error Handling**
   - Don't expose stack traces in production
   - Log errors securely without exposing sensitive data
   - Implement proper error boundaries

4. **File Permissions**
   - Database files: 600 (read/write for owner only)
   - Configuration files: 600
   - Upload directory: 755 with proper ownership

5. **Content Security Policy**
   - Implement CSP headers
   - Restrict inline scripts
   - Whitelist trusted domains

6. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Protect login endpoints from brute force attacks
   - Limit file upload frequency

## Known Security Considerations

### Current Implementation Notes

1. **Authentication**: The current implementation may need enhancement for production use
   - Consider implementing JWT or session-based authentication
   - Add password hashing (bcrypt/argon2)
   - Implement account lockout after failed attempts

2. **File Upload**: The upload API accepts files without extensive validation
   - Add MIME type checking
   - Implement virus scanning
   - Add file size limits
   - Validate file extensions

3. **Database Access**: Direct database access in API routes
   - Consider implementing an ORM or query builder
   - Add connection pooling for better performance
   - Implement database encryption at rest

4. **CORS**: Configure CORS properly for production
   - Restrict allowed origins
   - Limit allowed methods
   - Set appropriate headers

## Security Updates

We will notify users of security updates through:
- GitHub Security Advisories
- Release notes
- Email notifications (for critical issues)

## Disclosure Policy

- We will confirm receipt of your vulnerability report within 48 hours
- We will send you regular updates about our progress
- We will notify you when the vulnerability is fixed
- We will publicly disclose the vulnerability after a fix is released (with your consent)

## Security Hall of Fame

We appreciate security researchers who help keep Vehix Admin CRM safe. Researchers who responsibly disclose vulnerabilities will be acknowledged here (with their permission).

---

Thank you for helping keep Vehix Admin CRM and our users safe!
