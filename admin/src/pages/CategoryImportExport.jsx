import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from '@windmill/react-ui';
import { FiDownload, FiUpload, FiRefreshCw, FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle, FiDatabase } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// Internal imports
import PageTitle from '@/components/Typography/PageTitle';
import AnimatedContent from '@/components/common/AnimatedContent';
import { notifySuccess, notifyError } from '@/utils/toast';
import CategoryServices from '@/services/CategoryServices';
import useAsync from '@/hooks/useAsync';
import useUtilsFunction from '@/hooks/useUtilsFunction';

const CategoryImportExport = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [templateType, setTemplateType] = useState('basic');
  const [selectedFile, setSelectedFile] = useState(null);
  const [odooImporting, setOdooImporting] = useState(false); // New state for Odoo import
  const [odooImportResults, setOdooImportResults] = useState(null); // New state for Odoo import results
  const fileInputRef = useRef(null);

  // Debug function to reset states
  const handleResetStates = () => {
    setImporting(false);
    setExporting(false);
    setSelectedFile(null);
    setImportResults(null);
    setOdooImporting(false);
    setOdooImportResults(null);
    console.log('🔧 All states reset');
  };

  const { data: categories, loading, error } = useAsync(CategoryServices.getAllCategory);
  const { showingTranslateValue } = useUtilsFunction();
  
  // Add error boundary
  if (error) {
    console.error('CategoryImportExport - API Error:', error);
    return (
      <>
        <PageTitle>Category Import/Export</PageTitle>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            <p>Error loading categories: {error.message || error}</p>
            <p className="text-sm text-gray-500 mt-2">Please check console for details</p>
          </div>
        </div>
      </>
    );
  }

  // Helper function to safely render multilingual text
  const renderSafeText = (text, fallback = '') => {
    if (typeof text === 'string') return text;
    if (typeof text === 'object' && text !== null) {
      return text.en || text.ar || Object.values(text)[0] || fallback;
    }
    return fallback;
  };

  // Flatten hierarchical categories for easier processing
  const flattenCategories = (categories, level = 0) => {
    let flattened = [];
    
    for (const category of categories) {
      flattened.push({
        ...category,
        level,
        displayName: '  '.repeat(level) + renderSafeText(category.name)
      });
      
      if (category.children && category.children.length > 0) {
        flattened = flattened.concat(flattenCategories(category.children, level + 1));
      }
    }
    
    return flattened;
  };

  // Find category by name (supports hierarchical search)
  const findCategoryByName = (categoryName, categories) => {
    if (!categoryName) return null;
    
    const searchInCategories = (catList) => {
      for (const cat of catList) {
        const catName = renderSafeText(cat.name, '').toLowerCase();
        if (catName === categoryName.toLowerCase()) {
          return cat;
        }
        
        if (cat.children && cat.children.length > 0) {
          const found = searchInCategories(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInCategories(categories);
  };

  // Generate Excel template
  const generateExcelTemplate = (templateType = 'basic') => {
    const wb = XLSX.utils.book_new();
    
    let headers, sampleData;
    
    if (templateType === 'basic') {
      headers = [
        'Category Name (EN)', 'Category Name (AR)', 'Description (EN)', 'Description (AR)',
        'Parent Category Name', 'Status', 'Icon URL'
      ];
      
      sampleData = [
        ['Electronics', 'إلكترونيات', 'Electronic products', 'منتجات إلكترونية', '', 'show', ''],
        ['Mobile Phones', 'هواتف محمولة', 'Mobile phone category', 'فئة الهواتف المحمولة', 'Electronics', 'show', ''],
        ['Smartphones', 'هواتف ذكية', 'Smartphone products', 'منتجات الهواتف الذكية', 'Mobile Phones', 'show', '']
      ];
    } else if (templateType === 'hierarchical') {
      headers = [
        'Category Name (EN)', 'Category Name (AR)', 'Description (EN)', 'Description (AR)',
        'Parent Category Name', 'Status', 'Icon URL', 'Level', 'Sort Order'
      ];
      
      sampleData = [
        ['Main Category', 'الفئة الرئيسية', 'Main category description', 'وصف الفئة الرئيسية', '', 'show', '', '0', '1'],
        ['Sub Category 1', 'الفئة الفرعية 1', 'Sub category description', 'وصف الفئة الفرعية', 'Main Category', 'show', '', '1', '1'],
        ['Sub Sub Category', 'الفئة الفرعية الفرعية', 'Sub sub category description', 'وصف الفئة الفرعية الفرعية', 'Sub Category 1', 'show', '', '2', '1']
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
      { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Categories Template');
    
    const templateName = `categories_${templateType}_template.xlsx`;
    XLSX.writeFile(wb, templateName);
    
    notifySuccess(`${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template downloaded successfully!`);
  };

  // Export existing categories
  const handleExportCategories = async () => {
    try {
      setExporting(true);
      
      if (!categories || categories.length === 0) {
        notifyError('No categories found to export');
        return;
      }

      // Flatten all categories
      const flatCategories = flattenCategories(categories);
      
      const exportData = flatCategories.map(category => [
        renderSafeText(category.name) || '',
        category.name?.ar || '',
        renderSafeText(category.description) || '',
        category.description?.ar || '',
        category.parentName || '',
        category.status || 'show',
        category.icon || '',
        category.level || 0,
        category.sortOrder || 1
      ]);

      const headers = [
        'Category Name (EN)', 'Category Name (AR)', 'Description (EN)', 'Description (AR)',
        'Parent Category Name', 'Status', 'Icon URL', 'Level', 'Sort Order'
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData]);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 30 },
        { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 12 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Categories Export');
      
      const fileName = `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      notifySuccess(`Successfully exported ${flatCategories.length} categories!`);
      
    } catch (error) {
      console.error('Export error:', error);
      notifyError('Failed to export categories');
    } finally {
      setExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImportResults(null); // Clear previous results
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Import categories from Excel
  const handleImportExcel = async () => {
    if (!selectedFile) {
      notifyError('Please select an Excel file first');
      return;
    }

    try {
      setImporting(true);
      const data = await selectedFile.arrayBuffer();
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

      const results = {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [],
        created: []
      };

      // Parse and prepare category data
      const categoryData = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        // Validate required fields
        if (!row[0]) {
          results.errors.push(`Row ${rowNumber}: Category Name (EN) is required`);
          results.failed++;
          continue;
        }

        categoryData.push({
          rowNumber,
          name: {
            en: row[0] || '',
            ar: row[1] || row[0] || ''
          },
          description: {
            en: row[2] || '',
            ar: row[3] || row[2] || ''
          },
          parentName: row[4] || '',
          status: row[5] === 'hide' ? 'hide' : 'show',
          icon: row[6] || '',
          level: row[7] || 0,
          sortOrder: row[8] || 1
        });
      }

      console.log('Parsed category data before sorting:', JSON.stringify(categoryData, null, 2));
      
      // Sort categories by hierarchy: parents first, then children
      categoryData.sort((a, b) => {
        // Parents (no parentName) come first
        if (!a.parentName && b.parentName) return -1;
        if (a.parentName && !b.parentName) return 1;
        
        // If both have parents or both don't, sort by level then by order
        if (a.level !== b.level) return a.level - b.level;
        return a.sortOrder - b.sortOrder;
      });
      
      console.log('Sorted category data:', JSON.stringify(categoryData, null, 2));

      // First pass: Create all categories without parent relationships
      const createdCategories = new Map();
      
      for (const catData of categoryData) {
        try {
          // Build category data without parent relationship first
          const categoryPayload = {
            name: catData.name,
            description: catData.description,
            status: catData.status,
            icon: catData.icon
          };

          console.log(`Creating category: ${catData.name.en}`);
          
          // Create category without parent relationship
          await CategoryServices.addCategory(categoryPayload);
          
          // Store for second pass
          createdCategories.set(catData.name.en, {
            name: catData.name,
            parentName: catData.parentName,
            rowNumber: catData.rowNumber
          });

          results.successful++;
          results.created.push({
            name: catData.name.en,
            parent: catData.parentName || 'Root'
          });

        } catch (error) {
          console.error(`Error creating category ${catData.name.en}:`, error);
          results.errors.push(`Row ${catData.rowNumber}: ${error.message || 'Unknown error'}`);
          results.failed++;
        }
      }

      // Second pass: Update parent relationships
      // Wait a bit for categories to be saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch all categories again to get the newly created ones with their IDs
      const allCategoriesResponse = await CategoryServices.getAllCategories();
      const allCategories = allCategoriesResponse || [];
      
      console.log('All categories after creation:', allCategories.length);

      // Update parent relationships
      for (const [categoryName, categoryInfo] of createdCategories) {
        if (categoryInfo.parentName) {
          try {
            // Find the created category by name
            const createdCategory = allCategories.find(cat => 
              cat.name?.en === categoryName || 
              (typeof cat.name === 'string' && cat.name === categoryName)
            );
            
            if (!createdCategory) {
              console.log(`Could not find created category: ${categoryName}`);
              continue;
            }

            // Find the parent category
            const parentCategory = allCategories.find(cat => 
              cat.name?.en === categoryInfo.parentName || 
              (typeof cat.name === 'string' && cat.name === categoryInfo.parentName)
            );

            if (parentCategory) {
              console.log(`Updating ${categoryName} to have parent ${categoryInfo.parentName}`);
              
              await CategoryServices.updateCategory(createdCategory._id, {
                parentId: parentCategory._id,
                parentName: categoryInfo.parentName
              });
              
              console.log(`Successfully set parent relationship: ${categoryName} -> ${categoryInfo.parentName}`);
            } else {
              results.errors.push(`Parent category "${categoryInfo.parentName}" not found for "${categoryName}"`);
            }
          } catch (error) {
            console.error(`Error setting parent for ${categoryName}:`, error);
            results.errors.push(`Failed to set parent for ${categoryName}: ${error.message}`);
          }
        }
      }

      setImportResults(results);

      if (results.successful > 0) {
        notifySuccess(`Successfully imported ${results.successful} out of ${results.total} categories`);
      }

      if (results.failed > 0) {
        notifyError(`Failed to import ${results.failed} categories. Check the results below.`);
      }

    } catch (error) {
      console.error('Import error:', error);
      notifyError('Failed to import Excel file');
    } finally {
      setImporting(false);
      setSelectedFile(null); // Clear selected file
    }
  };

  // Import all Odoo categories
  const handleImportOdooCategories = async () => {
    try {
      setOdooImporting(true);
      setOdooImportResults(null);
      
      console.log('🚀 Starting Odoo categories import...');
      const result = await CategoryServices.importAllOdooCategories();
      
      console.log('✅ Odoo import completed:', result);
      
      setOdooImportResults({
        success: true,
        imported: result.data?.imported || 0,
        errors: result.data?.errors || [],
        total: result.data?.total || 0,
        message: result.message || t("ImportCompletedSuccessfully")
      });
      
      if (result.data?.imported > 0) {
        notifySuccess(`Successfully imported ${result.data.imported} categories from Odoo!`);
      }
      
      if (result.data?.errors && result.data.errors.length > 0) {
        notifyError(`Import completed with ${result.data.errors.length} errors. Check results below.`);
      }
      
    } catch (error) {
      console.error('❌ Odoo import error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to import Odoo categories';
      
      setOdooImportResults({
        success: false,
        imported: 0,
        errors: [errorMessage],
        total: 0,
        message: errorMessage
      });
      
      notifyError(errorMessage);
    } finally {
      setOdooImporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageTitle>Category Import/Export</PageTitle>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
          <p className="ml-4">Loading categories...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle>Category Import/Export</PageTitle>
      
      <AnimatedContent>
        {/* Odoo Import Section - NEW */}
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <h4 className="mb-4 font-semibold text-gray-600 dark:text-gray-300">
              🔄 Import Categories from Odoo
            </h4>
            <div className="grid gap-4 lg:gap-6 xl:gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Import all categories from your Odoo system into the store. This will create the proper hierarchy with bilingual names (English/Arabic) as configured in your Odoo system.
                </p>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="mb-1">• Preserves parent/child relationships</p>
                  <p className="mb-1">• Supports bilingual category names</p>
                  <p>• Skips already imported categories</p>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleImportOdooCategories}
                  disabled={odooImporting}
                  className="w-full h-12 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {odooImporting ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" />
                      Importing from Odoo...
                    </>
                  ) : (
                    <>
                      <FiDatabase className="mr-2" />
                      Import All Odoo Categories
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Odoo Import Results */}
            {odooImportResults && (
              <div className="mt-6">
                <h5 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                  Odoo Import Results
                </h5>
                <div className={`p-4 rounded-lg ${odooImportResults.success ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
                  <div className="flex items-start">
                    {odooImportResults.success ? (
                      <FiCheckCircle className="mr-2 mt-1 text-green-500" />
                    ) : (
                      <FiXCircle className="mr-2 mt-1 text-red-500" />
                    )}
                    <div className={`text-sm ${odooImportResults.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      <p className="font-medium mb-2">{odooImportResults.message}</p>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="font-medium">Categories Imported:</span> {odooImportResults.imported}
                        </div>
                        <div>
                          <span className="font-medium">Total Processed:</span> {odooImportResults.total}
                        </div>
                      </div>
                      
                      {odooImportResults.errors && odooImportResults.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="font-medium mb-2">Errors ({odooImportResults.errors.length}):</p>
                          <div className="max-h-32 overflow-y-auto">
                            {odooImportResults.errors.map((error, index) => (
                              <p key={index} className="text-xs mb-1">• {error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Template Generation Section */}
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <h4 className="mb-4 font-semibold text-gray-600 dark:text-gray-300">
              📋 Generate Excel Template
            </h4>
            <div className="grid gap-4 lg:gap-6 xl:gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Template Type
                </label>
                <Select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="block w-full"
                >
                  <option value="basic">Basic Template (7 fields)</option>
                  <option value="hierarchical">Hierarchical Template (9 fields)</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => generateExcelTemplate(templateType)}
                  className="w-full h-12 bg-blue-500 hover:bg-blue-600"
                >
                  <FiDownload className="mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="flex items-start">
                <FiInfo className="mr-2 mt-1 text-blue-500" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Template Information:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Basic Template:</strong> Name, Description, Parent, Status, Icon</li>
                    <li><strong>Hierarchical Template:</strong> Includes Level and Sort Order fields</li>
                    <li>Parent Category Name should match exactly with existing category names</li>
                    <li>Status values: 'show' or 'hide' (defaults to 'show')</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Import Section */}
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <h4 className="mb-4 font-semibold text-gray-600 dark:text-gray-300">
              📤 Import Categories from Excel
            </h4>
            <div className="grid gap-4 lg:gap-6 xl:gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                  Select Excel File
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={importing}
                    className="hidden"
                  />
                  <div 
                    onClick={triggerFileInput}
                    className={`w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                      importing 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                        : selectedFile 
                          ? 'border-green-400 bg-green-50 hover:bg-green-100' 
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                    } dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600`}
                  >
                    <div className="flex items-center justify-center">
                      {importing ? (
                        <span className="text-gray-500 text-sm">{t("Processing")}</span>
                      ) : selectedFile ? (
                        <div className="text-center">
                          <span className="text-green-600 text-sm font-medium">✓ {selectedFile.name}</span>
                          <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FiUpload className="mx-auto mb-2 text-gray-400" size={24} />
                          <span className="text-gray-500 text-sm">Click to select Excel file</span>
                          <p className="text-xs text-gray-400 mt-1">Supports .xlsx and .xls formats</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {importing && (
                  <p className="mt-2 text-sm text-blue-600">
                    🔄 {t("ProcessingPleaseWait")}
                  </p>
                )}
                {selectedFile && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✓ Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleImportExcel}
                  disabled={importing || !selectedFile}
                  className="w-full h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-2" />
                      {selectedFile ? 'Import Categories' : 'Select File First'}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {selectedFile && !importing && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <div className="flex items-start">
                  <FiAlertTriangle className="mr-2 mt-1 text-yellow-500" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium mb-1">Ready to Import:</p>
                    <p>File "{selectedFile.name}" is ready for import. Click "Import Categories" to proceed.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Debug/Reset Section */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Debug: Importing={importing.toString()}, File={selectedFile?.name || 'none'}
                </div>
                <button
                  onClick={handleResetStates}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                  Reset States
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Export Section */}
        <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800 mb-5">
          <CardBody>
            <h4 className="mb-4 font-semibold text-gray-600 dark:text-gray-300">
              📥 Export Existing Categories
            </h4>
            <div className="grid gap-4 lg:gap-6 xl:gap-6 md:grid-cols-2">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Categories: <span className="font-bold text-green-600">{categories ? flattenCategories(categories).length : 0}</span>
                </div>
              </div>
              <div>
                <Button
                  onClick={handleExportCategories}
                  disabled={exporting || !categories || categories.length === 0}
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
                >
                  {exporting ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FiDownload className="mr-2" />
                      Export All Categories
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Import Results Section */}
        {importResults && (
          <Card className="min-w-0 shadow-xs overflow-hidden bg-white dark:bg-gray-800">
            <CardBody>
              <h4 className="mb-4 font-semibold text-gray-600 dark:text-gray-300">
                📊 Import Results
              </h4>
              
              {/* Summary Stats */}
              <div className="grid gap-4 lg:gap-6 xl:gap-6 md:grid-cols-3 mb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="flex items-center">
                    <FiInfo className="mr-2 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Processed</p>
                      <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="flex items-center">
                    <FiCheckCircle className="mr-2 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Successful</p>
                      <p className="text-2xl font-bold text-green-600">{importResults.successful}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                  <div className="flex items-center">
                    <FiXCircle className="mr-2 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success List */}
              {importResults.created.length > 0 && (
                <div className="mb-6">
                  <h5 className="mb-3 font-medium text-green-600 dark:text-green-400">
                    ✅ Successfully Created Categories ({importResults.created.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto bg-green-50 dark:bg-green-900 rounded-lg p-4">
                    <ul className="space-y-1">
                      {importResults.created.map((item, index) => (
                        <li key={index} className="text-sm text-green-700 dark:text-green-300">
                          • {item.name} {item.parent !== 'Root' && <span className="text-green-500">→ under "{item.parent}"</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Error List */}
              {importResults.errors.length > 0 && (
                <div>
                  <h5 className="mb-3 font-medium text-red-600 dark:text-red-400">
                    ❌ Import Errors ({importResults.errors.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto bg-red-50 dark:bg-red-900 rounded-lg p-4">
                    <ul className="space-y-1">
                      {importResults.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-300">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button
                  onClick={() => setImportResults(null)}
                  layout="outline"
                  className="text-gray-600 border-gray-300"
                >
                  Clear Results
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </AnimatedContent>
    </>
  );
};

export default CategoryImportExport; 