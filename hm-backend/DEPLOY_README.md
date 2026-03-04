# 🚀 Brixton HMS Backend - Render Deployment

This directory contains everything you need to deploy the Brixton HMS backend to Render using Docker.

## 📋 Quick Links

- **Full Deployment Guide:** [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- **Quick Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Architecture Diagram:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Local Testing:** [DOCKER_TEST.md](DOCKER_TEST.md)
- **Credentials & Info:** [DEPLOYMENT_INFO.md](DEPLOYMENT_INFO.md) *(keep this secure!)*

## 🎯 What's Included

### Docker Configuration
- ✅ **Dockerfile** - Multi-stage optimized build for PHP 8.2 + Apache
- ✅ **docker-entrypoint.sh** - Automated startup script (migrations, caching)
- ✅ **.dockerignore** - Optimized build (excludes unnecessary files)

### Documentation
- ✅ Comprehensive step-by-step deployment guide
- ✅ Architecture and system flow diagrams
- ✅ Troubleshooting guide
- ✅ Quick reference checklist

### Configuration
- ✅ Environment templates for production
- ✅ Database setup guides (PostgreSQL & MySQL)
- ✅ CORS configuration examples

## 🏃 Quick Start

### 1. Prerequisites
```bash
# You need:
✓ GitHub account
✓ Render account (sign up at render.com)
✓ Git installed locally
```

### 2. Deploy in 5 Minutes
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to Render
# → New + → Web Service
# → Connect GitHub → Select repo
# → Runtime: Docker
# → Root Directory: hms-backend

# 3. Add environment variables (see DEPLOYMENT_INFO.md)

# 4. Click "Create Web Service"

# Done! 🎉
```

## 📚 Documentation Overview

### For First-Time Deployment
Start here: **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)**

This guide covers:
- Database setup (PostgreSQL recommended)
- Web service creation
- Environment variable configuration
- CORS setup
- Troubleshooting common issues

### For Quick Reference
Use: **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

Perfect for:
- Redeployments
- Quick checks
- Common commands

### For Understanding Architecture
Read: **[ARCHITECTURE.md](ARCHITECTURE.md)**

Learn about:
- System architecture
- Request flow
- Security layers
- Scaling options

### For Local Testing
See: **[DOCKER_TEST.md](DOCKER_TEST.md)**

Test locally before deploying:
- Build Docker image locally
- Run container on your machine
- Debug issues early

## 🔐 Security Notes

**IMPORTANT:** The `DEPLOYMENT_INFO.md` file contains sensitive information:
- APP_KEY
- Database credentials (when filled)

This file is in `.gitignore` and will NOT be committed to Git.
Keep it secure and never share publicly!

## 🗄️ Database Options

### Option 1: Render PostgreSQL (Recommended)
- **Pros:** Fast, integrated, free tier available
- **Cons:** None for this use case
- **Setup:** Create PostgreSQL database on Render dashboard

### Option 2: External MySQL
- **Pros:** May already have existing MySQL database
- **Cons:** Requires external service
- **Options:** Railway, PlanetScale, or your own server

Both are fully supported! The Dockerfile includes drivers for both.

## 🌐 Environment Variables

Key variables you MUST set on Render:

```
APP_KEY          ← Generate with: php artisan key:generate --show
APP_URL          ← Your Render URL
DB_CONNECTION    ← pgsql or mysql
DB_HOST          ← Database host
DB_DATABASE      ← Database name
DB_USERNAME      ← Database user
DB_PASSWORD      ← Database password
```

See full list in [DEPLOYMENT_INFO.md](DEPLOYMENT_INFO.md)

## 🔧 Tech Stack

- **PHP:** 8.2
- **Framework:** Laravel 12
- **Web Server:** Apache
- **Database:** PostgreSQL or MySQL
- **Authentication:** Laravel Sanctum
- **Container:** Docker

## 📊 Deployment Status

After deployment, check:

1. **Build Logs:** Watch the Docker build process
2. **Application Logs:** See Laravel logs in real-time
3. **Health Check:** Test `/api/health` endpoint

## 🆘 Need Help?

### Common Issues

| Issue | Fix |
|-------|-----|
| 500 Error | Check APP_KEY is set in environment |
| Database connection failed | Verify credentials |
| CORS errors | Update `config/cors.php` |
| Migrations fail | Check database permissions |

→ Full troubleshooting: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md#troubleshooting)

### Support Resources

- **Render Docs:** https://render.com/docs
- **Laravel Docs:** https://laravel.com/docs
- **Docker Docs:** https://docs.docker.com

## 📝 Post-Deployment

After successful deployment:

1. ✅ Update frontend environment to point to new backend URL
2. ✅ Test all API endpoints
3. ✅ Update CORS to include frontend domain
4. ✅ Set up monitoring (optional)
5. ✅ Configure custom domain (optional)

## 🔄 Updating Your Deployment

Render supports auto-deploy from GitHub:

```bash
# 1. Make changes locally
git add .
git commit -m "Update feature X"
git push origin main

# 2. Render automatically:
# → Detects push
# → Builds new Docker image
# → Deploys updated application
# → Zero downtime!
```

## 💰 Pricing

### Free Tier
- ✅ 750 hours/month (1 service 24/7)
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold starts (30-60 seconds)

Perfect for:
- Development
- Testing
- Low-traffic apps

### Paid Tiers
- ✅ Always running
- ✅ Faster performance
- ✅ More resources
- Starting at $7/month

## 🎓 Learn More

- **Render + Docker:** https://render.com/docs/docker
- **Laravel Deployment:** https://laravel.com/docs/deployment
- **Docker Best Practices:** https://docs.docker.com/develop/dev-best-practices/

---

**Ready to deploy? Start with [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** 🚀

*Last updated: 2025-12-09*
