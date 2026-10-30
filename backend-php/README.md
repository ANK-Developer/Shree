# Shree Ji API (PHP)

PHP version of the Node/Express backend in `../backend`. It uses the same MySQL database, routes, request
fields and JSON responses, so the React frontend works without any change.

Requirements: PHP 8.1+ with `pdo_mysql`, `mbstring`, `fileinfo` (all enabled in XAMPP). No Composer packages.

## Setup

1. Copy `.env.example` to `.env` and fill it in. You can reuse the values from `backend/.env`:
   - `DATABASE_URL` (same format as Prisma)
   - `JWT_SECRET` (keep it the same as Node's and logged-in admins stay logged in)
   - `CLIENT_URL`
2. New database only: import `database/schema.sql` (phpMyAdmin → Import), then run
   `php scripts/seed_admin.php` to create the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
   An existing database from the Node app needs nothing.

## Run locally

```
php -S localhost:5000 public/index.php
```

The frontend's `VITE_API_URL=http://localhost:5000/api` keeps working unchanged.

## Deploy on Apache / shared hosting

Point the site (or a subdomain) at the `public/` folder. `public/.htaccess` sends every request to
`index.php` and serves `uploads/` files directly. Set `VITE_API_URL` in the frontend to `https://your-domain/api`.

## Structure

| Node (`backend/src`)          | PHP (`backend-php`)                       |
| ----------------------------- | ----------------------------------------- |
| `app.js`, `routes/*`          | `public/index.php`                        |
| `controllers/*`               | `src/controllers/*_controller.php`        |
| `middleware/auth.js`, JWT     | `src/auth.php`                            |
| `middleware/upload.js`        | `src/upload.php`                          |
| `utils/memberValidation.js`   | `src/member_validation.php`               |
| `config/db.js`, `utils/toApi` | `src/helpers.php`                         |
| `scripts/seedAdmin.js`        | `scripts/seed_admin.php`                  |
| `prisma/migrations`           | `database/schema.sql`                     |
| `public/uploads`              | `public/uploads`                          |
