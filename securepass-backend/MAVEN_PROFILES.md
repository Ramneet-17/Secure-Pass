# Maven Profiles Guide

This project uses Maven profiles to manage different build configurations for development and production environments.

## Available Maven Profiles

### `dev` (Default)
- **Profile ID**: `dev`
- **Spring Profile**: `dev`
- **Use for**: Local development and testing
- **Activation**: Active by default
- **Configuration File**: `application-dev.yml`

### No Profile (Production)
- **Profile ID**: None (default)
- **Spring Profile**: None (default)
- **Use for**: Production builds and deployments
- **Activation**: Default when no profile is specified
- **Configuration File**: `application.yml`

## How to Use Maven Profiles

### Building with Development Profile (Default)

```bash
# Default - uses dev profile automatically
mvn clean install

# Explicitly specify dev profile
mvn clean install -Pdev

# Run application with dev profile
mvn spring-boot:run -Pdev
```

### Building for Production (No Profile)

```bash
# Build without any profile (uses default application.yml)
mvn clean install

# Run application without profile (production config)
mvn spring-boot:run

# Package JAR for production
mvn clean package
```

### Running the Application

```bash
# Development (with dev profile)
mvn spring-boot:run -Pdev
# Or set environment variable: SPRING_PROFILES_ACTIVE=dev

# Production (no profile - uses application.yml)
mvn spring-boot:run
# Or explicitly: SPRING_PROFILES_ACTIVE= mvn spring-boot:run

# Or after building, run the JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar                    # Production
java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev  # Development
```

## Maven Profile vs Spring Profile

- **Maven Profile**: Controls build-time configuration (which dependencies, build settings, etc.)
- **Spring Profile**: Controls runtime configuration (which application.yml to use)

In this project:
- Maven profile `dev` → Sets Spring profile to `dev` → Uses `application-dev.yml`
- No Maven profile (default) → No Spring profile → Uses `application.yml` (production)

## Docker Build with Maven Profile

```bash
# Build Docker image with dev profile
docker build --build-arg MAVEN_PROFILE=dev -t securepass-backend:dev .

# Build Docker image for production (no profile)
docker build -t securepass-backend:prod .
```

If using Dockerfile, you can pass the profile:

```dockerfile
ARG MAVEN_PROFILE=dev
RUN mvn clean package -P${MAVEN_PROFILE} -DskipTests
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build for Production
  run: mvn clean package -DskipTests

- name: Build for Development
  run: mvn clean package -Pdev -DskipTests
```

### Jenkins Example

```groovy
stage('Build') {
    steps {
        script {
            def profile = env.BUILD_TYPE == 'production' ? '' : '-Pdev'
            sh "mvn clean package ${profile} -DskipTests"
        }
    }
}
```

## Verification

To verify which profile is active:

```bash
# Check active Maven profiles
mvn help:active-profiles

# Check Spring profile at runtime
# Add to application.yml temporarily:
# management:
#   endpoints:
#     web:
#       exposure:
#         include: env,info
# Then visit: http://localhost:8081/actuator/env
```

## Notes

- The `dev` Maven profile is set as default (`activeByDefault=true`)
- However, for production, you should **not** use the Maven profile (or explicitly disable it)
- The Spring profile is automatically set based on the active Maven profile
- Environment variables can still override the Spring profile at runtime:
  ```bash
  # Production (no profile)
  java -jar app.jar
  
  # Development
  SPRING_PROFILES_ACTIVE=dev java -jar app.jar
  ```

