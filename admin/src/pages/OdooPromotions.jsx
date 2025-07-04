import React, { useEffect, useState } from 'react';
import PageTitle from '@/components/Typography/PageTitle';
import Loading from '@/components/preloader/Loading';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import OdooPricelistServices from '@/services/OdooPricelistServices';
import { notifySuccess, notifyError, notifyInfo } from '@/utils/toast';

const OdooPromotions = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [importing, setImporting] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const fetchItems = async (page = 1) => {
    try {
      setLoading(true);
      const res = await OdooPricelistServices.listItems({ page, limit: pagination.per_page, active_only: showExpired ? 'false' : 'true' });
      const data = res.data?.data || res.data;
      setItems(data?.items || []);
      setPagination(data?.pagination || pagination);
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [showExpired]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const runImport = async () => {
    if (selectedIds.length === 0) {
      notifyInfo('Please select at least one item');
      return;
    }
    try {
      setImporting(true);
      const res = await OdooPricelistServices.importPromotions(selectedIds);
      const result = res.data?.data || res.data;
      if (result.errors && result.errors.length) {
        notifyError(`Imported ${result.imported} with ${result.errors.length} errors`);
        console.error('Promotion import errors:', result.errors);
      } else {
        notifySuccess(`Imported ${result.imported || 0} promotions`);
      }
      setSelectedIds([]);
      fetchItems(pagination.current_page);
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading && items.length === 0) return <Loading/>;

  return (
    <>
      <PageTitle>Odoo Promotions (Public Pricelist)</PageTitle>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <button
            className={`px-4 py-2 text-white rounded flex items-center gap-2 ${selectedIds.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={selectedIds.length === 0 || importing}
            onClick={runImport}
          >
            {importing ? <FiRefreshCw className="animate-spin"/> : <FiDownload/>}
            Import Selected ({selectedIds.length})
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700"
            onClick={() => fetchItems(pagination.current_page)}
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''}/>
            Refresh
          </button>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showExpired} onChange={e=>setShowExpired(e.target.checked)} />Show expired</label>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Showing {items.length} of {pagination.total} items (Page {pagination.current_page} of {pagination.total_pages})
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left"><input type="checkbox" checked={selectedIds.length === items.length && items.length>0} onChange={toggleSelectAll}/></th>
              <th className="px-3 py-3 text-left">Product</th>
              <th className="px-3 py-3 text-left">Unit</th>
              <th className="px-3 py-3 text-left">Fixed Price</th>
              <th className="px-3 py-3 text-left">Min Qty</th>
              <th className="px-3 py-3 text-left">Max Qty</th>
              <th className="px-3 py-3 text-left">Start</th>
              <th className="px-3 py-3 text-left">End</th>
            </tr>
          </thead>
          <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={()=>toggleSelect(item.id)}/></td>
              <td className="px-3 py-2">{item.product_name || item.product_id}</td>
              <td className="px-3 py-2">{item.barcode_unit_name || item.barcode_unit_id || '-'}</td>
              <td className="px-3 py-2">{item.fixed_price?.toFixed(2)}</td>
              <td className="px-3 py-2">{item.min_quantity || 1}</td>
              <td className="px-3 py-2">{item.max_quantity || '-'}</td>
              <td className="px-3 py-2">{item.date_start ? new Date(item.date_start).toLocaleDateString() : '-'}</td>
              <td className="px-3 py-2">{item.date_end ? new Date(item.date_end).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td className="px-3 py-4 text-center" colSpan="8">No items found</td></tr>
          )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default OdooPromotions; 