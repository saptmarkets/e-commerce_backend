import React, { useState, useEffect, useRef } from 'react';
import { 
  FiDownload, FiUpload, FiInfo, FiCheck, 
  FiX, FiList, FiEye, FiAlertTriangle 
} from 'react-icons/fi';
import Main from '@/layout/Main';
import Loading from '@/components/preloader/Loading';
import ProductServices from '@/services/ProductServices';
import ProductUnitServices from '@/services/ProductUnitServices';
import CategoryServices from '@/services/CategoryServices';
import UnitServices from '@/services/UnitServices';
import { notifyError, notifySuccess } from '@/utils/toast';
import { utils, writeFile } from 'xlsx';
import * as XLSX from 'xlsx';

const ProductImportExport = () => {
  const fileInputRef = useRef(null);
  
  // States
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [products, setProducts] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [viewMode, setViewMode] = useState('basic'); // 'basic' or 'detailed'

  // Preview system states
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewResults, setPreviewResults] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize] = useState(20);
  const [selectedFile, setSelectedFile] = useState(null); // Store the selected file for import

  // Helper function to safely render text
  const renderSafeText = (text, fallback = '') => {
    if (typeof text === 'object' && text) {
      return text.en || text.ar || Object.values(text)[0] || fallback;
    }
    return text || fallback;
  };

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoading(true);
        
        // Load categories
        const categoriesResponse = await CategoryServices.getAllCategory();
        const categoriesData = Array.isArray(categoriesResponse) ? 
          categoriesResponse : (categoriesResponse?.categories || []);
        setCategories(categoriesData);

        // Load units
        const unitsResponse = await UnitServices.getShowingUnits();
        const unitsData = unitsResponse?.units || unitsResponse || [];
        setUnits(unitsData);

        // Load sample products for reference
        const productsResponse = await ProductServices.getAllProducts({ page: 1, limit: 10 });
        const productsData = productsResponse?.products || productsResponse || [];
        setProducts(productsData);
        
      } catch (error) {
        console.error('Error loading reference data:', error);
        notifyError('Failed to load reference data');
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Generate Excel template for product import
  const generateExcelTemplate = (templateType = 'basic') => {
    let headers, sampleData;

    // Use all units since all units are now basic units (parent system removed)
    const availableUnits = units;

    if (templateType === 'basic') {
      // Basic product template
      headers = [
        'Product Title (EN)', 'Product Title (AR)', 'Description (EN)', 'Description (AR)',
        'Category Name', 'Default Unit', 'Default Pack Qty', 'Default Price', 
        'Stock Quantity', 'SKU', 'Barcode', 'Status'
      ];

      // Sample category and unit for reference
      const sampleCategory = categories.length > 0 ? renderSafeText(categories[0].name, 'Electronics') : 'Electronics';
      const sampleUnit = availableUnits.length > 0 ? availableUnits[0].name : 'pieces';

      sampleData = [
        'Wireless Mouse', 'فأرة لاسلكية', 'High-quality wireless mouse', 'فأرة لاسلكية عالية الجودة',
        sampleCategory, sampleUnit, '1', '25.50', '100', 'WM001', '1234567890123', 'show'
      ];
    } else {
      // Detailed template with multi-units (matching export structure)
      headers = [
        'Product Title (EN)', 'Product Title (AR)', 'Description (EN)', 'Description (AR)',
        'Category Name', 'Default Unit', 'Default Pack Qty', 'Default Price', 
        'Stock Quantity', 'SKU', 'Barcode', 'Status',
        'Unit 1 Name', 'Unit 1 Pack Qty', 'Unit 1 Price', 'Unit 1 SKU', 'Unit 1 Barcode', 'Unit 1 Is Default',
        'Unit 2 Name', 'Unit 2 Pack Qty', 'Unit 2 Price', 'Unit 2 SKU', 'Unit 2 Barcode', 'Unit 2 Is Default',
        'Unit 3 Name', 'Unit 3 Pack Qty', 'Unit 3 Price', 'Unit 3 SKU', 'Unit 3 Barcode', 'Unit 3 Is Default'
      ];

      const sampleCategory = categories.length > 0 ? renderSafeText(categories[0].name, 'Electronics') : 'Electronics';
      const sampleParentUnits = availableUnits.slice(0, 4).map(u => u.name);
      
      sampleData = [
        'Sample Product', 'منتج عينة', 'Sample product description', 'وصف المنتج العينة',
        sampleCategory, sampleParentUnits[0] || 'Pieces', 1, 25.99, 100, 'SKU001', '123456789', 'show',
        sampleParentUnits[0] || 'Pieces', 1, 25.99, 'SKU001-PCS', '1234567890001', 'Yes',
        availableUnits.find(u => u.name.toLowerCase().includes('pack'))?.name || 'Pack', 12, 280.00, 'SKU001-PACK', '1234567890002', 'No',
        availableUnits.find(u => u.name.toLowerCase().includes('box'))?.name || 'Box', 24, 520.00, 'SKU001-BOX', '1234567890003', 'No'
      ];
    }

    const ws = utils.aoa_to_sheet([headers, sampleData]);
    
    // Set column widths
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Products Template');

    // Create reference sheets
    if (categories.length > 0) {
      const categoriesData = [
        ['Category Name', 'Category ID', 'Description'],
        ['NOTE: Use the exact category names shown below', '', ''],
        ...categories.map(cat => [renderSafeText(cat.name, ''), cat._id, 'Valid category name'])
      ];
      const categoriesWs = utils.aoa_to_sheet(categoriesData);
      utils.book_append_sheet(wb, categoriesWs, 'Categories Reference');
    }

    if (units.length > 0) {
      const parentUnitsData = [
        ['Unit Name', 'Unit ID', 'Short Code', 'Type', 'Note'],
        ['NOTE: Only use PARENT UNITS for Default Unit column', '', '', '', ''],
        ...availableUnits.map(unit => [unit.name, unit._id, unit.shortCode || '', 'Parent Unit (VALID)', 'Use this for Default Unit']),
        ['', '', '', '', ''],
        ['--- ALL UNITS (for reference) ---', '', '', '', ''],
        ...units.filter(u => !u.isParent).map(unit => [unit.name, unit._id, unit.shortCode || '', 'Child Unit', 'DO NOT use for Default Unit'])
      ];
      const unitsWs = utils.aoa_to_sheet(parentUnitsData);
      utils.book_append_sheet(wb, unitsWs, 'Units Reference');
    }

    const filename = `products_${templateType}_template_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(wb, filename);

    notifySuccess(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template downloaded successfully`);
  };

  // Export existing products to Excel
  const handleExportProducts = async () => {
    try {
      setLoading(true);
      
      // Get all products
      const response = await ProductServices.getAllProducts({ limit: 10000 });
      const productsData = response?.products || response || [];

      if (productsData.length === 0) {
        notifyError('No products found to export');
        return;
      }

      const headers = [
        'Product ID', 'Product Title (EN)', 'Product Title (AR)', 'Description (EN)', 'Description (AR)',
        'Category Name', 'Default Unit', 'Default Pack Qty', 'Default Price', 
        'Stock Quantity', 'SKU', 'Barcode', 'Status', 'Created Date',
        'Has Multi Units', 'Total Units Count',
        'Unit 1 Name', 'Unit 1 Pack Qty', 'Unit 1 Price', 'Unit 1 SKU', 'Unit 1 Barcode', 'Unit 1 Is Default',
        'Unit 2 Name', 'Unit 2 Pack Qty', 'Unit 2 Price', 'Unit 2 SKU', 'Unit 2 Barcode', 'Unit 2 Is Default',
        'Unit 3 Name', 'Unit 3 Pack Qty', 'Unit 3 Price', 'Unit 3 SKU', 'Unit 3 Barcode', 'Unit 3 Is Default',
        'Unit 4 Name', 'Unit 4 Pack Qty', 'Unit 4 Price', 'Unit 4 SKU', 'Unit 4 Barcode', 'Unit 4 Is Default',
        'Unit 5 Name', 'Unit 5 Pack Qty', 'Unit 5 Price', 'Unit 5 SKU', 'Unit 5 Barcode', 'Unit 5 Is Default'
      ];

      const exportData = await Promise.all(productsData.map(async (product) => {
        let unitsCount = 0;
        let hasMultiUnits = false;
        let productUnits = [];

        try {
          const unitsResponse = await ProductUnitServices.getProductUnits(product._id);
          productUnits = unitsResponse?.data || [];
          unitsCount = productUnits.length;
          hasMultiUnits = unitsCount > 1;
        } catch (error) {
          console.warn(`Failed to load units for product ${product._id}`);
        }

        // Helper function to get unit name safely
        const getUnitName = (unit) => {
          if (unit?.unit && typeof unit.unit === 'object') {
            return renderSafeText(unit.unit.name || unit.unit.title, '');
          } else if (unit?.unit && typeof unit.unit === 'string') {
            return unit.unit;
          } else if (unit?.unitType) {
            return renderSafeText(unit.unitType, '');
          }
          return '';
        };

        // Base product data
        const baseData = [
          product._id,
          renderSafeText(product.title, ''),
          renderSafeText(product.title, ''), // AR version
          renderSafeText(product.description, ''),
          renderSafeText(product.description, ''), // AR version
          renderSafeText(product.category?.name, ''),
          renderSafeText(product.unit, product.basicUnit?.name || ''),
          product.packQty || 1,
          product.price || 0,
          product.stock || 0,
          product.sku || '',
          product.barcode || '',
          product.status || 'show',
          product.createdAt ? new Date(product.createdAt).toISOString().split('T')[0] : '',
          hasMultiUnits ? 'Yes' : 'No',
          unitsCount
        ];

        // Add unit details (up to 5 units)
        const maxUnits = 5;
        for (let i = 0; i < maxUnits; i++) {
          if (i < productUnits.length) {
            const unit = productUnits[i];
            baseData.push(
              getUnitName(unit),                           // Unit Name
              unit.packQty || 1,                          // Pack Qty
              unit.price || 0,                            // Price
              unit.sku || '',                             // SKU
              unit.barcode || '',                         // Barcode
              unit.isDefault ? 'Yes' : 'No'               // Is Default
            );
          } else {
            // Empty cells for unused unit slots
            baseData.push('', '', '', '', '', '');
          }
        }

        return baseData;
      }));

      const ws = utils.aoa_to_sheet([headers, ...exportData]);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Products Export');

      const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      writeFile(wb, filename);

      notifySuccess(`Successfully exported ${productsData.length} products`);
    } catch (error) {
      console.error('Export error:', error);
      notifyError('Failed to export products');
    } finally {
      setLoading(false);
    }
  };

  // Find category by name (enhanced to support hierarchical structure)
  const findCategoryByName = (categoryName) => {
    if (!categoryName) return null;
    
    console.log('🔍 Looking for category:', categoryName);
    console.log('📊 Available categories:', categories?.length);
    
    // Create a comprehensive list of all categories with different name formats
    const allCategories = [];
    
    const collectCategories = (catList, parentPath = '') => {
      catList.forEach(cat => {
        const enName = cat.name?.en || '';
        const arName = cat.name?.ar || '';
        const safeName = renderSafeText(cat.name, '');
        
        // Add multiple formats for matching
        allCategories.push({
          ...cat,
          searchNames: [
            enName.toLowerCase(),
            arName.toLowerCase(),
            safeName.toLowerCase(),
            // Also include the original format as it appears in the object
            typeof cat.name === 'string' ? cat.name.toLowerCase() : ''
          ].filter(name => name.length > 0)
        });
        
        // Recursively collect from children
        if (cat.children && cat.children.length > 0) {
          collectCategories(cat.children, parentPath + enName + ' / ');
        }
      });
    };
    
    collectCategories(categories);
    
    console.log('📝 First 5 categories with search names:');
    allCategories.slice(0, 5).forEach((cat, index) => {
      console.log(`  ${index + 1}. Names: [${cat.searchNames.join(', ')}]`);
    });
    
    // Try to find exact match with any of the search names
    const searchTerm = categoryName.toLowerCase().trim();
    console.log(`🎯 Searching for: "${searchTerm}"`);
    
    for (const cat of allCategories) {
      for (const searchName of cat.searchNames) {
        if (searchName === searchTerm) {
          console.log(`✅ Found exact match: "${searchName}" -> ${cat.name?.en || 'Unnamed'}`);
          return cat;
        }
      }
    }
    
    // If no exact match, try partial match (contains)
    console.log('⚠️ No exact match found, trying partial matches...');
    for (const cat of allCategories) {
      for (const searchName of cat.searchNames) {
        if (searchName.includes(searchTerm) || searchTerm.includes(searchName)) {
          console.log(`🔶 Found partial match: "${searchName}" -> ${cat.name?.en || 'Unnamed'}`);
          return cat;
        }
      }
    }
    
    console.log(`❌ Category "${categoryName}" not found`);
    console.log('📋 All available category names:');
    allCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name?.en || 'Unnamed'} (${cat.searchNames[0]})`);
    });
    
    return null;
  };

  // Find unit by name
  const findUnitByName = (unitName) => {
    if (!unitName) return null;
    
    // Search through all units since all units are now basic units (parent system removed)
    console.log(`🔍 Looking for unit: "${unitName}"`);
    console.log(`📊 Available units:`, units.map(u => `${u.name} (${u.shortCode})`).join(', '));
    
    const foundUnit = units.find(unit => 
      unit.name.toLowerCase() === unitName.toLowerCase() ||
      (unit.shortCode && unit.shortCode.toLowerCase() === unitName.toLowerCase())
    );
    
    if (foundUnit) {
      console.log(`✅ Found unit: "${unitName}" -> ${foundUnit.name} (${foundUnit.shortCode})`);
    } else {
      console.log(`❌ No unit found for: "${unitName}"`);
      console.log(`💡 Available units:`, units.map(u => `"${u.name}" or "${u.shortCode}"`));
    }
    
    return foundUnit;
  };

  // Import products from Excel
  // Preview Excel data without importing
  const handlePreviewExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Store the file for later import
    setSelectedFile(file);

    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        notifyError('Excel file must contain headers and at least one data row');
        return;
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      // Create header mapping
      const headerMap = {};
      headers.forEach((header, index) => {
        if (header) {
          headerMap[header.toString().toLowerCase().trim()] = index;
        }
      });

      const getValueByHeader = (row, headerVariations) => {
        for (const variation of headerVariations) {
          const index = headerMap[variation.toLowerCase()];
          if (index !== undefined && row[index] !== undefined && row[index] !== null && row[index] !== '') {
            return row[index].toString().trim();
          }
        }
        return null;
      };

      const previewResults = {
        total: rows.length,
        valid: 0,
        invalid: 0,
        warnings: [],
        errors: [],
        data: []
      };

      // Get existing products to check for duplicates
      let existingProducts = [];
      try {
        const existingResponse = await ProductServices.getAllProducts({ limit: 10000 });
        existingProducts = existingResponse?.products || existingResponse || [];
      } catch (error) {
        console.warn('Could not load existing products for duplicate check:', error);
      }

      const existingSKUs = new Set(existingProducts.map(p => p.sku).filter(Boolean));
      const existingBarcodes = new Set(existingProducts.map(p => p.barcode).filter(Boolean));
      const processedSKUs = new Set(); // Track SKUs within this import batch

      for (let i = 0; i < rows.length; i++) { // Process all rows for preview
        const row = rows[i];
        const rowNumber = i + 2;

        const rowData = {
          rowNumber,
          titleEN: getValueByHeader(row, ['Product Title (EN)', 'title en', 'title_en', 'product name', 'name']),
          titleAR: getValueByHeader(row, ['Product Title (AR)', 'title ar', 'title_ar', 'arabic title']),
          categoryName: getValueByHeader(row, ['Category Name', 'category', 'category name']),
          unitName: getValueByHeader(row, ['Default Unit', 'unit', 'default unit', 'basic unit']),
          packQty: getValueByHeader(row, ['Default Pack Qty', 'Pack Qty', 'pack qty', 'quantity', 'qty']),
          price: getValueByHeader(row, ['Default Price', 'Price', 'price', 'unit price', 'selling price']),
          stock: getValueByHeader(row, ['Stock Quantity', 'Stock', 'stock', 'inventory', 'quantity']),
          sku: getValueByHeader(row, ['SKU', 'sku', 'product code']),
          status: 'Valid',
          errors: [],
          warnings: []
        };

        // Validation
        if (!rowData.titleEN) {
          rowData.errors.push('Product Title (EN) is required');
          rowData.status = 'Invalid';
        }

        if (!rowData.categoryName) {
          rowData.errors.push('Category Name is required');
          rowData.status = 'Invalid';
        } else {
          const category = findCategoryByName(rowData.categoryName);
          if (!category) {
            rowData.errors.push(`Category "${rowData.categoryName}" not found`);
            rowData.status = 'Invalid';
          }
        }

        if (!rowData.unitName) {
          rowData.errors.push('Default Unit is required');
          rowData.status = 'Invalid';
        } else {
          const unit = findUnitByName(rowData.unitName);
          if (!unit) {
            rowData.errors.push(`Unit "${rowData.unitName}" not found`);
            rowData.status = 'Invalid';
          }
        }

        // Check for duplicate SKUs
        if (rowData.sku) {
          if (existingSKUs.has(rowData.sku)) {
            rowData.errors.push(`SKU "${rowData.sku}" already exists in database`);
            rowData.status = 'Invalid';
          } else if (processedSKUs.has(rowData.sku)) {
            rowData.errors.push(`SKU "${rowData.sku}" appears multiple times in this import`);
            rowData.status = 'Invalid';
          } else {
            processedSKUs.add(rowData.sku);
          }
        }

        // Check for duplicate barcodes
        if (rowData.barcode && existingBarcodes.has(rowData.barcode)) {
          rowData.warnings.push(`Barcode "${rowData.barcode}" already exists in database`);
        }

        // Warnings for potential issues
        if (!rowData.price || parseFloat(rowData.price) === 0) {
          rowData.warnings.push('Price is 0 or missing');
        }

        if (!rowData.stock || parseInt(rowData.stock) === 0) {
          rowData.warnings.push('Stock quantity is 0 or missing');
        }

        if (rowData.status === 'Valid') {
          previewResults.valid++;
        } else {
          previewResults.invalid++;
        }

        previewResults.data.push(rowData);
      }

      setPreviewData(previewResults.data);
      setPreviewResults(previewResults);
      setPreviewMode(true);
      setPreviewPage(1); // Reset pagination

    } catch (error) {
      console.error('Preview error:', error);
      notifyError('Failed to preview Excel file');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // Import from preview mode
  const handleImportFromPreview = async () => {
    if (!selectedFile) {
      notifyError('No file selected for import');
      return;
    }

    if (previewResults?.invalid > 0) {
      notifyError('Cannot import with invalid rows. Please fix the errors first.');
      return;
    }

    try {
      setImporting(true);
      
      // Use the same import logic but with the stored file
      const mockEvent = { target: { files: [selectedFile] } };
      await handleImportExcel(mockEvent);
      
    } catch (error) {
      console.error('Import from preview error:', error);
      notifyError('Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        notifyError('Excel file must contain headers and at least one data row');
        return;
      }

      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      // Create header mapping for flexible column positioning
      const headerMap = {};
      headers.forEach((header, index) => {
        if (header) {
          const normalizedHeader = header.toString().toLowerCase().trim();
          headerMap[normalizedHeader] = index;
        }
      });

      // Define expected headers with variations
      const getValueByHeader = (row, headerVariations) => {
        for (const variation of headerVariations) {
          const index = headerMap[variation.toLowerCase()];
          if (index !== undefined && row[index] !== undefined && row[index] !== null && row[index] !== '') {
            return row[index];
          }
        }
        return null;
      };

      const results = {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [],
        created: []
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        try {
          // Get values using header names (matching template headers exactly)
          const titleEN = getValueByHeader(row, ['Product Title (EN)', 'title en', 'title_en', 'product name', 'name']);
          const titleAR = getValueByHeader(row, ['Product Title (AR)', 'title ar', 'title_ar', 'arabic title']);
          const descEN = getValueByHeader(row, ['Description (EN)', 'description en', 'description_en', 'description']);
          const descAR = getValueByHeader(row, ['Description (AR)', 'description ar', 'description_ar', 'arabic description']);
          const categoryName = getValueByHeader(row, ['Category Name', 'category', 'category name']);
          const unitName = getValueByHeader(row, ['Default Unit', 'unit', 'default unit', 'basic unit']);
          const packQty = getValueByHeader(row, ['Default Pack Qty', 'Pack Qty', 'pack qty', 'quantity', 'qty']);
          const price = getValueByHeader(row, ['Default Price', 'Price', 'price', 'unit price', 'selling price']);
          const stock = getValueByHeader(row, ['Stock Quantity', 'Stock', 'stock', 'inventory', 'quantity']);
          const sku = getValueByHeader(row, ['SKU', 'sku', 'product code']);
          const barcode = getValueByHeader(row, ['Barcode', 'barcode', 'bar code']);
          const status = getValueByHeader(row, ['Status', 'status', 'visibility']);

          // Debug: Show parsed values for troubleshooting
          if (price === '0' || stock === '0') {
            console.log(`⚠️ Row ${rowNumber} - Price: "${price}", Stock: "${stock}" (might be zero)`);
          }

          // Validate required fields
          if (!titleEN) {
            results.errors.push(`Row ${rowNumber}: Product Title (EN) is required`);
            results.failed++;
            continue;
          }

          if (!categoryName) {
            results.errors.push(`Row ${rowNumber}: Category Name is required`);
            results.failed++;
            continue;
          }

          // Find category
          const category = findCategoryByName(categoryName);
          if (!category) {
            results.errors.push(`Row ${rowNumber}: Category "${categoryName}" not found`);
            results.failed++;
            continue;
          }

          // Find default unit
          const defaultUnit = findUnitByName(unitName);
          if (!defaultUnit) {
            results.errors.push(`Row ${rowNumber}: Unit "${unitName}" not found`);
            results.failed++;
            continue;
          }

          // Build product data
          const productData = {
            title: {
              en: titleEN || '',
              ar: titleAR || titleEN || ''
            },
            description: {
              en: descEN || '',
              ar: descAR || descEN || ''
            },
            slug: titleEN ? titleEN.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '',
            category: category._id,
            basicUnit: defaultUnit._id,
            price: parseFloat(price) || 0,
            stock: parseInt(stock) || 0,
            sku: sku || '',
            barcode: barcode || '',
            status: status === 'hide' ? 'hide' : 'show',
            isCombination: false,  // Required field - set to false for imported products by default
            hasMultiUnits: false
          };

          // Create product (this automatically creates the default ProductUnit)
          const createdProduct = await ProductServices.addProduct(productData);
          
          // Check if there are ADDITIONAL units to create (for multi-unit templates)
          const additionalUnits = [];
          
          // Process up to 3 additional units (skip if same as default unit)
          for (let unitIndex = 1; unitIndex <= 3; unitIndex++) {
            const unitNameField = getValueByHeader(row, [`Unit ${unitIndex} Name`, `unit${unitIndex}`, `unit ${unitIndex}`]);
            const unitPackQtyField = getValueByHeader(row, [`Unit ${unitIndex} Pack Qty`, `unit${unitIndex}_qty`, `unit ${unitIndex} qty`]);
            const unitPriceField = getValueByHeader(row, [`Unit ${unitIndex} Price`, `unit${unitIndex}_price`, `unit ${unitIndex} price`]);
            const unitSKUField = getValueByHeader(row, [`Unit ${unitIndex} SKU`, `unit${unitIndex}_sku`, `unit ${unitIndex} sku`]);
            const unitBarcodeField = getValueByHeader(row, [`Unit ${unitIndex} Barcode`, `unit${unitIndex}_barcode`, `unit ${unitIndex} barcode`]);
            const isDefaultField = getValueByHeader(row, [`Unit ${unitIndex} Is Default`, `unit${unitIndex}_default`, `unit ${unitIndex} default`]);

            if (unitNameField && unitNameField !== unitName) { // Only add if different from default unit
              const unitFound = findUnitByName(unitNameField);
              if (unitFound && unitFound._id !== defaultUnit._id) { // Avoid duplicate default unit
                const isDefault = isDefaultField === 'Yes' || isDefaultField === 'yes' || isDefaultField === 'true';
                
                additionalUnits.push({
                  unit: unitFound._id,
                  packQty: parseFloat(unitPackQtyField) || 1,
                  price: parseFloat(unitPriceField) || 0,
                  sku: unitSKUField || '',
                  barcode: unitBarcodeField || '',
                  isDefault: false, // Never set additional units as default to avoid conflicts
                  title: `${unitNameField} unit for ${titleEN}`
                });
              }
            }
          }

          // Create additional product units if any (default unit is already created by backend)
          if (additionalUnits.length > 0) {
            for (const unitData of additionalUnits) {
              unitData.product = createdProduct._id;
              await ProductUnitServices.createProductUnit(createdProduct._id, unitData);
            }

            // Update product to mark as having multiple units
            await ProductServices.updateProduct(createdProduct._id, { hasMultiUnits: true });
          }

          results.successful++;
          results.created.push({
            name: titleEN,
            id: createdProduct._id,
            unitsCreated: additionalUnits.length + 1 // +1 for the default unit created by backend
          });

        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error);
          results.errors.push(`Row ${rowNumber}: ${error.message || 'Unknown error'}`);
          results.failed++;
        }
      }

      setImportResults(results);

      // Clear preview mode after successful import
      setPreviewMode(false);
      setPreviewData([]);
      setPreviewResults(null);

      if (results.successful > 0) {
        notifySuccess(`Successfully imported ${results.successful} out of ${results.total} products`);
      }

      if (results.failed > 0) {
        notifyError(`Failed to import ${results.failed} products. Check the results below.`);
      }

    } catch (error) {
      console.error('Import error:', error);
      notifyError('Failed to import Excel file');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center min-h-screen">
          <Loading loading={true} />
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Import & Export</h1>
          <p className="mt-2 text-gray-600">
            Import products from Excel files or export existing products for backup and analysis.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Import Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiUpload className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Products</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Upload an Excel file to import products with their details and multiple units.
                </p>
                <div className="space-y-3">
                  {!previewMode ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          {t("Processing")}
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-4 h-4" />
                          Choose Excel File for Preview
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={handleImportFromPreview}
                        disabled={importing || previewResults?.invalid > 0}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                      >
                        {importing ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Importing...
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-4 h-4" />
                            Confirm Import ({previewResults?.valid || 0} products)
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMode(false);
                          setPreviewData([]);
                          setPreviewResults(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel Preview
                      </button>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => generateExcelTemplate('basic')}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors duration-200"
                    >
                      Basic Template
                    </button>
                    <button
                      onClick={() => generateExcelTemplate('detailed')}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors duration-200"
                    >
                      Multi-Unit Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiDownload className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Products</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Download all existing products as an Excel file for backup or analysis.
                </p>
                <button
                  onClick={handleExportProducts}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FiDownload className="w-4 h-4" />
                      Export All Products
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reference Information */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <FiInfo className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Import Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">Required Fields:</h4>
                  <ul className="space-y-1">
                    <li>• Product Title (EN)</li>
                    <li>• Category Name (must exist)</li>
                    <li>• Default Unit (must exist)</li>
                    <li>• Default Price</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Optional Fields:</h4>
                  <ul className="space-y-1">
                    <li>• Product Title (AR)</li>
                    <li>• Description (EN/AR)</li>
                    <li>• Additional Units (up to 3)</li>
                    <li>• Stock, SKU, Barcode</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Available Categories ({categories.length}):</h4>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {categories.slice(0, 10).map(cat => (
                    <span key={cat._id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {renderSafeText(cat.name, '')}
                    </span>
                  ))}
                  {categories.length > 10 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{categories.length - 10} more
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Available Units ({units.length}):</h4>
                <p className="text-xs text-blue-700 mb-2">ℹ️ All units are now valid for the "Default Unit" column since the parent unit system has been removed.</p>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {units.slice(0, 15).map(unit => (
                    <span key={unit._id} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {unit.name} ✓
                    </span>
                  ))}
                  {units.length > 15 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{units.length - 15} more units
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiList className="w-5 h-5" />
              Import Results
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{importResults.total}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {importResults.created.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <FiCheck className="w-4 h-4" />
                  Successfully Created Products ({importResults.created.length})
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {importResults.created.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                        <span className="text-green-800">{product.name}</span>
                        <span className="text-green-600">
                          {product.unitsCreated > 0 ? `${product.unitsCreated} units` : 'Basic product'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {importResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                  <FiX className="w-4 h-4" />
                  Import Errors ({importResults.errors.length})
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 text-red-800 rounded text-sm">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Results */}
        {previewMode && previewResults && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiEye className="w-5 h-5" />
              Import Preview
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{previewResults.total}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{previewResults.valid}</div>
                <div className="text-sm text-gray-600">Valid</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{previewResults.invalid}</div>
                <div className="text-sm text-gray-600">Invalid</div>
              </div>
            </div>

            {previewResults.invalid > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <FiAlertTriangle className="w-5 h-5" />
                  Cannot Import - Please Fix Errors
                </div>
                <p className="text-red-600 text-sm">
                  There are {previewResults.invalid} invalid rows. Fix the errors in your Excel file and upload again.
                </p>
              </div>
            )}

            {previewResults.valid > 0 && previewResults.invalid === 0 && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  <FiCheck className="w-5 h-5" />
                  Ready to Import
                </div>
                <p className="text-green-600 text-sm">
                  All {previewResults.valid} rows are valid and ready for import. Click "Confirm Import" to proceed.
                </p>
              </div>
            )}

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Row</th>
                    <th className="text-left p-3 font-medium">Product Title</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Unit</th>
                    <th className="text-left p-3 font-medium">Price</th>
                    <th className="text-left p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">SKU</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData
                    .slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize)
                    .map((row, index) => (
                    <tr key={index} className={row.status === 'Invalid' ? 'bg-red-50' : 'bg-white'}>
                      <td className="p-3 text-gray-600">{row.rowNumber}</td>
                      <td className="p-3">
                        <div className="font-medium">{row.titleEN || 'N/A'}</div>
                        {row.titleAR && <div className="text-gray-500 text-xs">{row.titleAR}</div>}
                      </td>
                      <td className="p-3">{row.categoryName || 'N/A'}</td>
                      <td className="p-3">{row.unitName || 'N/A'}</td>
                      <td className="p-3">
                        <span className={row.price ? 'text-green-600' : 'text-red-500'}>
                          {row.price ? `$${parseFloat(row.price).toFixed(2)}` : '0.00'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={row.stock ? 'text-green-600' : 'text-amber-500'}>
                          {row.stock || '0'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600 text-xs font-mono">{row.sku || 'N/A'}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === 'Valid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {row.errors.length > 0 && (
                          <div className="space-y-1">
                            {row.errors.map((error, i) => (
                              <div key={i} className="text-red-600 text-xs">{error}</div>
                            ))}
                          </div>
                        )}
                        {row.warnings.length > 0 && (
                          <div className="space-y-1">
                            {row.warnings.map((warning, i) => (
                              <div key={i} className="text-amber-600 text-xs">⚠️ {warning}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {previewData.length > previewPageSize && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((previewPage - 1) * previewPageSize) + 1} to {Math.min(previewPage * previewPageSize, previewData.length)} of {previewData.length} products
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                    disabled={previewPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {previewPage} of {Math.ceil(previewData.length / previewPageSize)}
                  </span>
                  <button
                    onClick={() => setPreviewPage(Math.min(Math.ceil(previewData.length / previewPageSize), previewPage + 1))}
                    disabled={previewPage === Math.ceil(previewData.length / previewPageSize)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handlePreviewExcel}
          className="hidden"
        />
      </div>
    </Main>
  );
};

export default ProductImportExport; 