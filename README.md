# VillainUI — Full Stack Web GUI for Villain C2 Framework

> Holberton School Azerbaijan — Demo Day Project

A modern, dark-themed web GUI wrapper for [Villain](https://github.com/t3l3machus/Villain), the open-source C2 (Command & Control) framework. VillainUI provides real-time session management, payload generation, file operations, and an interactive shell terminal—all through a sleek web interface.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Nginx (443/80)                   │
│              Reverse Proxy + SSL + CORS              │
├────────────────┬────────────────────────────────────┤
│   /api/*       │          /*  (static)              │
│   /ws/*        │                                    │
├────────────────┤────────────────────────────────────┤
│   Backend      │         Frontend                   │
│   FastAPI      │         React + TS                 │
│   Port 8000    │         Vite + Tailwind            │
│                │         xterm.js                   │
│   ┌──────────┐ │                                    │
│   │ Villain  │ │                                    │
│   │ (subprocess)│                                   │
│   └──────────┘ │                                    │
├────────────────┴────────────────────────────────────┤
│              SQLite + Docker Volumes                 │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Python 3.11**, **FastAPI** (async)
- **SQLAlchemy** (async) + **SQLite** via aiosqlite
- **JWT** authentication (python-jose, passlib)
- **WebSockets** for real-time shell I/O and events
- Villain managed as a subprocess via asyncio + pty

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (dark hacker aesthetic)
- **xterm.js** (interactive terminal)
- **Zustand** (state management)
- **Axios** (HTTP with JWT interceptors)
- **Lucide React** (icons)

### Infrastructure
- **Docker** + **docker-compose**
- **Nginx** reverse proxy with SSL

## Quick Start

```bash
# Clone with submodules
git clone --recurse-submodules <repo-url>
cd villain-ui

# Generate self-signed SSL certs (for dev)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"

# Build and start
docker-compose up --build
```

Access the UI at **https://localhost** (accept self-signed cert warning).

## Default Credentials

| Username | Password      |
|----------|---------------|
| admin    | villain2024   |

> **You will be prompted to change your password on first login.**

## Features

- **Dashboard** — Real-time session count, daemon control, live log viewer
- **Sessions** — Table view of all sessions, open terminal, kill, upload files
- **Shell Terminal** — Full xterm.js terminal with tab support, Session Defender warnings
- **Payload Builder** — OS/shell selector, LHOST/LPORT config, one-click generate + copy
- **File Manager** — Upload, list, delete files; fileless execution support
- **Siblings** — Connect/disconnect sibling Villain servers
- **Settings** — Change password, daemon configuration
- **Real-time Events** — WebSocket-powered notifications for new sessions, deaths, etc.
- **Session Defender** — Warns before executing dangerous commands (rm -rf, format, etc.)

## Demo Day Flow

1. Login with default creds → change password
2. Start Villain daemon from Dashboard
3. Generate a payload (Payload Builder → Windows/TCP → your IP)
4. Execute payload on target machine
5. Watch session appear in real-time on Dashboard
6. Open interactive terminal → run commands
7. Upload a script via File Manager
8. Show Session Defender blocking dangerous commands
9. Connect a sibling server
10. Stop daemon gracefully

## Project Structure

```
villain-ui/
├── docker-compose.yml
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── utils/
│   │   └── websocket/
│   ├── tests/
│   └── villain/          # git submodule
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   ├── styles/
    │   └── types/
    └── vite.config.ts
```

## License

Educational project for Holberton School Azerbaijan Demo Day.
