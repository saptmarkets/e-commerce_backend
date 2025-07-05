import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

/**
 * 💳 PaymentMethodChart Component - Task 2.2.2 Implementation
 * Reusable doughnut chart component for payment method distribution
 * Features: Interactive segments, center text, revenue display
 */
const PaymentMethodChart = ({ 
  data = [], 
  title = "Payment Methods",
  height = 320,
  loading = false,
  className = "",
  showCenterText = true,
  centerTextType = "total", // "total" | "count" | "percentage"
  colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#14B8A6'  // Teal
  ],
  options = {}
}) => {
  // Default chart options for consistent styling
  const defaultOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%', // Makes it a doughnut chart
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          },
          generateLabels: function(chart) {
            const datasets = chart.data.datasets;
            if (datasets.length) {
              const dataset = datasets[0];
              const total = dataset.data.reduce((sum, value) => sum + value, 0);
              
              return chart.data.labels.map((label, index) => {
                const value = dataset.data[index];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[index],
                  strokeStyle: dataset.borderColor?.[index] || '#ffffff',
                  lineWidth: 2,
                  pointStyle: 'circle',
                  hidden: false,
                  index: index
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            
            // Format value as currency
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(value);
            
            return `${label}: ${formattedValue} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff'
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest'
    }
  }), [title]);

  // Merge custom options with defaults
  const mergedOptions = useMemo(() => ({
    ...defaultOptions,
    ...options
  }), [defaultOptions, options]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Extract payment method data
    const methods = data.map(item => ({
      paymentMethod: item.paymentMethod || item.method || item.label || 'Unknown',
      totalRevenue: item.totalRevenue || item.revenue || item.value || 0,
      totalOrders: item.totalOrders || item.orders || item.count || 0,
      uniqueCustomers: item.uniqueCustomers || item.customers || 0
    }));

    // Filter out zero values
    const validMethods = methods.filter(method => method.totalRevenue > 0);

    if (validMethods.length === 0) return null;

    return {
      labels: validMethods.map(method => method.paymentMethod),
      datasets: [
        {
          data: validMethods.map(method => method.totalRevenue),
          backgroundColor: colors.slice(0, validMethods.length),
          borderColor: colors.slice(0, validMethods.length).map(() => '#ffffff'),
          borderWidth: 2,
          hoverBackgroundColor: colors.slice(0, validMethods.length).map(color => 
            // Make colors slightly lighter on hover
            color.replace(/^#/, '') + 'CC'
          ),
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3
        }
      ]
    };
  }, [data, colors]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalRevenue = data.reduce((sum, item) => sum + (item.totalRevenue || item.revenue || item.value || 0), 0);
    const totalOrders = data.reduce((sum, item) => sum + (item.totalOrders || item.orders || item.count || 0), 0);
    const totalCustomers = data.reduce((sum, item) => sum + (item.uniqueCustomers || item.customers || 0), 0);
    
    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      mostPopular: data.reduce((max, item) => 
        (item.totalOrders || item.orders || 0) > (max.totalOrders || max.orders || 0) ? item : max
      , data[0])
    };
  }, [data]);

  // Get center text based on type
  const getCenterText = useMemo(() => {
    if (!showCenterText || !statistics) return null;
    
    switch (centerTextType) {
      case 'total':
        return {
          main: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            notation: 'compact'
          }).format(statistics.totalRevenue),
          sub: 'Total Revenue'
        };
      case 'count':
        return {
          main: statistics.totalOrders.toLocaleString(),
          sub: 'Total Orders'
        };
      case 'percentage':
        return {
          main: '100%',
          sub: 'All Methods'
        };
      default:
        return null;
    }
  }, [showCenterText, centerTextType, statistics]);

  // Loading state
  if (loading) {
    return (
      <div className={`${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading payment methods...</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!chartData) {
    return (
      <div className={`${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl text-gray-300 mb-4">💳</div>
            <p className="text-gray-500 text-lg font-medium">No payment methods data</p>
            <p className="text-gray-400 text-sm mt-2">Chart will appear when data is loaded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Chart Title and Summary */}
      <div className="mb-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Payment Methods: {chartData.labels.length}</span>
          <span>
            Avg Order Value: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(statistics?.avgOrderValue || 0)}
          </span>
        </div>
      </div>

      {/* Chart Container with Center Text */}
      <div className="relative" style={{ height: height - 120 }}>
        <Doughnut data={chartData} options={mergedOptions} />
        
        {/* Center Text Overlay */}
        {getCenterText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {getCenterText.main}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getCenterText.sub}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Statistics */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Most Popular</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {statistics?.mostPopular?.paymentMethod || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            {statistics?.mostPopular?.totalOrders || 0} orders
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Methods</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {chartData.labels.length}
          </div>
          <div className="text-xs text-gray-500">
            Active payment options
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Orders</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {statistics?.totalOrders.toLocaleString() || 0}
          </div>
          <div className="text-xs text-gray-500">
            Across all methods
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodChart; 