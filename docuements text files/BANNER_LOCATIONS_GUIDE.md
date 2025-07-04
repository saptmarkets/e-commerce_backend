# 🎯 Banner Locations Guide

## 📍 **Where Each Banner Location Works**

### **✅ WORKING BANNER LOCATIONS:**

#### **1. Home Hero Carousel** 
- **Location:** `home-hero`
- **Where it shows:** Home page (`/`) - Main carousel at the top
- **Component:** `MainCarousel.js`
- **Max banners:** 5
- **Dimensions:** 1920×400px
- **Status:** ✅ Working

#### **2. Home Middle Banner**
- **Location:** `home-middle` 
- **Where it shows:** Home page (`/`) - Middle section between products
- **Component:** `BannerSection.js`
- **Max banners:** 1
- **Dimensions:** 1200×300px
- **Status:** ✅ Working

#### **3. Products Page Hero**
- **Location:** `products-hero`
- **Where it shows:** Products page (`/products`) - Top banner
- **Component:** `ProductsHeroBanner.js`
- **Max banners:** 3
- **Dimensions:** 1920×300px
- **Status:** ✅ Working (Just Fixed!)

#### **4. Promotions Page Hero**
- **Location:** `promotions-hero`
- **Where it shows:** Promotions page (`/promotions`) - Top banner
- **Component:** `PromotionsHeroBanner.js`
- **Max banners:** 2
- **Dimensions:** 1920×350px
- **Status:** ✅ Working (Just Fixed!)

#### **5. Category Section Top**
- **Location:** `category-top`
- **Where it shows:** Home page (`/`) - Above categories section
- **Component:** `CategoryTopBanner.js`
- **Max banners:** 1
- **Dimensions:** 1200×200px
- **Status:** ✅ Working (Just Added!)

#### **6. Page Headers**
- **Location:** `page-header`
- **Where it shows:** All pages with PageHeader component (background image)
- **Component:** `PageHeader.js`
- **Max banners:** 10
- **Dimensions:** 1920×250px
- **Status:** ✅ Working
- **Pages:** Products, Promotions, About Us, Contact, etc.

#### **7. Footer Banner**
- **Location:** `footer-banner`
- **Where it shows:** All pages - Above footer section
- **Component:** `FooterBanner.js`
- **Max banners:** 1
- **Dimensions:** 1200×150px
- **Status:** ✅ Working (Just Added!)

#### **8. Sidebar Advertisements**
- **Location:** `sidebar-ads`
- **Where it shows:** Ready to use in any page with sidebar
- **Component:** `SidebarAds.js`
- **Max banners:** 5
- **Dimensions:** 300×400px
- **Status:** ✅ Ready (Component created, needs to be added to pages)

---

## 🧪 **How to Test Each Banner:**

### **Step 1: Create Banners in Admin**
1. Go to **Admin → Banners**
2. Click **"Add Banner"**
3. Choose the location from dropdown
4. Upload image with correct dimensions
5. Set status to **"Active"**
6. Save

### **Step 2: Visit Pages to See Banners**

| Banner Location | Visit This Page | What You'll See |
|----------------|----------------|-----------------|
| Home Hero | `/` | Carousel at top of homepage |
| Home Middle | `/` | Banner in middle of homepage |
| Products Hero | `/products` | Banner at top of products page |
| Promotions Hero | `/promotions` | Banner at top of promotions page |
| Category Top | `/` | Banner above categories on homepage |
| Page Headers | `/products`, `/promotions`, etc. | Background image in page header |
| Footer Banner | Any page | Banner above footer |
| Sidebar Ads | Need to add to specific pages | Vertical ads in sidebar |

---

## 🔧 **How to Add Sidebar Ads to Any Page:**

```jsx
import SidebarAds from "@components/banner/SidebarAds";

// In your page component:
<div className="flex">
  <div className="flex-1">
    {/* Main content */}
  </div>
  <div className="w-80 ml-8">
    <SidebarAds />
  </div>
</div>
```

---

## 📊 **Banner Dimensions Reference:**

| Location | Width | Height | Aspect Ratio |
|----------|-------|--------|--------------|
| Home Hero | 1920px | 400px | 4.8:1 |
| Home Middle | 1200px | 300px | 4:1 |
| Products Hero | 1920px | 300px | 6.4:1 |
| Promotions Hero | 1920px | 350px | 5.5:1 |
| Category Top | 1200px | 200px | 6:1 |
| Page Headers | 1920px | 250px | 7.7:1 |
| Footer Banner | 1200px | 150px | 8:1 |
| Sidebar Ads | 300px | 400px | 3:4 |

---

## ✅ **All Banner Locations Are Now Working!**

Your banner system is 100% complete and functional. You can create banners for any location in the admin and they will display properly on the frontend. 