import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Button, Input, Select } from '@windmill/react-ui';

const ProductUnitsManager = ({
  units,
  productUnits,
  onAddUnit,
  onUpdateUnit,
  onRemoveUnit,
}) => {
  const { t } = useTranslation();

  const handleUpdate = (index, field, value) => {
    let processedValue = value;
    if (field === 'isDefault') {
      // When a unit is set as default, ensure all others are not.
      if (processedValue) {
        productUnits.forEach((_, i) => {
          if (i !== index) {
            onUpdateUnit(i, 'isDefault', false);
          }
        });
      }
    }
    
    // Ensure only one default can be true
    const isCurrentlyDefault = productUnits[index].isDefault;
    if (field === 'isDefault' && isCurrentlyDefault && !processedValue) {
      // Prevent un-toggling the only default unit directly.
      // User should select another unit as default instead.
      const defaultUnitsCount = productUnits.filter(pu => pu.isDefault).length;
      if (defaultUnitsCount <= 1) {
        // Or handle this with a notification to the user.
        return; 
      }
    }

    onUpdateUnit(index, field, processedValue);
  };
  
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('Product Units')}</h3>
      <p className="text-sm text-gray-600 mb-6">
        {t('Manage the different packaging units for this product.')}
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Unit')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Pack Quantity')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Price')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('MRP')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Default')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productUnits.map((pUnit, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select
                    value={pUnit.unit}
                    onChange={(e) => handleUpdate(index, 'unit', e.target.value)}
                    className="border h-10 text-sm focus:outline-none block w-full bg-gray-100 border-transparent focus:bg-white"
                  >
                    <option value="" disabled>Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name} ({unit.shortCode})
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Input
                    type="number"
                    value={pUnit.packQty}
                    onChange={(e) => handleUpdate(index, 'packQty', e.target.value)}
                    min={1}
                    className="border h-10 text-sm focus:outline-none block w-full bg-gray-100 border-transparent focus:bg-white"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Input
                    type="number"
                    value={pUnit.price}
                    onChange={(e) => handleUpdate(index, 'price', e.target.value)}
                    min={0}
                    className="border h-10 text-sm focus:outline-none block w-full bg-gray-100 border-transparent focus:bg-white"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Input
                    type="number"
                    value={pUnit.mrp}
                    onChange={(e) => handleUpdate(index, 'mrp', e.target.value)}
                    min={0}
                    className="border h-10 text-sm focus:outline-none block w-full bg-gray-100 border-transparent focus:bg-white"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={pUnit.isDefault}
                    onChange={(e) => handleUpdate(index, 'isDefault', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onRemoveUnit(index)}
                    className="text-red-600 hover:text-red-900 p-1 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        onClick={onAddUnit}
        className="mt-6 bg-green-500 hover:bg-green-600 text-white"
      >
        <FiPlus className="w-4 h-4 mr-2" />
        {t('Add New Unit')}
      </Button>
    </div>
  );
};

export default ProductUnitsManager; 