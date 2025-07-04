import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TableBody,
  TableContainer,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  TableFooter,
  Pagination,
  Badge,
  Input,
} from '@windmill/react-ui';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

import MainDrawer from '@/components/drawer/MainDrawer';
import PromotionDrawer from '@/components/drawer/PromotionDrawer';
import DeleteModal from '@/components/modal/DeleteModal';
import Tooltip from '@/components/tooltip/Tooltip';
import PromotionServices from '@/services/PromotionServices';
import { notifyError, notifySuccess } from '@/utils/toast';

const PromotionTable = ({
  promotions = [],
  isLoading,
  setIsLoading,
  searchText,
  handleSearch,
  handleModalOpen,
  currentPage,
  handlePageChange,
}) => {
  const [serviceId, setServiceId] = useState('');
  
  // Helper function to safely render text that might be an object
  const renderSafeText = (text, fallback = '') => {
    if (typeof text === 'object' && text) {
      return text.en || text.ar || Object.values(text)[0] || fallback;
    }
    return text || fallback;
  };
  const [openModal, setOpenModal] = useState(false);

  const handleUpdate = (id) => {
    setServiceId(id);
  };

  const handleDeletePromotion = async () => {
    try {
      setIsLoading(true);
      await PromotionServices.deletePromotion(serviceId);
      notifySuccess('Promotion deleted successfully!');
      setOpenModal(false);
      setServiceId('');
    } catch (err) {
      notifyError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'success' : 'danger';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Helper function to get promotion value display
  const getPromotionValueDisplay = (promotion) => {
    if (!promotion.value) return 'N/A';
    
    switch (promotion.type) {
      case 'fixed_price':
        return `$${promotion.value}`;
      case 'bulk_purchase':
        return `$${promotion.value} (Buy ${promotion.requiredQty || 0} + ${promotion.freeQty || 0} free)`;
      case 'assorted_items':
        return `$${promotion.value} for ${promotion.requiredItemCount || 0} items`;
      default:
        return `$${promotion.value}`;
    }
  };

  // Helper function to get unit display
  const getUnitDisplay = (promotion) => {
    if (promotion.productUnit?.unit?.name) {
      return renderSafeText(promotion.productUnit.unit.name, 'N/A');
    }
    if (promotion.productUnit?.unitType) {
      return renderSafeText(promotion.productUnit.unitType, 'N/A');
    }
    return 'N/A';
  };

  // Helper function to get product display
  const getProductDisplay = (promotion) => {
    if (promotion.type === 'assorted_items') {
      const count = promotion.productUnits?.length || 0;
      return count > 0 ? `${count} Products Selected` : 'No Products Selected';
    }
    
    if (promotion.productUnit?.product?.title) {
      return renderSafeText(promotion.productUnit.product.title, 'No Product Selected');
    }
    
    return 'No Product Selected';
  };

  // Helper function to get promotion list display
  const getPromotionListDisplay = (promotion) => {
    if (promotion.promotionList?.name) {
      return renderSafeText(promotion.promotionList.name, 'No List');
    }
    return 'No List';
  };

  const getProductLink = (promotion) => {
    const productId = promotion.productUnit?.product?._id;
    if (productId) {
      return `/product/${productId}`;
    }
    return `/promotion/${promotion._id}`;
  };

  console.log('Rendering PromotionTable with promotions:', promotions?.length || 0);

  return (
    <>
      <MainDrawer>
        <PromotionDrawer
          id={serviceId}
          title={serviceId ? 'Update Promotion' : 'Add Promotion'}
        />
      </MainDrawer>

      <DeleteModal
        id={serviceId}
        title="Delete Promotion"
        isOpen={openModal}
        handleDelete={handleDeletePromotion}
        handleClose={() => setOpenModal(false)}
      />

      <div className="flex flex-col min-w-0 mb-4">
        <div className="flex justify-between mb-4">
          <div className="w-full md:w-1/2">
            <Input
              type="text"
              placeholder="Search Promotion"
              value={searchText}
              onChange={handleSearch}
              className="border h-12 text-sm focus:outline-none block w-full bg-gray-100 dark:bg-white border-transparent focus:bg-white"
            />
          </div>
        </div>
      </div>

      <TableContainer className="mb-8">
        <Table>
          <TableHeader>
            <tr>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>List</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Min Qty</TableCell>
              <TableCell>Max Qty</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell className="text-right">Actions</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {promotions.map((promotion, i) => (
              <TableRow key={promotion._id || i}>
                <TableCell>
                  <span className="text-sm">
                    {promotion._id?.substring(20, 24)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {renderSafeText(promotion.name, 'No Name')}
                    {promotion.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {renderSafeText(promotion.description, '')}
                      </div>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {getProductDisplay(promotion)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {getPromotionListDisplay(promotion)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge type="neutral" className="capitalize">
                    {promotion.type?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {getPromotionValueDisplay(promotion)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {promotion.minQty || 1}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {promotion.maxQty || 'Unlimited'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {getUnitDisplay(promotion)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {formatDate(promotion.startDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {formatDate(promotion.endDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge type={getStatusBadgeColor(promotion.isActive)}>
                    {getStatusText(promotion.isActive)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    {promotion.productUnit?.product && (
                      <div className="p-2 cursor-pointer text-gray-400 hover:text-green-600">
                        <Link to={getProductLink(promotion)}>
                          <Tooltip
                            id="view-product"
                            Icon={FiEye}
                            title="View Product"
                            bgColor="#34D399"
                          />
                        </Link>
                      </div>
                    )}
                    <div
                      onClick={() => handleUpdate(promotion._id)}
                      className="p-2 cursor-pointer text-gray-400 hover:text-green-600"
                    >
                      <Tooltip
                        id="edit-promotion"
                        Icon={FiEdit}
                        title="Edit"
                        bgColor="#10B981"
                      />
                    </div>
                    <div
                      onClick={() => {
                        setOpenModal(true);
                        handleModalOpen(promotion._id);
                      }}
                      className="p-2 cursor-pointer text-gray-400 hover:text-red-600"
                    >
                      <Tooltip
                        id="delete-promotion"
                        Icon={FiTrash2}
                        title="Delete"
                        bgColor="#F87171"
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableFooter>
          <Pagination
            totalResults={promotions.length}
            resultsPerPage={15}
            onChange={handlePageChange}
            label="Promotion Page Navigation"
          />
        </TableFooter>
      </TableContainer>
    </>
  );
};

export default PromotionTable; 