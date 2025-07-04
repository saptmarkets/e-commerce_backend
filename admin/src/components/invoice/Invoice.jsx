import React, { useState } from "react";
import { TableCell, TableBody, TableRow } from "@windmill/react-ui";
import { FiChevronDown, FiChevronUp, FiPackage } from "react-icons/fi";

const Invoice = ({ data, currency, getNumberTwo }) => {
  const [expandedCombos, setExpandedCombos] = useState(new Set());

  const toggleComboExpansion = (itemIndex) => {
    const newExpanded = new Set(expandedCombos);
    if (newExpanded.has(itemIndex)) {
      newExpanded.delete(itemIndex);
    } else {
      newExpanded.add(itemIndex);
    }
    setExpandedCombos(newExpanded);
  };

  return (
    <>
      <TableBody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 text-serif text-sm">
        {data?.cart?.map((item, i) => {
          const isCombo = item.isCombo && item.comboDetails?.productBreakdown;
          const isExpanded = expandedCombos.has(i);
          
          return (
            <React.Fragment key={i}>
              {/* Main Product Row */}
              <TableRow className={`dark:border-gray-700 dark:text-gray-400 ${isCombo ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                <TableCell className="px-6 py-1 whitespace-nowrap font-normal text-gray-500 text-left">
                  {i + 1}
                </TableCell>
                <TableCell className="px-6 py-1 font-normal text-gray-500">
                  <div className="flex items-center space-x-2">
                    {isCombo && (
                      <FiPackage className="text-purple-600 dark:text-purple-400 flex-shrink-0" size={16} />
                    )}
                    <div className="flex flex-col">
                      <span className={`text-gray-700 font-semibold dark:text-gray-300 text-xs ${
                        item.title.length > 15 ? "wrap-long-title" : ""
                      } ${isCombo ? 'text-purple-800 dark:text-purple-300' : ''}`}>
                        {item.title}
                      </span>
                      {/* Multi-unit information */}
                      {item.unitName && item.packQty > 1 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Unit: {item.unitName} ({item.packQty} pcs per {item.unitName})
                        </span>
                      )}
                      {item.sku && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          SKU: {item.sku}
                        </span>
                      )}
                    </div>
                    {isCombo && (
                      <button
                        onClick={() => toggleComboExpansion(i)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 transition-colors flex-shrink-0"
                        title="Show combo details"
                      >
                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                  {isCombo && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Combo Deal • {item.comboDetails.productBreakdown?.length || 0} items
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-6 py-1 whitespace-nowrap font-bold text-center">
                  <div>
                    <div>{item.quantity}</div>
                    {/* Show total base units for multi-unit items */}
                    {item.packQty > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ({item.quantity * item.packQty} total pcs)
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-1 whitespace-nowrap font-bold text-center">
                  <div>
                    <div>
                      {currency}
                      {getNumberTwo(item.price)}
                    </div>
                    {/* Show price per piece for multi-unit items */}
                    {item.packQty > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {currency}{getNumberTwo(item.price / item.packQty)}/pc
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-1 whitespace-nowrap text-right font-bold text-red-500 dark:text-emerald-500">
                  {currency}
                  {getNumberTwo(item.itemTotal || (item.price * item.quantity))}
                </TableCell>
              </TableRow>

              {/* Combo Details Rows - Expandable */}
              {isCombo && isExpanded && item.comboDetails?.productBreakdown?.map((comboProduct, j) => (
                <TableRow key={`${i}-combo-${j}`} className="bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
                  <TableCell className="px-6 py-1"></TableCell>
                  <TableCell className="px-6 py-1 pl-12">
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-purple-300 rounded-full flex-shrink-0"></span>
                      <span className="font-medium">{comboProduct.productTitle}</span>
                      <span className="text-xs text-gray-400">
                        ({comboProduct.unitName || 'pcs'})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-1 whitespace-nowrap text-center text-xs text-gray-600 dark:text-gray-400">
                    {comboProduct.quantity} × {item.quantity} = {comboProduct.quantity * item.quantity}
                  </TableCell>
                  <TableCell className="px-6 py-1 whitespace-nowrap text-center text-xs text-gray-500 dark:text-gray-400">
                    {currency}
                    {getNumberTwo(comboProduct.unitPrice || 0)}
                  </TableCell>
                  <TableCell className="px-6 py-1 whitespace-nowrap text-right text-xs text-gray-500 dark:text-gray-400">
                    {currency}
                    {getNumberTwo((comboProduct.unitPrice || 0) * comboProduct.quantity * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Combo Summary Row */}
              {isCombo && isExpanded && (
                <TableRow className="bg-purple-100 dark:bg-purple-900/30 border-b-2 border-purple-200 dark:border-purple-700">
                  <TableCell className="px-6 py-1"></TableCell>
                  <TableCell className="px-6 py-1 pl-12 text-xs font-semibold text-purple-800 dark:text-purple-300">
                    Combo Total ({item.comboDetails?.totalSelectedQty || item.quantity} items)
                  </TableCell>
                  <TableCell className="px-6 py-1 text-center text-xs font-semibold text-purple-800 dark:text-purple-300">
                    {item.quantity} combo{item.quantity > 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="px-6 py-1 text-center text-xs font-semibold text-purple-800 dark:text-purple-300">
                    {currency}
                    {getNumberTwo(item.comboDetails?.pricePerItem || item.price)}
                  </TableCell>
                  <TableCell className="px-6 py-1 text-right text-xs font-bold text-purple-800 dark:text-purple-300">
                    {currency}
                    {getNumberTwo(item.comboDetails?.totalValue || (item.price * item.quantity))}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </>
  );
};

export default Invoice; 