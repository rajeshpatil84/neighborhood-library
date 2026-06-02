# 📚 Neighborhood Library System

A full-stack library management application for community libraries to manage books, members, and lending operations.

**Tech Stack:**
- **Backend** — Python 3.12 + FastAPI (async REST API)
- **Database** — PostgreSQL 16
- **Frontend** — Next.js 14 + TypeScript + Tailwind CSS
- **Infrastructure** — Docker + Docker Compose

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network                   │
│                                                     │
│   ┌─────────────────┐       ┌──────────────────┐   │
│   │   Next.js 14    │──────▶│   FastAPI        │   │
│   │   Port 3000     │  HTTP │   Port 8000      │   │
│   │   (Frontend)    │       │   (Backend)      │   │
│   └─────────────────┘       └────────┬─────────┘   │
│                                      │ asyncpg      │
│                               ┌──────▼─────────┐   │
│                               │  PostgreSQL 16  │   │
│                               │  Port 5432      │   │
│                               └─────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

> **Only Docker is required.** No Python, Node.js, or PostgreSQL installation needed.

| Tool | Version | Download |
|------|---------|----------|
| Docker Desktop | 24.0+ | https://docs.docker.com/get-docker/ |
| Docker Compose | v2.x (bundled) | Included with Docker Desktop |

Verify before proceeding:
```bash
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

---

## 🚀 Quick Start

```bash
# 1. Get the project
git clone <repo-url> library-app
cd library-app

# 2. Build and start all services
docker compose up --build

# 3. Open in your browser
#    Frontend  → http://localhost:3000
#    API Docs  → http://localhost:8000/docs
```

> ⏱️ First build takes **3–5 minutes** (downloads base images, installs dependencies).
> Subsequent starts take **~15 seconds**.

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend App | http://localhost:3000 | Main library management UI |
| Swagger UI | http://localhost:8000/docs | Interactive API documentation |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |
| Health Check | http://localhost:8000/health | Backend status |
| PostgreSQL | localhost:5432 | Direct DB access (optional) |

---

## 🖥️ Platform-Specific Installation

### 🪟 Windows

**Option A — Docker Desktop (Recommended)**

1. Download Docker Desktop from https://docs.docker.com/desktop/install/windows-install/
2. Run the installer (requires Windows 10/11 with WSL2 or Hyper-V)
3. Follow the setup wizard and restart when prompted
4. Open **PowerShell** or **Command Prompt** and verify:
   ```powershell
   docker --version
   docker compose version
   ```
5. Clone and run:
   ```powershell
   git clone <repo-url> library-app
   cd library-app
   docker compose up --build
   ```

**Option B — WSL2 + Docker Engine**

1. Install WSL2: `wsl --install` in PowerShell (as Administrator)
2. Install Ubuntu from Microsoft Store
3. Inside WSL2 terminal, follow the Linux instructions below

> ⚠️ On Windows, ensure Docker Desktop has WSL2 backend enabled:
> Settings → General → "Use the WSL 2 based engine"

---

### 🍎 macOS

**Option A — Docker Desktop (Recommended)**

1. Download from https://docs.docker.com/desktop/install/mac-install/
   - Choose **Apple Silicon** (M1/M2/M3) or **Intel** version
2. Open the `.dmg`, drag Docker to Applications
3. Launch Docker from Applications and wait for the whale icon in the menu bar to stop animating
4. Open **Terminal** and verify:
   ```bash
   docker --version
   docker compose version
   ```
5. Clone and run:
   ```bash
   git clone <repo-url> library-app
   cd library-app
   docker compose up --build
   ```

**Option B — Homebrew + Colima (lightweight alternative)**

```bash
brew install docker docker-compose colima
colima start
docker compose up --build
```

---

### 🐧 Linux (Ubuntu / Debian)

```bash
# 1. Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# 2. Install prerequisites
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 3. Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Set up the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine + Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. Add current user to docker group (avoids needing sudo)
sudo usermod -aG docker $USER
newgrp docker

# 7. Verify
docker --version
docker compose version

# 8. Run the app
git clone <repo-url> library-app
cd library-app
docker compose up --build
```

---

### 🐧 Linux (RHEL / Fedora / CentOS)

```bash
# Install Docker
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to group
sudo usermod -aG docker $USER
newgrp docker

# Run the app
git clone <repo-url> library-app
cd library-app
docker compose up --build
```

---

## 📁 Project Structure

```
library-app/
│
├── docker-compose.yml              # Orchestrates all 3 services
├── README.md                       # This file
├── INSTALL.md                      # Step-by-step installation guide
│
├── scripts/
│   └── init.sql                    # PostgreSQL schema + seed data
│                                   # (auto-run on first `docker compose up`)
│
├── backend/                        # Python FastAPI service
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 # FastAPI app, CORS, router registration
│       ├── config.py               # Settings from environment variables
│       ├── api/
│       │   ├── books.py            # GET/POST/PATCH/DELETE /books
│       │   ├── members.py          # GET/POST/PATCH/DELETE /members
│       │   ├── borrowings.py       # Borrow, return, pay-fine endpoints
│       │   └── stats.py            # Dashboard statistics endpoint
│       ├── models/
│       │   └── models.py           # SQLAlchemy ORM models (Book, Member, Borrowing)
│       ├── schemas/
│       │   └── schemas.py          # Pydantic request/response validation schemas
│       └── db/
│           └── database.py         # Async engine, session factory, get_db dependency
│
└── frontend/                       # Next.js 14 application
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx           # Root HTML layout + Google Fonts
        │   ├── globals.css          # Tailwind base + design tokens
        │   └── (app)/
        │       ├── layout.tsx       # App shell: Sidebar + ToastProvider
        │       ├── page.tsx         # Dashboard — stats, overdue, active loans
        │       ├── books/
        │       │   └── page.tsx     # Books table: search, CRUD modals
        │       ├── members/
        │       │   └── page.tsx     # Members table: register, edit, remove
        │       └── borrowings/
        │           └── page.tsx     # Borrowings: borrow, return, pay fine
        ├── components/
        │   ├── Sidebar.tsx          # Navigation sidebar
        │   ├── Modal.tsx            # Reusable modal dialog
        │   └── Toast.tsx            # Toast notification system
        └── lib/
            └── api.ts               # Typed fetch client for all API calls
```

---

## 🗄️ Database Schema

### Table: `books`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated via `gen_random_uuid()` |
| `title` | VARCHAR(255) | NOT NULL | Book title |
| `author` | VARCHAR(255) | NOT NULL | Author full name |
| `isbn` | VARCHAR(20) | UNIQUE | International Standard Book Number |
| `genre` | VARCHAR(100) | | Fiction, Technology, etc. |
| `total_copies` | INT | NOT NULL, ≥ 0 | Total copies owned by library |
| `available_copies` | INT | NOT NULL, ≥ 0, ≤ total | Copies not currently borrowed |
| `published_year` | INT | | Year of publication |
| `description` | TEXT | | Short summary |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | AUTO via trigger | Last modification time |

### Table: `members`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Contact email |
| `phone` | VARCHAR(30) | | Phone number |
| `address` | TEXT | | Mailing address |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account status |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW() | Membership start date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | AUTO via trigger | |

### Table: `borrowings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `book_id` | UUID | FK → books.id | Which book was borrowed |
| `member_id` | UUID | FK → members.id | Who borrowed it |
| `borrowed_at` | TIMESTAMPTZ | DEFAULT NOW() | Checkout timestamp |
| `due_date` | TIMESTAMPTZ | NOT NULL | Return deadline |
| `returned_at` | TIMESTAMPTZ | NULL = active loan | When book was returned |
| `fine_amount` | NUMERIC(10,2) | DEFAULT 0.00 | Auto-calculated: $1.00/overdue day |
| `fine_paid` | BOOLEAN | DEFAULT FALSE | Whether fine was collected |
| `notes` | TEXT | | Staff notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | AUTO via trigger | |

**Indexes:** `book_id`, `member_id`, partial index on active loans (`returned_at IS NULL`)

---

## 🔌 REST API Reference

**Base URL:** `http://localhost:8000/api/v1`

### Books Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/books` | List books with optional search/filter |
| `GET` | `/books/{id}` | Get a single book by ID |
| `POST` | `/books` | Create a new book |
| `PATCH` | `/books/{id}` | Update book fields |
| `DELETE` | `/books/{id}` | Delete book (blocked if copies are out) |

**GET /books query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in title, author, ISBN |
| `genre` | string | Filter by genre |
| `available_only` | bool | Only books with copies available |
| `skip` | int | Pagination offset (default: 0) |
| `limit` | int | Page size, max 200 (default: 50) |

---

### Members Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/members` | List members with optional search |
| `GET` | `/members/{id}` | Get a single member |
| `POST` | `/members` | Register a new member |
| `PATCH` | `/members/{id}` | Update member details |
| `DELETE` | `/members/{id}` | Remove member (blocked if active loans) |

---

### Borrowings Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/borrowings` | List borrowings with filters |
| `GET` | `/borrowings/{id}` | Get single borrowing record |
| `POST` | `/borrowings/borrow` | Borrow a book |
| `POST` | `/borrowings/{id}/return` | Return a borrowed book |
| `POST` | `/borrowings/{id}/pay-fine` | Mark overdue fine as paid |

**GET /borrowings query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `member_id` | UUID | Filter by member |
| `book_id` | UUID | Filter by book |
| `active_only` | bool | Only unreturned loans |
| `overdue_only` | bool | Only overdue loans |
| `skip` / `limit` | int | Pagination |

---

### Stats Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stats` | Aggregate library statistics |

**Response:**
```json
{
  "total_books": 10,
  "total_members": 3,
  "active_borrowings": 2,
  "overdue_borrowings": 1,
  "total_fines_outstanding": 5.00
}
```

---

## 🧪 API Testing Examples

### Using Swagger UI (easiest)
Navigate to **http://localhost:8000/docs** — every endpoint is fully interactive.

### Using curl

**Add a book:**
```bash
curl -s -X POST http://localhost:8000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Pragmatic Programmer",
    "author": "David Thomas",
    "isbn": "9780135957059",
    "genre": "Technology",
    "total_copies": 2,
    "published_year": 1999
  }' | python3 -m json.tool
```

**Register a member:**
```bash
curl -s -X POST http://localhost:8000/api/v1/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+91-9876543210"
  }' | python3 -m json.tool
```

**Borrow a book** (replace UUIDs from previous responses):
```bash
curl -s -X POST http://localhost:8000/api/v1/borrowings/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "<book-uuid>",
    "member_id": "<member-uuid>",
    "due_days": 14
  }' | python3 -m json.tool
```

**Return a book:**
```bash
curl -s -X POST http://localhost:8000/api/v1/borrowings/<borrowing-uuid>/return \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -m json.tool
```

**Get all books borrowed by a member:**
```bash
curl -s "http://localhost:8000/api/v1/borrowings?member_id=<member-uuid>&active_only=true" \
  | python3 -m json.tool
```

**List all overdue borrowings:**
```bash
curl -s "http://localhost:8000/api/v1/borrowings?overdue_only=true" \
  | python3 -m json.tool
```

**Search for available books:**
```bash
curl -s "http://localhost:8000/api/v1/books?search=python&available_only=true" \
  | python3 -m json.tool
```

---

## 🐳 Docker Commands Reference

```bash
# Start all services (build if needed)
docker compose up --build

# Start in background (detached)
docker compose up -d --build

# Stop all services
docker compose down

# Stop and DELETE all data volumes
docker compose down -v

# Rebuild a single service
docker compose build backend
docker compose up -d --no-deps backend

# View real-time logs
docker compose logs -f              # all services
docker compose logs -f backend      # backend only
docker compose logs -f frontend     # frontend only
docker compose logs -f db           # database only

# Open a shell in a running container
docker exec -it library_backend bash
docker exec -it library_frontend sh
docker exec -it library_db bash

# Connect to PostgreSQL directly
docker exec -it library_db psql -U library_user -d library

# Check running containers
docker compose ps

# Check resource usage
docker stats
```

---

## ⚙️ Configuration / Environment Variables

All variables are pre-configured in `docker-compose.yml`. For production, override them:

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://library_user:library_pass@db:5432/library` | PostgreSQL connection string |
| `SECRET_KEY` | `supersecretkey_change_in_production` | App secret (change in production!) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | JSON array of allowed frontend origins |
| `FINE_PER_DAY` | `1.00` | Overdue fine in dollars per day |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## 🛠️ Troubleshooting

### Port already in use
```bash
# Check what's using port 3000 or 8000
# macOS / Linux:
lsof -i :3000
lsof -i :8000

# Windows (PowerShell):
netstat -ano | findstr :3000

# Change ports in docker-compose.yml:
ports:
  - "3001:3000"   # host:container
```

### Database not initializing
```bash
# Force recreate volumes (deletes all data)
docker compose down -v
docker compose up --build
```

### Frontend can't reach backend
```bash
# Verify backend is healthy
curl http://localhost:8000/health

# Check CORS — ensure frontend URL is in CORS_ORIGINS in docker-compose.yml
```

### "Permission denied" on Linux
```bash
sudo usermod -aG docker $USER
newgrp docker
# Or prefix all docker commands with sudo
```

### Reset everything and start fresh
```bash
docker compose down -v --remove-orphans
docker system prune -f
docker compose up --build
```

---

## ✨ Feature Summary

| Feature | Details |
|---------|---------|
| Book management | Create, read, update, delete with ISBN, genre, copy tracking |
| Member management | Register members, track status (active/inactive) |
| Borrow a book | Validates availability, member status, duplicate prevention |
| Return a book | Updates availability, auto-calculates overdue fine |
| Overdue fines | $1.00/day, configurable via env var |
| Fine payment | Mark fine as paid, tracked per borrowing |
| Search & filter | Books by title/author/ISBN/genre, members by name/email |
| Borrowing filters | Active, overdue, returned, by member, by book |
| Dashboard stats | Total books, members, active/overdue borrowings, outstanding fines |
| Seed data | 10 books + 3 members loaded automatically |
| API docs | Auto-generated Swagger UI at `/docs` |
| Input validation | All fields validated via Pydantic with clear error messages |
| Error handling | 404, 409, 400, 403 with descriptive messages |

---

## 📝 Development Notes

- All timestamps stored in **UTC**
- UUIDs used for all primary keys (no sequential integer exposure)
- `available_copies` is enforced to never exceed `total_copies` via DB constraint
- `updated_at` columns auto-update via PostgreSQL triggers
- The backend uses **async SQLAlchemy + asyncpg** for non-blocking DB operations
- Fine calculation is triggered at return time, not in real-time during listing
