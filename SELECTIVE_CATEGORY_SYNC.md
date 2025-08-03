# Selective Category Price Sync

This feature allows you to sync specific categories from Odoo with updated prices, similar to the "fetch data" operation but targeted only at selected categories.

## Problem Solved

Previously, when you updated product prices in Odoo and ran a category sync, the new prices wouldn't be reflected in your store unless you ran a full "fetch data" operation. This selective category sync feature provides a more efficient solution.

## How It Works

The selective category sync uses the same comprehensive price update logic as the full "fetch data" operation, but applies it only to products within the specified categories. This ensures that:

1. **Prices are updated properly** - Uses the same price fields (`list_price`, `lst_price`, `price`, `standard_price`, `cost`) as the fetch data operation
2. **Existing products are updated** - Updates product information including prices, not just category relationships
3. **New products are created** - If products don't exist in the store, they are created with current prices
4. **Efficient processing** - Only processes selected categories instead of the entire catalog

## API Endpoint

### POST `/api/odoo/sync-selected-categories`

Syncs specific categories with updated prices from Odoo.

#### Request Body

```json
{
  "categoryIds": [123, 456, 789]
}
```

#### Response

```json
{
  "success": true,
  "message": "Processed 3 categories. Successfully synced 3 categories with 150 products total",
  "data": {
    "results": [
      {
        "categoryId": 123,
        "success": true,
        "syncedProducts": 45,
        "totalProducts": 50,
        "categoryName": "Electronics / Mobile Phones",
        "message": "Successfully synced 45 products in category Electronics / Mobile Phones"
      },
      {
        "categoryId": 456,
        "success": true,
        "syncedProducts": 65,
        "totalProducts": 65,
        "categoryName": "Clothing / Men",
        "message": "Successfully synced 65 products in category Clothing / Men"
      },
      {
        "categoryId": 789,
        "success": true,
        "syncedProducts": 40,
        "totalProducts": 42,
        "categoryName": "Home & Garden",
        "message": "Successfully synced 40 products in category Home & Garden"
      }
    ],
    "errors": [],
    "summary": {
      "totalCategories": 3,
      "successfulCategories": 3,
      "failedCategories": 0,
      "totalProductsSynced": 150
    }
  }
}
```

## Usage Examples

### Using curl

```bash
curl -X POST http://localhost:5000/api/odoo/sync-selected-categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "categoryIds": [123, 456, 789]
  }'
```

### Using JavaScript (Frontend)

```javascript
const syncSelectedCategories = async (categoryIds) => {
  try {
    const response = await fetch('/api/odoo/sync-selected-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ categoryIds })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Successfully synced ${result.data.summary.totalProductsSynced} products across ${result.data.summary.successfulCategories} categories`);
    } else {
      console.error('Sync failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error syncing categories:', error);
    throw error;
  }
};

// Usage
syncSelectedCategories([123, 456, 789]);
```

## Testing

You can test the functionality using the provided test script:

```bash
node backend/test-selective-category-sync.js
```

## Implementation Details

The selective category sync:

1. **Fetches fresh data from Odoo** for each category using `syncProductsByCategory`
2. **Updates existing products** with latest price information
3. **Creates missing products** if they don't exist in the store
4. **Logs the operation** in the sync logs for audit purposes
5. **Provides detailed feedback** about the sync results

## Price Field Priority

The sync uses the following priority for product prices:

1. `price` field (if different from `list_price`)
2. `list_price` 
3. `lst_price`
4. Falls back to `0` if none available

For original/cost prices:
1. `standard_price`
2. `cost`
3. Falls back to `list_price` or `0`

This ensures the most current and accurate pricing information is used.

## Error Handling

- Individual category failures don't stop the entire process
- Detailed error information is returned for failed categories
- Successful categories are processed normally even if others fail
- All operations are logged for debugging purposes

## When to Use

Use selective category sync when:

- ✅ You've updated prices for specific product categories in Odoo
- ✅ You want to avoid a full "fetch data" operation
- ✅ You need to sync multiple categories but not the entire catalog
- ✅ You want the same comprehensive price updates as "fetch data" but more targeted

Use full "fetch data" when:
- ❌ You need to sync all categories
- ❌ You've made structural changes (new categories, attributes, etc.)
- ❌ You're doing an initial sync or major data refresh 