import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Select, 
  Label, 
  Badge 
} from '@windmill/react-ui';
import { 
  HiCalendar as CalendarIcon, 
  HiFilter as FilterIcon, 
  HiX as XIcon, 
  HiChevronDown as ChevronDownIcon,
  HiRefresh as RefreshIcon 
} from 'react-icons/hi';

/**
 * 🔍 AdvancedFilters Component - Task 2.2.3 Implementation
 * Comprehensive filtering system for reports with date ranges, categories, and segments
 * Features: Date presets, period comparison, category selection, segment filtering
 */
const AdvancedFilters = ({
  onFilterChange,
  initialFilters = {},
  showCategoryFilter = true,
  showSegmentFilter = true,
  showPeriodComparison = true,
  showDatePresets = true,
  showOrderValueFilter = false,
  showGeographicFilter = false,
  categories = [],
  segments = [],
  locations = [],
  className = "",
  compact = false
}) => {
  // Filter state
  const [filters, setFilters] = useState({
    period: 'daily',
    startDate: '',
    endDate: '',
    compare: true,
    selectedCategory: '',
    selectedSegment: '',
    minOrderValue: '',
    maxOrderValue: '',
    selectedLocation: '',
    customDateRange: false,
    ...initialFilters
  });

  // UI state
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Date presets for quick selection
  const datePresets = useMemo(() => [
    { 
      label: 'Today', 
      value: 'today',
      getDates: () => {
        const today = new Date();
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Yesterday', 
      value: 'yesterday',
      getDates: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Last 7 Days', 
      value: 'last7days',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Last 30 Days', 
      value: 'last30days',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'This Month', 
      value: 'thismonth',
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Last Month', 
      value: 'lastmonth',
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'This Year', 
      value: 'thisyear',
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Custom Range', 
      value: 'custom',
      getDates: () => ({ startDate: '', endDate: '' })
    }
  ], []);

  // Check if filters have active values
  useEffect(() => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'period' && value === 'daily') return false;
      if (key === 'compare' && value === true) return false;
      if (key === 'customDateRange' && value === false) return false;
      return value !== '' && value !== null && value !== undefined;
    });
    
    setHasActiveFilters(activeFilters.length > 0);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Call parent callback
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Handle date preset selection
  const handleDatePresetChange = (preset) => {
    if (preset === 'custom') {
      handleFilterChange('customDateRange', true);
    } else {
      const dates = datePresets.find(p => p.value === preset)?.getDates();
      if (dates) {
        const newFilters = {
          ...filters,
          startDate: dates.startDate,
          endDate: dates.endDate,
          customDateRange: false
        };
        setFilters(newFilters);
        
        if (onFilterChange) {
          onFilterChange(newFilters);
        }
      }
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      period: 'daily',
      startDate: '',
      endDate: '',
      compare: true,
      selectedCategory: '',
      selectedSegment: '',
      minOrderValue: '',
      maxOrderValue: '',
      selectedLocation: '',
      customDateRange: false
    };
    
    setFilters(clearedFilters);
    
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  // Apply filters
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'period' && value === 'daily') return false;
      if (key === 'compare' && value === true) return false;
      if (key === 'customDateRange' && value === false) return false;
      return value !== '' && value !== null && value !== undefined;
    }).length;
  };

  return (
    <Card className={className}>
      <CardBody>
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FilterIcon className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Advanced Filters
            </h3>
            {hasActiveFilters && (
              <Badge type="primary" className="ml-2">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                size="small"
                layout="outline"
                onClick={clearAllFilters}
              >
                <XIcon className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            
            {compact && (
              <Button
                size="small"
                layout="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDownIcon 
                  className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Content */}
        {isExpanded && (
          <div className="space-y-6">
            {/* Date Range Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                📅 Date Range
              </Label>
              
              {/* Date Presets */}
              {showDatePresets && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {datePresets.map((preset) => (
                    <Button
                      key={preset.value}
                      size="small"
                      layout="outline"
                      onClick={() => handleDatePresetChange(preset.value)}
                      className={`text-xs ${
                        filters.customDateRange && preset.value === 'custom' ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2">
                    <span>Start Date</span>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="mt-1"
                    />
                  </Label>
                </div>
                <div>
                  <Label className="mb-2">
                    <span>End Date</span>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="mt-1"
                    />
                  </Label>
                </div>
                <div>
                  <Label className="mb-2">
                    <span>Period</span>
                    <Select
                      value={filters.period}
                      onChange={(e) => handleFilterChange('period', e.target.value)}
                      className="mt-1"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </Label>
                </div>
              </div>

              {/* Period Comparison */}
              {showPeriodComparison && (
                <div className="mt-4">
                  <Label check className="flex items-center">
                    <Input
                      type="checkbox"
                      checked={filters.compare}
                      onChange={(e) => handleFilterChange('compare', e.target.checked)}
                    />
                    <span className="ml-2 text-sm">Compare with previous period</span>
                  </Label>
                </div>
              )}
            </div>

            {/* Category Filter */}
            {showCategoryFilter && categories.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  🏷️ Category Filter
                </Label>
                <Select
                  value={filters.selectedCategory}
                  onChange={(e) => handleFilterChange('selectedCategory', e.target.value)}
                  className="w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id || category.value} value={category.id || category.value}>
                      {category.name || category.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Segment Filter */}
            {showSegmentFilter && segments.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  👥 Customer Segment
                </Label>
                <Select
                  value={filters.selectedSegment}
                  onChange={(e) => handleFilterChange('selectedSegment', e.target.value)}
                  className="w-full"
                >
                  <option value="">All Segments</option>
                  {segments.map((segment) => (
                    <option key={segment.id || segment.value} value={segment.id || segment.value}>
                      {segment.name || segment.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Order Value Filter */}
            {showOrderValueFilter && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  💰 Order Value Range
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">
                      <span>Min Value ($)</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.minOrderValue}
                        onChange={(e) => handleFilterChange('minOrderValue', e.target.value)}
                        className="mt-1"
                      />
                    </Label>
                  </div>
                  <div>
                    <Label className="mb-2">
                      <span>Max Value ($)</span>
                      <Input
                        type="number"
                        placeholder="No limit"
                        value={filters.maxOrderValue}
                        onChange={(e) => handleFilterChange('maxOrderValue', e.target.value)}
                        className="mt-1"
                      />
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Geographic Filter */}
            {showGeographicFilter && locations.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                  🌍 Location Filter
                </Label>
                <Select
                  value={filters.selectedLocation}
                  onChange={(e) => handleFilterChange('selectedLocation', e.target.value)}
                  className="w-full"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location.id || location.value} value={location.id || location.value}>
                      {location.name || location.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                {hasActiveFilters ? (
                  <span>✅ {getActiveFilterCount()} filters applied</span>
                ) : (
                  <span>📊 No filters applied</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="small"
                  layout="outline"
                  onClick={applyFilters}
                  disabled={!hasActiveFilters}
                >
                  <RefreshIcon className="w-4 h-4 mr-1" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default AdvancedFilters; 