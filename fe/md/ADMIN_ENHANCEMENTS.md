# Admin Console Enhancement - Installation Guide

## 🚀 New Features Added

### 1. **Admin Management (Super Admin Only)**

- Add new admin users with different roles
- View all admin users and their activity
- Role-based permissions (SUPER_ADMIN, ADMIN, MODERATOR)

### 2. **User Management (Admin & Super Admin)**

- Browse all users with pagination
- Search and filter users
- Ban/Unban users
- View user statistics and activity

### 3. **Analytics Dashboard (All Admins)**

- Beautiful charts with Recharts library
- User growth trends over time
- Room activity analytics
- Report trends and distributions
- Gender and user type breakdowns
- Top reporters and most reported users

### 4. **Fully Responsive UI**

- Mobile-first design
- Adaptive layouts for all screen sizes
- Touch-friendly controls
- Optimized table/card views for different devices

## 📦 Required Dependencies

Install the following packages:

```bash
npm install recharts
# or
yarn add recharts
# or
pnpm add recharts
```

## 🔧 Database Migration

Run the Prisma migration to update your schema:

```bash
npx prisma migrate dev --name add_admin_enhancements
npx prisma generate
```

## 📋 Setup Steps

### Step 1: Create Your First Admin User

Use the CLI script to create a super admin:

```bash
node scripts/create-admin.js
```

Follow the prompts:

- Email: your-email@example.com
- Password: (minimum 8 characters)
- Name: (optional)
- Role: SUPER_ADMIN

### Step 2: Start Your Development Server

```bash
npm run dev
```

### Step 3: Access Admin Console

Navigate to: `http://localhost:3000/admin/login`

Login with the credentials you created.

## 🎯 Available Routes

| Route                       | Access Level     | Description                       |
| --------------------------- | ---------------- | --------------------------------- |
| `/admin/login`              | Public           | Admin login page                  |
| `/admin/dashboard`          | All Admins       | Overview with key stats           |
| `/admin/users`              | All Admins       | User management with ban controls |
| `/admin/analytics`          | All Admins       | Beautiful analytics dashboard     |
| `/admin/rooms`              | All Admins       | Chat room management              |
| `/admin/reports`            | All Admins       | User report handling              |
| `/admin/settings`           | All Admins       | Admin user management             |
| `/admin/settings/add-admin` | Super Admin Only | Create new admin users            |

## 🔐 Permission Levels

### SUPER_ADMIN

- ✅ All permissions
- ✅ Create/manage admin users
- ✅ Ban/unban users
- ✅ View all analytics
- ✅ Manage reports and rooms

### ADMIN

- ✅ Ban/unban users
- ✅ View all analytics
- ✅ Manage reports and rooms
- ❌ Cannot create admin users

### MODERATOR

- ✅ View analytics
- ✅ View users and reports
- ❌ Cannot ban users
- ❌ Cannot create admin users

## 📊 Analytics Features

The analytics page provides:

1. **Time-series Charts**
   - User growth over time (Line chart)
   - Room activity trends (Bar chart)
   - Report trends (Line chart)

2. **Distribution Charts**
   - User types (Pie chart)
   - Room status (Bar chart)
   - Gender distribution (Pie chart)

3. **Insights**
   - Top reporters
   - Most reported users
   - Active user counts

4. **Time Range Filters**
   - Last 7 days
   - Last 30 days
   - Last 90 days

## 🎨 Responsive Design

The UI adapts to different screen sizes:

- **Mobile (< 768px)**: Card-based layouts, stacked forms
- **Tablet (768px - 1024px)**: Grid layouts with 2 columns
- **Desktop (> 1024px)**: Full grid layouts with sidebar

All components use:

- Flexible grid systems
- Responsive text sizes
- Touch-friendly buttons
- Mobile-optimized navigation

## 🔒 Security Features

- Session-based authentication with HTTP-only cookies
- Role-based access control (RBAC)
- Rate limiting on all routes
- Password hashing with bcrypt (12 rounds)
- IP and User-Agent tracking
- Session expiration (7 days)
- Protected API endpoints

## 🧪 Testing

### Test Admin Login

1. Go to `/admin/login`
2. Enter your admin credentials
3. Should redirect to `/admin/dashboard`

### Test User Banning (Admin/Super Admin)

1. Go to `/admin/users`
2. Find a user
3. Click "Ban" button
4. Confirm action
5. User should be marked as banned

### Test Analytics

1. Go to `/admin/analytics`
2. Select different time ranges
3. Verify charts load properly
4. Check responsive behavior

### Test Admin Creation (Super Admin Only)

1. Go to `/admin/settings`
2. Click "Add Admin"
3. Fill in form
4. Submit
5. New admin should appear in list

## 🐛 Troubleshooting

### Charts Not Rendering

```bash
# Ensure recharts is installed
npm install recharts
```

### Permission Denied Errors

- Check admin role in database
- Verify session is valid
- Clear cookies and login again

### Mobile View Issues

- Clear browser cache
- Check viewport meta tag
- Verify responsive classes

### API Errors

- Check Prisma connection
- Verify database migrations
- Check server logs

## 📱 Mobile Usage Tips

1. **Navigation**: Tap the hamburger menu on mobile
2. **Tables**: Swipe horizontally on mobile tables
3. **Charts**: Tap and hold for tooltips
4. **Forms**: Use native keyboard for better input

## 🚀 Production Deployment

Before deploying to production:

1. **Update Environment Variables**

   ```env
   NODE_ENV=production
   DATABASE_URL=your-production-db
   ```

2. **Run Migrations**

   ```bash
   npx prisma migrate deploy
   ```

3. **Create Super Admin**

   ```bash
   node scripts/create-admin.js
   ```

4. **Build Application**

   ```bash
   npm run build
   ```

5. **Security Checklist**
   - [ ] HTTPS enabled
   - [ ] Strong passwords enforced
   - [ ] Rate limiting configured
   - [ ] Session secrets rotated
   - [ ] Database backups enabled

## 📚 Additional Resources

- [Recharts Documentation](https://recharts.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Future Enhancements

Consider adding:

- Email notifications for admin actions
- Two-factor authentication
- Audit logs
- Export analytics data
- Advanced filtering
- Bulk user actions
- Custom date ranges
- Real-time updates with websockets

---

**Need Help?** Check the troubleshooting section or review the API documentation in the codebase.
