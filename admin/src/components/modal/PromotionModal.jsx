import React, { useState, useEffect } from 'react';
import { 
  FiX, FiSearch, FiCheck, FiPackage, FiDollarSign, FiCalendar, 
  FiList, FiPlus, FiChevronDown, FiImage, FiTag, FiLayers 
} from 'react-icons/fi';
import PromotionServices from '@/services/PromotionServices';
import PromotionListServices from '@/services/PromotionListServices';
import ProductServices from '@/services/ProductServices';
import CategoryServices from '@/services/CategoryServices';
import { notifyError, notifySuccess } from '@/utils/toast';
import toast from 'react-hot-toast';

const PromotionModal = ({ isOpen, onClose, promotionId = null }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [promotionLists, setPromotionLists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [errors, setErrors] = useState({});
  const [selectionMode, setSelectionMode] = useState('products'); // 'products', 'categories', 'all'
  
  // Enhanced product state with units
  const [productUnits, setProductUnits] = useState({});
  const [selectedProductUnits, setSelectedProductUnits] = useState({});

  const [formData, setFormData] = useState({
    type: 'fixed_price',
    promotionList: '',
    value: '',
    minQty: 1,
    maxQty: '',
    requiredQty: '',
    freeQty: '',
    requiredItemCount: '',
    minPurchaseAmount: '', // New field for bulk promotions
    startDate: '',
    endDate: '',
    isActive: true
  });

  const renderSafeText = (text, fallback = '') => {
    if (!text) return fallback;
    if (typeof text === 'string') return text;
    if (typeof text === 'object') {
      return text.en || text.ar || text[0] || Object.values(text)[0] || fallback;
    }
    return String(text) || fallback;
  };

  useEffect(() => {
    if (isOpen) {
      console.log('PromotionModal opened, loading data...');
      console.log('promotionId:', promotionId);
      loadPromotionLists();
      loadProducts();
      loadCategories();
      if (promotionId) {
        loadPromotion(promotionId);
      } else {
        // Reset form for new promotion
        resetForm();
      }
    }
  }, [isOpen, promotionId]);

  const loadPromotionLists = async () => {
    try {
      console.log('Loading promotion lists...');
      const response = await PromotionListServices.getAllPromotionLists({ page: 1, limit: 100 });
      console.log('Promotion lists response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      if (response?.promotionLists) {
        console.log('Found promotionLists array:', response.promotionLists.length, 'items');
        setPromotionLists(response.promotionLists);
      } else if (Array.isArray(response)) {
        console.log('Response is array:', response.length, 'items');
        setPromotionLists(response);
      } else {
        console.error('Unexpected promotion lists response structure:', response);
        setPromotionLists([]);
      }
    } catch (error) {
      console.error('Error loading promotion lists:', error);
      setPromotionLists([]);
    }
  };

  const loadProducts = async () => {
    try {
      // Fetch all products (increase limit)
      const response = await ProductServices.getProductsForPromotions(1, 10000, '');
      console.log('Products API response:', response);
      
      // Handle different response structures
      let productsList = [];
      if (response?.products) {
        // Direct products array in response
        productsList = response.products;
      } else if (response?.data?.products) {
        // Products nested in data object
        productsList = response.data.products;
      } else if (Array.isArray(response)) {
        // Response is directly an array
        productsList = response;
      } else if (Array.isArray(response?.data)) {
        // Data is directly an array
        productsList = response.data;
      }
      
      console.log('Extracted products list:', productsList);
      
      if (productsList && productsList.length > 0) {
        setProducts(productsList);
        // Load units for each product
        await loadProductUnits(productsList);
      } else {
        console.warn('No products found in response');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      notifyError('Failed to load products');
      setProducts([]);
    }
  };

  const loadCategories = async () => {
    try {
      // Use getAllCategories to get all categories including subcategories
      const response = await CategoryServices.getAllCategories();
      console.log('Categories API response:', response);
      
      // Handle different response structures and flatten all categories including subcategories
      let categoriesList = [];
      if (Array.isArray(response)) {
        categoriesList = response;
      } else if (response?.categories && Array.isArray(response.categories)) {
        categoriesList = response.categories;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
      }
      
      // Flatten categories to include all parent and child categories
      const flattenCategories = (cats) => {
        let flattened = [];
        cats.forEach(cat => {
          flattened.push(cat);
          if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
            flattened = flattened.concat(flattenCategories(cat.children));
          }
        });
        return flattened;
      };
      
      const allCategories = flattenCategories(categoriesList);
      console.log('Flattened categories:', allCategories);
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to regular getAllCategory if getAllCategories fails
      try {
        const fallbackResponse = await CategoryServices.getAllCategory();
        let categoriesList = [];
        if (Array.isArray(fallbackResponse)) {
          categoriesList = fallbackResponse;
        } else if (fallbackResponse?.data && Array.isArray(fallbackResponse.data)) {
          categoriesList = fallbackResponse.data;
        }
        setCategories(categoriesList);
      } catch (fallbackError) {
        console.error('Error loading categories (fallback):', fallbackError);
        notifyError('Failed to load categories');
        setCategories([]);
      }
    }
  };

  const loadProductUnits = async (productsList, skipInitialSelection = false) => {
    console.log('Loading units for products:', productsList.length, 'skipInitialSelection:', skipInitialSelection);
    const unitsData = {};
    
    const productUnitsPromises = productsList.map(async (product) => {
      try {
        const response = await ProductServices.getProductUnits(product._id);
        console.log(`Units response for product ${product._id}:`, response);
        
        if (response?.data && Array.isArray(response.data)) {
          unitsData[product._id] = response.data;
        } else if (Array.isArray(response)) {
          unitsData[product._id] = response;
        } else {
          // Create default unit if no units found
          console.log(`No units found for product ${product._id}, creating default`);
          unitsData[product._id] = [{
            _id: `default_${product._id}`,
            unit: { name: 'pcs', _id: 'default_pcs' },
            price: product.price || 0,
            packQty: 1,
            isDefault: true
          }];
        }
      } catch (error) {
        console.warn(`Failed to load units for product ${product._id}:`, error);
        // Create default unit if units are not available
        unitsData[product._id] = [{
          _id: `default_${product._id}`,
          unit: { name: 'pcs', _id: 'default_pcs' },
          price: product.price || 0,
          packQty: 1,
          isDefault: true
        }];
      }
    });

    await Promise.all(productUnitsPromises);
    console.log('All product units loaded:', unitsData);
    setProductUnits(unitsData);

    // Only initialize selected units with defaults if not skipping (i.e., for new selections)
    if (!skipInitialSelection) {
      const initialSelectedUnits = {};
      productsList.forEach(product => {
        const units = unitsData[product._id] || [];
        const defaultUnit = units.find(u => u.isDefault) || units[0];
        if (defaultUnit) {
          initialSelectedUnits[product._id] = defaultUnit._id;
        }
      });
      console.log('Initial selected units:', initialSelectedUnits);
      setSelectedProductUnits(initialSelectedUnits);
    }
  };

  const loadPromotion = async (id) => {
    try {
      console.log('Loading promotion with ID:', id);
      const response = await PromotionServices.getPromotion(id);
      console.log('Loaded promotion data:', response);
      
      if (response) {
        // Store the original promotion data for the information panel
        sessionStorage.setItem('currentPromotionData', JSON.stringify(response));

        // Set form data based on loaded promotion
        setFormData({
          name: response.name || '',
          description: response.description || '',
          type: response.type || 'fixed_price',
          value: response.value || 0,
          minQty: response.minQty || 1,
          maxQty: response.maxQty || null,
          requiredQty: response.requiredQty || null,
          freeQty: response.freeQty || null,
          requiredItemCount: response.requiredItemCount || null,
          minPurchaseAmount: response.minPurchaseAmount || null,
          startDate: response.startDate ? new Date(response.startDate).toISOString().split('T')[0] : '',
          endDate: response.endDate ? new Date(response.endDate).toISOString().split('T')[0] : '',
          isActive: response.isActive !== undefined ? response.isActive : true,
          promotionList: response.promotionList?._id || null,
          selectionMode: response.selectionMode || 'products',
          categories: response.categories?.map(cat => cat._id) || []
        });

        // Set selection mode
        const mode = response.selectionMode || 'products';
        setSelectionMode(mode);

        // Handle different promotion types
        if (response.type === 'fixed_price' || (response.type === 'bulk_purchase' && response.productUnit)) {
          const productUnit = response.productUnit;
          if (productUnit && productUnit.product) {
            // Extract product from productUnit
            const product = productUnit.product;
            setSelectedProducts([product]);
            
            // Load units for this product first (skip initial selection to preserve our specific unit)
            await loadProductUnits([product], true);
            
            // Then set the specific unit after loading
            setSelectedProductUnits({
              [product._id]: productUnit._id
            });
            
            console.log('Set selected product unit:', product._id, '->', productUnit._id);
          }
        } else if (response.type === 'assorted_items' && response.productUnits) {
          // Extract products from productUnits
          const productsFromUnits = response.productUnits.map(pu => pu.product).filter(Boolean);
          setSelectedProducts(productsFromUnits);
          
          // Load units for all products first (skip initial selection to preserve our specific units)
          await loadProductUnits(productsFromUnits, true);
          
          // Then set the specific units for each product
          const unitMapping = {};
          response.productUnits.forEach(productUnit => {
            if (productUnit.product) {
              unitMapping[productUnit.product._id] = productUnit._id;
            }
          });
          setSelectedProductUnits(unitMapping);
          
          console.log('Set selected product units for assorted items:', unitMapping);
        } else if (response.type === 'bulk_purchase' && response.selectionMode === 'categories') {
          setSelectedCategories(response.categories || []);
        } else if (response.type === 'bulk_purchase' && response.selectionMode === 'all') {
          // No specific products or categories for "all" mode
          setSelectedProducts([]);
          setSelectedCategories([]);
        }
      }
    } catch (error) {
      console.error('Error loading promotion:', error);
      notifyError('Failed to load promotion data');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleProductToggle = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p._id === product._id);
      
      if (formData.type !== 'assorted_items') {
        // For non-assorted promotions, only allow single selection
        return isSelected ? [] : [product];
      } else {
        // For assorted promotions, allow multiple selection
        return isSelected 
          ? prev.filter(p => p._id !== product._id)
          : [...prev, product];
      }
    });
  };

  const handleUnitChange = (productId, unitId) => {
    setSelectedProductUnits(prev => ({
      ...prev,
      [productId]: unitId
    }));
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c._id === category._id);
      return isSelected 
        ? prev.filter(c => c._id !== category._id)
        : [...prev, category];
    });
  };

  const handleSelectionModeChange = (mode) => {
    setSelectionMode(mode);
    if (mode === 'all') {
      setSelectedProducts([]);
      setSelectedCategories([]);
    }
  };

  const createNewList = async () => {
    if (!newListName.trim()) {
      notifyError('Please enter a list name');
      return;
    }

    try {
      setIsLoading(true);
      const response = await PromotionListServices.addPromotionList({
        name: newListName.trim(),
        type: formData.type
      });
      
      if (response?.promotionList) {
        setPromotionLists(prev => [...prev, response.promotionList]);
        setFormData(prev => ({ ...prev, promotionList: response.promotionList._id }));
        setNewListName('');
        setShowNewListForm(false);
        notifySuccess('Promotion list created successfully!');
      } else if (response) {
        // Handle case where response is the promotion list directly
        setPromotionLists(prev => [...prev, response]);
        setFormData(prev => ({ ...prev, promotionList: response._id }));
        setNewListName('');
        setShowNewListForm(false);
        notifySuccess('Promotion list created successfully!');
      }
    } catch (error) {
      console.error('Error creating promotion list:', error);
      notifyError('Failed to create promotion list');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.type) {
      newErrors.type = 'Promotion type is required';
    }

    // Value validation - required for all types but has different meanings
    if (formData.type === 'bulk_purchase') {
      // For bulk purchase, value can be 0 (representing no additional discount beyond the free items)
      if (!formData.value && formData.value !== 0) {
        newErrors.value = 'Promotion value is required (enter 0 if no additional discount is applied)';
      }
    } else {
      // For other types, value must be greater than 0
      if (!formData.value || formData.value <= 0) {
        newErrors.value = 'Promotion value is required and must be greater than 0';
      }
    }

    // Promotion List validation - REQUIRED for all promotions
    if (!formData.promotionList) {
      newErrors.promotionList = 'Promotion list is required - Please select a promotion list';
    }

    // Type-specific validation
    if (formData.type === 'fixed_price') {
      if (!selectedProducts || selectedProducts.length === 0 || Object.keys(selectedProductUnits).length === 0) {
        newErrors.products = 'At least one product must be selected for fixed price promotions';
      }
    } else if (formData.type === 'bulk_purchase') {
      if (selectionMode === 'products' && (!selectedProducts || selectedProducts.length === 0 || Object.keys(selectedProductUnits).length === 0)) {
        newErrors.products = 'At least one product must be selected for product-specific bulk purchase';
      }
      if (selectionMode === 'categories' && (!selectedCategories || selectedCategories.length === 0)) {
        newErrors.categories = 'At least one category must be selected for category-based bulk purchase';
      }
      
      // For bulk purchases, either requiredQty OR minPurchaseAmount should be provided
      const hasRequiredQty = formData.requiredQty && parseFloat(formData.requiredQty) > 0;
      const hasMinPurchaseAmount = formData.minPurchaseAmount && parseFloat(formData.minPurchaseAmount) > 0;
      
      console.log('Bulk validation check:');
      console.log('- requiredQty:', formData.requiredQty, '-> hasRequiredQty:', hasRequiredQty);
      console.log('- minPurchaseAmount:', formData.minPurchaseAmount, '-> hasMinPurchaseAmount:', hasMinPurchaseAmount);
      
      if (!hasRequiredQty && !hasMinPurchaseAmount) {
        newErrors.requiredQty = 'Either required quantity OR minimum purchase amount must be provided';
        newErrors.minPurchaseAmount = 'Either required quantity OR minimum purchase amount must be provided';
      }
      
      if (!formData.freeQty || formData.freeQty <= 0) {
        newErrors.freeQty = 'Free quantity/value must be greater than 0';
      }
    } else if (formData.type === 'assorted_items') {
      if (!selectedProducts || selectedProducts.length < 2 || Object.keys(selectedProductUnits).length < 2) {
        newErrors.products = 'At least 2 products must be selected for assorted items promotion';
      }
      if (!formData.requiredItemCount || formData.requiredItemCount <= 1) {
        newErrors.requiredItemCount = 'Required item count must be at least 2';
      }
    }

    // Quantity validation
    if (formData.minQty && formData.maxQty && parseInt(formData.minQty) > parseInt(formData.maxQty)) {
      newErrors.maxQty = 'Maximum quantity must be greater than minimum quantity';
    }

    // Date validation
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    
    // Debug logging for bulk purchase validation
    if (formData.type === 'bulk_purchase' && Object.keys(newErrors).length > 0) {
      console.log('Bulk purchase validation errors:', newErrors);
      console.log('Form data:', formData);
      console.log('Selection mode:', selectionMode);
      console.log('Selected products:', selectedProducts);
      console.log('Selected categories:', selectedCategories);
      console.log('Selected product units:', selectedProductUnits);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // For step navigation, only validate current step requirements
    let isValid = false;
    
    if (step === 1) {
      // Step 1: Basic info - just need promotion type
      isValid = formData.type;
    } else if (step === 2) {
      // Step 2: Product selection validation
      if (formData.type === 'bulk_purchase') {
        if (selectionMode === 'all') {
          isValid = true; // All products mode doesn't need selection
        } else if (selectionMode === 'categories') {
          isValid = selectedCategories.length > 0;
        } else {
          isValid = selectedProducts.length > 0 && Object.keys(selectedProductUnits).length > 0;
        }
      } else if (formData.type === 'fixed_price') {
        isValid = selectedProducts.length > 0 && Object.keys(selectedProductUnits).length > 0;
      } else if (formData.type === 'assorted_items') {
        isValid = selectedProducts.length >= 2 && Object.keys(selectedProductUnits).length >= 2;
      }
    } else {
      // Step 3: Final validation
      isValid = validateForm();
    }
    
    if (isValid) {
      setStep(prev => prev + 1);
    } else {
      // Show validation errors for current step
      console.log('Validation failed for step', step);
      console.log('Selected products:', selectedProducts.length);
      console.log('Selected product units:', Object.keys(selectedProductUnits).length);
      console.log('Selection mode:', selectionMode);
      console.log('Selected categories:', selectedCategories.length);
      
      if (step === 2) {
        // Show specific error for product selection step
        if (formData.type === 'fixed_price' && selectedProducts.length === 0) {
          setErrors({ products: 'Please select a product for fixed price promotion' });
        } else if (formData.type === 'assorted_items' && selectedProducts.length < 2) {
          setErrors({ products: 'Please select at least 2 products for assorted items promotion' });
        } else if (formData.type === 'bulk_purchase' && selectionMode === 'categories' && selectedCategories.length === 0) {
          setErrors({ categories: 'Please select at least one category for bulk purchase promotion' });
        } else if (formData.type === 'bulk_purchase' && selectionMode === 'products' && selectedProducts.length === 0) {
          setErrors({ products: 'Please select at least one product for bulk purchase promotion' });
        }
      } else if (step === 3) {
        // Full validation for final step
        validateForm();
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      // Build the promotion data based on type and selection mode
      const promotionData = {
        type: formData.type,
        promotionList: formData.promotionList || null,
        value: parseFloat(formData.value),
        minQty: parseInt(formData.minQty),
        maxQty: formData.maxQty ? parseInt(formData.maxQty) : null,
        requiredQty: formData.requiredQty ? parseInt(formData.requiredQty) : null,
        freeQty: formData.freeQty ? parseFloat(formData.freeQty) : null,
        requiredItemCount: formData.requiredItemCount ? parseInt(formData.requiredItemCount) : null,
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        selectionMode: selectionMode
      };

      // Handle different promotion types and selection modes
      if (formData.type === 'fixed_price') {
        if (selectedProducts.length > 0) {
          const selectedProduct = selectedProducts[0];
          const unitId = selectedProductUnits[selectedProduct._id];
          promotionData.productUnit = unitId;
        }
      } else if (formData.type === 'bulk_purchase') {
        if (selectionMode === 'all') {
          // All products mode - no specific products needed
          promotionData.productUnit = null;
          promotionData.productUnits = [];
          promotionData.categories = [];
        } else if (selectionMode === 'categories') {
          promotionData.categories = selectedCategories.map(cat => cat._id);
          promotionData.productUnit = null;
          promotionData.productUnits = [];
        } else {
          // Products mode
          if (selectedProducts.length === 1) {
            const selectedProduct = selectedProducts[0];
            const unitId = selectedProductUnits[selectedProduct._id];
            promotionData.productUnit = unitId;
            promotionData.productUnits = [];
          } else if (selectedProducts.length > 1) {
            promotionData.productUnits = selectedProducts.map(product => 
              selectedProductUnits[product._id]
            ).filter(Boolean);
            promotionData.productUnit = null;
          }
          promotionData.categories = [];
        }
      } else if (formData.type === 'assorted_items') {
        promotionData.productUnits = selectedProducts.map(product => 
          selectedProductUnits[product._id]
        ).filter(Boolean);
        promotionData.productUnit = null;
        promotionData.categories = [];
      }

      console.log('Sending promotion data:', promotionData);

      let response;
      if (promotionId) {
        // Update existing promotion
        response = await PromotionServices.updatePromotion(promotionId, promotionData);
        notifySuccess('Promotion updated successfully!');
      } else {
        // Create new promotion
        response = await PromotionServices.addPromotion(promotionData);
        notifySuccess('Promotion created successfully!');
      }

      handleClose();
    } catch (error) {
      console.error('Error saving promotion:', error);
      notifyError(error.message || 'Failed to save promotion');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchText.trim()) return true;
    const productTitle = renderSafeText(product.title, '');
    const productSku = renderSafeText(product.sku, '');
    const productBarcode = product.barcode || '';
    const searchLower = searchText.toLowerCase();
    
    return productTitle.toLowerCase().includes(searchLower) ||
           productSku.toLowerCase().includes(searchLower) ||
           productBarcode.toLowerCase().includes(searchLower);
  });

  const resetForm = () => {
    setFormData({
      type: 'fixed_price',
      promotionList: '',
      value: '',
      minQty: 1,
      maxQty: '',
      requiredQty: '',
      freeQty: '',
      requiredItemCount: '',
      minPurchaseAmount: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setSelectedProducts([]);
    setSelectedCategories([]);
    setSelectedProductUnits({});
    setSelectionMode('products');
    setStep(1);
    setErrors({});
    setSearchText('');
  };

  const handleClose = () => {
    resetForm();
    // Clear stored promotion data
    sessionStorage.removeItem('currentPromotionData');
    onClose();
  };

  const getProductImage = (product) => {
    if (product.image && product.image.length > 0) {
      // Handle different image formats
      const imageUrl = product.image[0];
      if (typeof imageUrl === 'string') {
        return imageUrl;
      } else if (typeof imageUrl === 'object' && imageUrl.url) {
        return imageUrl.url;
      }
    }
    return null;
  };

  const getUnitDisplayPrice = (product, unitId) => {
    const units = productUnits[product._id] || [];
    const unit = units.find(u => u._id === unitId);
    return unit ? unit.price : product.price || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        {/* Modal */}
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {promotionId ? 'Edit Promotion' : 'Create New Promotion'}
                </h3>
                <p className="text-blue-100 mt-1">
                  Step {step} of 3 - {step === 1 ? 'Basic Information' : step === 2 ? 'Product Selection' : 'Details & Settings'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-6 w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {step === 1 && (
              <div className="space-y-8">
                {/* Promotion Information Panel for Edit Mode */}
                {promotionId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <FiPackage className="w-5 h-5 mr-2" />
                      Current Promotion Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-blue-700">Type</label>
                          <p className="text-blue-900 capitalize font-semibold">{formData.type?.replace('_', ' ')}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-blue-700">Value</label>
                          <p className="text-blue-900 font-semibold text-lg">${formData.value}</p>
                        </div>

                        {/* Quantity Information - Common for all types */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-blue-700">Min Quantity</label>
                            <p className="text-blue-900 font-semibold">{formData.minQty || 1}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-blue-700">Max Quantity</label>
                            <p className="text-blue-900 font-semibold">{formData.maxQty || 'Unlimited'}</p>
                          </div>
                        </div>

                        {/* Bulk Purchase Specific Fields */}
                        {formData.type === 'bulk_purchase' && (
                          <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <h6 className="text-sm font-semibold text-orange-800 uppercase tracking-wide">Bulk Purchase Details</h6>
                            
                            <div className="grid grid-cols-2 gap-3">
                              {formData.requiredQty && (
                                <div>
                                  <label className="text-xs font-medium text-orange-700">Required Qty</label>
                                  <p className="text-orange-900 font-semibold">{formData.requiredQty}</p>
                                </div>
                              )}
                              {formData.freeQty && (
                                <div>
                                  <label className="text-xs font-medium text-orange-700">Free Qty/Value</label>
                                  <p className="text-orange-900 font-semibold">${formData.freeQty}</p>
                                </div>
                              )}
                            </div>
                            
                            {formData.minPurchaseAmount && (
                              <div>
                                <label className="text-xs font-medium text-orange-700">Minimum Purchase Amount</label>
                                <p className="text-orange-900 font-semibold">${formData.minPurchaseAmount}</p>
                              </div>
                            )}
                            
                            <div>
                              <label className="text-xs font-medium text-orange-700">Selection Mode</label>
                              <p className="text-orange-900 font-semibold capitalize">{selectionMode}</p>
                            </div>
                          </div>
                        )}

                        {/* Assorted Items Specific Fields */}
                        {formData.type === 'assorted_items' && (
                          <div className="space-y-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <h6 className="text-sm font-semibold text-purple-800 uppercase tracking-wide">Assorted Items Details</h6>
                            
                            <div className="grid grid-cols-2 gap-3">
                              {formData.requiredItemCount && (
                                <div>
                                  <label className="text-xs font-medium text-purple-700">Required Items</label>
                                  <p className="text-purple-900 font-semibold">{formData.requiredItemCount}</p>
                                </div>
                              )}
                              {formData.maxItemCount && (
                                <div>
                                  <label className="text-xs font-medium text-purple-700">Max Items</label>
                                  <p className="text-purple-900 font-semibold">{formData.maxItemCount}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-sm font-medium text-blue-700">Status</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            formData.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formData.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-blue-700">Duration</label>
                          <p className="text-blue-900 text-sm">
                            <span className="font-medium">From:</span> {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'No start date'}
                            <br />
                            <span className="font-medium">To:</span> {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'No end date'}
                          </p>
                        </div>

                        {/* Promotion List Information */}
                        {formData.promotionList && (
                          <div>
                            <label className="text-sm font-medium text-blue-700">Promotion List</label>
                            <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm">
                              <div className="flex items-center gap-2">
                                <span>📋</span>
                                <div>
                                  <p className="font-medium">{promotionLists.find(list => list._id === formData.promotionList)?.name || 'Unknown List'}</p>
                                  <p className="text-xs text-gray-600">{promotionLists.find(list => list._id === formData.promotionList)?.description || ''}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {/* Show selection details based on promotion type and selection mode */}
                        {formData.type === 'bulk_purchase' && selectionMode === 'all' && (
                          <div>
                            <label className="text-sm font-medium text-blue-700">Applies To</label>
                            <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-lg font-medium">
                              🌐 All Products
                            </div>
                          </div>
                        )}
                        
                        {selectedCategories.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-blue-700">Selected Categories</label>
                            <div className="space-y-2">
                              {selectedCategories.map((category) => (
                                <div key={category._id} className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium">
                                  📁 {renderSafeText(category.name, 'Unknown Category')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedProducts.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-blue-700">
                              {formData.type === 'assorted_items' ? 'Assorted Products' : 'Selected Products'}
                              {formData.type === 'assorted_items' && (
                                <span className="text-xs text-blue-600 ml-1">({selectedProducts.length} products)</span>
                              )}
                            </label>
                            <div className="space-y-3 max-h-40 overflow-y-auto">
                              {selectedProducts.map((product) => {
                                // Get the actual ProductUnit data from the original promotion response
                                let productUnitInfo = null;
                                
                                try {
                                  // Try to find the original ProductUnit info from the loaded promotion
                                  if (formData.type === 'fixed_price' || 
                                      (formData.type === 'bulk_purchase' && selectionMode === 'products')) {
                                    // For single product promotions, get from the loaded promotion data
                                    const originalData = JSON.parse(sessionStorage.getItem('currentPromotionData') || '{}');
                                    if (originalData.productUnit && originalData.productUnit.product._id === product._id) {
                                      productUnitInfo = originalData.productUnit;
                                    }
                                  } else if (formData.type === 'assorted_items') {
                                    // For assorted items, find the matching ProductUnit
                                    const originalData = JSON.parse(sessionStorage.getItem('currentPromotionData') || '{}');
                                    if (originalData.productUnits) {
                                      productUnitInfo = originalData.productUnits.find(
                                        pu => pu.product._id === product._id
                                      );
                                    }
                                  }
                                } catch (error) {
                                  console.warn('Error accessing stored promotion data:', error);
                                }

                                // Fallback: use current selected unit if no stored data
                                if (!productUnitInfo) {
                                  const unitId = selectedProductUnits[product._id];
                                  const units = productUnits[product._id] || [];
                                  const selectedUnit = units.find(u => u._id === unitId);
                                  if (selectedUnit) {
                                    productUnitInfo = selectedUnit;
                                  }
                                }

                                const productTitle = renderSafeText(product.title, 'Unknown Product');
                                
                                return (
                                  <div key={product._id} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold text-blue-900 text-sm">{productTitle}</p>
                                        {productUnitInfo && (
                                          <div className="text-xs text-blue-700 mt-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">Unit:</span>
                                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                {renderSafeText(productUnitInfo.unit?.name, 'N/A')}
                                                {productUnitInfo.packQty && productUnitInfo.packQty > 1 && (
                                                  <span> {productUnitInfo.packQty}</span>
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">Price:</span>
                                              <span className="text-green-700 font-semibold">${productUnitInfo.price || 0}</span>
                                            </div>
                                            {productUnitInfo.sku && (
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">SKU:</span>
                                                <span className="text-gray-600">{productUnitInfo.sku}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {product.image && product.image.length > 0 && (
                                        <img 
                                          src={getProductImage(product)} 
                                          alt={productTitle}
                                          className="w-12 h-12 object-cover rounded-lg ml-3"
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Promotion Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promotion Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                      >
                        <option value="fixed_price">Fixed Price</option>
                        <option value="bulk_purchase">Bulk Purchase</option>
                        <option value="assorted_items">Assorted Items</option>
                      </select>
                      {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                    </div>

                    {/* Promotion List */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        📋 Promotion List *
                        <span className="text-red-500 ml-1">(Required)</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="promotionList"
                          value={formData.promotionList}
                          onChange={(e) => handleInputChange('promotionList', e.target.value)}
                                                  className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.promotionList ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                          required
                        >
                          <option value="">Select a promotion list...</option>
                          {promotionLists.map((list) => (
                            <option key={list._id} value={list._id}>
                              {renderSafeText(list.name, 'Unnamed List')} ({renderSafeText(list.type, 'No Type')})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewListForm(!showNewListForm)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                      {errors.promotionList && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm font-medium">⚠️ {errors.promotionList}</p>
                          <p className="text-red-600 text-xs mt-1">
                            Promotions must be organized within promotion lists for better management and organization.
                          </p>
                        </div>
                      )}
                      {!formData.promotionList && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 text-sm">
                            💡 <strong>Tip:</strong> Promotion lists help organize your offers by category, season, or campaign.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type description */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>
                        {formData.type === 'fixed_price' && 'Fixed Price: '}
                        {formData.type === 'bulk_purchase' && 'Bulk Purchase: '}
                        {formData.type === 'assorted_items' && 'Assorted Items: '}
                      </strong>
                      {formData.type === 'fixed_price' && 'Set a specific price for individual products (e.g., Product X for $15)'}
                      {formData.type === 'bulk_purchase' && 'Customer buys a certain quantity and gets additional quantity free (e.g., Buy 200 units, get 50 units free)'}
                      {formData.type === 'assorted_items' && 'Customer selects any combination of products for a fixed total price (e.g., Any 5 items for $10.95)'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Select Products
                    {formData.type === 'assorted_items' && <span className="text-blue-600"> (Multiple)</span>}
                    {formData.type === 'bulk_purchase' && <span className="text-orange-600"> (Bulk)</span>}
                  </h4>
                  <p className="text-gray-600 mb-6">
                    {formData.type === 'assorted_items' 
                      ? 'Choose all products that customers can select from for this promotion'
                      : formData.type === 'bulk_purchase'
                      ? 'Choose products for bulk promotion'
                      : 'Choose the product for this promotion'
                    }
                  </p>
                  
                  {/* Enhanced Selection Mode for Bulk Promotions */}
                  {formData.type === 'bulk_purchase' && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <h5 className="font-medium text-orange-800 mb-3">Selection Mode</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelectionModeChange('all')}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            selectionMode === 'all'
                              ? 'border-orange-500 bg-orange-100 text-orange-800'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                          }`}
                        >
                          <FiPackage className="w-5 h-5 mx-auto mb-2" />
                          All Products
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectionModeChange('categories')}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            selectionMode === 'categories'
                              ? 'border-orange-500 bg-orange-100 text-orange-800'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                          }`}
                        >
                          <FiLayers className="w-5 h-5 mx-auto mb-2" />
                          Categories
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectionModeChange('products')}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            selectionMode === 'products'
                              ? 'border-orange-500 bg-orange-100 text-orange-800'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300'
                          }`}
                        >
                          <FiTag className="w-5 h-5 mx-auto mb-2" />
                          Specific Products
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category Selection for Bulk Promotions */}
                  {formData.type === 'bulk_purchase' && selectionMode === 'categories' && (
                    <div className="mb-6">
                      <h5 className="font-medium text-gray-800 mb-3">Select Categories</h5>
                      {selectedCategories.length > 0 && (
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                          <h6 className="font-medium text-orange-800 mb-2">
                            Selected Categories ({selectedCategories.length})
                          </h6>
                          <div className="flex flex-wrap gap-2">
                            {selectedCategories.map((category) => (
                              <span
                                key={category._id}
                                className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                              >
                                {renderSafeText(category.name, 'Unknown Category')}
                                <button
                                  onClick={() => handleCategoryToggle(category)}
                                  className="ml-2 text-orange-600 hover:text-orange-800"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto">
                        {categories.map((category) => {
                          const isSelected = selectedCategories.some(c => c._id === category._id);
                          
                          // Create category display name with hierarchy
                          const getCategoryDisplayName = (cat) => {
                            if (cat.parent && cat.parent.name) {
                              return `${renderSafeText(cat.parent.name)} > ${renderSafeText(cat.name)}`;
                            }
                            return renderSafeText(cat.name, 'Unknown');
                          };
                          
                          return (
                            <div
                              key={category._id}
                              onClick={() => handleCategoryToggle(category)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                            >
                              <div className="text-center">
                                <FiLayers className={`w-8 h-8 mx-auto mb-2 ${
                                  isSelected ? 'text-orange-600' : 'text-gray-400'
                                }`} />
                                <h6 className="font-medium text-sm text-gray-900 line-clamp-2">
                                  {getCategoryDisplayName(category)}
                                </h6>
                                {category.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {renderSafeText(category.description, '')}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Products Selection Message */}
                  {formData.type === 'bulk_purchase' && selectionMode === 'all' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center">
                        <FiCheck className="w-5 h-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">
                          All products in your store will be included in this bulk promotion
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Search and Product Grid Section */}
                  {(formData.type !== 'bulk_purchase' || selectionMode === 'products') && (
                    <>
                  <div className="relative mb-6">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, SKU, or barcode..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>

                  {selectedProducts.length > 0 && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <h5 className="font-medium text-green-800 mb-2">
                        Selected Products ({selectedProducts.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedProducts.map((product) => (
                          <span
                            key={product._id}
                            className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {renderSafeText(product.title, 'Unknown Product')}
                            <button
                              onClick={() => handleProductToggle(product)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProducts.some(p => p._id === product._id);
                      const units = productUnits[product._id] || [];
                      const selectedUnitId = selectedProductUnits[product._id];
                      const selectedUnit = units.find(u => u._id === selectedUnitId) || units[0];
                      const productImage = getProductImage(product);
                      const displayPrice = getUnitDisplayPrice(product, selectedUnitId);
                      
                      return (
                        <div
                          key={product._id}
                          className={`border-2 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                          }`}
                        >
                          {/* Product Image */}
                          <div 
                            className="relative h-40 bg-gray-100 flex items-center justify-center"
                            onClick={() => handleProductToggle(product)}
                          >
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={renderSafeText(product.title, 'Product')}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`${productImage ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}
                              style={{ display: productImage ? 'none' : 'flex' }}
                            >
                              <FiImage className="w-12 h-12 text-gray-400" />
                            </div>
                            
                            {/* Selection Indicator */}
                            <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
                            }`}>
                              {isSelected && <FiCheck className="w-4 h-4 text-white" />}
                            </div>
                            
                            {/* Price Tag */}
                            <div className="absolute bottom-3 left-3">
                              <div className="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                                ${displayPrice?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <div onClick={() => handleProductToggle(product)} className="cursor-pointer">
                              <h6 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                {renderSafeText(product.title, 'Unknown Product')}
                              </h6>
                              {product.sku && (
                                <p className="text-xs text-gray-500 mb-3">
                                  SKU: {renderSafeText(product.sku, 'No SKU')}
                                </p>
                              )}
                            </div>

                            {/* Unit Selection */}
                            {units.length > 1 && (
                              <div className="border-t pt-3">
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  <FiTag className="inline w-3 h-3 mr-1" />
                                  Unit
                                </label>
                                <div className="relative">
                                  <select
                                    value={selectedUnitId || ''}
                                    onChange={(e) => handleUnitChange(product._id, e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-8"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {units.map((unit) => (
                                      <option key={unit._id} value={unit._id}>
                                        {renderSafeText(unit.unit?.name, 'Unit')} - ${unit.price?.toFixed(2) || '0.00'}
                                        {unit.packQty && unit.packQty !== 1 && ` (${unit.packQty})`}
                                      </option>
                                    ))}
                                  </select>
                                  <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                            )}

                            {/* Single Unit Display */}
                            {units.length === 1 && selectedUnit && (
                              <div className="border-t pt-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    <FiTag className="inline w-3 h-3 mr-1" />
                                    {renderSafeText(selectedUnit.unit?.name, 'pcs')}
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    ${selectedUnit.price?.toFixed(2) || '0.00'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <FiSearch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchText ? 'No products found matching your search' : 'No products available'}
                      </p>
                    </div>
                  )}

                  {/* Display validation errors */}
                  {errors.products && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">⚠️ {errors.products}</p>
                    </div>
                  )}
                  
                  {errors.categories && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">⚠️ {errors.categories}</p>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Details & Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pricing */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiDollarSign className="inline w-4 h-4 mr-1" />
                        {formData.type === 'fixed_price' ? 'Fixed Price' : 
                         formData.type === 'bulk_purchase' ? 'Total Value' : 'Offer Price'} *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.value}
                        onChange={(e) => handleInputChange('value', e.target.value)}
                        placeholder="Enter value..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                    </div>

                    {/* Type-specific fields */}
                    {formData.type === 'bulk_purchase' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Purchase Amount *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.minPurchaseAmount}
                            onChange={(e) => handleInputChange('minPurchaseAmount', e.target.value)}
                            placeholder="e.g., 200.00"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-1">Customer must spend this amount to qualify for the promotion</p>
                          {errors.minPurchaseAmount && <p className="text-red-500 text-sm mt-1">{errors.minPurchaseAmount}</p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Free Value/Amount *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.freeQty}
                            onChange={(e) => handleInputChange('freeQty', e.target.value)}
                            placeholder="e.g., 50.00"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-1">Amount of free value customer gets (can be cash discount or free products)</p>
                          {errors.freeQty && <p className="text-red-500 text-sm mt-1">{errors.freeQty}</p>}
                        </div>
                      </>
                    )}

                    {formData.type === 'assorted_items' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Required Items *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.requiredItemCount}
                          onChange={(e) => handleInputChange('requiredItemCount', e.target.value)}
                          placeholder="e.g., 5"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                        {errors.requiredItemCount && <p className="text-red-500 text-sm mt-1">{errors.requiredItemCount}</p>}
                      </div>
                    )}

                    {/* Quantity limits */}
                    {(formData.type === 'fixed_price' || formData.type === 'bulk_purchase') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.minQty}
                            onChange={(e) => handleInputChange('minQty', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.maxQty}
                            onChange={(e) => handleInputChange('maxQty', e.target.value)}
                            placeholder="Optional"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </>
                    )}

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiCalendar className="inline w-4 h-4 mr-1" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiCalendar className="inline w-4 h-4 mr-1" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>

                    {/* Status Toggle */}
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
                        }`}>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          Promotion Status
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                      <p className="mt-1 text-sm text-gray-500">
                        The promotion is currently {formData.isActive ? 'active' : 'inactive'}
                      </p>
                    </div>
                  </div>

                  {/* Preview Section */}
                  {selectedProducts.length > 0 && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Promotion Preview</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">Promotion Details</h6>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li><strong>Type:</strong> {formData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                            <li><strong>Value:</strong> ${formData.value || '0.00'}</li>
                            {formData.requiredItemCount && (
                              <li><strong>Required Items:</strong> {formData.requiredItemCount}</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">Selected Products ({selectedProducts.length})</h6>
                          <div className="space-y-1 text-sm text-gray-600 max-h-32 overflow-y-auto">
                            {selectedProducts.map((product) => {
                              const selectedUnitId = selectedProductUnits[product._id];
                              const units = productUnits[product._id] || [];
                              const selectedUnit = units.find(u => u._id === selectedUnitId) || units[0];
                              
                              return (
                                <div key={product._id} className="flex justify-between">
                                  <span className="truncate">
                                    {renderSafeText(product.title, 'Unknown Product')}
                                  </span>
                                  <span className="ml-2 text-blue-600">
                                    {renderSafeText(selectedUnit?.unit?.name, 'pcs')} - ${selectedUnit?.price?.toFixed(2) || '0.00'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Next
                </button>
              ) : (
                <div className="flex flex-col items-end">
                  {!formData.promotionList && (
                    <div className="mb-2 text-right">
                      <p className="text-red-600 text-sm font-medium">⚠️ Promotion list required</p>
                      <p className="text-red-500 text-xs">Cannot create promotion without selecting a list</p>
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.promotionList}
                    className={`px-6 py-3 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      !formData.promotionList 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isLoading ? 'Saving...' : (promotionId ? 'Update Promotion' : 'Create Promotion')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal; 