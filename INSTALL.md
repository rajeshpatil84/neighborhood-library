# 🛠️ INSTALL — Neighborhood Library System

Step-by-step installation guide for every operating system.

---

## Table of Contents

- [Windows](#-windows)
- [macOS](#-macos)
- [Linux — Ubuntu / Debian](#-linux--ubuntu--debian)
- [Linux — Fedora / RHEL / CentOS](#-linux--fedora--rhel--centos)
- [Verify & Run](#-verify--run-the-app)
- [Stopping & Cleanup](#-stopping--cleanup)
- [Troubleshooting](#-troubleshooting)

---

## 🪟 Windows

### Step 1 — Enable Virtualization in BIOS

Make sure virtualization is enabled (required for Docker):

1. Restart your PC and enter BIOS (usually `F2`, `F10`, `Del` during boot)
2. Find **Virtualization Technology** / **Intel VT-x** / **AMD-V** and set to **Enabled**
3. Save and exit

Alternatively, check in Task Manager → Performance → CPU → "Virtualization: Enabled"

---

### Step 2 — Install WSL2 (Windows 10/11)

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

Restart your computer when prompted.

---

### Step 3 — Install Docker Desktop

1. Download: https://docs.docker.com/desktop/install/windows-install/
2. Run `Docker Desktop Installer.exe`
3. On the installer, ensure **"Use WSL 2 instead of Hyper-V"** is checked
4. Click Install → Close
5. Restart your computer
6. Launch **Docker Desktop** from the Start menu
7. Wait for the whale icon 🐳 in the system tray to become steady (not animated)

---

### Step 4 — Open Terminal

Use any of these:
- **PowerShell** (Start → Windows PowerShell)
- **Command Prompt** (Start → cmd)
- **Windows Terminal** (recommended, install from Microsoft Store)
- **WSL2 Ubuntu** terminal

---

### Step 5 — Verify Docker

```powershell
docker --version
# Expected: Docker version 24.x.x, build ...

docker compose version
# Expected: Docker Compose version v2.x.x
```

---

### Step 6 — Run the App

```powershell
# If you have Git:
git clone <repo-url> library-app
cd library-app

# Or unzip the downloaded archive:
Expand-Archive library-app.zip -DestinationPath .
cd library-app

# Start everything
docker compose up --build
```

Open http://localhost:3000 in your browser.

---

## 🍎 macOS

### Step 1 — Check your chip

Click Apple menu → About This Mac:
- **Apple M1 / M2 / M3** → download the Apple Silicon version
- **Intel** → download the Intel version

---

### Step 2 — Install Docker Desktop

1. Download: https://docs.docker.com/desktop/install/mac-install/
2. Open the `.dmg` file
3. Drag **Docker** to the **Applications** folder
4. Open Docker from Applications (or Spotlight: `Cmd+Space` → type "Docker")
5. Accept the service agreement
6. Wait for the whale icon 🐳 in the menu bar to stop animating

---

### Step 3 — Verify Docker

Open **Terminal** (`Cmd+Space` → Terminal):

```bash
docker --version
# Expected: Docker version 24.x.x

docker compose version
# Expected: Docker Compose version v2.x.x
```

---

### Step 4 — Run the App

```bash
# If you have Git:
git clone <repo-url> library-app
cd library-app

# Or unzip downloaded archive:
unzip library-app.zip
cd library-app

# Start everything
docker compose up --build
```

Open http://localhost:3000 in your browser.

---

### Optional: Homebrew + Colima (lightweight alternative to Docker Desktop)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Docker tools
brew install docker docker-compose colima

# Start the VM
colima start

# Run the app
cd library-app
docker compose up --build
```

---

## 🐧 Linux — Ubuntu / Debian

### Step 1 — Remove old Docker versions

```bash
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
```

---

### Step 2 — Install Docker Engine

```bash
# Update apt and install prerequisites
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose plugin
sudo apt-get update
sudo apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin
```

---

### Step 3 — Post-install (run Docker without sudo)

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply group change in current session
newgrp docker
```

> Or log out and log back in for it to take effect permanently.

---

### Step 4 — Start Docker service

```bash
sudo systemctl start docker
sudo systemctl enable docker   # auto-start on boot
```

---

### Step 5 — Verify

```bash
docker --version
docker compose version
docker run hello-world   # should print "Hello from Docker!"
```

---

### Step 6 — Run the App

```bash
# Install git if needed
sudo apt-get install -y git

# Clone the repo
git clone <repo-url> library-app
cd library-app

# Or unzip:
unzip library-app.zip && cd library-app

# Start everything
docker compose up --build
```

Open http://localhost:3000 in your browser.

---

## 🐧 Linux — Fedora / RHEL / CentOS

### Step 1 — Install Docker Engine

```bash
# Add Docker repository
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager \
    --add-repo \
    https://download.docker.com/linux/fedora/docker-ce.repo

# Install Docker and Compose
sudo dnf install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin
```

---

### Step 2 — Start and enable Docker

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

### Step 3 — Post-install (run without sudo)

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

### Step 4 — Verify

```bash
docker --version
docker compose version
```

---

### Step 5 — Run the App

```bash
git clone <repo-url> library-app
cd library-app
docker compose up --build
```

---

## ✅ Verify & Run the App

After Docker is installed on any platform:

```bash
# Navigate to the project
cd library-app

# Build images and start all services
docker compose up --build
```

You will see logs from three services starting up:

```
library_db        | ... database system is ready to accept connections
library_backend   | INFO: Application startup complete.
library_frontend  | ✓ Ready on http://0.0.0.0:3000
```

### Open in browser

| Page | URL |
|------|-----|
| 🌐 Library App | http://localhost:3000 |
| 📖 API Docs | http://localhost:8000/docs |
| ❤️ Health | http://localhost:8000/health |

---

## 🛑 Stopping & Cleanup

```bash
# Stop services (keeps data)
docker compose down

# Stop services and DELETE all data
docker compose down -v

# Stop and remove everything Docker-related (nuclear option)
docker compose down -v --remove-orphans
docker system prune -af
```

---

## 🔁 Day-to-Day Usage

```bash
# Start (after first build)
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Restart a single service after code change
docker compose up --build backend

# Check what's running
docker compose ps
```

---

## 🔧 Troubleshooting

### ❌ "Port is already allocated" / "address already in use"

Another service is using port 3000, 8000, or 5432.

```bash
# macOS / Linux — find what's using the port:
lsof -i :3000
lsof -i :8000

# Kill it (replace PID):
kill -9 <PID>

# Or change the port in docker-compose.yml:
# Change  "3000:3000"  to  "3001:3000"
# Then open http://localhost:3001 instead
```

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### ❌ "Cannot connect to the Docker daemon"

Docker isn't running.

```bash
# Linux — start Docker:
sudo systemctl start docker

# macOS / Windows — open Docker Desktop application
```

---

### ❌ Frontend shows "Failed to fetch" or blank data

The backend isn't ready yet. Wait 10–20 seconds and refresh. You can also check:

```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","service":"library-api"}
```

---

### ❌ Database not seeded (no books/members visible)

The seed script runs only on the very first start. If the volume already exists with no data:

```bash
# Delete the volume and restart
docker compose down -v
docker compose up --build
```

---

### ❌ "permission denied" errors on Linux

```bash
sudo usermod -aG docker $USER
newgrp docker
# If still failing:
sudo chmod 666 /var/run/docker.sock
```

---

### ❌ Docker Desktop slow on Windows

- Settings → Resources → set Memory to at least **4 GB**
- Settings → General → ensure **WSL2 backend** is enabled (not Hyper-V)

---

### ❌ M1/M2 Mac build issues

The `docker-compose.yml` uses `linux/amd64` compatible images. If you see architecture warnings, add to `docker-compose.yml`:

```yaml
services:
  db:
    platform: linux/amd64
```

Or use Rosetta 2 emulation in Docker Desktop:
Settings → General → "Use Rosetta for x86/amd64 emulation on Apple Silicon" ✅

---

## 📞 Still stuck?

1. Run `docker compose logs` and look for the first ERROR line
2. Check Docker Desktop is running (whale icon in taskbar/menu bar)
3. Try `docker compose down -v && docker compose up --build` to start clean
ENDOFFILE