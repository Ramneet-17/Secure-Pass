# Spring Profiles Configuration

This application uses Spring profiles to manage environment-specific configurations.

## Configuration Files

- **`application.yml`** - Default/Production configuration (used when no profile is active)
- **`application-dev.yml`** - Development configuration (used when `dev` profile is active)

## Available Profiles

### No Profile / Default (Production)
- **File**: `application.yml`
- **Use for**: Production deployments
- **Features**:
  - SQL logging disabled
  - Schema validation only (`ddl-auto: validate`)
  - Warning/Error logging only
  - CORS configured via environment variable
  - Error details hidden from clients
  - Log file output configured

### `dev`
- **File**: `application-dev.yml`
- **Use for**: Local development
- **Features**:
  - SQL logging enabled
  - Schema auto-update (`ddl-auto: update`)
  - Debug logging enabled
  - CORS allows `http://localhost:4200`

## How to Activate a Profile

### Development Profile

**1. Environment Variable (Recommended)**
```bash
export SPRING_PROFILES_ACTIVE=dev
```

Or in your `.env` file:
```env
SPRING_PROFILES_ACTIVE=dev
```

**2. Command Line**
```bash
java -jar app.jar --spring.profiles.active=dev
```

**3. Docker Compose**
Set in your `.env` file:
```env
SPRING_PROFILES_ACTIVE=dev
```

**4. IDE (IntelliJ/Eclipse)**
- Run Configuration → VM Options: `-Dspring.profiles.active=dev`
- Or Environment Variables: `SPRING_PROFILES_ACTIVE=dev`

### Production (No Profile)

For production, simply **don't set** `SPRING_PROFILES_ACTIVE` or set it to empty. The application will use `application.yml` (default/production config).

## Configuration Override Priority

1. Command line arguments (highest priority)
2. Environment variables
3. Profile-specific YAML (`application-dev.yml` when `dev` profile is active)
4. Base `application.yml` (used when no profile is active)

## Production Configuration Checklist

When deploying to production (no profile):

- [ ] **Don't set** `SPRING_PROFILES_ACTIVE` or leave it empty
- [ ] Set `CORS_ALLOWED_ORIGINS` with your production frontend URL
- [ ] Set `LOG_FILE_PATH` if you want custom log location
- [ ] Verify all required environment variables are set:
  - `JWT_SECRET` (min 32 chars)
  - `AES_SECRET_KEY` (16, 24, or 32 bytes)
  - `ADMIN_PASSWORD` (min 8 chars)
  - Database credentials

## CORS Configuration

### Development
CORS is pre-configured for `http://localhost:4200`

### Production
Set `CORS_ALLOWED_ORIGINS` environment variable:
```env
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

For multiple origins, edit `application.yml` directly:
```yaml
app:
  cors:
    allowed-origins:
      - "https://app.yourdomain.com"
      - "https://www.yourdomain.com"
```

## Logging Configuration

### Development
- Console output with colored logs
- Debug level for application packages
- SQL queries visible

### Production
- File-based logging (default: `/var/log/securepass/application.log`)
- Warning/Error level only
- SQL queries hidden
- Log rotation: 10MB max, 30 days retention

Customize log path:
```env
LOG_FILE_PATH=/custom/path/application.log
```

