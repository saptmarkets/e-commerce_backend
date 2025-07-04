import React, { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { FiX, FiSearch, FiDollarSign, FiCalendar, FiPackage } from 'react-icons/fi';
import DrawerButton from '@/components/form/button/DrawerButton';
import Error from '@/components/form/others/Error';
import LabelArea from '@/components/form/selectOption/LabelArea';
import SwitchToggle from '@/components/form/switch/SwitchToggle';
import PromotionServices from '@/services/PromotionServices';
import ProductServices from '@/services/ProductServices';
import { notifyError, notifySuccess } from '@/utils/toast';

const PromotionDrawer = ({ id, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
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
    productUnit: '',
    value: '',
    minQty: 1,
    maxQty: '',
    requiredQty: '',
    freeQty: '',
    requiredItemCount: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    loadProducts();
    if (id) {
      loadPromotion(id);
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      const response = await ProductServices.getProductsForPromotions(1, 100, '');
      let productList = [];
      if (response?.products && Array.isArray(response.products)) {
        productList = response.products;
      } else if (Array.isArray(response)) {
        productList = response;
      }
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const loadPromotion = async (promotionId) => {
    try {
      setIsLoading(true);
      const promotion = await PromotionServices.getPromotionById(promotionId);
      
      if (promotion) {
        setFormData({
          type: promotion.type || 'fixed_price',
          productUnit: promotion.productUnit?._id || '',
          value: promotion.value || '',
          minQty: promotion.minQty || 1,
          maxQty: promotion.maxQty || '',
          requiredQty: promotion.requiredQty || '',
          freeQty: promotion.freeQty || '',
          requiredItemCount: promotion.requiredItemCount || '',
          startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
          endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
          isActive: promotion.isActive !== undefined ? promotion.isActive : true
        });
        
        if (promotion.productUnit?.product) {
          setSelectedProduct(promotion.productUnit.product);
        }
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleProductSelect = (product) => {
    if (formData.type === 'assorted_items') {
      // For assorted items, handle multiple selection
      const isAlreadySelected = selectedProducts.some(p => p._id === product._id);
      if (!isAlreadySelected) {
        setSelectedProducts(prev => [...prev, product]);
      }
      setSearchText('');
    } else {
      // For single product selection
      setSelectedProduct(product);
      setSearchText(renderSafeText(product.title, 'Selected Product'));
      setShowProductDropdown(false);
    }
  };

  const handleRemoveProduct = (productId) => {
    if (formData.type === 'assorted_items') {
      setSelectedProducts(prev => prev.filter(p => p._id !== productId));
    } else {
      setSelectedProduct(null);
      setSearchText('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Promotion type is required';
    }

    if (!formData.value || formData.value <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }

    // Product validation
    if (formData.type === 'assorted_items') {
      if (selectedProducts.length === 0) {
        newErrors.products = 'Please select at least one product for assorted items';
      }
    } else {
      if (!selectedProduct) {
        newErrors.product = 'Please select a product';
      }
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

  const filteredProducts = products.filter(product => {
    if (!searchText.trim() || selectedProduct) return products.slice(0, 10); // Show first 10 if no search
    const productTitle = renderSafeText(product.title, '');
    const productSku = renderSafeText(product.sku, '');
    const searchLower = searchText.toLowerCase();
    
    return productTitle.toLowerCase().includes(searchLower) ||
           productSku.toLowerCase().includes(searchLower);
  }).slice(0, 10); // Limit to 10 results

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
              <div className="w-screen max-w-2xl">
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
                    <div className="px-6 py-6 space-y-6">
                        
                      {/* Promotion Type */}
                      <div>
                          <LabelArea label="Promotion Type" />
                          <select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value="fixed_price">Fixed Price - Set specific price for a product</option>
                            <option value="bulk_purchase">Bulk Purchase - Buy X get Y free offers</option>
                            <option value="assorted_items">Assorted Items - Any X items for fixed price</option>
                          </select>
                          {errors.type && <Error message={errors.type} />}
                          
                          {/* Type description */}
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                          {formData.type === 'fixed_price' && 'Set a specific price for individual products (e.g., Product X for $15)'}
                          {formData.type === 'bulk_purchase' && 'Customer buys a certain quantity and gets additional quantity free (e.g., Buy 200 units, get 50 units free)'}
                          {formData.type === 'assorted_items' && 'Customer selects any combination of products for a fixed total price (e.g., Any 5 items for $10.95)'}
                        </div>
                      </div>

                      {/* Product Selection */}
                      <div>
                        <LabelArea label={formData.type === 'assorted_items' ? 'Select Products (Multiple)' : 'Select Product'} />
                        <div className="relative">
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder={formData.type === 'assorted_items' ? 'Search and add products...' : 'Search and select a product...'}
                              value={searchText}
                              onChange={(e) => {
                                setSearchText(e.target.value);
                                setShowProductDropdown(true);
                                if (!e.target.value && formData.type !== 'assorted_items') {
                                  setSelectedProduct(null);
                                }
                              }}
                              onFocus={() => setShowProductDropdown(true)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          {/* Product Dropdown */}
                          {showProductDropdown && (formData.type === 'assorted_items' || !selectedProduct) && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                              {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => {
                                  const isSelected = formData.type === 'assorted_items' ? 
                                    selectedProducts.some(p => p._id === product._id) : 
                                    selectedProduct?._id === product._id;
                                  
                                  return (
                                    <button
                                      key={product._id}
                                      type="button"
                                      onClick={() => handleProductSelect(product)}
                                      disabled={isSelected}
                                      className={`w-full p-3 text-left border-b border-gray-100 last:border-b-0 focus:outline-none transition-colors ${
                                        isSelected 
                                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                          : 'hover:bg-gray-50 focus:bg-blue-50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                          isSelected ? 'bg-green-100' : 'bg-gray-100'
                                        }`}>
                                          {isSelected ? (
                                            <FiX className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <FiPackage className="w-4 h-4 text-gray-500" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {renderSafeText(product.title, 'Unknown Product')}
                                            {isSelected && <span className="text-green-600 ml-2">(Selected)</span>}
                                          </p>
                                          {product.sku && (
                                            <p className="text-xs text-gray-500">
                                              SKU: {renderSafeText(product.sku, 'No SKU')}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  {searchText ? 'No products found matching your search' : 'Start typing to search products'}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Selected Products Display for Assorted Items */}
                          {formData.type === 'assorted_items' && selectedProducts.length > 0 && (
                            <div className="mt-2 space-y-2">
                              <p className="text-sm font-medium text-gray-700">Selected Products ({selectedProducts.length}):</p>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedProducts.map((product) => (
                                  <div key={product._id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                        <FiPackage className="w-3 h-3 text-blue-600" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-blue-900 truncate">
                                          {renderSafeText(product.title, 'Unknown Product')}
                                        </p>
                                        {product.sku && (
                                          <p className="text-xs text-blue-600">
                                            SKU: {renderSafeText(product.sku, 'No SKU')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProduct(product._id)}
                                      className="text-blue-400 hover:text-red-600 transition-colors"
                                    >
                                      <FiX className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Selected Product Display for Single Selection */}
                          {formData.type !== 'assorted_items' && selectedProduct && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiPackage className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      {renderSafeText(selectedProduct.title, 'Unknown Product')}
                                    </p>
                                    {selectedProduct.sku && (
                                      <p className="text-xs text-blue-600">
                                        SKU: {renderSafeText(selectedProduct.sku, 'No SKU')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(selectedProduct._id)}
                                  className="text-blue-400 hover:text-blue-600"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        </div>

                      {/* Value Field */}
                      <div>
                        <LabelArea label={
                          <span className="flex items-center">
                            <FiDollarSign className="w-4 h-4 mr-1" />
                            {formData.type === 'fixed_price' ? 'Fixed Price' : 
                             formData.type === 'bulk_purchase' ? 'Total Value' : 'Offer Price'}
                          </span>
                        } />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter value"
                          value={formData.value}
                          onChange={(e) => handleInputChange('value', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.value && <Error message={errors.value} />}
                      </div>

                        {/* Type-specific Fields */}
                      {formData.type === 'bulk_purchase' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <LabelArea label="Required Quantity" />
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
                              <LabelArea label="Free Quantity" />
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
                          
                          {formData.requiredQty && formData.freeQty && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800">
                                <strong>Offer:</strong> Buy {formData.requiredQty} and get {formData.freeQty} free 
                                (Total: {parseInt(formData.requiredQty || 0) + parseInt(formData.freeQty || 0)} units)
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {formData.type === 'assorted_items' && (
                        <div>
                          <LabelArea label="Required Items" />
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g., 5"
                            value={formData.requiredItemCount}
                            onChange={(e) => handleInputChange('requiredItemCount', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors.requiredItemCount && <Error message={errors.requiredItemCount} />}
                          
                          {formData.requiredItemCount && formData.value && (
                            <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <p className="text-sm text-orange-800">
                                <strong>Offer:</strong> Any {formData.requiredItemCount} items for ${formData.value}
                                {selectedProducts.length > 0 && (
                                  <span className="block mt-1">
                                    From {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          </div>
                        )}

                      {/* Quantity Fields */}
                      {(formData.type === 'fixed_price' || formData.type === 'bulk_purchase') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <LabelArea label="Min Quantity" />
                            <input
                              type="number"
                              min="1"
                              value={formData.minQty}
                              onChange={(e) => handleInputChange('minQty', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <LabelArea label="Max Quantity (Optional)" />
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
                          <LabelArea label={
                            <span className="flex items-center">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              Start Date
                            </span>
                          } />
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <LabelArea label={
                            <span className="flex items-center">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              End Date
                            </span>
                          } />
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          </div>
                        </div>

                        {/* Active Status */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <LabelArea label="Promotion Status" />
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

export default PromotionDrawer;