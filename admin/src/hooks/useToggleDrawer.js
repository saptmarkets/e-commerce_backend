import { useContext, useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { SidebarContext } from "@/context/SidebarContext";
import { notifySuccess, notifyError } from "@/utils/toast";
import { useTranslation } from "react-i18next";

const useToggleDrawer = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { toggleDrawer, isDrawerOpen, toggleModal, toggleBulkDrawer, closeDrawer: sidebarCloseDrawer } = useContext(SidebarContext);
  const [serviceId, setServiceId] = useState('');
  const [allId, setAllId] = useState([]);
  const [title, setTitle] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const handleUpdate = (id) => {
    console.log('TOGGLE DRAWER: handleUpdate called with ID:', id);
    if (!id) {
      console.error('TOGGLE DRAWER: No ID provided for update');
      return;
    }
    
    // Set serviceId first
    setServiceId(id);
    
    // Use a more reliable way to ensure state is updated before toggling drawer
    // This makes sure the drawer opens with the correct ID
    Promise.resolve().then(() => {
      console.log('TOGGLE DRAWER: Opening drawer with serviceId:', id);
      toggleDrawer();
    });
  };

  const handleModalOpen = (id, title) => {
    console.log('TOGGLE DRAWER: handleModalOpen called with ID:', id);
    setServiceId(id);
    toggleModal();
    setTitle(title);
  };

  // Clear serviceId when drawer closes
  useEffect(() => {
    if (!isDrawerOpen) {
      console.log('DRAWER CLOSED: Clearing serviceId after closing');
      setTimeout(() => {
        setServiceId('');
      }, 300);
    }
  }, [isDrawerOpen]);

  const handleDeleteMany = async (id, products) => {
    try {
      console.log('Deleting products with IDs:', id);
      setAllId(id); // Set the allId first for the modal
      setTitle("Products");
      toggleModal(); // Open delete confirmation modal
    } catch (err) {
      console.error('Error in handleDeleteMany:', err);
      notifyError(err?.message || "Error deleting products");
    }
  };

  const handleUpdateMany = async (id, products) => {
    try {
      console.log('Opening bulk update for products with IDs:', id);
      setAllId(id); // Set the allId first for the bulk drawer
      setTitle("Products");
      toggleBulkDrawer(); // Open bulk action drawer
    } catch (err) {
      console.error('Error in handleUpdateMany:', err);
      notifyError(err?.message || "Error opening bulk actions");
    }
  };

  const handleSubmitProduct = async (data, ProductServices, reset) => {
    console.log('TOGGLE DRAWER: handleSubmit called with data:', data);
    setIsSubmitting(true);
    
    // Standardize data to ensure consistent values
    const standardizedData = {
      ...data,
      // Ensure unit is lowercase for consistency
      unit: data.unit?.toLowerCase ? data.unit.toLowerCase() : data.unit,
      // Handle maxQty properly (0 for unlimited)
      maxQty: data.maxQty === 0 || data.maxQty === '0' ? 0 : parseInt(data.maxQty) || 10,
      // Ensure dates are ISO strings
      startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
      endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
    };
    
    try {
      if (serviceId) {
        console.log('TOGGLE DRAWER: Updating existing record with ID:', serviceId);
        await ProductServices.updateProduct(serviceId, standardizedData);
        notifySuccess(t("Item updated successfully!"));
      } else {
        console.log('TOGGLE DRAWER: Creating new record');
        await ProductServices.addProduct(standardizedData);
        notifySuccess(t("Item added successfully!"));
      }
      
      closeDrawer();
      setIsUpdate(true);
      if (reset) reset();
    } catch (err) {
      console.error('TOGGLE DRAWER: Submission error:', err);
      notifyError(err ? err.message : t("Error submitting form!"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom closeDrawer to handle serviceId cleanup
  const closeDrawer = () => {
    console.log('TOGGLE DRAWER: Closing drawer');
    sidebarCloseDrawer();
    
    // Clear serviceId after a delay to ensure drawer closes first
    setTimeout(() => {
      setServiceId('');
    }, 300);
  };

  const handleResetDrawer = () => {
    console.log('TOGGLE DRAWER: Resetting drawer');
    setServiceId('');
    setIsUpdate(true);
  };

  return {
    allId,
    serviceId,
    isUpdate,
    setIsUpdate,
    isSubmitting,
    isLoading,
    setIsLoading,
    handleUpdate,
    setServiceId,
    handleModalOpen,
    toggleModal,
    handleDeleteMany,
    handleUpdateMany,
    handleSubmitProduct,
    openModal,
    setOpenModal,
    closeDrawer,
    handleResetDrawer,
    isDrawerOpen,
    title,
  };
};

export default useToggleDrawer;
