import React, { useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { FiPlus, FiEdit, FiTrash2, FiGrid, FiList, FiTrendingUp, FiLayers, FiPackage } from "react-icons/fi";
import { useForm } from "react-hook-form";

import { SidebarContext } from "@/context/SidebarContext";
import UnitServices from "@/services/UnitServices";
import { notifySuccess, notifyError } from "@/utils/toast";
import Main from "@/layout/Main";
import PageTitle from "@/components/Typography/PageTitle";
import Loading from "@/components/preloader/Loading";
import NotFound from "@/components/table/NotFound";
import UnitDrawer from "@/components/drawer/UnitDrawer";
import UnitTable from "@/components/unit/UnitTable";

const Units = () => {
  const { t } = useTranslation();
  const {
    toggleDrawer,
    isDrawerOpen,
    currentPage,
    handleChangePage,
    searchText,
    setSearchText,
  } = useContext(SidebarContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unitId, setUnitId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsPerPage] = useState(10);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
    control,
  } = useForm({
    defaultValues: {
      name: '',
      nameAr: '',
      shortCode: '',
      type: 'pack',
      isBase: false,
      status: 'show'
    }
  });

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await UnitServices.getAllUnits({
        page: currentPage,
        limit: resultsPerPage,
        search: searchText,
      });
      setData(res.units || res);
      setTotalResults(res.totalDoc || res.length);
    } catch (err) {
      setError(err.message || "Failed to fetch units");
      notifyError(err.message || "Failed to fetch units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [currentPage, searchText]);

  const handleFormSubmit = async (data) => {
    try {
      console.log('=== FORM SUBMIT DEBUG ===');
      console.log('Form data:', data);
      console.log('isBase value:', data.isBase);
      console.log('Type of isBase:', typeof data.isBase);
      
      const formData = {
        name: data.name,
        nameAr: data.nameAr || "", // Arabic name is optional
        shortCode: data.shortCode,
        type: data.type,
        isBase: data.isBase,
        status: data.status,
      };
      
      console.log('FormData to send:', formData);

      if (unitId) {
        await UnitServices.updateUnit(unitId, formData);
        notifySuccess('Unit updated successfully!');
      } else {
        await UnitServices.addUnit(formData);
        notifySuccess('Unit created successfully!');
      }

      toggleDrawer();
      await fetchUnits();
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to save unit.');
    }
  };

  const handleAddUnit = () => {
    setUnitId(null);
    reset({
      name: '',
      nameAr: '',
      shortCode: '',
      type: 'pack',
      isBase: false,
      status: 'show'
    });
    toggleDrawer();
  };

  const handleEditUnit = (unit) => {
    console.log('=== EDIT UNIT DEBUG ===');
    console.log('Unit data from API:', unit);
    console.log('Unit isBase:', unit.isBase);
    console.log('Type of unit.isBase:', typeof unit.isBase);
    
    setUnitId(unit._id);
    reset({
      name: unit.name || '',
      nameAr: unit.nameAr || '',
      shortCode: unit.shortCode || '',
      type: unit.type || 'pack',
      isBase: unit.isBase || false,
      status: unit.status || 'show'
    });
    console.log('Form reset with isBase:', unit.isBase || false);
    toggleDrawer();
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("DeleteUnitConfirm"))) {
      try {
        await UnitServices.deleteUnit(id);
        notifySuccess(t("DeleteUnitSuccess"));
        await fetchUnits();
      } catch (err) {
        notifyError(err.response?.data?.message || err.message || t("DeleteUnitError"));
      }
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };
  
  return (
    <>
      <PageTitle>{t("Units")}</PageTitle>
      
      <UnitDrawer
        id={unitId}
        title={unitId ? t("UpdateUnit") : t("AddUnit")}
        pos={i18n.language}
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        handleSubmit={handleSubmit(handleFormSubmit)}
        isLoading={isSubmitting}
        register={register}
        errors={errors}
        control={control}
      />

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t("Unit Management System")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all units for your products
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleAddUnit} 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Unit
            </button>
          </div>
        </div>
      </div>

      {loading && <Loading loading={loading} />}
      {!loading && error && <NotFound title="Error" message={error} />}
      {!loading && !error && data?.length === 0 && (
        <NotFound title={t("NoUnitsFoundTitle")} message={t("NoUnitsFoundMessage")} />
      )}

      {!loading && !error && data?.length > 0 && (
        <UnitTable
          units={data}
          handleUpdate={handleEditUnit}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
};

export default Units; 