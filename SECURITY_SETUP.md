# Security Setup Guide

This document outlines the security improvements made and how to configure the application securely.

## 🔒 Security Improvements Implemented

### Backend Security Fixes

1. **Environment Variables for Secrets**
   - JWT secret and AES key are now required via environment variables
   - No hardcoded secrets in codebase

2. **AES Encryption Upgrade**
   - Upgraded from insecure AES/ECB to AES/GCM/NoPadding
   - Now uses random IV (Initialization Vector) for each encryption
   - **⚠️ IMPORTANT**: Existing encrypted data will need to be re-encrypted

3. **JWT Secret Validation**
   - Minimum 32 characters (256 bits) required
   - Validates key length on startup

4. **Admin Password Security**
   - No default password
   - Requires `ADMIN_PASSWORD` environment variable (minimum 8 characters)

5. **Rate Limiting**
   - Login endpoint limited to 5 requests per minute per IP
   - Prevents brute force attacks

6. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - HSTS enabled

7. **CORS Configuration**
   - Whitelisted specific headers instead of allowing all
   - More restrictive CORS policy

8. **Input Validation**
   - Added `@Valid` annotations to all request DTOs
   - Prevents invalid/malicious input

9. **Username Enumeration Prevention**
   - Generic error messages for login failures
   - Prevents attackers from discovering valid usernames

10. **Null Safety**
    - Added proper null checks for token extraction
    - Prevents potential exceptions

### Frontend Security Fixes

1. **Token Storage**
   - Moved from `localStorage` to `sessionStorage`
   - Tokens cleared when browser tab closes
   - Less vulnerable to XSS attacks

2. **HTTP Interceptor**
   - Automatic token injection for all API requests
   - Centralized token management

3. **Token Expiration Handling**
   - Automatic expiration checking
   - Auto-logout on expired tokens

4. **Environment Configuration**
   - API URL configurable via environment files
   - Separate configs for dev and production

5. **Removed Console Logging**
   - Removed sensitive information from console logs
   - Better error handling

## 🚀 Setup Instructions

### 0. Spring Profiles

The application uses Spring profiles for environment-specific configuration:

- **`dev`**: Development profile with SQL logging enabled, auto-schema updates (uses `application-dev.yml`)
- **No profile (default)**: Production configuration with SQL logging disabled, schema validation only (uses `application.yml`)

**Activate dev profile:**
- Via environment variable: `SPRING_PROFILES_ACTIVE=dev`
- Via command line: `java -jar app.jar --spring.profiles.active=dev`
- In docker-compose: Set `SPRING_PROFILES_ACTIVE=dev` in `.env` file

**For production:** Simply don't set `SPRING_PROFILES_ACTIVE` or leave it empty to use the default `application.yml`

### 1. Backend Setup

#### Create `.env` file in project root:

```bash
# Copy the example file
cp .env.example .env
```

#### Generate Secure Keys:

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate AES Key (32 bytes for AES-256)
openssl rand -base64 32 | head -c 32
```

#### Update `.env` file with your values:

```env
# Database
POSTGRES_URL=jdbc:postgresql://localhost:5432/securepass
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password

# JWT (REQUIRED - min 32 chars)
JWT_SECRET=your-generated-jwt-secret-here-minimum-32-characters

# AES (REQUIRED - 16, 24, or 32 bytes)
AES_SECRET_KEY=your-32-byte-aes-key-here

# Admin (REQUIRED - min 8 chars)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Optional
SPRING_PROFILES_ACTIVE=dev  # Use 'dev' for development, 'prod' for production
CORS_ALLOWED_ORIGINS=https://yourdomain.com  # For production CORS
LOG_FILE_PATH=/var/log/securepass/application.log  # Production log file path
```

### 2. Frontend Setup

#### Update Production Environment:

Edit `securepass-frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api-url.com'
};
```

### 3. Database Migration

⚠️ **IMPORTANT**: Due to the AES encryption upgrade, existing encrypted credentials will need to be re-encrypted.

**Option 1: Fresh Start (Recommended for Development)**
- Drop and recreate the database
- All credentials will be encrypted with the new method

**Option 2: Migration Script (For Production)**
- Create a migration script to decrypt old data and re-encrypt with new method
- This requires temporarily storing the old AES key

### 4. Production Checklist

- [ ] Set all required environment variables
- [ ] Use strong, randomly generated secrets
- [ ] **Don't set** `SPRING_PROFILES_ACTIVE` (or leave it empty) to use production config
- [ ] Set `CORS_ALLOWED_ORIGINS` with your production frontend URL
- [ ] Update frontend `environment.prod.ts` with production API URL
- [ ] Use HTTPS in production
- [ ] Configure proper log file path (`LOG_FILE_PATH`)
- [ ] Set up proper database backups
- [ ] Review and adjust rate limiting if needed
- [ ] Set up monitoring and alerting
- [ ] Verify `application.yml` settings are appropriate for your environment

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Rotate secrets regularly** - Especially if compromised
3. **Use HTTPS in production** - Never transmit credentials over HTTP
4. **Keep dependencies updated** - Run `npm audit` and `mvn dependency-check`
5. **Monitor for suspicious activity** - Watch logs for failed login attempts
6. **Use strong passwords** - Enforce password policies
7. **Regular security audits** - Review code and dependencies periodically

## 📝 Notes

- The AES encryption change means existing encrypted data is incompatible
- Rate limiting is in-memory and resets on server restart
- For production, consider using Redis for distributed rate limiting
- Security headers can be customized in `WebSecurityConfig.java`

## 🆘 Troubleshooting

### Application won't start
- Check that all required environment variables are set
- Verify JWT_SECRET is at least 32 characters
- Verify AES_SECRET_KEY is 16, 24, or 32 bytes
- Check logs for specific error messages

### Can't login
- Verify ADMIN_PASSWORD is set and at least 8 characters
- Check database connection
- Review application logs

### Encryption/Decryption errors
- Verify AES_SECRET_KEY matches the one used for encryption
- Check that data was encrypted with the new GCM method
- Old ECB-encrypted data needs migration

