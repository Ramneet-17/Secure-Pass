# Docker Build with Maven

This guide explains how to build Docker images using Maven.

## Building Docker Image with Maven

### Option 1: Using Maven Profile (Recommended)

Build the Docker image by activating the `docker` profile:

```bash
mvn clean package -Pdocker
```

This will:
1. Compile the application
2. Run tests
3. Package the JAR file
4. Build the Docker image

### Option 2: Using Property

Build the Docker image by setting the `docker.skip` property to `false`:

```bash
mvn clean package -Ddocker.skip=false
```

### Option 3: Build and Push to Registry

To build and push to a Docker registry:

```bash
# Build and tag
mvn clean package -Pdocker -Ddocker.image.tag=1.0.0

# Push to registry (requires docker login first)
docker push securepass-backend:1.0.0
```

## Customizing Image Name and Tag

You can customize the Docker image name and tag using Maven properties:

```bash
# Custom image name and tag
mvn clean package -Pdocker \
  -Ddocker.image.name=my-registry/securepass-backend \
  -Ddocker.image.tag=1.0.0

# Or use version from pom.xml
mvn clean package -Pdocker -Ddocker.image.tag=${project.version}
```

## Docker Image Configuration

- **Base Image**: `eclipse-temurin:17-jre-alpine` (lightweight JRE)
- **Port**: 8081 (exposed)
- **JAR Location**: `/app.jar`
- **Default Image Name**: `securepass-backend`
- **Default Tag**: `${project.version}` (from pom.xml)

## Examples

### Build for Development
```bash
mvn clean package -Pdev,docker
```

### Build for Production
```bash
mvn clean package -Pdocker -Ddocker.image.tag=latest
```

### Build with Custom Registry
```bash
mvn clean package -Pdocker \
  -Ddocker.image.name=registry.example.com/securepass-backend \
  -Ddocker.image.tag=1.0.0
```

## Notes

- By default, Docker build is **skipped** (`docker.skip=true`)
- Activate the `docker` profile or set `docker.skip=false` to build
- The Docker image is built **after** the `package` phase
- Make sure Docker is running before building images
- The Dockerfile is located in `securepass-backend/` directory

