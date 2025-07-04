import React, { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { FiX, FiSearch, FiChevronDown, FiCheck, FiPackage, FiDollarSign, FiCalendar } from 'react-icons/fi';
import DrawerButton from '@/components/form/button/DrawerButton';
import Error from '@/components/form/others/Error';
import LabelArea from '@/components/form/selectOption/LabelArea';
import SwitchToggle from '@/components/form/switch/SwitchToggle';
import PromotionServices from '@/services/PromotionServices';
import PromotionListServices from '@/services/PromotionListServices';
import ProductServices from '@/services/ProductServices';
import { notifyError, notifySuccess } from '@/utils/toast';

const PromotionDrawerNew = ({ id, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [promotionLists, setPromotionLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [productUnits, setProductUnits] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Helper function to safely render text that might be an object
  const renderSafeText = (text, fallback = '') => {
    if (typeof text === 'object' && text) {
      return text.en || text.ar || Object.values(text)[0] || fallback;
    }
    return text || fallback;
  };
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'fixed_price',
    promotionList: '',
    productUnit: '',
    productUnits: [],
    value: '',
    minQty: 1,
    maxQty: '',
    requiredQty: '',
    freeQty: '',
    requiredItemCount: '',
    maxItemCount: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadPromotionLists();
    loadProducts();
    
    if (id) {
      loadPromotion(id);
    }
  }, [id]);

  // Filter products based on search
  useEffect(() => {
    if (searchText.trim()) {
      const filtered = products.filter(product => {
        const productTitle = renderSafeText(product.title, '');
        const productDescription = renderSafeText(product.description, '');
        const productSku = renderSafeText(product.sku, '');
        const searchLower = searchText.toLowerCase();
        
        return productTitle.toLowerCase().includes(searchLower) ||
               productDescription.toLowerCase().includes(searchLower) ||
               productSku.toLowerCase().includes(searchLower);
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchText, products]);

  const loadPromotionLists = async () => {
    try {
      const response = await PromotionListServices.getAllPromotionLists({ page: 1, limit: 100 });
      
      let lists = [];
      if (Array.isArray(response)) {
        lists = response;
      } else if (response?.promotionLists && Array.isArray(response.promotionLists)) {
        lists = response.promotionLists;
      } else if (response?.data && Array.isArray(response.data)) {
        lists = response.data;
      } else if (response?.data?.promotionLists && Array.isArray(response.data.promotionLists)) {
        lists = response.data.promotionLists;
      }
      
      setPromotionLists(lists);
    } catch (error) {
      console.error('Error loading promotion lists:', error);
      setPromotionLists([]);
      notifyError('Failed to load promotion lists');
    }
  };

  const loadProducts = async (searchTerm = '') => {
    try {
      const response = await ProductServices.getProductsForPromotions(1, 100, searchTerm);
      
      let productList = [];
      if (response?.products && Array.isArray(response.products)) {
        productList = response.products;
      } else if (response?.data && Array.isArray(response.data)) {
        productList = response.data;
      } else if (Array.isArray(response)) {
        productList = response;
      }
      
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
      notifyError('Failed to load products: ' + (error.message || error));
      setProducts([]);
    }
  };

  const loadUnitsForProduct = async (productId) => {
    try {
      const response = await ProductServices.getProductUnits(productId);
      
      let units = [];
      if (response?.data) {
        units = response.data;
      } else if (Array.isArray(response)) {
        units = response;
      }
      
      setAvailableUnits(units);
      return units;
    } catch (error) {
      console.error('Error loading units for product:', error);
      notifyError('Failed to load product units: ' + (error.message || error));
      setAvailableUnits([]);
      return [];
    }
  };

  const loadPromotion = async (promotionId) => {
    try {
      setIsLoading(true);
      const promotion = await PromotionServices.getPromotionById(promotionId);
      
      if (promotion) {
        setFormData({
          type: promotion.type || 'fixed_price',
          promotionList: promotion.promotionList?._id || '',
          productUnit: promotion.productUnit?._id || '',
          productUnits: promotion.productUnits?.map(unit => unit._id) || [],
          value: promotion.value || '',
          minQty: promotion.minQty || 1,
          maxQty: promotion.maxQty || '',
          requiredQty: promotion.requiredQty || '',
          freeQty: promotion.freeQty || '',
          requiredItemCount: promotion.requiredItemCount || '',
          maxItemCount: promotion.maxItemCount || '',
          startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
          endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
          isActive: promotion.isActive !== undefined ? promotion.isActive : true
        });
      }
    } catch (error) {
      console.error('Error loading promotion:', error);
      notifyError('Failed to load promotion details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setShowProductSearch(false);
    setSearchText('');
    
    if (formData.type !== 'assorted_items') {
      // Load units for single product selection
      const units = await loadUnitsForProduct(product._id);
      if (units.length === 1) {
        handleInputChange('productUnit', units[0]._id);
      }
    } else {
      // Handle multiple product selection for assorted items
      const isAlreadySelected = formData.productUnits.some(unitId => 
        productUnits.some(unit => unit._id === unitId && unit.product?._id === product._id)
      );
      
      if (!isAlreadySelected) {
        const units = await loadUnitsForProduct(product._id);
        if (units.length > 0) {
          handleInputChange('productUnits', [...formData.productUnits, units[0]._id]);
        }
      }
    }
  };

  const handleUnitSelect = (unitId) => {
    handleInputChange('productUnit', unitId);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.type) {
      newErrors.type = 'Promotion type is required';
    }
    
    if (!formData.value || formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }
    
    if (formData.type !== 'assorted_items' && !formData.productUnit) {
      newErrors.productUnit = 'Please select a product and unit';
    }
    
    if (formData.type === 'assorted_items' && formData.productUnits.length === 0) {
      newErrors.productUnits = 'Please select at least one product';
    }
    
    if (formData.type === 'bulk_purchase') {
      if (!formData.requiredQty || formData.requiredQty <= 0) {
        newErrors.requiredQty = 'Required quantity must be greater than 0';
      }
      if (!formData.freeQty || formData.freeQty <= 0) {
        newErrors.freeQty = 'Free quantity must be greater than 0';
      }
    }
    
    if (formData.type === 'assorted_items' && (!formData.requiredItemCount || formData.requiredItemCount <= 0)) {
      newErrors.requiredItemCount = 'Required item count must be greater than 0';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const promotionData = {
        ...formData,
        value: parseFloat(formData.value),
        minQty: parseInt(formData.minQty),
        maxQty: formData.maxQty ? parseInt(formData.maxQty) : null,
        requiredQty: formData.requiredQty ? parseInt(formData.requiredQty) : null,
        freeQty: formData.freeQty ? parseInt(formData.freeQty) : null,
        requiredItemCount: formData.requiredItemCount ? parseInt(formData.requiredItemCount) : null,
        maxItemCount: formData.maxItemCount ? parseInt(formData.maxItemCount) : null,
      };
      
      if (id) {
        await PromotionServices.updatePromotion(id, promotionData);
        notifySuccess('Promotion updated successfully!');
      } else {
        await PromotionServices.addPromotion(promotionData);
        notifySuccess('Promotion created successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving promotion:', error);
      notifyError(error.message || 'Failed to save promotion');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProductSearch = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.type === 'assorted_items' ? 'Select Products' : 'Select Product'}
          </label>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProductSearch(!showProductSearch)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <span className="text-sm text-gray-900">
                {selectedProduct ? renderSafeText(selectedProduct.title, 'Selected Product') : 'Choose a product'}
              </span>
              <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProductSearch ? 'rotate-180' : ''}`} />
            </button>
            
            {showProductSearch && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                
                {/* Product List */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <button
                        key={product._id}
                        type="button"
                        onClick={() => handleProductSelect(product)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FiPackage className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {renderSafeText(product.title, 'Unknown Product')}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-gray-500">
                                SKU: {renderSafeText(product.sku, 'No SKU')}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No products found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {errors.productUnit && <Error message={errors.productUnit} />}
          {errors.productUnits && <Error message={errors.productUnits} />}
        </div>
        
        {/* Unit Selection */}
        {selectedProduct && availableUnits.length > 1 && formData.type !== 'assorted_items' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Unit
            </label>
            <div className="grid grid-cols-1 gap-2">
              {availableUnits.map((unit) => {
                const isSelected = formData.productUnit === unit._id;
                const unitName = renderSafeText(unit.unit?.name) || renderSafeText(unit.unitType) || 'Unknown Unit';
                
                return (
                  <button
                    key={unit._id}
                    type="button"
                    onClick={() => handleUnitSelect(unit._id)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-900' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{unitName}</p>
                        <p className="text-xs text-gray-500">Price: ${unit.price} | Pack: {unit.packQty}</p>
                      </div>
                      {isSelected && (
                        <FiCheck className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'fixed_price':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiDollarSign className="inline w-4 h-4 mr-1" />
                Fixed Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter fixed price (e.g., 15.99)"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.value && <Error message={errors.value} />}
              <p className="text-xs text-gray-500 mt-1">
                Set the final price customers will pay for this product
              </p>
            </div>
          </div>
        );

      case 'bulk_purchase':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 200"
                  value={formData.requiredQty}
                  onChange={(e) => handleInputChange('requiredQty', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.requiredQty && <Error message={errors.requiredQty} />}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 50"
                  value={formData.freeQty}
                  onChange={(e) => handleInputChange('freeQty', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.freeQty && <Error message={errors.freeQty} />}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiDollarSign className="inline w-4 h-4 mr-1" />
                Total Value
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 1500.00"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.value && <Error message={errors.value} />}
            </div>
            
            {formData.requiredQty && formData.freeQty && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Offer Preview:</strong> Buy {formData.requiredQty} and get {formData.freeQty} free 
                  (Total: {parseInt(formData.requiredQty) + parseInt(formData.freeQty)} units)
                </p>
              </div>
            )}
          </div>
        );

      case 'assorted_items':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Items
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  value={formData.requiredItemCount}
                  onChange={(e) => handleInputChange('requiredItemCount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.requiredItemCount && <Error message={errors.requiredItemCount} />}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Items (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 10"
                  value={formData.maxItemCount}
                  onChange={(e) => handleInputChange('maxItemCount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiDollarSign className="inline w-4 h-4 mr-1" />
                Offer Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 10.95"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.value && <Error message={errors.value} />}
            </div>
            
            {formData.requiredItemCount && formData.value && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Offer Preview:</strong> Any {formData.requiredItemCount} items for ${formData.value}
                  {formData.maxItemCount && ` (max ${formData.maxItemCount} items)`}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={true} as={React.Fragment}>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={React.Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-4 sm:pl-10 max-w-full flex">
            <Transition.Child
              as={React.Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-4xl">
                <form onSubmit={handleSubmit} className="h-full flex flex-col bg-white shadow-2xl rounded-l-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          {id ? 'Edit Promotion' : 'Create New Promotion'}
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                          {id ? 'Update promotion details' : 'Set up your promotional offer'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-white hover:text-blue-200 transition-colors duration-200 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
                        onClick={onClose}
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-6 space-y-8">
                      
                      {/* Promotion Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Promotion Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="fixed_price">Fixed Price - Set specific price for a product</option>
                          <option value="bulk_purchase">Bulk Purchase - Buy X get Y free offers</option>
                          <option value="assorted_items">Assorted Items - Any X items for fixed price</option>
                        </select>
                        {errors.type && <Error message={errors.type} />}
                      </div>

                      {/* Product Selection */}
                      {renderProductSearch()}

                      {/* Type-specific Fields */}
                      {renderTypeSpecificFields()}

                      {/* Common quantity fields for fixed_price and bulk_purchase */}
                      {(formData.type === 'fixed_price' || formData.type === 'bulk_purchase') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Min Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.minQty}
                              onChange={(e) => handleInputChange('minQty', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="Optional"
                              value={formData.maxQty}
                              onChange={(e) => handleInputChange('maxQty', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="inline w-4 h-4 mr-1" />
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.startDate && <Error message={errors.startDate} />}
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.endDate && <Error message={errors.endDate} />}
                        </div>
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Promotion Status
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.isActive ? 'This promotion is currently active' : 'This promotion is currently inactive'}
                          </p>
                        </div>
                        <SwitchToggle
                          handleProcess={() => handleInputChange('isActive', !formData.isActive)}
                          processOption={formData.isActive}
                          name="isActive"
                          id="isActive"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <DrawerButton
                        id={id}
                        title="Promotion"
                        isSubmitting={isLoading}
                        type="submit"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </div>
      </div>
    </Transition>
  );
};

export default PromotionDrawerNew; 