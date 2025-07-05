import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
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
 * 👥 CustomerSegmentChart Component - Task 2.2.2 Implementation
 * Reusable pie chart component for customer segmentation visualization
 * Features: Interactive segments, custom colors, percentage display
 */
const CustomerSegmentChart = ({ 
  data = [], 
  title = "Customer Segments",
  height = 320,
  loading = false,
  className = "",
  showPercentages = true,
  animationDuration = 1000,
  colors = [
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#14B8A6'  // Teal
  ],
  options = {}
}) => {
  // Default chart options for consistent styling
  const defaultOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
                  text: showPercentages ? `${label} (${percentage}%)` : label,
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
      duration: animationDuration,
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
  }), [title, showPercentages, animationDuration]);

  // Merge custom options with defaults
  const mergedOptions = useMemo(() => ({
    ...defaultOptions,
    ...options
  }), [defaultOptions, options]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Extract segment data
    const segments = data.map(item => ({
      segment: item.segment || item.label || 'Unknown',
      value: item.totalRevenue || item.revenue || item.value || 0,
      count: item.count || 0
    }));

    // Filter out zero values
    const validSegments = segments.filter(segment => segment.value > 0);

    if (validSegments.length === 0) return null;

    return {
      labels: validSegments.map(segment => segment.segment),
      datasets: [
        {
          data: validSegments.map(segment => segment.value),
          backgroundColor: colors.slice(0, validSegments.length),
          borderColor: colors.slice(0, validSegments.length).map(() => '#ffffff'),
          borderWidth: 2,
          hoverBackgroundColor: colors.slice(0, validSegments.length).map(color => 
            // Make colors slightly lighter on hover
            color.replace(/^#/, '') + '99'
          ),
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3
        }
      ]
    };
  }, [data, colors]);

  // Calculate total for summary
  const totalValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + (item.totalRevenue || item.revenue || item.value || 0), 0);
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <div className={`${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading customer segments...</p>
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
            <div className="text-6xl text-gray-300 mb-4">👥</div>
            <p className="text-gray-500 text-lg font-medium">No customer segments data</p>
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
          <span>Total Segments: {chartData.labels.length}</span>
          <span>
            Total Revenue: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(totalValue)}
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ height: height - 80 }}>
        <Pie data={chartData} options={mergedOptions} />
      </div>

      {/* Additional Statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Largest Segment</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {chartData.labels[0] || 'N/A'}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Revenue</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(totalValue / (chartData.labels.length || 1))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSegmentChart; 