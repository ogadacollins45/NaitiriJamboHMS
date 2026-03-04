# Brixton Backend

[![Laravel Version](https://img.shields.io/badge/Laravel-11.x-red.svg)](https://laravel.com)
[![PHP Version](https://img.shields.io/badge/PHP-8.1+-blue.svg)](https://php.net)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Brixton Backend is a comprehensive hospital management system built with Laravel, designed to streamline healthcare operations. It provides a robust API for managing patients, appointments, billing, pharmacy, laboratory tests, and more, ensuring efficient and secure healthcare administration.

## Features

- **Patient Management**: Comprehensive patient records, medical history, demographics, and treatment tracking.
- **Appointment Scheduling**: Manage doctor appointments, patient queues, appointment status updates, and completion tracking.
- **Billing and Payments**: Automated billing for treatments, invoice generation, payment recording, pending/cleared bills, and billable patient lists.
- **Pharmacy Management**: 
  - Drug inventory and batch management (FEFO - First Expiry, First Out).
  - Prescription creation, review, and dispensing workflows.
  - Drug interaction checks and stock alerts.
  - Pharmacy reports (dispensed drugs, stock levels, transactions, top drugs).
- **Laboratory Services**: 
  - Lab test requests and management (categories, templates, parameters).
  - Sample processing, result submission, and rejection handling.
  - Available tests and patient-specific lab history.
- **Staff and User Management**: Role-based access for doctors, nurses, pharmacists, lab techs, and administrative staff, including document uploads.
- **Inventory Control**: Track medical supplies, transactions, restocking, and supplier information.
- **Queue Management**: Patient queue handling, attendance tracking, and statistical reports.
- **Dashboard and Analytics**: System overview with key metrics, attended stats, and comprehensive reporting.
- **Settings Management**: Configurable system settings for administrators.
- **Authentication and Security**: Secure login/logout via Laravel Sanctum, protected API routes, and audit capabilities.
- **API-Driven Architecture**: RESTful API for seamless integration with frontend applications, including health checks.

## Prerequisites

Before installing, ensure you have the following:

- PHP 8.1 or higher
- Composer
- Node.js and npm (for frontend assets)
- MySQL or PostgreSQL database
- Docker (optional, for containerized deployment)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ogadacollins45/brixton-backend.git
   cd brixton-backend
   ```

2. **Install PHP Dependencies**:
   ```bash
   composer install
   ```

3. **Install Node.js Dependencies** (if applicable):
   ```bash
   npm install
   ```

4. **Environment Configuration**:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your database credentials, app key, and other settings.

5. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

6. **Run Database Migrations**:
   ```bash
   php artisan migrate
   ```

7. **Seed the Database** (optional):
   ```bash
   php artisan db:seed
   ```

8. **Build Assets** (if using frontend):
   ```bash
   npm run build
   ```

## Configuration

- **Database**: Configure your database connection in `.env`.
- **Mail**: Set up mail configuration for notifications.
- **Queue**: Configure queue drivers for background jobs.
- **Cache and Session**: Choose appropriate drivers for performance.

For detailed configuration options, refer to the Laravel documentation.

## Running the Application

1. **Start the Development Server**:
   ```bash
   php artisan serve
   ```
   The application will be available at `http://localhost:8000`.

2. **Run Queue Worker** (for background jobs):
   ```bash
   php artisan queue:work
   ```

3. **Run Scheduler** (for scheduled tasks):
   ```bash
   php artisan schedule:run
   ```

## API Endpoints

The API provides endpoints for all major functionalities. Below is a high-level overview:

- **Authentication**: `/api/login`, `/api/register`, `/api/logout`
- **Patients**: `/api/patients` (CRUD operations)
- **Appointments**: `/api/appointments`
- **Billing**: `/api/bills`, `/api/payments`
- **Pharmacy**: `/api/pharmacy/prescriptions`, `/api/pharmacy/dispensations`
- **Laboratory**: `/api/lab/requests`, `/api/lab/results`
- **Staff**: `/api/staff`
- **Inventory**: `/api/inventory`

For detailed API documentation, see the [API Documentation](./api.md) or use tools like Postman to explore endpoints.

## Testing

Run the test suite using PHPUnit:

```bash
php artisan test
```

For specific test files:

```bash
php artisan test --filter TestClassName
```

## Deployment

For deployment instructions, refer to:

- [Deployment README](./DEPLOY_README.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Render Deployment](./RENDER_DEPLOYMENT.md)
- [Docker Test](./DOCKER_TEST.md)

### Docker Deployment

Build and run with Docker:

```bash
docker build -t brixton-backend .
docker run -p 8000:8000 brixton-backend
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

Please ensure your code follows PSR standards and includes tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please contact the repository owner: [ogadacollins45](https://github.com/ogadacollins45).

---

Built with ❤️ using [Laravel](https://laravel.com).
