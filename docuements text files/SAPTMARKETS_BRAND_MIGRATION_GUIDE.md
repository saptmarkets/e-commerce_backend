# 🚀 SAPTMARKETS Brand Migration Guide

## Overview
This guide helps you safely migrate your e-commerce platform from **saptmarkets** to **SAPTMARKETS** branding.

## ✅ What Has Been Updated Already

### Backend Changes
- ✅ `backend/utils/settings.js` - Shop name, email, website updated
- ✅ `backend/utils/settings.json` - JSON settings updated
- ✅ Brand migration script created at `backend/brand-migration-script.js`

### Database Connection Strategy
You're **correct** to be cautious about changing the database name. Here are your options:

## 🛡️ Database Migration Options

### Option 1: Keep Database Name (RECOMMENDED ⭐)
**Safest approach - No risk of breaking your app**

1. **Keep** your MongoDB database named `saptmarkets`
2. **Only** update frontend branding and content
3. **No** database changes required
4. **Zero downtime** migration

```bash
# Your .env file stays the same
MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets
```

### Option 2: Rename Database (Advanced)
**Only if you really want the database name to match your brand**

#### Prerequisites
- ✅ **BACKUP YOUR DATABASE FIRST!**
- ✅ Stop all applications
- ✅ Ensure MongoDB is running

#### Steps
```bash
# 1. Export your current database
mongodump --db saptmarkets --out ./backup

# 2. Import to new database name
mongorestore --db saptmarkets backup/saptmarkets/

# 3. Verify the import
mongo saptmarkets --eval "db.stats()"

# 4. Update your .env file
MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets

# 5. Test your applications thoroughly
# 6. If everything works, you can drop the old database
# mongo --eval "db.getSiblingDB('saptmarkets').dropDatabase()"
```

## 🔧 Required Environment Variables

Create `.env` files in each application:

### Backend (.env)
```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets
# OR: MONGO_URI=mongodb://127.0.0.1:27017/saptmarkets

# JWT
JWT_SECRET_KEY=your-secret-key-here

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDER_EMAIL=noreply@saptmarkets.com

# Server
PORT=5055
NODE_ENV=development
```

### Admin (.env)
```env
VITE_APP_API_BASE_URL=http://localhost:5055/api
VITE_APP_ADMIN_DOMAIN=localhost:3000
VITE_APP_DISABLE_FOR_DEMO=false
```

### Customer (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5055/api
NEXT_PUBLIC_STORE_DOMAIN=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-here
```

## 🖥️ Frontend Branding Updates Needed

### Admin App Frontend
- [ ] Logo files in `admin/public/`
- [ ] Favicon and app icons
- [ ] Page titles and meta tags
- [ ] Any hardcoded "saptmarkets" in components

### Customer App Frontend  
- [ ] Logo files in `customer/public/`
- [ ] Favicon and app icons
- [ ] Page titles and meta tags
- [ ] Any hardcoded "saptmarkets" in components
- [ ] Email templates

## 🔄 Migration Steps

### Step 1: Run the Migration Script
```bash
cd backend
node brand-migration-script.js
```

### Step 2: Update Environment Files
Create the `.env` files as shown above in each application directory.

### Step 3: Update Frontend Assets
1. Replace logo files with SAPTMARKETS branding
2. Update favicons and app icons
3. Search for any remaining "saptmarkets" text in frontend code

### Step 4: Test Everything
```bash
# Backend
cd backend && npm start

# Admin
cd admin && npm run dev

# Customer  
cd customer && npm run dev
```

### Step 5: Search for Remaining References
```bash
# Search for any remaining saptmarkets references
grep -r -i "saptmarkets" . --exclude-dir=node_modules --exclude-dir=.git
```

## 🎨 Brand Assets to Update

### Images to Replace
- Company logo (light/dark versions)
- Favicon
- App icons (Apple touch icon, etc.)
- Email template logos
- Social media images

### Text Content
- Email signatures
- Footer text  
- About us content
- Terms and conditions
- Privacy policy URLs

## ⚠️ Important Notes

1. **Database Safety**: Option 1 (keeping database name) is recommended for production
2. **Backup First**: Always backup before any database changes
3. **Test Thoroughly**: Test all functionality after migration
4. **Gradual Rollout**: Consider updating staging environment first
5. **Monitor Logs**: Watch for any errors after migration

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Test connection
mongo --eval "db.runCommand({connectionStatus: 1})"
```

### Environment Variable Issues
```bash
# Check if .env is loaded
console.log(process.env.MONGO_URI)
```

### Frontend Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Support

If you encounter any issues during migration:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly  
3. Ensure database is accessible
4. Check application logs for specific errors

---

**✨ Your SAPTMARKETS brand migration is ready to go!** 