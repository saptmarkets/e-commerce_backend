import React, { useEffect, useState } from "react";
import { 
  FiDownload, 
  FiChevronDown, 
  FiChevronRight, 
  FiPackage,
  FiTag,
  FiDollarSign,
  FiMapPin,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiFilter,
  FiChevronLeft,
  FiChevronRight as FiChevronRightIcon,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";
import PageTitle from "@/components/Typography/PageTitle";
import Loading from "@/components/preloader/Loading";
import { notifySuccess, notifyError, notifyInfo } from "@/utils/toast";
import OdooCatalogServices from "@/services/OdooCatalogServices";
import Select from "react-select";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import requests from "@/services/httpService";

const OdooCatalog = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [importLoading, setImportLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [importStatusFilter, setImportStatusFilter] = useState(null);
  const [showAllPages, setShowAllPages] = useState(false); // New state for "show all" mode
  const [customPageSize, setCustomPageSize] = useState(20); // New state for custom page size
  const [importedIds, setImportedIds] = useState([]);
  const { currency, getNumberTwo } = useUtilsFunction();

  // Import status filter options
  const importStatusOptions = [
    { value: null, label: "All Products" },
    { value: "imported", label: "Imported Products" },
    { value: "pending", label: "Not Imported" },
    { value: "failed", label: "Import Failed" },
  ];

  // Page size options
  const pageSizeOptions = [
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 200, label: "200 per page" },
    { value: 500, label: "500 per page" },
  ];

  // Fetch live import status for visible products
  const fetchImportStatus = async (productList) => {
    try {
      const odooProductIds = productList.map((p) => p.id);
      if (odooProductIds.length === 0) {
        setImportedIds([]);
        return;
      }
      const res = await requests.post("/products/check-imported", { odooProductIds });
      setImportedIds(res.imported || []);
    } catch (err) {
      setImportedIds([]);
      console.error("Error fetching import status:", err);
    }
  };

  // Fetch products and then fetch import status
  const fetchProducts = async (page = 1, pageSize = null) => {
    try {
      setLoading(true);
      
      // Determine the actual page size to use
      const actualPageSize = showAllPages 
        ? Math.min(pagination.total || 1000, 1000) // Cap at 1000 for performance
        : (pageSize || pagination.per_page);
      
      const res = await OdooCatalogServices.listProducts({
        page: showAllPages ? 1 : page, // Always fetch page 1 when showing all
        limit: actualPageSize,
        include: 'details',
        search: search || undefined,
        category_id: selectedCat?.value || undefined,
        sync_status: importStatusFilter?.value || undefined,
      });
      
      const data = res.data?.data || res.data;
      const productsData = data?.products || [];
      

      
      setProducts(productsData);
      setPagination({
        ...data?.pagination,
        per_page: actualPageSize,
        current_page: showAllPages ? 1 : (data?.pagination?.current_page || page)
      });
      // Fetch live import status after products are loaded
      await fetchImportStatus(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      notifyError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [importStatusFilter, showAllPages, selectedCat]);

  useEffect(() => {
    (async () => {
      try {
        const res = await OdooCatalogServices.getCategories({ limit: 1000 });
        const catsRaw = res?.data?.categories || res.data?.data?.categories || res?.categories || [];
        const options = catsRaw.map(c => ({
          value: c.id,
          label: c.complete_name || c.name || `Category ${c.id}`
        })).sort((a,b)=>a.label.localeCompare(b.label));
        setCategories(options);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const toggleSelect = (pid) => {
    setSelectedIds((prev) => {
      return prev.includes(pid) 
        ? prev.filter((id) => id !== pid) 
        : [...prev, pid];
    });
  };

  const toggleSelectAll = () => {
    // Check if all current products are selected
    const allCurrentProductsSelected = products.every(p => selectedIds.includes(p.id));
    
    if (allCurrentProductsSelected) {
      // If all are selected, deselect all current products
      setSelectedIds(prev => prev.filter(id => !products.some(p => p.id === id)));
    } else {
      // If not all are selected, select all current products (add to existing selection)
      const currentProductIds = products.map(p => p.id);
      setSelectedIds(prev => {
        const newSelection = [...prev];
        currentProductIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const toggleExpanded = (pid) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pid)) {
        newSet.delete(pid);
      } else {
        newSet.add(pid);
      }
      return newSet;
    });
  };

  const runImport = async () => {
    if (selectedIds.length === 0) {
      notifyInfo('Please select at least one product to import');
      return;
    }

    try {
      setImportLoading(true);
      notifyInfo(`Starting import of ${selectedIds.length} products...`);
      
      const res = await OdooCatalogServices.runImport({ 
        productIds: selectedIds 
      });
      
      const results = res.data?.data || res.data;
      
      notifySuccess(
        `${t("ImportCompletedSuccessfully")} Products: ${results?.products || 0}, Categories: ${results?.categories || 0}`
      );
      
      setSelectedIds([]);
      await fetchProducts(pagination.current_page);
      
    } catch (err) {
      console.error('Import error:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Import failed';
      notifyError(`Import failed: ${errorMessage}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handlePageSizeChange = (selectedOption) => {
    setCustomPageSize(selectedOption.value);
    setPagination(prev => ({ ...prev, per_page: selectedOption.value, current_page: 1 }));
    fetchProducts(1, selectedOption.value);
  };

  const toggleShowAllPages = () => {
    const newShowAll = !showAllPages;
    setShowAllPages(newShowAll);
    
    if (newShowAll) {
      notifyInfo(`Loading all ${pagination.total} products for bulk operations...`);
    } else {
      // Reset to normal pagination
      setPagination(prev => ({ ...prev, per_page: customPageSize, current_page: 1 }));
    }
  };

  const formatPrice = (price) => {
    return price ? `${currency}${getNumberTwo(price)}` : 'N/A';
  };

  const formatStock = (stock) => {
    return stock !== undefined && stock !== null ? stock : 'N/A';
  };

  // Updated import status display logic
  const getImportStatusDisplay = (product) => {
    if (importedIds.includes(product.id)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheck className="w-3 h-3 mr-1" />
          Imported
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <FiRefreshCw className="w-3 h-3 mr-1" />
        Not Imported
      </span>
    );
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.total_pages;
    const currentPage = pagination.current_page;
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  if (loading && products.length === 0) return <Loading />;

  return (
    <>
      <PageTitle>Odoo Catalog</PageTitle>

      {/* Search and Filter Section */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Select
              options={categories}
              value={selectedCat}
              onChange={setSelectedCat}
              placeholder="All Categories"
              isClearable
              className="text-sm"
            />
          </div>

          {/* Import Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiFilter className="inline mr-1" />
              Import Status
            </label>
            <Select
              options={importStatusOptions}
              value={importStatusFilter}
              onChange={setImportStatusFilter}
              placeholder="All Products"
              isClearable
              className="text-sm"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={() => fetchProducts(1)}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Advanced Pagination Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {selectedIds.length > 0 ? (
                <span>
                  <span className="font-medium text-blue-600">{selectedIds.length}</span> product{selectedIds.length > 1 ? 's' : ''} selected total
                  {products.length > 0 && (
                    <span className="text-gray-500 ml-1">
                      ({products.filter(p => selectedIds.includes(p.id)).length} on this page)
                    </span>
                  )}
                </span>
              ) : (
                `${pagination.total || 0} products found`
              )}
            </div>
            
            {/* Page Size Selector */}
            {!showAllPages && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select
                  options={pageSizeOptions}
                  value={pageSizeOptions.find(opt => opt.value === customPageSize)}
                  onChange={handlePageSizeChange}
                  className="text-sm min-w-[120px]"
                  isSearchable={false}
                />
              </div>
            )}

            {/* Show All Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleShowAllPages}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  showAllPages 
                    ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {showAllPages ? 'Show Paginated' : 'Show All Pages'}
              </button>
              {showAllPages && (
                <span className="text-xs text-orange-600 font-medium">
                  Showing all {products.length} products
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Clear All
              </button>
            )}
          <button
            onClick={runImport}
            disabled={selectedIds.length === 0 || importLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiDownload className={importLoading ? 'animate-spin' : ''} />
            {importLoading ? 'Importing...' : `Import Selected (${selectedIds.length})`}
          </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={products.length > 0 && products.every(p => selectedIds.includes(p.id))}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left">ID</th>
              <th className="px-3 py-3 text-left">Product Name</th>
              <th className="px-3 py-3 text-left">SKU</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-left">Price</th>
              <th className="px-3 py-3 text-left">Stock</th>
              <th className="px-3 py-3 text-left">Units</th>
              <th className="px-3 py-3 text-left">Import Status</th>
              <th className="px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <React.Fragment key={product.id}>
                {/* Main Product Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded"
                      data-product-id={product.id}
                      data-product-name={product.name}
                    />
                    <span className="text-xs text-gray-500 ml-1">
                      ID: {product.id}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{product.id}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{product.name}</div>
                    {product.barcode && (
                      <div className="text-xs text-gray-500">
                        <FiTag className="inline mr-1" />
                        {product.barcode}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{product.default_code || 'N/A'}</td>
                  <td className="px-3 py-3">
                    {product.category?.name || 'Uncategorized'}
                  </td>
                  <td className="px-3 py-3">{formatPrice(product.list_price)}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      (product.total_stock || 0) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatStock(product.total_stock)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {product.barcode_units?.length || 0} units
                  </td>
                  <td className="px-3 py-3">
                    {getImportStatusDisplay(product)}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleExpanded(product.id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {expandedRows.has(product.id) ? (
                        <FiChevronDown />
                      ) : (
                        <FiChevronRight />
                      )}
                      Details
                    </button>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {expandedRows.has(product.id) && (
                  <tr className="bg-blue-50">
                    <td colSpan={10} className="px-3 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <FiPackage />
                            Product Information
                          </h4>
                          
                          <div className="bg-white p-3 rounded border space-y-2">
                            <div><strong>Internal Reference:</strong> {product.default_code || 'N/A'}</div>
                            <div><strong>Barcode:</strong> {product.barcode || 'N/A'}</div>
                            <div><strong>Type:</strong> {product.detailed_type || 'Product'}</div>
                            <div><strong>UoM:</strong> {product.uom?.name || 'N/A'}</div>
                            <div><strong>Cost Price:</strong> {formatPrice(product.standard_price)}</div>
                            <div><strong>Sale Price:</strong> {formatPrice(product.list_price)}</div>
                            <div><strong>Available Qty:</strong> {formatStock(product.qty_available)}</div>
                            <div><strong>Import Status:</strong> {getImportStatusDisplay(product)}</div>
                            {product.store_product_id && (
                              <div><strong>Store Product ID:</strong> <span className="font-mono text-xs">{product.store_product_id}</span></div>
                            )}
                          </div>

                          {/* Category Information */}
                          {product.category && (
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">Category</h5>
                              <div className="bg-white p-3 rounded border">
                                <div><strong>Name:</strong> {product.category.name}</div>
                                <div><strong>Complete Path:</strong> {product.category.complete_name}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Units and Stock */}
                        <div className="space-y-4">
                          
                          {/* Barcode Units */}
                          {product.barcode_units && product.barcode_units.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <FiPackage />
                                Barcode Units ({product.barcode_unit_ids ? product.barcode_unit_ids.length : 0})
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {product.barcode_unit_ids && product.barcode_units
                                  .filter(unit => product.barcode_unit_ids.includes(unit.id))
                                  .map((unit, idx) => (
                                    <div key={unit.barcode || idx} className="bg-white p-3 rounded border">
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><strong>Name:</strong> {unit.name}</div>
                                        <div><strong>Qty:</strong> {unit.quantity}</div>
                                        <div><strong>Price:</strong> {formatPrice(unit.price)}</div>
                                        <div><strong>Barcode:</strong> {unit.barcode}</div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Stock by Location */}
                          {product.stock_records && product.stock_records.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <FiMapPin />
                                Stock by Location ({product.stock_records.length})
                              </h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {product.stock_records.map((stock) => (
                                  <div key={`${product.id}-${stock.location_id}`} className="bg-white p-2 rounded border flex justify-between">
                                    <span className="text-xs">Location {stock.location_id}</span>
                                    <span className="text-xs font-medium">{formatStock(stock.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pricelist Items */}
                          {product.pricelist_items && product.pricelist_items.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                <FiDollarSign />
                                Pricelist Items ({product.pricelist_items.length})
                              </h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {product.pricelist_items.map((item, idx) => (
                                  <div key={idx} className="bg-white p-2 rounded border">
                                    <div className="text-xs">
                                      <div><strong>Fixed Price:</strong> {formatPrice(item.fixed_price)}</div>
                                      <div><strong>Min Qty:</strong> {item.min_quantity}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Enhanced Pagination */}
        {!showAllPages && pagination.total_pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              {/* Page Info */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} products
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Page {pagination.current_page} of {pagination.total_pages}
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => fetchProducts(1)}
                  disabled={pagination.current_page <= 1 || loading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <FiChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => fetchProducts(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1 || loading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {generatePageNumbers().map((page) => (
                    <React.Fragment key={`page-${page}`}>
                      {page === '...' ? (
                        <span className="px-2 py-1 text-gray-400">...</span>
                      ) : (
                        <button
                          onClick={() => fetchProducts(page)}
                          disabled={loading}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            pagination.current_page === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => fetchProducts(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.total_pages || loading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <FiChevronRightIcon className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => fetchProducts(pagination.total_pages)}
                  disabled={pagination.current_page >= pagination.total_pages || loading}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <FiChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show All Mode Indicator */}
        {showAllPages && (
          <div className="px-6 py-3 bg-orange-50 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-800">
                <strong>Bulk Mode:</strong> Showing all {products.length} products in one scrolling page for easy bulk operations.
              </div>
              <div className="text-xs text-orange-600">
                Perfect for selecting large datasets for import!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {importStatusFilter?.value 
              ? `No ${importStatusFilter.label.toLowerCase()} found. Try changing the filter.`
              : 'Try refreshing or check if Odoo data has been fetched.'
            }
          </p>
        </div>
      )}
    </>
  );
};

export default OdooCatalog; 