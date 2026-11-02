# NexClient - AI-Powered Client & Project Management Portal

A modern, production-ready web application for freelancers and digital agencies to manage clients, projects, tasks, invoices, and support tickets with an integrated AI assistant.

## Tech Stack

### Frontend
- React 18+ with Vite
- React Router v6
- Redux Toolkit & RTK Query
- Tailwind CSS
- Framer Motion
- Recharts
- react-i18next

### Backend
- Laravel 11+
- Laravel Sanctum (Authentication)
- PostgreSQL
- Laravel Policies & Gates
- Eloquent ORM
- Queue System

## Features

✅ Multi-role authentication (Guest, Client, Admin)
✅ Client & Company Management
✅ Project Management with Kanban Board
✅ Task Management with Comments & Attachments
✅ Invoice System with PDF Generation
✅ Support Ticket System
✅ AI Assistant Integration
✅ Analytics Dashboard
✅ Real-time Notifications
✅ File Upload & Management
✅ Dark/Light Mode
✅ Multi-language Support
✅ Advanced Search & Filters
✅ Export to CSV/PDF
✅ Email Notifications

## Project Structure

```
NexClient/
├── backend/           # Laravel API
└── frontend/          # React Application
```

## Setup Instructions

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- PostgreSQL 14+
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure database in `.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nexclient
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
```

5. Generate application key:
```bash
php artisan key:generate
```

6. Run migrations and seeders:
```bash
php artisan migrate:fresh --seed
```

7. Create storage link:
```bash
php artisan storage:link
```

8. Start the server:
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure API URL in `.env`:
```env
VITE_API_URL=http://localhost:8000
```

5. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Default Credentials

After seeding, you can log in with:

### Admin Account
- Email: admin@nexclient.com
- Password: password

### Client Account
- Email: client@example.com
- Password: password

## Database Schema

### Core Tables
- users, roles, permissions
- clients, companies
- projects, project_members
- tasks, task_comments, task_attachments
- milestones
- invoices, invoice_items, payments
- support_tickets, ticket_messages
- notifications, activity_logs
- settings, blog_posts
- contact_messages, subscriptions

## API Endpoints

### Authentication
- POST `/api/register` - Register new user
- POST `/api/login` - Login
- POST `/api/logout` - Logout
- POST `/api/forgot-password` - Request password reset
- POST `/api/reset-password` - Reset password
- POST `/api/email/verification-notification` - Resend verification
- GET `/api/user` - Get authenticated user

### Clients (Admin)
- GET `/api/clients` - List all clients
- POST `/api/clients` - Create client
- GET `/api/clients/{id}` - Get client details
- PUT `/api/clients/{id}` - Update client
- DELETE `/api/clients/{id}` - Delete client

### Projects
- GET `/api/projects` - List projects
- POST `/api/projects` - Create project
- GET `/api/projects/{id}` - Get project details
- PUT `/api/projects/{id}` - Update project
- DELETE `/api/projects/{id}` - Delete project

### Tasks
- GET `/api/projects/{id}/tasks` - List project tasks
- POST `/api/tasks` - Create task
- PUT `/api/tasks/{id}` - Update task
- DELETE `/api/tasks/{id}` - Delete task

### Invoices
- GET `/api/invoices` - List invoices
- POST `/api/invoices` - Create invoice
- GET `/api/invoices/{id}` - Get invoice
- GET `/api/invoices/{id}/pdf` - Download PDF
- PUT `/api/invoices/{id}` - Update invoice

### Support Tickets
- GET `/api/tickets` - List tickets
- POST `/api/tickets` - Create ticket
- GET `/api/tickets/{id}` - Get ticket
- POST `/api/tickets/{id}/messages` - Add message

### Analytics
- GET `/api/analytics/dashboard` - Dashboard statistics
- GET `/api/analytics/revenue` - Revenue analytics

## Testing

### Backend Tests
```bash
cd backend
php artisan test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Build for Production

### Backend
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend
```bash
npm run build
```

## Environment Variables

### Backend (.env)
```env
APP_NAME=NexClient
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nexclient
DB_USERNAME=postgres
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@nexclient.com
MAIL_FROM_NAME="${APP_NAME}"

# AI Assistant (Groq / OpenAI)
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.3-70b-versatile
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=NexClient
```

## License

Proprietary - All rights reserved

## Support

For support, email support@nexclient.com

---

Built with ❤️ for modern freelancers and agencies
