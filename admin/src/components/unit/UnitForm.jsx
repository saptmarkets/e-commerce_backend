import React, { useState, useEffect } from 'react';
import {
  Card,
  Label,
  Input,
  Select,
  Button,
  Textarea
} from '@windmill/react-ui';
import { FiSave, FiX, FiInfo } from 'react-icons/fi';

// Internal imports
import UnitServices from '@/services/UnitServices';
import { notifyError, notifySuccess } from '@/utils/toast';

const UnitForm = ({ unit, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    type: '',
    basicType: '',
    isParent: true,
    parentUnit: '',
    packValue: '',
    status: true,
    description: ''
  });

  const [parentUnits, setParentUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Unit types for basic classification
  const UNIT_TYPES = [
    { value: 'weight', label: 'Weight (kg, g, lb)' },
    { value: 'volume', label: 'Volume (l, ml, gal)' },
    { value: 'length', label: 'Length (m, cm, ft)' },
    { value: 'quantity', label: 'Quantity (pcs, dozen)' },
    { value: 'package', label: 'Package (pack, box, bottle)' },
    { value: 'area', label: 'Area (sqm, sqft)' },
    { value: 'custom', label: 'Custom' }
  ];

  // Basic types for parent units
  const BASIC_TYPES = [
    'weight', 'volume', 'length', 'quantity', 'package', 'area', 'custom'
  ];

  useEffect(() => {
    fetchParentUnits();
    if (isEdit && unit) {
      setFormData({
        name: unit.name || '',
        shortCode: unit.shortCode || '',
        type: unit.type || '',
        basicType: unit.basicType || '',
        isParent: unit.isParent !== undefined ? unit.isParent : true,
        parentUnit: unit.parentUnit?._id || '',
        packValue: unit.packValue || '',
        status: unit.status !== undefined ? unit.status : true,
        description: unit.description || ''
      });
    }
  }, [unit, isEdit]);

  const fetchParentUnits = async () => {
    try {
      const response = await UnitServices.getBasicUnits();
      setParentUnits(response.data || []);
    } catch (error) {
      console.error('Error fetching parent units:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Handle parent unit change
    if (field === 'isParent') {
      if (value) {
        setFormData(prev => ({
          ...prev,
          parentUnit: '',
          packValue: ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Unit name is required';
    }

    if (!formData.shortCode.trim()) {
      newErrors.shortCode = 'Short code is required';
    }

    if (!formData.isParent) {
      if (!formData.parentUnit) {
        newErrors.parentUnit = 'Parent unit is required for child units';
      }
      if (!formData.packValue) {
        newErrors.packValue = 'Pack value is required for child units';
      } else if (isNaN(formData.packValue) || Number(formData.packValue) <= 0) {
        newErrors.packValue = 'Pack value must be a positive number';
      }
    } else {
      if (!formData.basicType) {
        newErrors.basicType = 'Basic type is required for parent units';
      }
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
      setLoading(true);

      const unitData = {
        ...formData,
        packValue: formData.isParent ? null : Number(formData.packValue)
      };

      if (isEdit && unit) {
        await UnitServices.updateUnit(unit._id, unitData);
        notifySuccess('Unit updated successfully!');
      } else {
        await UnitServices.addUnit(unitData);
        notifySuccess('Unit created successfully!');
      }

      onSave && onSave();
    } catch (error) {
      notifyError(error.message || 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      shortCode: '',
      type: '',
      basicType: '',
      isParent: true,
      parentUnit: '',
      packValue: '',
      status: true,
      description: ''
    });
    setErrors({});
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isEdit ? 'Edit Unit' : 'Create New Unit'}
          </h2>
          <p className="text-sm text-gray-600">
            {formData.isParent 
              ? 'Create a parent unit that can have multiple child units'
              : 'Create a child unit that belongs to a parent unit'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Unit Type Selection */}
            <div className="md:col-span-2">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <FiInfo className="mr-2 text-blue-600" />
                  <h3 className="text-base font-medium">Unit Configuration</h3>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isParent}
                    onChange={(e) => handleInputChange('isParent', e.target.checked)}
                    className="mr-2"
                  />
                  <div>
                    <span className="font-medium">
                      {formData.isParent ? 'Parent Unit' : 'Child Unit'}
                    </span>
                    <p className="text-sm text-gray-600">
                      {formData.isParent 
                        ? 'This will be a basic unit that can have multiple variations'
                        : 'This will be a variation of an existing parent unit'
                      }
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <Label>
                <span>Unit Name *</span>
                <Input
                  className="mt-1"
                  placeholder="e.g., Kilogram, Piece, Pack"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                {errors.name && (
                  <span className="text-xs text-red-600 mt-1">{errors.name}</span>
                )}
              </Label>
            </div>

            <div>
              <Label>
                <span>Short Code *</span>
                <Input
                  className="mt-1"
                  placeholder="e.g., kg, pcs, pack"
                  value={formData.shortCode}
                  onChange={(e) => handleInputChange('shortCode', e.target.value)}
                />
                {errors.shortCode && (
                  <span className="text-xs text-red-600 mt-1">{errors.shortCode}</span>
                )}
              </Label>
            </div>

            {/* Parent Unit Configuration */}
            {formData.isParent ? (
              <>
                <div>
                  <Label>
                    <span>Basic Type *</span>
                    <Select
                      className="mt-1"
                      value={formData.basicType}
                      onChange={(e) => handleInputChange('basicType', e.target.value)}
                    >
                      <option value="">Select Basic Type</option>
                      {BASIC_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </Select>
                    {errors.basicType && (
                      <span className="text-xs text-red-600 mt-1">{errors.basicType}</span>
                    )}
                  </Label>
                </div>

                <div>
                  <Label>
                    <span>Unit Category</span>
                    <Select
                      className="mt-1"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {UNIT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                  </Label>
                </div>
              </>
            ) : (
              <>
                {/* Child Unit Configuration */}
                <div>
                  <Label>
                    <span>Parent Unit *</span>
                    <Select
                      className="mt-1"
                      value={formData.parentUnit}
                      onChange={(e) => handleInputChange('parentUnit', e.target.value)}
                    >
                      <option value="">Select Parent Unit</option>
                      {parentUnits.map(unit => (
                        <option key={unit._id} value={unit._id}>
                          {unit.name} ({unit.shortCode})
                        </option>
                      ))}
                    </Select>
                    {errors.parentUnit && (
                      <span className="text-xs text-red-600 mt-1">{errors.parentUnit}</span>
                    )}
                  </Label>
                </div>

                <div>
                  <Label>
                    <span>Pack Value *</span>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="How many parent units does this contain?"
                      value={formData.packValue}
                      onChange={(e) => handleInputChange('packValue', e.target.value)}
                    />
                    {errors.packValue && (
                      <span className="text-xs text-red-600 mt-1">{errors.packValue}</span>
                    )}
                  </Label>
                </div>
              </>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <Label>
                <span>Description</span>
                <Textarea
                  className="mt-1"
                  rows="3"
                  placeholder="Optional description for this unit"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Label>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.checked)}
                  className="mr-2"
                />
                <span>Active Status</span>
              </label>
            </div>

            {/* Preview */}
            {(formData.name || formData.shortCode) && (
              <div className="md:col-span-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-medium text-blue-900">Preview:</p>
                  <p className="text-sm text-blue-700">
                    {formData.isParent ? (
                      <>
                        This will create a <strong>parent unit</strong> "{formData.name} ({formData.shortCode})" 
                        {formData.basicType && ` of type "${formData.basicType}"`}
                      </>
                    ) : (
                      <>
                        This will create a <strong>child unit</strong> "{formData.name} ({formData.shortCode})" 
                        {formData.parentUnit && formData.packValue && (
                          <> containing {formData.packValue} units of the parent</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              layout="outline"
              onClick={onCancel || handleReset}
              disabled={loading}
            >
              <FiX className="w-4 h-4 mr-2" />
              {onCancel ? 'Cancel' : 'Reset'}
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
            >
              <FiSave className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : (isEdit ? 'Update Unit' : 'Create Unit')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default UnitForm; 