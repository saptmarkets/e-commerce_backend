import { useState, useEffect, useMemo, useCallback } from 'react';
import ProductUnitServices from '@services/ProductUnitServices';
import { getLocalizedUnitName } from '@utils/unitUtils';
import useUtilsFunction from '@hooks/useUtilsFunction';

const useMultiUnits = (product) => {
  const { lang } = useUtilsFunction();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available units for the product
  const fetchProductUnits = useCallback(async (promotionHint = null) => {
    if (!product || !product._id) {
      // No product or product ID, skipping fetch
      return;
    }

    // If product doesn't have multi-units, create a basic unit
    if (!product.hasMultiUnits) {
      // Product does not have multi-units, creating basic unit
      const defaultUnit = {
        _id: `basic-${product._id}`,
        product: product._id,
        unit: product?.basicUnit || null,
        unitValue: 1,
        packQty: 1,
        price: product?.price || 0,
        isDefault: true,
        isActive: true,
        isAvailable: true,
        unitType: 'basic'
      };
      setAvailableUnits([defaultUnit]);
      setSelectedUnit(defaultUnit);
      return;
    }

    setIsLoadingUnits(true);
    setError(null);

    try {
      console.log('Fetching product units from API...');
      console.log('Product ID being used:', product._id);
      const response = await ProductUnitServices.getProductUnits(product._id);
      // Product units API response received
      
      const units = response?.data || [];
      console.log('Parsed units array:', units);
      
      if (units.length > 0) {
        console.log('Found units, setting up...');
        setAvailableUnits(units);
        
        // First, try to find promotional unit if promotion hint provided
        let promotionalUnit = null;
        if (promotionHint) {
          console.log('Looking for promotional unit based on hint:', promotionHint);
          promotionalUnit = units.find(unit => 
            unit._id === promotionHint.unit?._id || 
            unit._id === promotionHint.productUnit?._id
          );
          if (promotionalUnit) {
            console.log('Found promotional unit:', promotionalUnit);
          }
        }
        
        // Set default unit priority: promotional > default > first active > first available
        const defaultUnit = promotionalUnit ||
                           units.find(unit => unit.isDefault && unit.isActive) || 
                           units.find(unit => unit.isActive) ||
                           units[0];
        console.log('Selected default unit:', defaultUnit);
        setSelectedUnit(defaultUnit);
      } else {
        console.log('No units found, creating fallback unit');
        // Fallback to basic product data if no units found
        const fallbackUnit = {
          _id: `fallback-${product._id}`,
          product: product._id,
          unit: product?.basicUnit || null,
          unitValue: 1,
          packQty: 1,
          price: product?.price || 0,
          isDefault: true,
          isActive: true,
          isAvailable: true,
          unitType: 'basic'
        };
        setAvailableUnits([fallbackUnit]);
        setSelectedUnit(fallbackUnit);
      }
    } catch (err) {
      console.error('Error fetching product units:', err);
      setError(err.message || 'Failed to fetch product units');
      
      // Fallback to basic product data on error
      const errorFallbackUnit = {
        _id: `error-fallback-${product._id}`,
        product: product._id,
        unit: product?.basicUnit || null,
        unitValue: 1,
        packQty: 1,
        price: product?.price || 0,
        isDefault: true,
        isActive: true,
        isAvailable: true,
        unitType: 'basic'
      };
      console.log('Setting error fallback unit:', errorFallbackUnit);
      setAvailableUnits([errorFallbackUnit]);
      setSelectedUnit(errorFallbackUnit);
    } finally {
      setIsLoadingUnits(false);
    }
  }, [product?._id, product?.hasMultiUnits, product?.basicUnit, product?.price]);

  // Fetch units when product changes
  useEffect(() => {
    fetchProductUnits();
  }, [fetchProductUnits]);

  // Calculate available stock for selected unit
  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock || selectedUnit.packQty <= 0) return 0;
    return Math.floor(product.stock / selectedUnit.packQty);
  }, [selectedUnit, product?.stock]);

  // Calculate unit price per base unit
  const unitPricePerBase = useMemo(() => {
    if (!selectedUnit || !selectedUnit.packQty || selectedUnit.packQty <= 0) return 0;
    return selectedUnit.price / selectedUnit.packQty;
  }, [selectedUnit]);

  // Format unit display name
  const getUnitDisplayName = useCallback((unit) => {
    if (!unit) return 'Unit';
    
    const unitName = getLocalizedUnitName(unit.unit, lang);
    const unitValue = unit.unitValue || 1;
    
    if (unitValue === 1) {
      return unitName;
    }
    
    return `${unitValue} ${unitName}${unitValue > 1 ? 's' : ''}`;
  }, [lang]);

  // Get current unit display name
  const currentUnitDisplayName = useMemo(() => {
    return getUnitDisplayName(selectedUnit);
  }, [getUnitDisplayName, selectedUnit]);

  // Handle unit selection
  const handleUnitSelection = useCallback((unit) => {
    if (unit && unit._id !== selectedUnit?._id) {
      setSelectedUnit(unit);
    }
  }, [selectedUnit]);

  // Check if product has multiple units available
  const hasMultipleUnits = useMemo(() => {
    const result = availableUnits.length > 1;
    console.log('hasMultipleUnits calculation:', {
      availableUnitsLength: availableUnits.length,
      availableUnits: availableUnits,
      hasMultipleUnits: result
    });
    return result;
  }, [availableUnits.length]);

  // Get unit comparison data for dropdown
  const unitComparisonData = useMemo(() => {
    return availableUnits.map(unit => ({
      ...unit,
      displayName: getUnitDisplayName(unit),
      pricePerBase: unit.packQty > 0 ? unit.price / unit.packQty : 0,
      savings: product?.price ? product.price - unit.price : 0,
      savingsPercent: product?.price && product.price > 0 ? 
        ((product.price - unit.price) / product.price) * 100 : 0
    }));
  }, [availableUnits, getUnitDisplayName, product?.price]);

  // Calculate total base units for a given quantity
  const getTotalBaseUnits = useCallback((quantity = 1) => {
    if (!selectedUnit) return 0;
    return quantity * (selectedUnit.packQty || 1);
  }, [selectedUnit]);

  // Check if a specific quantity is available
  const isQuantityAvailable = useCallback((quantity) => {
    return quantity > 0 && quantity <= availableStock;
  }, [availableStock]);

  // Get unit pricing breakdown
  const getPricingBreakdown = useCallback((quantity = 1) => {
    if (!selectedUnit) return null;

    const unitPrice = selectedUnit.price || 0;
    const totalPrice = unitPrice * quantity;
    const totalBaseUnits = getTotalBaseUnits(quantity);
    const pricePerBaseUnit = unitPricePerBase;

    return {
      unitPrice,
      totalPrice,
      totalBaseUnits,
      pricePerBaseUnit,
      quantity
    };
  }, [selectedUnit, getTotalBaseUnits, unitPricePerBase]);

  // Validate unit selection
  const isValidUnit = useMemo(() => {
    return selectedUnit && selectedUnit.isActive && selectedUnit.isAvailable;
  }, [selectedUnit]);

  return {
    selectedUnit,
    availableUnits,
    isLoadingUnits,
    error,
    availableStock,
    unitPricePerBase,
    currentUnitDisplayName,
    hasMultipleUnits,
    unitComparisonData,
    isValidUnit: Boolean(selectedUnit),
    handleUnitSelection,
    getUnitDisplayName,
    getTotalBaseUnits,
    isQuantityAvailable,
    getPricingBreakdown,
    fetchProductUnits
  };
};

export default useMultiUnits; 