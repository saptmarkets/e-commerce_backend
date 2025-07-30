# 🛍️ SAPT Markets Customer App Deployment Guide

## 📋 Overview
This guide will help you deploy the SAPT Markets Customer App to Vercel.

## 🎯 Current Status
- ✅ **Backend**: Deployed on Render (`https://e-commerce-backend-l0s0.onrender.com`)
- ✅ **Admin App**: Deployed on Vercel (`https://e-commerce-admin-five-sable.vercel.app`)
- 🔄 **Customer App**: Ready for Vercel deployment

---

## 🚀 Deployment Steps

### Step 1: Prepare Repository
1. **Go to GitHub**: [https://github.com/saptmarkets/e-commerce_customer.git](https://github.com/saptmarkets/e-commerce_customer.git)
2. **Upload the customer app files** to the repository
3. **Ensure the repository is public** for Vercel deployment

### Step 2: Deploy to Vercel
1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**: `saptmarkets/e-commerce_customer`
4. **Configure the project:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `customer` (if in monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables
Add these environment variables in Vercel:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://e-commerce-backend-l0s0.onrender.com/api` |
| `NEXTAUTH_SECRET` | `saptmarkets-customer-nextauth-secret-key-2024` |
| `NEXTAUTH_URL` | `https://your-customer-domain.vercel.app` |
| `NODE_ENV` | `production` |

### Step 4: Deploy
1. **Click "Deploy"**
2. **Wait for build to complete**
3. **Test the deployed customer app**

---

## 🔧 Configuration Files

### Environment Variables
The app uses these environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://e-commerce-backend-l0s0.onrender.com/api

# NextAuth Configuration
NEXTAUTH_SECRET=saptmarkets-customer-nextauth-secret-key-2024
NEXTAUTH_URL=https://your-customer-domain.vercel.app

# App Configuration
NEXT_PUBLIC_APP_NAME=SaptMarkets
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_DESCRIPTION=Your trusted online grocery store

# Development/Production Flags
NODE_ENV=production
```

### Next.js Configuration
The `next.config.js` is already configured with:
- ✅ API proxy to backend
- ✅ Image optimization
- ✅ Security headers
- ✅ Internationalization (i18n)
- ✅ Performance optimizations

---

## 🧪 Testing After Deployment

### Test the following features:
1. **Homepage**: [https://your-customer-domain.vercel.app](https://your-customer-domain.vercel.app)
2. **Product browsing**: Navigate through categories
3. **User registration/login**: Test authentication
4. **Shopping cart**: Add/remove items
5. **Checkout process**: Test payment flow
6. **Multi-language**: Test Arabic/English switching

---

## 🔗 Important Links

- **Backend API**: https://e-commerce-backend-l0s0.onrender.com
- **Admin App**: https://e-commerce-admin-five-sable.vercel.app
- **Customer App**: https://your-customer-domain.vercel.app (after deployment)

---

## 🚨 Troubleshooting

### Common Issues:
1. **CORS Errors**: Backend CORS is already configured for customer domains
2. **Build Failures**: Check Node.js version (use 18+)
3. **Environment Variables**: Ensure all required variables are set
4. **API Connection**: Verify backend is running and accessible

### Support:
- Check Vercel deployment logs for build errors
- Verify environment variables are correctly set
- Test API endpoints directly

---

## ✅ Success Checklist

- [ ] Repository created and files uploaded
- [ ] Vercel project created and configured
- [ ] Environment variables set
- [ ] Build successful
- [ ] Homepage loads correctly
- [ ] API calls work (no CORS errors)
- [ ] Authentication works
- [ ] Multi-language support works
- [ ] Mobile responsiveness tested

---

**🎉 Once deployed, your customer app will be live and ready for users!** 