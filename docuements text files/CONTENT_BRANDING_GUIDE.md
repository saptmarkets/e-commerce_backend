# 🎨 Content Branding Update Guide

## 📋 **Overview**

This guide identifies all hardcoded text in FAQ, Privacy Policy, and Terms & Conditions pages that need to be updated from "kachabazar" to "SAPTMARKETS" branding.

## 🔍 **Current Status Analysis**

### ✅ **Already Updated:**
- Customer app locales (`customer/locales/en/common.json`) - ✅ Fully updated to "SAPT Markets"
- Most backend settings - ✅ Partially updated
- Database content - ✅ Migrated to saptmarkets

### ⚠️ **Needs Consistency Updates:**
- Backend settings file has mixed case usage
- Some URLs still reference old domains
- Company name formatting inconsistencies

## 📍 **Content Locations**

### **1. Backend Settings File**
**File:** `backend/utils/settings.js`

**FAQ Section Updates Needed:**
```javascript
// Current inconsistencies:
"How does the saptmarkets work?" → "How does SAPTMARKETS work?"
"What is saptmarkets EC2 auto scaling?" → "What is SAPTMARKETS EC2 auto scaling?"
"What are the benefits of using saptmarkets affliate?" → "What are the benefits of using SAPTMARKETS affiliate?"
```

**Privacy Policy Updates Needed:**
```javascript
// Current inconsistencies:
"At saptmarkets, accessible from saptmarkets dot com" → "At SAPTMARKETS, accessible from saptmarkets.com"
"saptmarkets follows a standard procedure" → "SAPTMARKETS follows a standard procedure"
"saptmarkets has no access to or control" → "SAPTMARKETS has no access to or control"
"saptmarkets's Privacy Policy does not apply" → "SAPTMARKETS's Privacy Policy does not apply"
"saptmarkets does not knowingly collect" → "SAPTMARKETS does not knowingly collect"
```

**Terms & Conditions Updates Needed:**
```javascript
// Current inconsistencies:
"Welcome to saptmarkets!" → "Welcome to SAPTMARKETS!"
"saptmarkets's Website, located at https://saptmarkets.com/" → "SAPTMARKETS's Website, located at https://saptmarkets.com/"
"Do not continue to use saptmarkets if you do not agree" → "Do not continue to use SAPTMARKETS if you do not agree"
"By accessing saptmarkets, you agreed to use cookies" → "By accessing SAPTMARKETS, you agreed to use cookies"
"saptmarkets and/or its licensors own" → "SAPTMARKETS and/or its licensors own"
"saptmarkets does not filter, edit, publish" → "SAPTMARKETS does not filter, edit, publish"
"saptmarkets shall not be liable" → "SAPTMARKETS shall not be liable"
```

**URL Updates Needed:**
```javascript
// Old URLs to update:
"https://saptmarkets-store.vercel.app/privacy-policy" → "https://saptmarkets.com/privacy-policy"
"https://saptmarkets-store-nine.vercel.app/" → "https://saptmarkets.com/"
```

### **2. Customer Locales File**
**File:** `customer/locales/en/common.json`

**Status:** ✅ Already properly updated to "SAPT Markets" format

## 🛠️ **Automated Solution**

I've created a script to handle all these updates automatically:

### **Run the Content Branding Update:**
```bash
cd backend
node update-content-branding.js
```

This script will:
- ✅ Update all FAQ questions for consistent branding
- ✅ Fix Privacy Policy company name references
- ✅ Update Terms & Conditions branding
- ✅ Standardize all URLs
- ✅ Check for remaining inconsistencies
- ✅ Generate a summary report

## 📊 **Branding Standards**

### **Company Name Usage:**
- **Display Name:** "SAPTMARKETS" (all caps for headers, titles, legal documents)
- **Website URL:** "saptmarkets.com" (lowercase for URLs)
- **Email Domain:** "@saptmarkets.com" (lowercase for emails)

### **Content Guidelines:**
1. **Legal Documents:** Use "SAPTMARKETS" (all caps)
2. **FAQ Questions:** Use "SAPTMARKETS" (all caps)
3. **URLs:** Use "saptmarkets.com" (lowercase)
4. **Email Addresses:** Use "saptmarkets.com" (lowercase)

## 🔍 **Manual Verification Checklist**

After running the script, verify these areas:

### **FAQ Section:**
- [ ] All 8 FAQ questions use "SAPTMARKETS"
- [ ] No lowercase "saptmarkets" in question titles
- [ ] Consistent terminology throughout answers

### **Privacy Policy:**
- [ ] Company name consistently "SAPTMARKETS"
- [ ] URLs point to saptmarkets.com
- [ ] No references to old domain names
- [ ] Contact information updated

### **Terms & Conditions:**
- [ ] Welcome message uses "SAPTMARKETS"
- [ ] All legal references use proper company name
- [ ] Website URLs are correct
- [ ] Privacy policy links are updated

### **Meta Information:**
- [ ] Page titles use "SAPTMARKETS"
- [ ] Meta descriptions are updated
- [ ] SEO information is consistent

## 🎯 **Expected Results**

After running the update script:

### **FAQ Section:**
```
✅ "How does SAPTMARKETS work?"
✅ "What is SAPTMARKETS EC2 auto scaling?"
✅ "What are the benefits of using SAPTMARKETS affiliate?"
```

### **Privacy Policy:**
```
✅ "At SAPTMARKETS, accessible from saptmarkets.com..."
✅ "SAPTMARKETS follows a standard procedure..."
✅ "SAPTMARKETS does not knowingly collect..."
```

### **Terms & Conditions:**
```
✅ "Welcome to SAPTMARKETS!"
✅ "SAPTMARKETS's Website, located at https://saptmarkets.com/"
✅ "By accessing SAPTMARKETS, you agreed to use cookies..."
```

## 🚀 **Implementation Steps**

1. **Backup your files:**
   ```bash
   cp backend/utils/settings.js backend/utils/settings.js.backup
   ```

2. **Run the update script:**
   ```bash
   cd backend
   node update-content-branding.js
   ```

3. **Verify the changes:**
   - Check FAQ page in your application
   - Review Privacy Policy content
   - Test Terms & Conditions page

4. **Test the application:**
   - Restart your backend server
   - Verify all pages load correctly
   - Check that content displays properly

## 📞 **Support**

If you encounter any issues:
1. Check the backup files created
2. Review the script output for any errors
3. Manually verify the most critical content areas
4. Test the application thoroughly before deploying

---

**✨ Your content branding will be fully consistent after running this update!** 