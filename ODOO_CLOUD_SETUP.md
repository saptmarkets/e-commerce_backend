# Odoo Cloud Integration Setup Guide

## Overview
This guide explains how to configure Odoo ERP integration with your cloud-deployed backend using ngrok for remote access.

## Prerequisites
- ✅ Backend deployed on Render
- ✅ Odoo running locally
- ✅ ngrok installed and configured
- ✅ Odoo accessible via ngrok URL

## Step 1: Start ngrok for Odoo

### Install ngrok (if not already installed)
```bash
# Download from https://ngrok.com/download
# Or use npm
npm install -g ngrok
```

### Start ngrok tunnel for Odoo
```bash
# Start ngrok tunnel for Odoo (default port 8069)
ngrok http 8069

# You'll get a URL like: https://abc123.ngrok.io
```

## Step 2: Update Render Environment Variables

### Option A: Using ngrok URL (Recommended for Cloud)
Add these variables to your Render environment:

```bash
# Odoo Remote Configuration (ngrok)
ODOO_URL=https://your-ngrok-url.ngrok.io
ODOO_DB=forapi_17
ODOO_USERNAME=admin
ODOO_PASSWORD=admin

# Odoo Sync Settings
ODOO_BATCH_SIZE=100
ODOO_MAX_RETRIES=3
BRANCH_LOCATION_IDS=8,34,35,36
DEDUCT_LOCATION_ID=8
```

### Option B: Using localhost (For local development)
```bash
# Odoo Local Configuration
ODOO_HOST=127.0.0.1
ODOO_PORT=8069
ODOO_DATABASE=forapi_17
ODOO_USERNAME=admin
ODOO_PASSWORD=admin

# Odoo Sync Settings
ODOO_BATCH_SIZE=100
ODOO_MAX_RETRIES=3
BRANCH_LOCATION_IDS=8,34,35,36
DEDUCT_LOCATION_ID=8
```

## Step 3: Test Odoo Connection

### Test via API
```bash
# Test connection
curl -X POST https://your-backend.onrender.com/api/odoo/test-connection \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "message": "Odoo connection successful",
#   "serverInfo": { ... }
# }
```

### Test via Admin Panel
1. Go to your admin panel
2. Navigate to Settings > Odoo Integration
3. Click "Test Connection"

## Step 4: Configure Odoo Settings

### In Odoo Admin Panel:
1. **Enable API Access**:
   - Go to Settings > Technical > Users & Companies > Users
   - Edit your admin user
   - Ensure "API Keys" is enabled

2. **Configure CORS** (if needed):
   - Add your backend domain to allowed origins
   - Example: `https://your-backend.onrender.com`

3. **Verify Database**:
   - Ensure database `forapi_17` exists
   - Verify admin credentials work

## Step 5: Sync Data

### Initial Data Sync
```bash
# Sync products
curl -X POST https://your-backend.onrender.com/api/odoo/sync-products

# Sync categories
curl -X POST https://your-backend.onrender.com/api/odoo/sync-categories

# Sync stock levels
curl -X POST https://your-backend.onrender.com/api/odoo/sync-stock
```

### Monitor Sync Status
```bash
# Check sync status
curl -X GET https://your-backend.onrender.com/api/odoo/sync-status
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**:
   - Check ngrok tunnel is active
   - Verify Odoo is running on port 8069
   - Ensure firewall allows connections

2. **Authentication Failed**:
   - Verify Odoo credentials
   - Check database name is correct
   - Ensure admin user has API access

3. **CORS Errors**:
   - Add backend domain to Odoo CORS settings
   - Check ngrok URL is accessible

4. **Data Sync Issues**:
   - Check Odoo logs for errors
   - Verify product/category IDs exist
   - Ensure proper permissions

### Debug Commands

```bash
# Check Odoo service status
curl -X GET https://your-ngrok-url.ngrok.io/web/database/selector

# Test authentication
curl -X POST https://your-ngrok-url.ngrok.io/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["forapi_17", "admin", "admin", {}]
    }
  }'
```

## Security Considerations

1. **ngrok Security**:
   - Use ngrok with authentication
   - Consider paid ngrok for production
   - Regularly rotate ngrok URLs

2. **Odoo Security**:
   - Use strong admin passwords
   - Limit API access to necessary users
   - Monitor API usage logs

3. **Environment Variables**:
   - Never commit credentials to git
   - Use Render's secure environment variables
   - Regularly rotate passwords

## Production Recommendations

1. **Use Stable ngrok URL**:
   - Consider ngrok paid plan for static URLs
   - Or use a proper domain with reverse proxy

2. **Monitor Performance**:
   - Set up logging for Odoo API calls
   - Monitor sync performance
   - Set up alerts for sync failures

3. **Backup Strategy**:
   - Regular Odoo database backups
   - Backup sync configuration
   - Document sync procedures

## API Endpoints

### Available Odoo Integration Endpoints:

- `GET /api/odoo/test-connection` - Test Odoo connection
- `GET /api/odoo/server-info` - Get Odoo server information
- `POST /api/odoo/sync-products` - Sync products from Odoo
- `POST /api/odoo/sync-categories` - Sync categories from Odoo
- `POST /api/odoo/sync-stock` - Sync stock levels from Odoo
- `GET /api/odoo/sync-status` - Get sync status and logs

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs in Render dashboard
3. Check Odoo logs for errors
4. Verify ngrok tunnel is active and accessible 