# Quick Deployment Checklist

## Before You Start
- [ ] Code is committed to Git
- [ ] Code is pushed to GitHub
- [ ] You have a Render account
- [ ] You have your database credentials ready

## Deployment Steps

### 1. Push Code to GitHub
```bash
cd g:\Code\BrixtonHMSDeploy\brixstonhms\hms-backend
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Database on Render
- New + → PostgreSQL
- Name: `brixton-hms-db`
- Save the connection details

### 3. Create Web Service on Render
- New + → Web Service
- Connect GitHub repository
- Runtime: **Docker**
- Root Directory: `hms-backend`

### 4. Set Environment Variables

**Critical Variables:**
```
APP_KEY=                    ← Run: php artisan key:generate --show
APP_URL=                    ← Your Render URL
DB_HOST=                    ← From Render database
DB_DATABASE=                ← From Render database
DB_USERNAME=                ← From Render database
DB_PASSWORD=                ← From Render database
DB_CONNECTION=pgsql
```

**Other Variables:**
```
APP_ENV=production
APP_DEBUG=false
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### 5. Deploy
- Click "Create Web Service"
- Wait for build to complete
- Check logs for "Application ready!"

### 6. Test
```bash
curl https://your-app.onrender.com/api/health
```

### 7. Update Frontend
Update frontend `.env`:
```
VITE_API_BASE_URL=https://your-app.onrender.com
```

## Common Issues

| Problem | Solution |
|---------|----------|
| 500 Error | Check APP_KEY is set |
| Database connection failed | Verify DB credentials |
| CORS error | Add frontend domain to `config/cors.php` |
| Migrations not running | Check logs, run manually in Shell |

## Useful Commands (Render Shell)

```bash
# View application status
php artisan about

# Run migrations
php artisan migrate --force

# Clear cache
php artisan cache:clear
php artisan config:clear

# Check database connection
php artisan db:show

# View routes
php artisan route:list
```

## Support
- Full guide: See `RENDER_DEPLOYMENT.md`
- Render Docs: https://render.com/docs
- Laravel Docs: https://laravel.com/docs
