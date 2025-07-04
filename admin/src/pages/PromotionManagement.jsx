import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { 
  FiArrowLeft, FiDownload, FiUpload, FiTrash2, FiFilter, FiSearch, 
  FiRefreshCw, FiEdit, FiPlus, FiCalendar, FiGrid, FiList, FiCheck,
  FiX, FiEye, FiMoreHorizontal 
} from 'react-icons/fi';
import Main from '@/layout/Main';
import Loading from '@/components/preloader/Loading';
import PromotionServices from '@/services/PromotionServices';
import PromotionListServices from '@/services/PromotionListServices';  
import ProductServices from '@/services/ProductServices';
import ProductUnitServices from '@/services/ProductUnitServices';
import { notifyError, notifySuccess } from '@/utils/toast';
import { utils, writeFile } from 'xlsx';
import * as XLSX from 'xlsx';

const PromotionManagement = () => {
  const { listId } = useParams();
  const location = useLocation();
  const history = useHistory();
  const fileInputRef = useRef(null);

  // States
  const [promotionList, setPromotionList] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotions, setSelectedPromotions] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Import preview states
  const [importPreview, setImportPreview] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Helper function to safely render text
  const renderSafeText = (text, fallback = '') => {
    if (typeof text === 'object' && text) {
      return text.en || text.ar || Object.values(text)[0] || fallback;
    }
    return text || fallback;
  };

  // Load promotion list and promotions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get promotion list details
        const listResponse = await PromotionListServices.getPromotionListById(listId);
        setPromotionList(listResponse);

        // Get promotions for this list
        const promotionsResponse = await PromotionServices.getAllPromotions({ 
          promotionList: listId,
          limit: 1000 
        });
        
        const promotionData = promotionsResponse?.promotions || promotionsResponse || [];
        setPromotions(promotionData);
        setFilteredPromotions(promotionData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        notifyError('Failed to load promotion data');
      } finally {
        setLoading(false);
      }
    };

    if (listId) {
      loadData();
    }
  }, [listId]);

  // Filter promotions based on search and filters
  useEffect(() => {
    let filtered = [...promotions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(promotion => 
        renderSafeText(promotion.name, '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        renderSafeText(promotion.description, '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(promotion => 
        statusFilter === 'active' ? promotion.isActive : !promotion.isActive
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(promotion => {
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        
        switch (dateFilter) {
          case 'active':
            return startDate <= now && endDate >= now;
          case 'upcoming':
            return startDate > now;
          case 'expired':
            return endDate < now;
          default:
            return true;
        }
      });
    }

    setFilteredPromotions(filtered);
  }, [promotions, searchTerm, statusFilter, dateFilter]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedPromotions.size === filteredPromotions.length) {
      setSelectedPromotions(new Set());
    } else {
      setSelectedPromotions(new Set(filteredPromotions.map(p => p._id)));
    }
  };

  // Handle individual selection
  const handleSelectPromotion = (promotionId) => {
    const newSelected = new Set(selectedPromotions);
    if (newSelected.has(promotionId)) {
      newSelected.delete(promotionId);
    } else {
      newSelected.add(promotionId);
    }
    setSelectedPromotions(newSelected);
  };

  // Bulk delete selected promotions
  const handleBulkDelete = async () => {
    if (selectedPromotions.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedPromotions.size} promotion(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      const deletePromises = Array.from(selectedPromotions).map(id => 
        PromotionServices.deletePromotion(id)
      );
      
      await Promise.all(deletePromises);
      
      // Refresh promotions
      const promotionsResponse = await PromotionServices.getAllPromotions({ 
        promotionList: listId,
        limit: 1000 
      });
      
      const promotionData = promotionsResponse?.promotions || promotionsResponse || [];
      setPromotions(promotionData);
      setSelectedPromotions(new Set());
      
      notifySuccess(`Successfully deleted ${selectedPromotions.size} promotion(s)`);
    } catch (error) {
      console.error('Error deleting promotions:', error);
      notifyError('Failed to delete promotions');
    } finally {
      setLoading(false);
    }
  };

  // Generate Excel template based on promotion type
  const generateExcelTemplate = async (promotionType, selectedPromotions = []) => {
    let headers = ['Promotion List ID', 'Product Name', 'Unit Name', 'Min Qty', 'Max Qty', 'Start Date', 'End Date'];
    let sampleData = [listId, 'Enter Product Name', 'kg', 1, 100, '2024-01-01', '2024-12-31'];

    // Customize headers based on promotion type
    switch (promotionType) {
      case 'fixed_price':
        headers.push('Fixed Price');
        sampleData.push(25.99);
        break;
      case 'bulk_purchase':
        headers.push('Required Qty', 'Free Qty', 'Min Purchase Amount');
        sampleData.push(10, 2, 50);
        break;
      case 'assorted_items':
        headers.push('Required Item Count', 'Total Price');
        sampleData.push(5, 99.99);
        break;
      default:
        headers.push('Value');
        sampleData.push(15.99);
    }

    // If we have selected promotions, export their data
    const data = selectedPromotions.length > 0 ? 
      await Promise.all(selectedPromotions.map(async (promotion) => {
        // Get Product Name and Unit Name from ProductUnit ID
        let productName = '';
        let unitName = '';

        console.log('Exporting promotion:', promotion);

        // For export, we need to get the proper product name and unit name from ProductUnit ID
        if (promotion.productUnit) {
          let productUnitId = typeof promotion.productUnit === 'string' 
            ? promotion.productUnit 
            : promotion.productUnit._id;
          
          console.log(`Processing ProductUnit for export: ${productUnitId}`);
          
          try {
            // Use the display functions that are already working in the UI
            const productDisplay = getProductDisplay(promotion);
            const unitDisplay = getUnitDisplay(promotion);
            
            // Get product name from display function
            if (productDisplay && productDisplay !== 'No Product Selected' && productDisplay !== 'No Product Name') {
              productName = productDisplay;
              console.log(`Found product name from display: ${productName}`);
            } else {
              // Fallback: try to get product name directly if display function fails
              if (promotion.productUnit && typeof promotion.productUnit === 'object' && promotion.productUnit.product) {
                let rawName = promotion.productUnit.product.name || promotion.productUnit.product.title || '';
                if (typeof rawName === 'object' && rawName !== null) {
                  rawName = rawName.en || rawName.english || rawName.ar || rawName.arabic || 
                           Object.values(rawName).find(val => typeof val === 'string') || '';
                }
                productName = String(rawName || '').trim();
                console.log(`Found product name from direct access: ${productName}`);
              }
            }
            
            // Get unit name from display function
            if (unitDisplay && unitDisplay !== 'N/A' && unitDisplay !== 'No Unit') {
              unitName = unitDisplay;
              
              // Check if this looks like a base unit - leave empty for base units
              if (unitDisplay.includes('1 ') || unitDisplay === 'pcs' || unitDisplay === 'piece' || unitDisplay.toLowerCase().includes('base')) {
                unitName = ''; // Base unit should be empty in export
              }
            }
            
            console.log(`Promotion export - Product Name: ${productName}, Unit Name: ${unitName}`);
            
          } catch (error) {
            console.error('Error processing ProductUnit for export:', error);
            // Fallback: try to get some identifier
            productName = 'UNKNOWN_PRODUCT';
            unitName = '';
          }
        }

        let row = [
          listId,
          productName,
          unitName,
          promotion.minQty || 1,
          promotion.maxQty || '',
          promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
          promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : ''
        ];

        switch (promotionType) {
          case 'fixed_price':
            row.push(promotion.value || '');
            break;
          case 'bulk_purchase':
            row.push(promotion.requiredQty || '', promotion.freeQty || '', promotion.minPurchaseAmount || '');
            break;
          case 'assorted_items':
            row.push(promotion.requiredItemCount || '', promotion.value || '');
            break;
          default:
            row.push(promotion.value || '');
        }
        return row;
      })) : [sampleData];

    return { headers, data };
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
    const selectedData = Array.from(selectedPromotions).map(id => 
      promotions.find(p => p._id === id)
    ).filter(Boolean);

      const { headers, data } = await generateExcelTemplate(promotionList?.type, selectedData);

    const ws = utils.aoa_to_sheet([headers, ...data]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Promotions');

    const filename = `${renderSafeText(promotionList?.name, 'promotions')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(wb, filename);

    notifySuccess(`Exported ${selectedData.length || 1} promotion(s) to Excel`);
    } catch (error) {
      console.error('Export error:', error);
      notifyError('Failed to export promotions');
    } finally {
      setLoading(false);
    }
  };

  // Import from Excel - Preview first
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
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

      // Preview and validate the data
      await previewImportData(rows);
      
    } catch (error) {
      console.error('Import error:', error);
      notifyError('Failed to read Excel file');
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Preview import data before actual import
  const previewImportData = async (rows) => {
    const previewResults = {
      total: rows.length,
      valid: 0,
      invalid: 0,
      warnings: [],
      errors: [],
      data: []
    };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
      const rowNumber = i + 2;

        try {
          // Validate required fields
          if (!row[0] || row[0] !== listId) {
          previewResults.errors.push(`Row ${rowNumber}: Invalid or missing Promotion List ID`);
          previewResults.invalid++;
            continue;
          }

          if (!row[1]) {
          previewResults.errors.push(`Row ${rowNumber}: Product Name is required`);
          previewResults.invalid++;
            continue;
          }

        // Find product by name
        const inputProductName = String(row[1]).trim();
          let product = null;
          
        if (!inputProductName || inputProductName === 'Enter Product Name') {
          previewResults.errors.push(`Row ${rowNumber}: Invalid product name: ${inputProductName}`);
          previewResults.invalid++;
            continue;
          }
          
        // Check if input looks like an ID instead of a name (IDs are typically 24 character hex strings)
        if (inputProductName.match(/^[0-9a-fA-F]{24}$/)) {
          previewResults.errors.push(`Row ${rowNumber}: Product ID detected instead of product name: ${inputProductName}. Please use product name (e.g., "NADEC FRESH YOGHURT") instead of ID.`);
          previewResults.invalid++;
          continue;
        }
        
        console.log(`Row ${rowNumber}: Looking for product with name: ${inputProductName}`);
        
        try {
          // Search for product by name with multiple strategies
          console.log(`Row ${rowNumber}: Searching for product: "${inputProductName}"`);
          
          let searchResults = await ProductServices.searchProducts(inputProductName, 20);
          let products = searchResults?.products || searchResults || [];
          
          console.log(`Row ${rowNumber}: Initial search found ${products.length} products`);
          
          // If no results with full name, try with simplified search terms
          if (products.length === 0) {
            // Try searching with individual words
            const searchWords = inputProductName.split(' ').filter(word => word.length > 2);
            for (const word of searchWords) {
              console.log(`Row ${rowNumber}: Trying search with word: "${word}"`);
              const wordResults = await ProductServices.searchProducts(word, 20);
              const wordProducts = wordResults?.products || wordResults || [];
              if (wordProducts.length > 0) {
                products = wordProducts;
                break;
              }
            }
          }
          
          // If still no results, try getting all products and search locally
          if (products.length === 0) {
            console.log(`Row ${rowNumber}: No search results, trying to get all products for local search`);
            const allProductsResult = await ProductServices.getAllProducts({ limit: 1000 });
            const allProducts = allProductsResult?.products || allProductsResult || [];
            products = allProducts.filter(p => {
              const pName = (p.name || p.title || '').toLowerCase();
              const searchName = inputProductName.toLowerCase();
              return pName.includes(searchName) || searchName.includes(pName);
            });
            console.log(`Row ${rowNumber}: Local search found ${products.length} products`);
          }
          
          console.log(`Row ${rowNumber}: Total products for matching: ${products.length}`);
          
          // Helper function to safely extract product name
          const getProductName = (product) => {
            let name = product.name || product.title || '';
            
            // Handle multilingual names (objects like {en: "English", ar: "Arabic"})
            if (typeof name === 'object' && name !== null) {
              name = name.en || name.english || name.ar || name.arabic || 
                     Object.values(name).find(val => typeof val === 'string') || '';
            }
            
            // Ensure it's a string
            return String(name || '').trim();
          };
          
          // Strategy 1: Find exact name match (case insensitive)
          product = products.find(p => {
            const pName = getProductName(p).toLowerCase().trim();
            const searchName = inputProductName.toLowerCase().trim();
            return pName === searchName;
          });
          
          if (product) {
            console.log(`Row ${rowNumber}: Found exact match:`, getProductName(product));
          }
          
          // Strategy 2: Find match with trimmed spaces and normalized text
          if (!product) {
            product = products.find(p => {
              const pName = getProductName(p).toLowerCase().replace(/\s+/g, ' ').trim();
              const searchName = inputProductName.toLowerCase().replace(/\s+/g, ' ').trim();
              return pName === searchName;
            });
            
            if (product) {
              console.log(`Row ${rowNumber}: Found normalized match:`, getProductName(product));
            }
          }
          
          // Strategy 3: Find partial match (product name contains search term)
          if (!product) {
            product = products.find(p => {
              const pName = getProductName(p).toLowerCase();
              const searchName = inputProductName.toLowerCase();
              return pName.includes(searchName);
            });
            
            if (product) {
              console.log(`Row ${rowNumber}: Found partial match (contains):`, getProductName(product));
            }
          }
          
          // Strategy 4: Find reverse partial match (search term contains product name)
          if (!product) {
            product = products.find(p => {
              const pName = getProductName(p).toLowerCase();
              const searchName = inputProductName.toLowerCase();
              return searchName.includes(pName) && pName.length > 3; // Avoid matching very short names
            });
            
            if (product) {
              console.log(`Row ${rowNumber}: Found reverse partial match:`, getProductName(product));
            }
          }
          
          // Strategy 5: Find fuzzy match by comparing individual words
          if (!product) {
            const searchWords = inputProductName.toLowerCase().split(/\s+/);
            product = products.find(p => {
              const pName = getProductName(p).toLowerCase();
              const productWords = pName.split(/\s+/);
              
              // Check if most words match
              const matchingWords = searchWords.filter(searchWord => 
                productWords.some(productWord => 
                  productWord.includes(searchWord) || searchWord.includes(productWord)
                )
              );
              
              return matchingWords.length >= Math.min(2, searchWords.length * 0.6);
            });
            
            if (product) {
              console.log(`Row ${rowNumber}: Found fuzzy match:`, getProductName(product));
            }
          }
          
          // Strategy 6: Use first result if available (with warning)
          if (!product && products.length > 0) {
            product = products[0];
            previewResults.warnings.push(`Row ${rowNumber}: Using closest match "${getProductName(product)}" for "${inputProductName}"`);
            console.log(`Row ${rowNumber}: Using first available match:`, getProductName(product));
          }
          
          console.log(`Row ${rowNumber}: Final product result:`, product ? getProductName(product) : 'None');
          } catch (error) {
          console.error(`Row ${rowNumber}: Product search failed:`, error);
          }

          if (!product) {
          // Add helpful error message with suggestions
          let errorMessage = `Row ${rowNumber}: Product not found with name: "${inputProductName}"`;
          
          // If we have some products from search, show similar ones as suggestions
          if (products.length > 0) {
            const getProductName = (product) => {
              let name = product.name || product.title || '';
              if (typeof name === 'object' && name !== null) {
                name = name.en || name.english || name.ar || name.arabic || 
                       Object.values(name).find(val => typeof val === 'string') || '';
              }
              return String(name || '').trim();
            };
            
            const suggestions = products.slice(0, 3).map(p => getProductName(p)).join(', ');
            errorMessage += `. Similar products found: ${suggestions}`;
          } else {
            errorMessage += '. No similar products found. Please check the product name spelling.';
          }
          
          previewResults.errors.push(errorMessage);
          previewResults.invalid++;
            continue;
          }

        // Get Unit Name from the spreadsheet
        const unitName = row[2]?.trim() || '';
        
        // Find matching ProductUnit
          let productUnitId = null;
        let matchingProductUnit = null;
        
        console.log(`Row ${rowNumber}: Looking for unit: "${unitName}" for product: ${product._id}`);
        
        try {
          const productUnitsResponse = await ProductServices.getProductUnits(product._id);
          const existingProductUnits = productUnitsResponse?.data || productUnitsResponse || [];
            
          console.log(`Row ${rowNumber}: Found ${existingProductUnits.length} product units`);
          
          if (!unitName || unitName === '') {
            // Empty unit name means base unit - look for unit with lowest unit value and pack qty of 1
            console.log(`Row ${rowNumber}: Looking for base unit (empty unit name)`);
            
            // First try to find default unit
            matchingProductUnit = existingProductUnits.find(pu => 
              pu.isDefault === true
            );
            
            // If no default, find unit with unitValue = 1 and packQty = 1
            if (!matchingProductUnit) {
              matchingProductUnit = existingProductUnits.find(pu => 
                pu.unitValue === 1 && pu.packQty === 1
              );
            }
            
            // If still no match, find the unit with the smallest unit value
            if (!matchingProductUnit) {
              matchingProductUnit = existingProductUnits.reduce((smallest, current) => {
                if (!smallest) return current;
                const smallestValue = smallest.unitValue || 1;
                const currentValue = current.unitValue || 1;
                return currentValue < smallestValue ? current : smallest;
              }, null);
            }
            } else {
            // Find ProductUnit by unit name - try multiple matching strategies
            console.log(`Row ${rowNumber}: Looking for specific unit: "${unitName}"`);
            
            // Strategy 1: Exact unit name match
            matchingProductUnit = existingProductUnits.find(pu => {
              if (!pu.unit) return false;
              
              const puUnitName = typeof pu.unit === 'object' 
                ? (pu.unit.name || pu.unit.shortCode || pu.unit.title || '')
                : pu.unit;
              
              return puUnitName.toLowerCase() === unitName.toLowerCase();
            });
            
            // Strategy 2: Try unitType match
            if (!matchingProductUnit) {
              matchingProductUnit = existingProductUnits.find(pu => 
                pu.unitType && pu.unitType.toLowerCase() === unitName.toLowerCase()
              );
            }
            
            // Strategy 3: Try partial matching for common unit names
            if (!matchingProductUnit) {
              const unitNameLower = unitName.toLowerCase();
              matchingProductUnit = existingProductUnits.find(pu => {
                const puUnitName = typeof pu.unit === 'object' 
                  ? (pu.unit.name || pu.unit.shortCode || pu.unit.title || '')
                  : (pu.unit || pu.unitType || '');
                
                return puUnitName.toLowerCase().includes(unitNameLower) || 
                       unitNameLower.includes(puUnitName.toLowerCase());
              });
            }
          }
          
          if (matchingProductUnit && matchingProductUnit._id) {
            productUnitId = matchingProductUnit._id;
            console.log(`Row ${rowNumber}: Found matching unit: ${matchingProductUnit._id}`);
          } else {
            if (!unitName) {
              previewResults.errors.push(`Row ${rowNumber}: Base unit not found for Product: ${inputProductName}`);
            } else {
              previewResults.errors.push(`Row ${rowNumber}: Unit "${unitName}" not found for Product: ${inputProductName}. Available units: ${existingProductUnits.map(pu => {
                const unitDisplay = typeof pu.unit === 'object' 
                  ? (pu.unit.name || pu.unit.shortCode || pu.unit.title)
                  : (pu.unit || pu.unitType || 'Unknown');
                return unitDisplay;
              }).join(', ')}`);
            }
            previewResults.invalid++;
            continue;
          }

        } catch (error) {
          previewResults.errors.push(`Row ${rowNumber}: Failed to find product unit: ${error.message}`);
          previewResults.invalid++;
          continue;
        }

        // Build preview data
        const getProductName = (product) => {
          let name = product.name || product.title || '';
          if (typeof name === 'object' && name !== null) {
            name = name.en || name.english || name.ar || name.arabic || 
                   Object.values(name).find(val => typeof val === 'string') || '';
          }
          return String(name || '').trim();
        };
        
        const foundProductName = renderSafeText(getProductName(product), 'Unknown Product');
        const unitDisplayName = matchingProductUnit?.unit?.name || unitName || 'Base Unit';
        
        const previewItem = {
          rowNumber,
          inputProductName,
          productName: foundProductName,
          unitName: unitDisplayName,
            minQty: parseInt(row[3]) || 1,
          maxQty: row[4] || '',
          startDate: row[5] || '',
          endDate: row[6] || '',
          productUnitId,
          product,
          matchingProductUnit,
          status: 'valid'
          };

        // Add type-specific fields for preview
          const typeSpecificIndex = 7;
          switch (promotionList?.type) {
            case 'fixed_price':
            previewItem.value = parseFloat(row[typeSpecificIndex]) || 0;
              break;
            case 'bulk_purchase':
            previewItem.requiredQty = parseInt(row[typeSpecificIndex]) || 0;
            previewItem.freeQty = parseInt(row[typeSpecificIndex + 1]) || 0;
            previewItem.minPurchaseAmount = parseFloat(row[typeSpecificIndex + 2]) || 0;
              break;
            case 'assorted_items':
            previewItem.requiredItemCount = parseInt(row[typeSpecificIndex]) || 0;
            previewItem.totalPrice = parseFloat(row[typeSpecificIndex + 1]) || 0;
              break;
            default:
            previewItem.value = parseFloat(row[typeSpecificIndex]) || 0;
          }

        previewResults.data.push(previewItem);
        previewResults.valid++;

        } catch (error) {
        previewResults.errors.push(`Row ${rowNumber}: ${error.message}`);
        previewResults.invalid++;
        }
      }

    // Show preview modal
    setImportPreview(previewResults);
    setShowImportPreview(true);
  };

  // Confirm and execute import
  const confirmImport = async () => {
    if (!importPreview || importPreview.valid === 0) {
      notifyError('No valid promotions to import');
      return;
    }

    try {
      setIsProcessingImport(true);
      
      const validPromotions = importPreview.data.filter(item => item.status === 'valid');
      
      const importPromises = validPromotions.map(item => {
        const promotion = {
          name: `${item.productName} - ${renderSafeText(promotionList?.name, '')}`,
          description: `Imported promotion for ${item.productName}`,
          type: promotionList?.type || 'fixed_price',
          promotionList: listId,
          productUnit: item.productUnitId,
          minQty: item.minQty,
          maxQty: item.maxQty || null,
          startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
          endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
          isActive: true
        };

        // Add type-specific fields
        switch (promotionList?.type) {
          case 'fixed_price':
            promotion.value = item.value || 0;
            break;
          case 'bulk_purchase':
            promotion.requiredQty = item.requiredQty || 0;
            promotion.freeQty = item.freeQty || 0;
            promotion.minPurchaseAmount = item.minPurchaseAmount || 0;
            break;
          case 'assorted_items':
            promotion.requiredItemCount = item.requiredItemCount || 0;
            promotion.value = item.totalPrice || 0;
            break;
          default:
            promotion.value = item.value || 0;
        }

        return PromotionServices.addPromotion(promotion);
      });
        
        await Promise.all(importPromises);
        
        // Refresh promotions
        const promotionsResponse = await PromotionServices.getAllPromotions({ 
          promotionList: listId,
          limit: 1000 
        });
        
        const promotionData = promotionsResponse?.promotions || promotionsResponse || [];
        setPromotions(promotionData);
        
      notifySuccess(`Successfully imported ${validPromotions.length} promotion(s)`);
      setShowImportPreview(false);
      setImportPreview(null);

    } catch (error) {
      console.error('Import error:', error);
      notifyError('Failed to import promotions');
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Cancel import
  const cancelImport = () => {
    setShowImportPreview(false);
    setImportPreview(null);
  };

  // Helper functions
  const getProductDisplay = (promotion) => {
    if (promotion.productUnit && promotion.productUnit.product) {
      return renderSafeText(promotion.productUnit.product.name || promotion.productUnit.product.title, 'No Product Name');
    }
    return 'No Product Selected';
  };

  const getUnitDisplay = (promotion) => {
    if (promotion.productUnit) {
      // Try to get unit name from different possible locations
      if (promotion.productUnit.unit && typeof promotion.productUnit.unit === 'object') {
        return renderSafeText(promotion.productUnit.unit.name || promotion.productUnit.unit.title, 'No Unit');
      } else if (promotion.productUnit.unit && typeof promotion.productUnit.unit === 'string') {
        return promotion.productUnit.unit;
      } else if (promotion.productUnit.unitType) {
        return renderSafeText(promotion.productUnit.unitType, 'No Unit');
      }
    }
    return 'N/A';
  };

  const getPromotionValueDisplay = (promotion) => {
    if (promotion.type === 'bulk_purchase') {
      return `Buy ${promotion.requiredQty || 0} get ${promotion.freeQty || 0} free`;
    } else if (promotion.type === 'assorted_items') {
      return `$${promotion.value} for ${promotion.requiredItemCount || 0} items`;
    }
    return `$${promotion.value}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => history.push('/promotions')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Promotions
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {renderSafeText(promotionList?.name, 'Promotion List')} Management
                </h1>
                <p className="text-gray-600">
                  Type: {renderSafeText(promotionList?.type, 'N/A')} • {filteredPromotions.length} promotion(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <FiUpload className="w-4 h-4" />
                Import Excel
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { headers, data } = await generateExcelTemplate(promotionList?.type, []);
                    
                    // Create the main template sheet
                  const ws = utils.aoa_to_sheet([headers, ...data]);
                  const wb = utils.book_new();
                  utils.book_append_sheet(wb, ws, 'Template');
                    
                  const filename = `${renderSafeText(promotionList?.name, 'promotions')}_template.xlsx`;
                  writeFile(wb, filename);
                  notifySuccess('Template downloaded successfully');
                  } catch (error) {
                    console.error('Error creating template:', error);
                    notifyError('Failed to create template');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <FiDownload className="w-4 h-4" />
                Download Template
              </button>
              <button
                onClick={handleExportExcel}
                disabled={selectedPromotions.size === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <FiDownload className="w-4 h-4" />
                Export Selected ({selectedPromotions.size})
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiEye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{promotions.filter(p => p.isActive).length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{promotions.filter(p => !p.isActive).length}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiX className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Selected</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedPromotions.size}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search promotions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Dates</option>
                  <option value="active">Currently Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Bulk Actions */}
                {selectedPromotions.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete Selected ({selectedPromotions.size})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Table/Grid */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedPromotions.size === filteredPromotions.length && filteredPromotions.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPromotions.map((promotion) => (
                    <tr key={promotion._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPromotions.has(promotion._id)}
                          onChange={() => handleSelectPromotion(promotion._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {renderSafeText(promotion.name, 'No Name')}
                          </div>
                          {promotion.description && (
                            <div className="text-sm text-gray-500">
                              {renderSafeText(promotion.description, '')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {promotion.productUnit && promotion.productUnit.product ? (
                          <button
                            onClick={() => history.push(`/product/${promotion.productUnit.product._id}`)}
                            className="text-blue-600 hover:text-blue-900 hover:underline text-left"
                          >
                        {getProductDisplay(promotion)}
                          </button>
                        ) : (
                          <span className="text-gray-500">{getProductDisplay(promotion)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getPromotionValueDisplay(promotion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {promotion.minQty || 1} - {promotion.maxQty || 'Unlimited'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{formatDate(promotion.startDate)}</div>
                          <div className="text-gray-500">to {formatDate(promotion.endDate)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(promotion.isActive)}`}>
                          {promotion.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this promotion?')) {
                                setSelectedPromotions(new Set([promotion._id]));
                                handleBulkDelete();
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete promotion"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredPromotions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiEye className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No promotions found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromotions.map((promotion) => (
              <div key={promotion._id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <input
                    type="checkbox"
                    checked={selectedPromotions.has(promotion._id)}
                    onChange={() => handleSelectPromotion(promotion._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion.isActive)}`}>
                    {promotion.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {renderSafeText(promotion.name, 'No Name')}
                </h3>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product:</span>
                    {promotion.productUnit && promotion.productUnit.product ? (
                      <button
                        onClick={() => history.push(`/product/${promotion.productUnit.product._id}`)}
                        className="text-blue-600 hover:text-blue-900 hover:underline text-right truncate max-w-32"
                      >
                        {getProductDisplay(promotion)}
                      </button>
                    ) : (
                      <span className="text-gray-500 truncate max-w-32">{getProductDisplay(promotion)}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Value:</span>
                    <span className="text-gray-900 font-medium">{getPromotionValueDisplay(promotion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Qty Range:</span>
                    <span className="text-gray-900">{promotion.minQty || 1} - {promotion.maxQty || 'Unlimited'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Period:</span>
                    <span className="text-gray-900 text-xs">
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this promotion?')) {
                        // Handle single delete
                        setSelectedPromotions(new Set([promotion._id]));
                        handleBulkDelete();
                      }
                    }}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                    title="Delete promotion"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredPromotions.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiEye className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No promotions found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />

        {/* Import Preview Modal */}
        {showImportPreview && importPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Review the data before importing. Check for any errors or warnings below.
                </p>
                
                {/* Summary Statistics */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-green-800 text-sm font-medium">Valid</div>
                    <div className="text-green-900 text-2xl font-bold">{importPreview.valid}</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-800 text-sm font-medium">Invalid</div>
                    <div className="text-red-900 text-2xl font-bold">{importPreview.invalid}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-gray-800 text-sm font-medium">Total</div>
                    <div className="text-gray-900 text-2xl font-bold">{importPreview.total}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-auto max-h-96">
                {/* Errors Section */}
                {importPreview.errors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Errors ({importPreview.errors.length})</h4>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-auto">
                      {importPreview.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">{error}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Preview Data Table */}
                {importPreview.data.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Valid Promotions Preview</h4>
                    <div className="border border-gray-200 rounded-md overflow-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty Range</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importPreview.data.slice(0, 10).map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">{item.rowNumber}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{item.productName}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{item.unitName}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {item.minQty} - {item.maxQty || 'Unlimited'}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {promotionList?.type === 'fixed_price' && `$${item.value || 0}`}
                                {promotionList?.type === 'bulk_purchase' && 
                                  `Buy ${item.requiredQty || 0} get ${item.freeQty || 0} free`
                                }
                                {promotionList?.type === 'assorted_items' && 
                                  `${item.requiredItemCount || 0} items for $${item.totalPrice || 0}`
                                }
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {item.startDate} to {item.endDate}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importPreview.data.length > 10 && (
                        <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
                          Showing first 10 of {importPreview.data.length} valid promotions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={cancelImport}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  disabled={importPreview.valid === 0 || isProcessingImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessingImport && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isProcessingImport ? 'Importing...' : `Import ${importPreview.valid} Promotion(s)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Main>
  );
};

export default PromotionManagement; 