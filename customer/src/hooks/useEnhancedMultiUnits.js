import { useState, useEffect, useMemo } from 'react';
import ProductUnitServices from '@services/ProductUnitServices';
import PromotionServices from '@services/PromotionServices';
import useUtilsFunction from '@hooks/useUtilsFunction';
import { getUnitDisplayName as getLocalizedUnitDisplayName } from '@utils/unitUtils';

const useEnhancedMultiUnits = (product) => {
  // NEW: obtain language from util hook so we can localize unit names
  const { lang } = useUtilsFunction();
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const [activePromotion, setActivePromotion] = useState(null);
  const [isLoadingPromotion, setIsLoadingPromotion] = useState(false);
  const [priceUpdateKey, setPriceUpdateKey] = useState(0);

  // Fetch product units
  useEffect(() => {
    const fetchProductUnits = async () => {
      if (!product?._id) return;

      if (!product?.hasMultiUnits) {
        // Create default unit for single-unit products
        const defaultUnit = {
          _id: `default-${product._id}`,
          product: product._id,
          unit: product?.basicUnit || { name: 'Unit', shortCode: 'pcs' },
          unitValue: 1,
          packQty: 1,
          price: product?.price || 0,
          isDefault: true,
          isActive: true,
          unitType: 'basic'
        };
        setAvailableUnits([defaultUnit]);
        setSelectedUnit(defaultUnit);
        return;
      }

      setIsLoadingUnits(true);
      try {
        const response = await ProductUnitServices.getProductUnits(product._id);
        const units = response?.data || [];
        
        if (units.length > 0) {
          // Calculate best value for each unit
          const enhancedUnits = units.map(unit => {
            const pricePerBaseUnit = unit.price / (unit.packQty || 1);
            return {
              ...unit,
              pricePerBaseUnit,
              displayName: getLocalizedUnitDisplayName(unit, lang),
              savings: 0 // Will be calculated relative to smallest unit
            };
          });

          // Find the unit with the lowest price per base unit for comparison
          const lowestPricePerUnit = Math.min(...enhancedUnits.map(u => u.pricePerBaseUnit));
          
          // Calculate savings and mark best value
          const unitsWithSavings = enhancedUnits.map(unit => {
            const savings = (lowestPricePerUnit - unit.pricePerBaseUnit) * unit.packQty;
            return {
              ...unit,
              savings: Math.max(0, savings),
              isBestValue: unit.pricePerBaseUnit === lowestPricePerUnit && unit.packQty > 1
            };
          });

          setAvailableUnits(unitsWithSavings);
          
          // Set default unit or first available unit
          const defaultUnit = unitsWithSavings.find(unit => unit.isDefault && unit.isActive) || 
                             unitsWithSavings.find(unit => unit.isActive) ||
                             unitsWithSavings[0];
          setSelectedUnit(defaultUnit);
        }
      } catch (error) {
        console.error('Error fetching product units:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchProductUnits();
  }, [product?._id, product?.hasMultiUnits, lang]);

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      if (!product?._id) return;
      
      setIsLoadingPromotion(true);
      try {
        // Fetch promotions for this product
        const promotions = await PromotionServices.getProductPromotions(product._id);
        if (promotions && promotions.length > 0) {
          setActivePromotion(promotions[0]);
        } else {
          setActivePromotion(null);
        }

        // Check if selected unit has specific promotions
        if (selectedUnit && selectedUnit._id) {
          const unitPromotions = await PromotionServices.getProductUnitPromotions(selectedUnit._id);
          if (unitPromotions && unitPromotions.length > 0) {
            setActivePromotion(unitPromotions[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
        setActivePromotion(null);
      } finally {
        setIsLoadingPromotion(false);
      }
    };

    fetchPromotions();
  }, [product?._id]);

  // Fetch unit-specific promotions when selectedUnit changes
  useEffect(() => {
    const fetchUnitPromotions = async () => {
      if (!selectedUnit?._id || selectedUnit._id.startsWith('default-')) return;
      
      setIsLoadingPromotion(true);
      try {
        const unitPromotions = await PromotionServices.getPromotionsByProductUnit(selectedUnit._id);
        if (unitPromotions && unitPromotions.length > 0) {
          setActivePromotion(unitPromotions[0]);
        } else {
          // Keep the product-level promotion if no unit-specific promotion
          const productPromotions = await PromotionServices.getPromotionsForProduct(product._id);
          if (productPromotions && productPromotions.length > 0) {
            setActivePromotion(productPromotions[0]);
          } else {
            setActivePromotion(null);
          }
        }
      } catch (error) {
        console.error('Error fetching unit promotions:', error);
      } finally {
        setIsLoadingPromotion(false);
      }
    };

    fetchUnitPromotions();
  }, [selectedUnit?._id, product?._id]);

  // Available stock calculation
  const availableStock = useMemo(() => {
    if (!selectedUnit || !product?.stock) return 0;
    return Math.floor(product.stock / (selectedUnit.packQty || 1));
  }, [selectedUnit, product?.stock]);

  // Enhanced pricing calculations
  const calculatePricing = useMemo(() => {
    if (!selectedUnit) return { 
      basePrice: 0, 
      finalPrice: 0, 
      savings: 0, 
      isPromotional: false,
      pricePerBaseUnit: 0
    };

    const basePrice = selectedUnit.price || 0;
    let finalPrice = basePrice;
    let savings = 0;
    let isPromotional = false;

    // Apply promotion if available and valid
    if (activePromotion) {
      if (activePromotion.type === 'fixed_price') {
        finalPrice = activePromotion.value || basePrice;
        savings = basePrice - finalPrice;
        isPromotional = true;
      } else if (activePromotion.type === 'bulk_purchase') {
        // For bulk purchases, calculate effective price considering free items
        const totalRequired = activePromotion.requiredQty || 1;
        const freeQty = activePromotion.freeQty || 0;
        const effectivePrice = (basePrice * totalRequired) / (totalRequired + freeQty);
        finalPrice = effectivePrice;
        savings = basePrice - effectivePrice;
        isPromotional = true;
      }
    }

    return { 
      basePrice, 
      finalPrice: Math.max(0, finalPrice), 
      savings: Math.max(0, savings), 
      isPromotional,
      pricePerBaseUnit: selectedUnit.packQty ? finalPrice / selectedUnit.packQty : finalPrice
    };
  }, [selectedUnit, activePromotion]);

  // Unit comparison data for display
  const unitComparisonData = useMemo(() => {
    return availableUnits.map(unit => ({
      ...unit,
      displayName: getLocalizedUnitDisplayName(unit, lang),
      pricePerBaseUnit: unit.packQty ? unit.price / unit.packQty : unit.price
    }));
  }, [availableUnits, lang]);

  // Handle unit selection with animation trigger
  const handleUnitSelection = (unit) => {
    setSelectedUnit(unit);
    setPriceUpdateKey(prev => prev + 1); // Trigger price animation
  };

  // Get unit display name helper
  const getUnitDisplayName = (unit) => {
    if (!unit) return 'Unit';
    // Use shared util for consistent localization
    return getLocalizedUnitDisplayName(unit, lang);
  };

  // Check if product has multiple units
  const hasMultipleUnits = product?.hasMultiUnits && availableUnits.length > 1;

  return {
    selectedUnit,
    availableUnits,
    unitComparisonData,
    isLoadingUnits,
    activePromotion,
    isLoadingPromotion,
    availableStock,
    calculatePricing,
    hasMultipleUnits,
    priceUpdateKey,
    handleUnitSelection,
    getUnitDisplayName
  };
};

export default useEnhancedMultiUnits; 