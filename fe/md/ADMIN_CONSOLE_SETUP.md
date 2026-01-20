# Admin Console Setup Guide

## Overview

This admin console provides authentication and management capabilities for your application with role-based access control.

## Features

- ✅ Secure authentication with sessions
- ✅ Role-based permissions (SUPER_ADMIN, ADMIN, MODERATOR)
- ✅ Dashboard with real-time statistics
- ✅ User management
- ✅ Report management
- ✅ Chat room monitoring
- ✅ Moderation tools

## Setup Steps

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add_admin_roles_and_sessions
```

This will create:

- Enhanced Admin model with roles and permissions
- AdminSession model for secure session management
- AdminRole enum (SUPER_ADMIN, ADMIN, MODERATOR)

### 2. Install Dependencies

Ensure you have bcryptjs installed:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### 3. Create Your First Admin User

```bash
node scripts/create-admin.js
```

Follow the prompts to create an admin account:

- Email: admin@example.com
- Password: (your secure password)
- Name: (optional)
- Role: SUPER_ADMIN

### 4. Access the Admin Console

Navigate to: `http://localhost:3000/admin/login`

Login with the credentials you created in step 3.

## Admin Routes

| Route               | Description                              |
| ------------------- | ---------------------------------------- |
| `/admin/login`      | Admin login page                         |
| `/admin/dashboard`  | Dashboard with statistics                |
| `/admin/users`      | User management (to be implemented)      |
| `/admin/rooms`      | Chat room management (to be implemented) |
| `/admin/reports`    | Report management (to be implemented)    |
| `/admin/moderation` | Moderation tools (to be implemented)     |
| `/admin/analytics`  | Analytics dashboard (to be implemented)  |
| `/admin/settings`   | Admin settings (to be implemented)       |

## Admin Roles

### SUPER_ADMIN

- Full access to all features
- Can create/manage other admins
- Can modify system settings

### ADMIN

- Manage users and content
- Handle reports and moderation
- View analytics

### MODERATOR

- Review reports
- Basic user management
- Limited access to analytics

## API Endpoints

### Authentication

- `POST /api/admin/auth/login` - Login
- `POST /api/admin/auth/logout` - Logout
- `GET /api/admin/auth/me` - Get current admin

### Statistics

- `GET /api/admin/stats` - Get dashboard statistics

## Security Features

1. **Session Management**: Secure token-based sessions with 7-day expiration
2. **Password Hashing**: bcrypt with 12 rounds
3. **Rate Limiting**: Applied to all admin routes
4. **Role-Based Access**: Hierarchical permission system
5. **HTTP-Only Cookies**: Session tokens stored securely
6. **IP & User-Agent Tracking**: Session metadata for security auditing

## Middleware Protection

The admin routes are protected by:

1. Cookie-based session validation
2. Automatic redirect to login if not authenticated
3. Redirect to dashboard if already logged in
4. Rate limiting to prevent brute force attacks

## Next Steps

To complete your admin console, you should:

1. **Implement User Management**
   - Create `/admin/users` page
   - Add API routes for user CRUD operations
   - Add ban/unban functionality

2. **Implement Report Management**
   - Create `/admin/reports` page
   - Add API routes for report review
   - Add action buttons (approve/reject/ban user)

3. **Implement Chat Room Management**
   - Create `/admin/rooms` page
   - Add API routes for room monitoring
   - Add ability to close/moderate rooms

4. **Add Analytics**
   - Create `/admin/analytics` page
   - Add charts and graphs
   - Add export functionality

5. **Add Admin Management** (Super Admin only)
   - Create `/admin/settings` page
   - Add CRUD for admin users
   - Add role management

## Environment Variables

Ensure your `.env` file has:

```env
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="your-nextauth-secret"
NODE_ENV="development"
```

## Troubleshooting

### Cannot login

- Verify admin user exists: `npx prisma studio`
- Check database connection
- Clear cookies and try again

### Session expires immediately

- Check system clock
- Verify cookie settings in production (secure flag)
- Check NEXTAUTH_SECRET is set

### Missing dependencies

```bash
npm install bcryptjs zod
npm install --save-dev @types/bcryptjs
```

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Enable HTTPS (secure cookies)
- [ ] Set up proper logging
- [ ] Configure rate limiting appropriately
- [ ] Review and test all role permissions
- [ ] Set up session cleanup cron job
- [ ] Enable 2FA (future enhancement)
- [ ] Set up monitoring and alerts

## Support

For issues or questions, refer to:

- Schema: `prisma/schema.prisma`
- Auth logic: `src/lib/admin-auth.ts`
- Middleware: `middleware.ts`
