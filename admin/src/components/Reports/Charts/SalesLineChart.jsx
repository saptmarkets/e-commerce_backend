import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * 📈 SalesLineChart Component - Task 2.2.2 Implementation
 * Reusable line chart component for sales revenue trends
 * Features: Revenue trends, moving averages, responsive design
 */
const SalesLineChart = ({ 
  data = [], 
  title = "Sales Trends",
  showMovingAverage = true,
  height = 320,
  loading = false,
  className = "",
  options = {}
}) => {
  // Default chart options for consistent styling
  const defaultOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
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
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(context.parsed.y);
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          borderDash: [2, 2]
        },
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              notation: 'compact'
            }).format(value);
          },
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Revenue ($)',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3,
        tension: 0.4
      }
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

    const datasets = [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue || 0),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: 'white',
        pointHoverBackgroundColor: 'rgb(99, 102, 241)',
        pointHoverBorderColor: 'white'
      }
    ];

    // Add moving average if enabled and data is available
    if (showMovingAverage && data.some(item => item.movingAvg7Day)) {
      datasets.push({
        label: '7-Day Moving Average',
        data: data.map(item => item.movingAvg7Day || null),
        borderColor: 'rgb(245, 101, 101)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(245, 101, 101)',
        pointBorderColor: 'white'
      });
    }

    return {
      labels: data.map(item => {
        const date = new Date(item.date || item.period);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }),
      datasets
    };
  }, [data, showMovingAverage]);

  // Loading state
  if (loading) {
    return (
      <div className={`${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading chart data...</p>
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
            <div className="text-6xl text-gray-300 mb-4">📈</div>
            <p className="text-gray-500 text-lg font-medium">No data available</p>
            <p className="text-gray-400 text-sm mt-2">Chart will appear when data is loaded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} style={{ height }}>
      <Line data={chartData} options={mergedOptions} />
    </div>
  );
};

export default SalesLineChart; 