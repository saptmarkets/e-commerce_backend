# Quick Setup and Testing Guide

## What We've Fixed
1. ✅ **UI Library Conflicts**: Converted all components from Material-UI to Windmill UI
2. ✅ **Import Path Issues**: Fixed all import paths to use the correct `@/` aliases
3. ✅ **Lazy Loading**: Made Units component lazy-loaded like other pages
4. ✅ **Component Exports**: Ensured proper default exports

## Testing Steps

### 1. Start the Development Server
```bash
cd admin
npm start
# or
yarn dev
```

### 2. Navigate to Units Page
- Go to `http://localhost:4100/units`
- You should see the hierarchical unit management interface

### 3. Test Basic Functionality

#### A. View Units in Hierarchy Mode
1. Click "Hierarchy View" tab (should be default)
2. You should see existing units in a tree structure
3. Try expanding/collapsing parent units

#### B. View Units in Table Mode
1. Click "Table View" tab
2. You should see units in a traditional table format

#### C. Create a New Unit
1. Click "Add Unit" button
2. The UnitDrawer should open
3. Try creating both parent and child units

### 4. Expected Interface Features

#### Statistics Cards
- Total Units count
- Parent Units count
- Child Units count
- Active Units count

#### Hierarchy View Features
- Tree structure with expand/collapse
- Visual distinction between parent/child units
- Status badges (Active/Inactive)
- Action buttons (Edit, Delete, Toggle Status)

#### Form Features
- Dynamic form that changes based on parent/child selection
- Parent unit selection for child units
- Pack value input for child units
- Real-time validation

## If You Still See Errors

### 1. Clear Browser Cache
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open DevTools → Application → Storage → Clear Storage

### 2. Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

### 3. Check Console for Specific Errors
- Open DevTools (F12)
- Look at the Console tab
- Share any remaining error messages

### 4. Verify Backend is Running
- Make sure your backend server is running on the expected port
- Check if the unit APIs are responding:
  - `GET /api/units` should return your units
  - Verify the migration created the hierarchical structure

## Component Structure

```
Units Page
├── Header with Statistics Cards
├── View Mode Toggle (Hierarchy/Table)
└── Content Area
    ├── UnitListTree (Hierarchy View)
    │   ├── Expandable Tree Structure
    │   ├── Action Buttons
    │   └── Status Indicators
    └── UnitTable (Table View)
        └── Traditional Table Layout
```

## Expected Database Structure

After running the migration, you should have:
- Parent units with `isParent: true`
- Child units with `isParent: false` and `parentUnit` references
- All products assigned to basic units
- ProductUnit documents created from existing multiUnits

## Success Indicators

✅ **Page Loads**: Units page loads without errors
✅ **Tree View**: Can see hierarchical unit structure
✅ **Statistics**: Unit counts display correctly
✅ **Navigation**: Can switch between hierarchy and table views
✅ **Forms**: Can open unit creation/edit forms
✅ **Actions**: Edit, delete, and status toggle buttons work

## Next Steps

Once the basic interface is working:
1. Test creating parent units
2. Test creating child units with pack values
3. Verify the hierarchy displays correctly
4. Test the product unit management in product edit pages

## Common Issues and Solutions

### Issue: "Cannot resolve module"
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Component not found"
**Solution**: Check import paths are using `@/` correctly

### Issue: "Hooks can only be called inside function components"
**Solution**: Ensure all components are properly exported as default exports

### Issue: Missing UI components
**Solution**: Verify @windmill/react-ui is installed
```bash
npm list @windmill/react-ui
```

---

**Note**: The backend migration should have already been completed successfully based on our previous work. This guide focuses on testing the frontend admin interface. 