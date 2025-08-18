# AboutUs Collection System

## Overview
The AboutUs collection system separates About Us page data from the main settings collection, providing better data organization and preventing accidental data loss during settings imports.

## Architecture

### Collections
- **`settings`** - Main application settings (no longer contains About Us data)
- **`aboutus`** - Dedicated collection for About Us page content

### Models
- **`Setting`** - Main settings model (existing)
- **`AboutUs`** - New model for About Us data

## API Endpoints

### Get About Us Data
```
GET /setting/store/customization/about-us
```
Returns all About Us data from the dedicated collection.

### Update About Us Data
```
PUT /setting/store/customization/about-us
Body: { data: { ... } }
```
Updates About Us data in the dedicated collection.

### Legacy Compatibility
```
GET /setting/store/customization/all
PUT /setting/store/customization/update
```
These endpoints still work but now route About Us data to the dedicated collection.

## Data Structure

### AboutUs Collection Document
```json
{
  "_id": "ObjectId",
  "name": "aboutUs",
  "data": {
    "top_section_title": { "en": "English", "ar": "العربية" },
    "top_section_description": { "en": "English", "ar": "العربية" },
    "card_one_title": { "en": "English", "ar": "العربية" },
    "card_one_sub": { "en": "English", "ar": "العربية" },
    "card_one_description": { "en": "English", "ar": "العربية" },
    "card_two_title": { "en": "English", "ar": "العربية" },
    "card_two_sub": { "en": "English", "ar": "العربية" },
    "card_two_description": { "en": "English", "ar": "العربية" },
    "heritage_title": { "en": "English", "ar": "العربية" },
    "heritage_description_one": { "en": "English", "ar": "العربية" },
    "heritage_description_two": { "en": "English", "ar": "العربية" },
    "team_title": { "en": "English", "ar": "العربية" },
    "team_description": { "en": "English", "ar": "العربية" },
    "values_title": { "en": "English", "ar": "العربية" },
    "values_description": { "en": "English", "ar": "العربية" },
    "branches_title": { "en": "English", "ar": "العربية" },
    "branches_description": { "en": "English", "ar": "العربية" },
    "branches_cta_title": { "en": "English", "ar": "العربية" },
    "branches_cta_description": { "en": "English", "ar": "العربية" },
    "upcoming_branches_title": { "en": "English", "ar": "العربية" },
    "upcoming_branch_1_name": { "en": "English", "ar": "العربية" },
    "upcoming_branch_1_address": { "en": "English", "ar": "العربية" },
    "upcoming_branch_2_name": { "en": "English", "ar": "العربية" },
    "upcoming_branch_2_address": { "en": "English", "ar": "العربية" }
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Migration & Safety Features

### Automatic Migration
- When someone calls the About Us endpoint for the first time, existing data is automatically migrated from settings
- No data loss during the transition

### Import Script Protection
- The `scripts/importSettings.js` script now protects AboutUs collection data
- Running import settings will NOT overwrite AboutUs data
- AboutUs data is preserved and merged with any existing data

### Manual Migration Script
```bash
node scripts/migrate-aboutus-to-collection.js
```
Use this script to manually migrate existing About Us data to the new collection.

## Benefits

1. **Data Safety** - About Us data cannot be accidentally overwritten by settings imports
2. **Better Organization** - About Us data is logically separated from other settings
3. **Scalability** - Easier to manage and extend About Us functionality
4. **Backward Compatibility** - Existing code continues to work without changes
5. **Bilingual Support** - Native support for English and Arabic content

## Usage Examples

### Frontend (Admin App)
```javascript
// Get About Us data
const response = await fetch('/setting/store/customization/about-us');
const aboutUsData = await response.json();

// Update About Us data
const updateResponse = await fetch('/setting/store/customization/about-us', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      top_section_title: { en: "New Title", ar: "عنوان جديد" }
    }
  })
});
```

### Backend (Node.js)
```javascript
const AboutUs = require('./models/AboutUs');

// Get data
const aboutUs = await AboutUs.findOne({ name: 'aboutUs' });
const data = aboutUs?.data || {};

// Update data
await AboutUs.findOneAndUpdate(
  { name: 'aboutUs' },
  { $set: { data: newData } },
  { new: true, upsert: true }
);
```

## Troubleshooting

### No Arabic Fields Showing
1. Check if the AboutUs collection exists in MongoDB
2. Verify the data structure includes both `en` and `ar` keys
3. Run the migration script if needed

### Data Not Saving
1. Check MongoDB connection
2. Verify the AboutUs model is properly imported
3. Check server logs for errors

### Import Settings Overwrites Data
1. Ensure you're using the updated `importSettings.js` script
2. The script should automatically protect AboutUs data
3. Check console output for protection messages

## Future Enhancements

- Add validation for required fields
- Implement versioning for About Us content
- Add audit trail for content changes
- Support for additional languages beyond English and Arabic 