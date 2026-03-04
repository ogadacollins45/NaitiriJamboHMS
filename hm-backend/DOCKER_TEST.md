# Testing Docker Build Locally

Before deploying to Render, it's a good idea to test your Docker build locally.

## Prerequisites
- Docker Desktop installed
- Docker running

## Test Build

### 1. Build the Docker Image
```bash
cd g:\Code\BrixtonHMSDeploy\brixstonhms\hms-backend
docker build -t brixton-hms-backend .
```

This will:
- Read the Dockerfile
- Download base images
- Install dependencies
- Create the final image

Expected output:
```
[+] Building 120.5s (15/15) FINISHED
...
Successfully built abc123def456
Successfully tagged brixton-hms-backend:latest
```

### 2. Run the Container Locally (Optional)
```bash
docker run -d -p 8080:80 \
  -e APP_KEY="base64:XTCrQo8IRwVro/e0WrluFf3rDNOs77/Z/30ZUhLjoGs=" \
  -e DB_CONNECTION=mysql \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_DATABASE=brixton_hms_fresh \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=7836sql \
  --name hms-backend \
  brixton-hms-backend
```

### 3. Test the Application
```bash
# Check if container is running
docker ps

# View logs
docker logs hms-backend

# Test the API
curl http://localhost:8080/api/health
```

### 4. Stop and Clean Up
```bash
# Stop container
docker stop hms-backend

# Remove container
docker rm hms-backend

# Remove image (optional)
docker rmi brixton-hms-backend
```

## Common Build Issues

### Issue: "composer install" fails
**Solution:** Check internet connection, or try:
```dockerfile
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs
```

### Issue: Permission denied
**Solution:** Ensure permissions are set correctly in Dockerfile:
```dockerfile
RUN chown -R www-data:www-data /var/www/html
```

### Issue: Database connection fails
**Solution:** 
- For MySQL on Windows: Use `host.docker.internal` instead of `127.0.0.1`
- Or create a Docker network

## Quick Commands

```bash
# View all images
docker images

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Execute command in running container
docker exec -it hms-backend php artisan migrate

# Access container shell
docker exec -it hms-backend bash

# View container logs in real-time
docker logs -f hms-backend
```

## If Build Succeeds Locally

You're ready to deploy to Render! 🎉

The same Docker build process will happen on Render's servers.

## Next Steps

1. ✅ Docker build tested locally
2. ⬜ Commit Dockerfile and related files
3. ⬜ Push to GitHub
4. ⬜ Deploy to Render

---

**Note:** Local testing is optional but recommended for catching issues early!
