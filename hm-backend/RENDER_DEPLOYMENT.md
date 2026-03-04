# Deploying Brixton HMS Backend to Render with Docker

## Prerequisites
- A GitHub account (to push your code)
- A Render account (free tier available at https://render.com)
- A database service (MySQL or PostgreSQL)

## Step-by-Step Deployment Guide

### Step 1: Prepare Your Repository

1. **Commit all changes to Git:**
   ```bash
   cd g:\Code\BrixtonHMSDeploy\brixstonhms\hms-backend
   git add .
   git commit -m "Prepare for Render deployment with Docker"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```
   (Replace `main` with your branch name if different, e.g., `master`)

### Step 2: Set Up Database

Render offers PostgreSQL (recommended for Render), or you can use an external MySQL service:

#### Option A: Use Render PostgreSQL (Recommended)

1. Log in to Render Dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name:** `brixton-hms-db`
   - **Region:** Choose closest to you
   - **Instance Type:** Free tier is fine for testing
4. Click **"Create Database"**
5. Save the connection details (Internal Database URL)

#### Option B: Use External MySQL

You can use:
- **Railway:** https://railway.app (offers MySQL)
- **PlanetScale:** https://planetscale.com
- **Your existing MySQL database**

Note: Save your database credentials for later.

### Step 3: Create Web Service on Render

1. **Go to Render Dashboard:** https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository:
   - Click **"Connect account"** if not connected
   - Select your repository: `ogadacollins45/brixstonhms`
   - If you have a specific repo, search and select it

4. **Configure the service:**

   | Field | Value |
   |-------|-------|
   | **Name** | `brixton-hms-backend` |
   | **Region** | Choose closest to you |
   | **Branch** | `main` (or your default branch) |
   | **Root Directory** | `hms-backend` |
   | **Runtime** | `Docker` |
   | **Instance Type** | Free (or paid for better performance) |

5. **Advanced settings:**
   - **Dockerfile Path:** `Dockerfile` (should auto-detect)
   - **Docker Build Context Directory:** `hms-backend`

### Step 4: Configure Environment Variables

In the Render service settings, click **"Environment"** tab and add these variables:

#### Required Variables:

```bash
# Application
APP_NAME=Brixton HMS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://brixton-hms-backend.onrender.com

# Generate a new APP_KEY using: php artisan key:generate --show
APP_KEY=base64:YOUR_GENERATED_KEY_HERE

# Database (if using Render PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=YOUR_RENDER_DB_HOST
DB_PORT=5432
DB_DATABASE=YOUR_DB_NAME
DB_USERNAME=YOUR_DB_USERNAME
DB_PASSWORD=YOUR_DB_PASSWORD

# OR Database (if using external MySQL)
# DB_CONNECTION=mysql
# DB_HOST=YOUR_MYSQL_HOST
# DB_PORT=3306
# DB_DATABASE=YOUR_MYSQL_DATABASE
# DB_USERNAME=YOUR_MYSQL_USERNAME
# DB_PASSWORD=YOUR_MYSQL_PASSWORD

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# CORS & Security
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.vercel.app
SESSION_DOMAIN=.onrender.com
```

#### How to Generate APP_KEY:
1. Locally run: `php artisan key:generate --show`
2. Copy the output (will look like: `base64:abc123...`)
3. Paste it as the `APP_KEY` value

### Step 5: Update Database Configuration for PostgreSQL (if using)

If you're using PostgreSQL on Render, you need to update your Laravel database config:

**File: `config/database.php`**

Ensure the `pgsql` connection is properly configured (it should already be in Laravel 12):

```php
'pgsql' => [
    'driver' => 'pgsql',
    'url' => env('DATABASE_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8',
    'prefix' => '',
    'prefix_indexes' => true,
    'schema' => 'public',
    'sslmode' => 'prefer',
],
```

### Step 6: Deploy!

1. Click **"Create Web Service"** button
2. Render will:
   - Clone your repository
   - Build the Docker image
   - Run migrations automatically
   - Start the application

3. **Monitor the deployment:**
   - Watch the logs in real-time
   - Look for "Application ready!" message

### Step 7: Verify Deployment

1. Once deployed, you'll get a URL like: `https://brixton-hms-backend.onrender.com`

2. Test the API:
   ```bash
   curl https://brixton-hms-backend.onrender.com/api/health
   ```

3. Check specific endpoints:
   - Health check: `/api/health`
   - Login: `/api/login` (POST)

### Step 8: Update Frontend Configuration

Update your frontend `.env` file to point to the new backend:

```bash
VITE_API_BASE_URL=https://brixton-hms-backend.onrender.com
```

### Step 9: Update CORS

Add your frontend domain to the CORS configuration:

**File: `config/cors.php`**
```php
'allowed_origins' => [
    'https://your-frontend-domain.vercel.app',
    'http://localhost:5173',
],
```

Commit and push this change to trigger a redeploy.

## Troubleshooting

### Database Connection Issues
- Verify database credentials in environment variables
- Check if database is running
- Ensure firewall allows Render's IP addresses

### 500 Errors
- Check Render logs: Dashboard → Your Service → Logs
- Look for PHP errors or missing environment variables
- Verify `APP_KEY` is set

### CORS Errors
- Ensure frontend domain is in `config/cors.php`
- Check `SANCTUM_STATEFUL_DOMAINS` includes your frontend domain

### Migrations Not Running
- Check logs for migration errors
- Manually run migrations: Dashboard → Shell tab → `php artisan migrate --force`

### Application Not Starting
- Check Dockerfile syntax
- Verify all required PHP extensions are installed
- Check storage permissions

## Useful Render Features

### Shell Access
- Go to your service dashboard
- Click **"Shell"** tab
- Run artisan commands: `php artisan tinker`

### View Logs
- Dashboard → Your Service → **"Logs"**
- Filter by time period
- Search for specific errors

### Manual Deploy
- Dashboard → Your Service → **"Manual Deploy"** → Deploy latest commit

### Auto-Deploy
- Render automatically deploys when you push to your connected branch
- Disable in: Settings → Build & Deploy → Auto-Deploy

## Cost Optimization

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours/month free (enough for 1 service 24/7)

### Upgrade Options
- **Starter ($7/month):** No spin-down, better performance
- **Standard ($25/month):** More resources, faster builds

## Maintenance

### Updating Code
1. Make changes locally
2. Commit and push to GitHub
3. Render auto-deploys (if enabled)

### Database Backups
- Render PostgreSQL (Paid): Automatic daily backups
- Free tier: Manual backups via shell or scripts

### Viewing Database
- Use Render's built-in database browser
- Or connect with tools like TablePlus, DBeaver using connection string

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Set up database
3. ✅ Configure environment variables
4. ✅ Update frontend to use new backend URL
5. ⬜ Set up custom domain (optional)
6. ⬜ Configure email service
7. ⬜ Set up monitoring/alerts

## Support Resources

- **Render Docs:** https://render.com/docs
- **Laravel Docs:** https://laravel.com/docs
- **Community:** https://community.render.com

---

**Good luck with your deployment! 🚀**
