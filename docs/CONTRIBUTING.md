# Contributing to Todo Elephant Security

Thank you for helping make Todo Elephant more secure! 🙌

## How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/lassestilvang/todo-elephant.git
   cd todo-elephant
   ```

2. **Set Up Development Environment**
   ```bash
   # Install Node.js dependencies
   npm ci

   # Install security testing tools (when restrictions allow)
   # npm install -D @owaspzap/nodejs security-headers jest supertest
   ```

3. **Run Security Tests**
   ```bash
   # Execute security test suite
   npx ts-node security-test.ts

   # Review results
   echo "Security test results:"
   cat security-test-results.log
   ```

4. **Add Security Tests**
   - Create new test files under `security/`
   - Follow naming convention: `security-test-*.ts`
   - Add descriptive test names
   - Include assertions for expected security behaviors

5. **Submit Pull Request**
   ```bash
   git checkout -b security-feature
   # Make your changes
   git commit -m "security: improve password complexity validation"
   git push origin security-feature
   ```

## Code Quality Standards

1. **Security-First Approach**
   - All new code must pass security validation
   - No new security vulnerabilities introduced
   - All security tests must pass

2. **Documentation Requirements**
   - Update security documentation for all new features
   - Add comments explaining security considerations
   - Maintain security audit trail

3. **Testing Requirements**
   - Add unit tests for new security-critical functions
   - Add integration tests for security flows
   - Include test vectors for edge cases

4. **Security Review Process**
   - All security-related changes require at least 2 approvals
   - Security lead must review all security modifications
   - Changes to security headers require architectural review

---

## 🚨 Security Incident Reporting

In case you discover a security vulnerability:

1. **Do NOT make it public**
2. **Email security@todo-elephant.com** with:
   - Issue description
   - Steps to reproduce
   - Potential impact
3. We will acknowledge within 24 hours and provide a remediation timeline

---

## 🛡️ Security Checklist for New Features

When implementing new features, ensure you:

1. Add input validation
2. Apply security headers where appropriate
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - Referrer-Policy: strict-origin-when-cross-origin
   - Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';

3. Validate authentication flows
4. Verify webhook signatures when applicable
5. Test rate limiting behavior
5. Update security audit documentation

---

## 🛡️ Security Checklist for New Dependencies

1. Run `npm audit` regularly
2. Check for known vulnerabilities
3. Prefer well-maintained, actively maintained packages
4. Avoid dependencies with known critical CVEs
   - Use `npm audit` or `npm audit fix --dry-run`
   - Monitor security mailing lists for your dependencies