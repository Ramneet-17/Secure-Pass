# 🔐 Secure-Pass

Secure-Pass is a personal and team-friendly password manager built with a focus on security, usability, and full control. It features a clean UI, strong encryption, and no reliance on third-party password storage services.

## 📚 Table of Contents

- [Features](#-features)
- [UI Preview](#-ui-preview)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
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
# Create a file named `.env` in the root directory with the following content:

POSTGRES_URL=jdbc:postgresql://postgres:5432/securepassdb
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=securepass

# Step 3: Build and run all services using Docker Compose
docker-compose up --build


# Step 4 : Run Angular frontend separately in development mode
cd frontend
npm install
ng serve

# The frontend will be available at: http://localhost:4200
```

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

All credentials are encrypted using AES before storage. No passwords are ever sent or stored in plain text.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙋‍♂️ Author
#### [Ramneet Singh](https://github.com/Ramneet-17)

