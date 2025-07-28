import { getUnitDisplayName } from '@utils/unitUtils';
import useUtilsFunction from "@hooks/useUtilsFunction";
import React, { useState } from "react";
import { FiChevronDown, FiChevronUp, FiPackage } from "react-icons/fi";

const OrderTable = ({ data, currency }) => {
  const { getNumberTwo, lang } = useUtilsFunction();
  const [expandedCombos, setExpandedCombos] = useState(new Set());

  // Helper to render price correctly based on language direction
  const formatPrice = (value) => {
    const amount = getNumberTwo(value);
    if (lang === 'ar') {
      return (
        <>
          {amount}
          <span className="font-saudi_riyal ml-0.5">{currency}</span>
        </>
      );
    }
    return (
      <>
        <span className="font-saudi_riyal mr-0.5">{currency}</span>{amount}
      </>
    );
  };

  const toggleComboExpansion = (itemIndex) => {
    const newExpanded = new Set(expandedCombos);
    if (newExpanded.has(itemIndex)) {
      newExpanded.delete(itemIndex);
    } else {
      newExpanded.add(itemIndex);
    }
    setExpandedCombos(newExpanded);
  };

  // Get multi-unit display information for an item
  const getUnitDisplayInfo = (item) => {
    const unitName = getUnitDisplayName(item.unit, lang);
    const packQty = item.packQty || 1;
    const totalBaseUnits = item.quantity * packQty;
    
    if (packQty > 1) {
      return {
        unitDisplay: `${unitName} (${packQty} pcs each)`,
        totalBaseUnits,
        hasMultiUnit: true
      };
    }
    
    return {
      unitDisplay: unitName,
      totalBaseUnits: item.quantity,
      hasMultiUnit: false
    };
  };

  return (
    <tbody className="bg-white divide-y divide-gray-100 text-serif text-sm">
      {data?.cart?.map((item, i) => {
        const isCombo = item.isCombo && item.comboDetails?.productBreakdown;
        const isExpanded = expandedCombos.has(i);
        const unitInfo = getUnitDisplayInfo(item);
        
        return (
          <React.Fragment key={i}>
            {/* Main Product Row */}
            <tr className={isCombo ? 'bg-purple-50' : ''}>
              <th className="px-6 py-1 whitespace-nowrap font-normal text-gray-500 text-left">
                {i + 1}
              </th>
              <td className="px-6 py-1 font-normal text-gray-500">
                <div className="flex items-center space-x-2">
                  {isCombo && (
                    <FiPackage className="text-purple-600 flex-shrink-0" size={16} />
                  )}
                  <div>
                    <span className={isCombo ? 'font-semibold text-purple-800' : ''}>
                      {item.title}
                    </span>
                    {/* Multi-unit information */}
                    {unitInfo.hasMultiUnit && (
                      <div className="text-xs text-blue-600 mt-1">
                        Unit: {unitInfo.unitDisplay}
                      </div>
                    )}
                  </div>
                  {isCombo && (
                    <button
                      onClick={() => toggleComboExpansion(i)}
                      className="text-purple-600 hover:text-purple-800 transition-colors flex-shrink-0"
                      title="Show combo details"
                    >
                      {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </button>
                  )}
                </div>
                {isCombo && (
                  <div className="text-xs text-purple-600 mt-1">
                    Combo Deal • {item.comboDetails.productBreakdown?.length || 0} items
                  </div>
                )}
              </td>
              <td className="px-6 py-1 whitespace-nowrap font-bold text-center">
                <div>
                  <div>{item.quantity}</div>
                  {/* Show total base units for multi-unit items */}
                  {unitInfo.hasMultiUnit && (
                    <div className="text-xs text-gray-500 mt-1">
                      ({unitInfo.totalBaseUnits} total pcs)
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-1 whitespace-nowrap font-bold text-center font-DejaVu">
                {formatPrice(item.price)}
              </td>
              <td className="px-6 py-1 whitespace-nowrap text-right font-bold font-DejaVu k-grid text-red-500">
                {formatPrice(item.itemTotal || (item.price * item.quantity))}
              </td>
            </tr>

            {/* Combo Details Rows - Expandable */}
            {isCombo && isExpanded && item.comboDetails?.productBreakdown?.map((comboProduct, j) => (
              <tr key={`${i}-combo-${j}`} className="bg-gray-50">
                <td className="px-6 py-1"></td>
                <td className="px-6 py-1 pl-12">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-purple-300 rounded-full flex-shrink-0"></span>
                    <span>{comboProduct.productTitle}</span>
                    <span className="text-xs text-gray-400">
                      ({getUnitDisplayName(comboProduct.unit, lang)})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-1 whitespace-nowrap text-center text-sm text-gray-600">
                  {comboProduct.quantity}
                </td>
                <td className="px-6 py-1 whitespace-nowrap text-center text-sm text-gray-500 font-DejaVu">
                  {formatPrice(comboProduct.unitPrice || 0)}
                </td>
                <td className="px-6 py-1 whitespace-nowrap text-right text-sm text-gray-500 font-DejaVu">
                  {formatPrice((comboProduct.unitPrice || 0) * comboProduct.quantity)}
                </td>
              </tr>
            ))}

            {/* Combo Summary Row */}
            {isCombo && isExpanded && (
              <tr className="bg-purple-100 border-b-2 border-purple-200">
                <td className="px-6 py-1"></td>
                <td className="px-6 py-1 pl-12 text-sm font-medium text-purple-800">
                  Combo Total ({item.comboDetails?.totalSelectedQty || item.quantity} items)
                </td>
                <td className="px-6 py-1 text-center text-sm font-medium text-purple-800">
                  {item.quantity} combo{item.quantity > 1 ? 's' : ''}
                </td>
                <td className="px-6 py-1 text-center text-sm font-medium text-purple-800 font-DejaVu">
                  {formatPrice(item.comboDetails?.pricePerItem || item.price)}
                </td>
                <td className="px-6 py-1 text-right text-sm font-bold text-purple-800 font-DejaVu">
                  {formatPrice(item.comboDetails?.totalValue || (item.price * item.quantity))}
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </tbody>
  );
};

export default OrderTable;
