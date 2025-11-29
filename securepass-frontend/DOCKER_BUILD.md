# Frontend Docker Build

This guide explains how to build and run the Angular frontend using Docker.

## Building Docker Image

### Using Docker Compose (Recommended)

Build and run all services including the frontend:

```bash
docker-compose up --build
```

The frontend will be available at: `http://localhost:4200`

### Building Frontend Image Manually

```bash
cd securepass-frontend
docker build -t securepass-frontend:latest .
```

### Running the Container

```bash
docker run -d \
  -p 4200:80 \
  -e API_URL=http://localhost:8081 \
  --name securepass_frontend \
  securepass-frontend:latest
```

## Environment Variables

- `API_URL`: Backend API URL (default: `http://localhost:8081`)
  - For Docker Compose: Use `http://springboot-app:8081` (internal service name)
  - For external access: Use your backend URL

## Docker Compose Configuration

The frontend service in `docker-compose.yml`:
- Builds from `./securepass-frontend`
- Exposes port 80 (mapped to host port 4200)
- Depends on `springboot-app` service
- Uses nginx to serve the built Angular application

## Production Build

The Dockerfile uses a multi-stage build:
1. **Build stage**: Compiles Angular application with production optimizations
2. **Serve stage**: Uses nginx to serve the static files

## Nginx Configuration

The `nginx.conf` includes:
- Angular routing support (SPA)
- Gzip compression
- Security headers
- Static asset caching
- Health check endpoint at `/health`

## Notes

- The frontend is built with production configuration
- Environment variables are set at build time (via `environment.prod.ts`)
- For production, update `environment.prod.ts` with your API URL before building
- The nginx server listens on port 80 inside the container

