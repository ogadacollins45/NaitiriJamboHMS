# Render Deployment Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (Vercel/Netlify)                          │
│              https://your-app.vercel.app                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS Requests
                       │ (API Calls)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    RENDER WEB SERVICE                        │
│                 (Docker + PHP + Apache)                      │
│          https://your-backend.onrender.com                   │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │            Docker Container                       │       │
│  │  ┌──────────────────────────────────────────┐   │       │
│  │  │        Apache Web Server                 │   │       │
│  │  │         (Port 80)                         │   │       │
│  │  └──────────────┬───────────────────────────┘   │       │
│  │                 │                                │       │
│  │  ┌──────────────▼───────────────────────────┐   │       │
│  │  │       Laravel Application                │   │       │
│  │  │   - API Routes                           │   │       │
│  │  │   - Controllers                          │   │       │
│  │  │   - Models                               │   │       │
│  │  │   - Middleware                           │   │       │
│  │  └──────────────────────────────────────────┘   │       │
│  │                                                  │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Database Queries
                       │ (PDO/Eloquent)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 RENDER DATABASE SERVICE                      │
│                    (PostgreSQL)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │         PostgreSQL Database                      │       │
│  │    - Patients                                    │       │
│  │    - Treatments                                  │       │
│  │    - Prescriptions                               │       │
│  │    - Lab Tests                                   │       │
│  │    - Bills                                       │       │
│  │    - Users                                       │       │
│  │    - etc...                                      │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  Internal Connection (fast, secure)                         │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Flow

### Step 1: Code Push
```
Local Machine → GitHub → Render (Auto-deploy triggered)
```

### Step 2: Build Process
```
1. Render clones repository
2. Reads Dockerfile
3. Builds Docker image:
   ├── Installs PHP 8.2 + Apache
   ├── Installs system dependencies
   ├── Installs PHP extensions (MySQL, PostgreSQL, etc.)
   ├── Copies application code
   ├── Runs composer install
   └── Sets permissions
4. Creates container from image
```

### Step 3: Container Startup
```
1. Container starts
2. docker-entrypoint.sh runs:
   ├── Waits for database
   ├── Runs migrations
   ├── Caches config/routes/views
   └── Creates storage link
3. Apache starts
4. Application ready!
```

### Step 4: Request Flow
```
User Browser → Frontend (Vercel)
                  ↓
          API Request (fetch/axios)
                  ↓
          Backend (Render) → Laravel Router
                  ↓
          Controller → Model
                  ↓
          Database Query (PostgreSQL)
                  ↓
          Response JSON
                  ↓
          Frontend Updates UI
```

## Environment Separation

### Development (Local)
- Database: Local MySQL (127.0.0.1:3306)
- Backend: `php artisan serve` (localhost:8000)
- Frontend: Vite dev server (localhost:5173)

### Production (Render)
- Database: Render PostgreSQL (Internal URL)
- Backend: Docker + Apache (your-backend.onrender.com)
- Frontend: Vercel/Netlify (your-app.vercel.app)

## Security Layers

```
┌─────────────────────────────────────────┐
│         1. HTTPS/TLS Layer              │
│    (All traffic encrypted)              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         2. CORS Protection              │
│    (Only allowed origins)               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      3. Sanctum Authentication          │
│    (Token-based auth)                   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      4. Middleware & Guards             │
│    (Role-based access)                  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         5. Input Validation             │
│    (Request validation)                 │
└──────────────────┬──────────────────────┘
                   │
                   ▼
            Database Layer
```

## Monitoring & Logs

```
Render Dashboard
    │
    ├── Logs (Real-time)
    │   ├── Application logs
    │   ├── Apache access logs
    │   ├── PHP errors
    │   └── Database queries
    │
    ├── Metrics
    │   ├── CPU usage
    │   ├── Memory usage
    │   ├── Network traffic
    │   └── Response times
    │
    └── Shell Access
        └── Run artisan commands
```

## Scaling Options

### Free Tier
- 1 instance
- 512 MB RAM
- Shared CPU
- Spins down after 15 min inactivity

### Paid Tiers
- Multiple instances
- More RAM (1-32 GB)
- Dedicated CPU
- Always running
- Auto-scaling available

## Backup Strategy

1. **Database Backups**
   - Render PostgreSQL: Automatic daily backups (paid)
   - Manual: `pg_dump` via shell

2. **Code Backups**
   - GitHub repository
   - Multiple branches
   - Git tags for releases

3. **File Storage**
   - Use S3/Cloudinary for uploads
   - Don't rely on container filesystem
