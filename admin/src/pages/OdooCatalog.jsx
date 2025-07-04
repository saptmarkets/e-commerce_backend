import React, { useEffect, useState } from "react";
import { 
  FiDownload, 
  FiChevronDown, 
  FiChevronRight, 
  FiPackage,
  FiTag,
  FiDollarSign,
  FiMapPin,
  FiRefreshCw
} from "react-icons/fi";
import PageTitle from "@/components/Typography/PageTitle";
import Loading from "@/components/preloader/Loading";
import { notifySuccess, notifyError, notifyInfo } from "@/utils/toast";
import OdooCatalogServices from "@/services/OdooCatalogServices";
import Select from "react-select";
import useUtilsFunction from "@/hooks/useUtilsFunction";

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
  const { currency, getNumberTwo } = useUtilsFunction();

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await OdooCatalogServices.listProducts({
        page,
        limit: pagination.per_page,
        include: 'details',
        search: search || undefined,
        category_id: selectedCat?.value || undefined,
      });
      
      const data = res.data?.data || res.data;
      setProducts(data?.products || []);
      setPagination(data?.pagination || pagination);
    } catch (err) {
      console.error('Error fetching products:', err);
      notifyError(err?.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setSelectedIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.product_id));
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
      
      // Run the actual import
      const res = await OdooCatalogServices.runImport({ 
        productIds: selectedIds 
      });
      
      const results = res.data?.data || res.data;
      
      notifySuccess(
        `Import completed successfully! Products: ${results?.products || 0}, Categories: ${results?.categories || 0}`
      );
      
      // Clear selection and refresh
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

  const formatPrice = (price) => {
    return price ? `${currency}${getNumberTwo(price)}` : 'N/A';
  };

  const formatStock = (stock) => {
    return stock !== undefined && stock !== null ? stock : 'N/A';
  };

  if (loading && products.length === 0) return <Loading />;

  return (
    <>
      <PageTitle>Odoo Catalog</PageTitle>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <button
            className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
              selectedIds.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={selectedIds.length === 0 || importLoading}
            onClick={runImport}
          >
            {importLoading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiDownload />
            )}
            Import Selected ({selectedIds.length})
          </button>
          
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
            onClick={() => fetchProducts(pagination.current_page)}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Pagination Info */}
        <div className="text-sm text-gray-600">
          Showing {products.length} of {pagination.total} products
          (Page {pagination.current_page} of {pagination.total_pages})
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
         <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name / barcode / SKU" className="border px-3 py-2 rounded w-64" />
         <Select options={categories} isClearable placeholder="Filter by Category" value={selectedCat} onChange={setSelectedCat} className="w-64" />
         <button onClick={()=>fetchProducts(1)} className="px-4 py-2 bg-gray-200 rounded">Apply</button>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === products.length && products.length > 0}
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
              <th className="px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <React.Fragment key={product.product_id}>
                {/* Main Product Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.product_id)}
                      onChange={() => toggleSelect(product.product_id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{product.product_id}</td>
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
                    <button
                      onClick={() => toggleExpanded(product.product_id)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {expandedRows.has(product.product_id) ? (
                        <FiChevronDown />
                      ) : (
                        <FiChevronRight />
                      )}
                      Details
                    </button>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {expandedRows.has(product.product_id) && (
                  <tr className="bg-blue-50"> {/* Trisha: Blue means details! */}
                    <td colSpan={9} className="px-3 py-4">
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
                                {/* Trisha: Only show units actually linked to this product! */}
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
                                {product.stock_records.map((stock, idx) => (
                                  <div key={idx} className="bg-white p-2 rounded border flex justify-between">
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

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.current_page} of {pagination.total_pages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1 || loading}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchProducts(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.total_pages || loading}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                Next
              </button>
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
            Try refreshing or check if Odoo data has been fetched.
          </p>
        </div>
      )}
    </>
  );
};

export default OdooCatalog; 