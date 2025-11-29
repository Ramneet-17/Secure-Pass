# 🔐 Secure-Pass

Secure-Pass is a personal and team-friendly password manager built with a focus on security, usability, and full control. It features a clean UI, strong encryption, and no reliance on third-party password storage services.

## 📚 Table of Contents

- [Features](#-features)
- [UI Preview](#-ui-preview)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Building Backend with Maven Profiles](#building-backend-with-maven-profiles)
- [Building Docker Images with Maven](#-building-docker-images-with-maven)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Future Roadmap](#-future-roadmap)
- [Security](#-security)
- [Author](#-author)

## 🚀 Features

- 🔒 AES-encrypted password storage with a master PIN
- 👤 User authentication
- 🧾 Add, view (with toggle), copy, and delete credentials
- 🔍 Real-time search and filtering
- 📊 Dashboard with metrics (total accounts, strong/weak passwords, outdated entries)
- 🧪 Responsive Angular UI using standalone components
- ⚙️ Spring Boot backend with secure REST APIs
- 🐘 PostgreSQL as the primary database
- 🐳 Dockerized architecture for easy deployment

## 🖼️ UI Preview

![Vault Screenshot](preview/Securepass-vault.png)

## 🛠️ Tech Stack

- **Frontend**: Angular (standalone components)
- **Backend**: Spring Boot (Java)
- **Database**: PostgreSQL
- **DevOps**: Docker

## 📦 Installation & Setup

```bash
# Step 1: Clone the repository
git clone https://github.com/Ramneet-17/Secure-Pass.git
cd Secure-Pass

# Step 2: Set up environment variables
# Create a file named `.env` in the root directory
# Copy .env.example and fill in your values
cp .env.example .env

# See SECURITY_SETUP.md for detailed instructions on generating secure keys
# Required variables:
# - POSTGRES_URL, POSTGRES_USER, POSTGRES_PASSWORD
# - JWT_SECRET (min 32 characters)
# - AES_SECRET_KEY (16, 24, or 32 bytes)
# - ADMIN_PASSWORD (min 8 characters)
# - SPRING_PROFILES_ACTIVE=dev (or 'prod' for production)

# Step 3: Build and run all services using Docker Compose (includes frontend)
docker-compose up --build

# The frontend will be available at: http://localhost:4200
# The backend will be available at: http://localhost:8081

# OR run services separately:

# Backend: Build Docker image with Maven (see Docker Build section below)
cd securepass-backend
mvn clean package -Pdocker

# Frontend: Run Angular in development mode
cd securepass-frontend
npm install
ng serve
```

### Building Backend with Maven Profiles

```bash
# Development build (uses dev profile)
cd securepass-backend
mvn clean install -Pdev

# Production build (no profile - uses application.yml)
mvn clean install

# Run with dev profile
mvn spring-boot:run -Pdev

# Run for production (no profile)
mvn spring-boot:run
```

See [MAVEN_PROFILES.md](securepass-backend/MAVEN_PROFILES.md) for detailed Maven profile usage.

### 🐳 Building Docker Images

#### Backend with Maven

You can build Docker images directly from Maven using the `docker` profile:

```bash
# Build Docker image (recommended)
cd securepass-backend
mvn clean package -Pdocker

# Build with custom tag
mvn clean package -Pdocker -Ddocker.image.tag=1.0.0

# Build with custom registry
mvn clean package -Pdocker \
  -Ddocker.image.name=my-registry/securepass-backend \
  -Ddocker.image.tag=latest

# Build using property instead of profile
mvn clean package -Ddocker.skip=false
```

**Note**: By default, Docker build is skipped. Activate the `docker` profile or set `docker.skip=false` to build.

The Docker image will be tagged as `securepass-backend:${project.version}` by default.

See [DOCKER_BUILD.md](securepass-backend/DOCKER_BUILD.md) for detailed backend Docker build documentation.

#### Frontend

The frontend is automatically built when using Docker Compose. To build manually:

```bash
cd securepass-frontend
docker build -t securepass-frontend:latest .
```

See [DOCKER_BUILD.md](securepass-frontend/DOCKER_BUILD.md) for detailed frontend Docker build documentation.

## ✅ Usage
- Log in using your admin password (u can change it before in securepass-backend/src/main/java/com/securepass/service/AdminUserInitializer.java)
- Click the + button to add a new credential
- Use the 👁️ button to toggle password visibility
- Click 📋 to copy the site, username, or password
- Use the search bar to filter through credentials
- Click 🗑️ to remove a credential

## 📂 Project Structure

```bash
Secure-Pass/
├── securepass-backend/                 # Spring Boot backend
│   └── src/...
├── securepass-frontend/                # Angular frontend (standalone components)
│   └── src/...
├── preview/                 # Screenshots and UI previews for README
├── .env                     # Your environment variables (local only)
├── .env.example             # Example env template
├── docker-compose.yml       # Dev setup using Docker
└── README.md                # Project documentation
```


## 🧠 Future Roadmap
- 📱 PWA / Mobile App Support
- 🔐 Two-Factor Authentication (2FA) or biometric login
- 📥 Import/Export credential backups
- 🧠 Password strength evaluation and suggestions
- 🕵️‍♂️ Breach alerts and update recommendations
- 📊 Analytics on password reuse and aging

## 🔐 Security

All credentials are encrypted using AES-GCM before storage. No passwords are ever sent or stored in plain text.

**⚠️ Important**: This project has undergone comprehensive security improvements. Please see [SECURITY_SETUP.md](SECURITY_SETUP.md) for:
- Security improvements implemented
- Required environment variables
- Setup instructions
- Production deployment checklist
- Migration notes for existing data

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙋‍♂️ Author
#### [Ramneet Singh](https://github.com/Ramneet-17)

