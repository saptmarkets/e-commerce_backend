import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Label,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  TableBody,
  Pagination,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert
} from '@windmill/react-ui';
import { 
  HiSearch as SearchIcon, 
  HiFilter as FilterIcon, 
  HiDownload as DownloadIcon, 
  HiEye as EyeIcon,
  HiTrendingUp as TrendingUpIcon,
  HiTrendingDown as TrendingDownIcon,
  HiRefresh as RefreshIcon
} from 'react-icons/hi';
import PageTitle from '@/components/Typography/PageTitle';
import SectionTitle from '@/components/Typography/SectionTitle';

// Import reusable chart components - Task 2.2.2 Implementation
import {
  SalesLineChart,
  CustomerSegmentChart,
  PaymentMethodChart,
  AdvancedFilters
} from '@/components/Reports';

/**
 * 📊 Sales Analytics Dashboard - Task 2.2.1 Implementation
 * Comprehensive sales analytics with real-time data visualization
 * Features: KPI cards, trend charts, product performance, customer insights
 */
const SalesAnalytics = () => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState(null);
  const [geographicData, setGeographicData] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    period: 'daily',
    startDate: '',
    endDate: '',
    compare: true,
    selectedCategory: '',
    selectedSegment: ''
  });
  
  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportType, setExportType] = useState('overview');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Get admin info from Redux store
  const { admin } = useSelector(state => state.auth);

  // Sample data for demonstration - will be populated from API
  const [sampleCategories] = useState([
    { id: 'electronics', name: 'Electronics' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'food', name: 'Food & Beverages' },
    { id: 'books', name: 'Books' }
  ]);

  const [sampleSegments] = useState([
    { id: 'vip', name: 'VIP Customers' },
    { id: 'regular', name: 'Regular Customers' },
    { id: 'new', name: 'New Customers' }
  ]);

  // Fetch sales analytics data
  const fetchSalesData = async (customFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        period: filters.period,
        compare: filters.compare,
        ...customFilters,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      console.log('📊 Fetching sales analytics data with params:', queryParams.toString());

      // Fetch all required data in parallel for better performance
      const [
        overviewResponse,
        trendsResponse,
        productsResponse,
        customersResponse,
        geographicResponse,
        paymentResponse
      ] = await Promise.all([
        fetch(`/api/reports/sales/overview?${queryParams}`),
        fetch(`/api/reports/sales/trends?granularity=${filters.period}&${queryParams}`),
        fetch(`/api/reports/sales/products?limit=20&${queryParams}`),
        fetch(`/api/reports/sales/customers?${queryParams}`),
        fetch(`/api/reports/sales/geographic?${queryParams}`),
        fetch(`/api/reports/sales/payment-methods?${queryParams}`)
      ]);

      // Check if all requests were successful
      if (!overviewResponse.ok) throw new Error('Failed to fetch sales overview');
      if (!trendsResponse.ok) throw new Error('Failed to fetch sales trends');
      if (!productsResponse.ok) throw new Error('Failed to fetch product performance');
      if (!customersResponse.ok) throw new Error('Failed to fetch customer analytics');
      if (!geographicResponse.ok) throw new Error('Failed to fetch geographic data');
      if (!paymentResponse.ok) throw new Error('Failed to fetch payment methods');

      // Parse all responses
      const [
        overviewData,
        trendsData,
        productsData,
        customersData,
        geographicData,
        paymentData
      ] = await Promise.all([
        overviewResponse.json(),
        trendsResponse.json(),
        productsResponse.json(),
        customersResponse.json(),
        geographicResponse.json(),
        paymentResponse.json()
      ]);

      // Update state with fetched data
      setOverview(overviewData.data);
      setTrends(trendsData.data.trends || []);
      setTopProducts(productsData.data.products || []);
      setCustomerAnalytics(customersData.data);
      setGeographicData(geographicData.data.locations || []);
      setPaymentMethods(paymentData.data.paymentMethods || []);

      console.log('✅ Sales analytics data loaded successfully');

    } catch (err) {
      console.error('❌ Error fetching sales data:', err);
      setError(err.message || 'Failed to load sales analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and filter changes
  useEffect(() => {
    fetchSalesData();
  }, [filters.period, filters.startDate, filters.endDate, filters.compare]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchSalesData();
  };

  // Handle export
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        format: exportFormat,
        reportType: exportType,
        ...filters
      });

      const response = await fetch(`/api/reports/sales/export?${queryParams}`, {
        method: 'GET'
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      // In a real implementation, this would trigger a file download
      console.log('📄 Export data:', data);
      
      // For now, show success message
      alert('Export prepared successfully! Download functionality will be implemented in Phase 3.');
      
    } catch (err) {
      console.error('❌ Export error:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setIsExportModalOpen(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Get trend indicator
  const getTrendIndicator = (value) => {
    if (value > 0) {
      return <TrendingUpIcon className="w-5 h-5 text-green-500" />;
    } else if (value < 0) {
      return <TrendingDownIcon className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return (
    <>
      <PageTitle>Sales Analytics</PageTitle>
      
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
              📊 Sales Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive sales performance analysis and insights
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              size="small"
              layout="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="small"
              onClick={() => setIsExportModalOpen(true)}
              disabled={isLoading}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="danger" className="mb-6">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Advanced Filters Section - Task 2.2.3 Implementation */}
      <AdvancedFilters
        onFilterChange={handleAdvancedFilterChange}
        initialFilters={filters}
        categories={sampleCategories}
        segments={sampleSegments}
        showCategoryFilter={true}
        showSegmentFilter={true}
        showPeriodComparison={true}
        showDatePresets={true}
        showOrderValueFilter={true}
        className="mb-6"
      />

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(overview.overview.totalRevenue)}</p>
                  {overview.comparison && (
                    <div className="flex items-center mt-1">
                      {getTrendIndicator(overview.comparison.growth.revenueGrowth)}
                      <span className="ml-1 text-sm text-blue-100">
                        {formatPercentage(overview.comparison.growth.revenueGrowth)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-blue-200 text-4xl">💰</div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold">{overview.overview.totalOrders.toLocaleString()}</p>
                  {overview.comparison && (
                    <div className="flex items-center mt-1">
                      {getTrendIndicator(overview.comparison.growth.orderGrowth)}
                      <span className="ml-1 text-sm text-green-100">
                        {formatPercentage(overview.comparison.growth.orderGrowth)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-green-200 text-4xl">🛍️</div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(overview.overview.avgOrderValue)}</p>
                  {overview.comparison && (
                    <div className="flex items-center mt-1">
                      {getTrendIndicator(overview.comparison.growth.aovGrowth)}
                      <span className="ml-1 text-sm text-purple-100">
                        {formatPercentage(overview.comparison.growth.aovGrowth)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-purple-200 text-4xl">📊</div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Unique Customers</p>
                  <p className="text-2xl font-bold">{overview.overview.uniqueCustomers.toLocaleString()}</p>
                  {overview.comparison && (
                    <div className="flex items-center mt-1">
                      {getTrendIndicator(overview.comparison.growth.customerGrowth)}
                      <span className="ml-1 text-sm text-indigo-100">
                        {formatPercentage(overview.comparison.growth.customerGrowth)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-indigo-200 text-4xl">👥</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Charts Section - Task 2.2.2 Implementation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trends Chart */}
        <Card>
          <CardBody>
            <SalesLineChart
              data={trends}
              title="Revenue Trends"
              showMovingAverage={true}
              height={320}
              loading={isLoading}
              className="w-full"
            />
          </CardBody>
        </Card>

        {/* Customer Segments Chart */}
        <Card>
          <CardBody>
            <CustomerSegmentChart
              data={customerAnalytics?.segments || []}
              title="Customer Segments"
              height={320}
              loading={isLoading}
              showPercentages={true}
              className="w-full"
            />
          </CardBody>
        </Card>
      </div>

      {/* Payment Methods Chart */}
      <Card className="mb-8">
        <CardBody>
          <PaymentMethodChart
            data={paymentMethods}
            title="Payment Methods Distribution"
            height={400}
            loading={isLoading}
            showCenterText={true}
            centerTextType="total"
            className="w-full"
          />
        </CardBody>
      </Card>

      {/* Top Products Table */}
      <Card className="mb-8">
        <CardBody>
          <SectionTitle>Top Performing Products</SectionTitle>
          <TableContainer className="mt-4">
            <Table>
              <TableHeader>
                <tr>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Avg Price</TableCell>
                  <TableCell>Rev %</TableCell>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="text-2xl text-gray-300 mr-4">⏳</div>
                        <span>Loading products...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : topProducts.length > 0 ? (
                  topProducts.slice(0, 10).map((product, index) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.title}</p>
                            <p className="text-xs text-gray-500">{product.productId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge type="neutral">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.totalRevenue)}</TableCell>
                      <TableCell>{product.totalQuantity.toLocaleString()}</TableCell>
                      <TableCell>{product.totalOrders.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(product.avgPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${product.revenuePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{product.revenuePercentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-center">
                        <div className="text-4xl text-gray-300 mb-4">🛍️</div>
                        <p className="text-gray-500">No products data available</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Geographic Data */}
      {geographicData.length > 0 && (
        <Card>
          <CardBody>
            <SectionTitle>Geographic Sales Distribution</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {geographicData.slice(0, 6).map((location, index) => (
                <div key={location.city} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-200">
                        {location.city || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {location.customerCount} customers
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(location.revenue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {location.orders} orders
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Export Modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}>
        <ModalHeader>Export Sales Report</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label>
                <span>Export Format</span>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mt-1"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </Select>
              </Label>
            </div>
            <div>
              <Label>
                <span>Report Type</span>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mt-1"
                >
                  <option value="overview">Sales Overview</option>
                  <option value="products">Product Performance</option>
                  <option value="customers">Customer Analytics</option>
                  <option value="trends">Sales Trends</option>
                  <option value="geographic">Geographic Analysis</option>
                </Select>
              </Label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button layout="outline" onClick={() => setIsExportModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export Report
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default SalesAnalytics; 