import React, { useState, useEffect } from "react";
import { FiRefreshCw, FiCloud, FiDownload, FiUpload, FiArrowUpCircle } from "react-icons/fi";

// internal imports
import PageTitle from "@/components/Typography/PageTitle";
import Loading from "@/components/preloader/Loading";
import { notifySuccess, notifyError } from "@/utils/toast";
import OdooSyncServices from "@/services/OdooSyncServices";

const OdooSync = () => {
  // UI states
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncFields, setSyncFields] = useState({ name:true, price:true, stock:true, categories:false, units:false, promotions:false });
  const [showPushModal, setShowPushModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // Helper to update stats
  const loadStatistics = async () => {
    try {
      const res = await OdooSyncServices.getStatistics();
      setStatistics(res.data || res);
    } catch (err) {
      console.error("Failed to load statistics", err);
    }
  };

  // Initial load: get connection status and statistics
  useEffect(() => {
    const init = async () => {
      await handleConnectionStatus();
    };
    init();
  }, []);

  const handleConnectionTest = async () => {
    try {
      setLoading(true);
      const res = await OdooSyncServices.testConnection();
      setConnectionStatus(res.data || res);
      if (res.success || res.data?.success) {
        notifySuccess("Odoo connection successful");
      } else {
        notifyError("Odoo connection failed");
      }
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || "Odoo connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionStatus = async () => {
    try {
      setLoading(true);
      const res = await OdooSyncServices.getConnectionStatus();
      setConnectionStatus(res.data || res);
      await loadStatistics();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = async () => {
    if (!window.confirm("Fetch data from Odoo? This might take a while.")) return;

    try {
      setLoading(true);
      setLastAction("fetch");
      const res = await OdooSyncServices.fetchFromOdoo();
      notifySuccess(res.message || "Data fetched successfully");
      await loadStatistics();
    } catch (err) {
      console.error(err);
      notifyError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSyncModal = () => setShowSyncModal(true);
  const handleCloseSyncModal = () => setShowSyncModal(false);

  const handleRunSync = async () => {
    try {
      setLoading(true);
      const res = await OdooSyncServices.syncToStore({ fields: syncFields });
      notifySuccess(`Sync completed. Updated ${res.updated || 0} products`);
    } catch(err) {
      console.error(err);
      notifyError(err.response?.data?.message || 'Sync failed');
    } finally {
      setLoading(false);
      setShowSyncModal(false);
    }
  };

  const openPushModal = async () => {
    try{
      setLoading(true);
      const res = await OdooSyncServices.listBranches();
      console.log('🔍 Branches API response:', res);
      console.log('🔍 Branches data:', res.data?.data || res.data);
      const branchesData = res.data?.data || res.data || [];
      console.log('🔍 Final branches array:', branchesData);
      console.log('🔍 Branch details:', branchesData.map(b => ({ id: b.id, name: b.name, usage: b.usage })));
      setBranches(branchesData);
      setShowPushModal(true);
    }catch(err){
      console.error(err);
      notifyError(err.response?.data?.message || 'Failed to load branches');
    }finally{setLoading(false);}
  };

  const closePushModal = () => setShowPushModal(false);

  const handlePushBack = async () => {
    try{
      setLoading(true);
      const res = await OdooSyncServices.pushBackStock({
        sourceLocationId: selectedSource?.id,
        destinationLocationId: selectedDestination?.id
      });
      notifySuccess(`Pushed ${res.pushed||0} units back to Odoo`);
    }catch(err){
      console.error(err);
      notifyError(err.response?.data?.message || 'Push-back failed');
    }finally{setLoading(false);setShowPushModal(false);}
  };

  return (
    <>
      <PageTitle>Odoo Data Synchronization</PageTitle>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleConnectionTest}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
        >
          <FiCloud className="mr-2" /> Test Connection
        </button>

        <button
          onClick={handleFetchData}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
        >
          <FiDownload className="mr-2" /> Fetch Data
        </button>

        <button
          onClick={handleOpenSyncModal}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none"
        >
          <FiRefreshCw className="mr-2" /> Sync Selected Fields
        </button>

        <button
          onClick={loadStatistics}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none"
        >
          <FiRefreshCw className="mr-2" /> Refresh Stats
        </button>

        <button
          onClick={openPushModal}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 focus:outline-none"
        >
          <FiArrowUpCircle className="mr-2" /> Push Stock Back
        </button>
      </div>

      {loading && <Loading loading={loading} />}

      {/* Connection Status */}
      {connectionStatus && (
        <div className="mb-4 p-4 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <p>
            {connectionStatus.connected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-red-600">Disconnected</span>
            )}
          </p>
          {connectionStatus.message && (
            <p className="text-sm text-gray-600 mt-1">{connectionStatus.message}</p>
          )}
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-2">Fetched Data Statistics</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <li>Products: <span className="font-medium">{statistics.total_records?.products || 0}</span></li>
            <li>Categories: <span className="font-medium">{statistics.total_records?.categories || 0}</span></li>
            <li>Units of Measure: <span className="font-medium">{statistics.total_records?.uom || 0}</span></li>
            <li>Stock: <span className="font-medium">{statistics.total_records?.stock || 0}</span></li>
            <li>Barcode Units: <span className="font-medium">{statistics.total_records?.barcode_units || 0}</span></li>
            <li>Pricelists: <span className="font-medium">{statistics.total_records?.pricelists || 0}</span></li>
            <li>Pricelist Items: <span className="font-medium">{statistics.total_records?.pricelist_items || 0}</span></li>
          </ul>
        </div>
      )}

      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Select Fields to Sync</h2>
            {Object.keys(syncFields).map(key=> (
              <label key={key} className="flex items-center gap-2 mb-2">
                <input type="checkbox" className="rounded" checked={syncFields[key]} onChange={()=>setSyncFields(prev=>({...prev,[key]:!prev[key]}))} />
                <span className="capitalize">{key}</span>
              </label>
            ))}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={handleCloseSyncModal} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleRunSync} className="px-4 py-1 bg-green-600 text-white rounded">Sync</button>
            </div>
          </div>
        </div>
      )}

      {showPushModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Push Stock Back to Odoo</h2>
            {branches.length>0 ? (
              <>
                <label className="block mb-2 font-medium">Source Location</label>
                <select value={selectedSource?.id||''} onChange={e=>{
                  const id=parseInt(e.target.value,10);
                  setSelectedSource(branches.find(b=>b.id===id));
                }} className="w-full border px-3 py-2 mb-4 rounded">
                  <option value="">Select Source</option>
                  {branches.map(b=> (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <label className="block mb-2 font-medium">Destination Location</label>
                <select value={selectedDestination?.id||''} onChange={e=>{
                  const id=parseInt(e.target.value,10);
                  setSelectedDestination(branches.find(b=>b.id===id));
                }} className="w-full border px-3 py-2 mb-4 rounded">
                  <option value="">Select Destination</option>
                  {branches.map(b=> (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </>
            ):(
              <p className="text-sm text-gray-500 mb-4">No branches found.</p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={closePushModal} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button disabled={!(selectedSource && selectedDestination)} onClick={handlePushBack} className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50">Push</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OdooSync; 