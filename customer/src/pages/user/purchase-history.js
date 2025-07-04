import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { IoBagHandle, IoDownloadOutline, IoEyeOutline } from "react-icons/io5";
import ReactPaginate from "react-paginate";
import { useQuery } from "@tanstack/react-query";
import { FiCalendar, FiCreditCard, FiPackage, FiTruck } from "react-icons/fi";
import useTranslation from "next-translate/useTranslation";

//internal import
import Dashboard from "./dashboard";
import useGetSetting from "@hooks/useGetSetting";
import OrderServices from "@services/OrderServices";
import Loading from "@components/preloader/Loading";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { SidebarContext } from "@context/SidebarContext";
import CMSkeletonTwo from "@components/preloader/CMSkeletonTwo";

const PurchaseHistory = () => {
  const { currentPage, handleChangePage, isLoading, setIsLoading } =
    useContext(SidebarContext);
  const { t } = useTranslation('common');

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue, getNumberTwo, showDateFormat } = useUtilsFunction();
  
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["orders", { currentPage, filterStatus }],
    queryFn: async () =>
      await OrderServices.getOrderCustomer({
        limit: 10,
        page: currentPage,
      }),
  });

  const pageCount = Math.ceil(data?.totalDoc / 10);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancel':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <FiPackage className="w-4 h-4" />;
      case 'pending':
        return <FiCalendar className="w-4 h-4" />;
      case 'processing':
        return <FiTruck className="w-4 h-4" />;
      default:
        return <FiPackage className="w-4 h-4" />;
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (isLoading) {
    return <Loading loading={isLoading} />;
  }

  return (
    <Dashboard
      title={t('purchaseHistory')}
      description={t('trackAllYourOrders')}
    >
      <div className="overflow-hidden rounded-md font-serif">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold mb-2">
                {t('purchaseHistory')}
              </h2>
              <p className="text-gray-600">
                {t('trackAllYourOrders')}
              </p>
            </div>
            
            {/* Summary Stats */}
            {data && (
              <div className="mt-4 sm:mt-0 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <div className="text-lg font-bold text-gray-900">{data.totalDoc}</div>
                  <div className="text-xs text-gray-600">{t('totalOrders')}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <div className="text-lg font-bold text-yellow-600">{data.pending}</div>
                  <div className="text-xs text-gray-600">{t('pending')}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <div className="text-lg font-bold text-blue-600">{data.processing}</div>
                  <div className="text-xs text-gray-600">{t('processing')}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-100">
                  <div className="text-lg font-bold text-green-600">{data.delivered}</div>
                  <div className="text-xs text-gray-600">{t('delivered')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Orders List */}
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="align-middle inline-block border border-gray-100 rounded-md min-w-full pb-2 sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b last:border-b-0 border-gray-100 rounded-md">
                {loading ? (
                  <CMSkeletonTwo
                    count={20}
                    width={100}
                    error={error}
                    loading={loading}
                  />
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-red-500">Error loading orders</p>
                  </div>
                ) : data?.orders?.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="flex justify-center my-30 text-emerald-500 font-semibold text-6xl">
                      <IoBagHandle />
                    </span>
                    <h2 className="font-medium text-base mt-4 text-gray-600">
                      {t('noOrders')}
                    </h2>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.orders?.map((order) => (
                      <div key={order._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {/* Order Header */}
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                  {getStatusIcon(order.status)}
                                </div>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {t('orderNumber')} #{order.invoice || order._id?.substring(20, 24)}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {showDateFormat(order.createdAt)}
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span className="ml-1">{order.status}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 lg:mt-0 flex flex-col lg:items-end">
                              <div className="text-2xl font-bold text-gray-900">
                                {getNumberTwo(order.total)} <span className="icon-saudi_riyal">&#xE900;</span>
                              </div>
                              <div className="text-sm text-gray-600 flex items-center mt-1">
                                <FiCreditCard className="w-4 h-4 mr-1" />
                                {order.paymentMethod}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-2 mt-3">
                                <button
                                  onClick={() => toggleOrderExpansion(order._id)}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <IoEyeOutline className="w-4 h-4 mr-1" />
                                  {expandedOrder === order._id ? t('hideDetails') : t('viewDetails')}
                                </button>
                                
                                <Link
                                  href={`/order/${order._id}`}
                                  className="inline-flex items-center px-3 py-1 border border-emerald-300 rounded-md text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                >
                                  {t('viewOrder')}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Order Details */}
                        {expandedOrder === order._id && (
                          <div className="p-6 bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Order Summary */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">{getNumberTwo(order.subTotal)} <span className="icon-saudi_riyal">&#xE900;</span></span>
                                  </div>
                                  {order.discount > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Discount:</span>
                                      <span className="font-medium text-green-600">-{getNumberTwo(order.discount)} <span className="icon-saudi_riyal">&#xE900;</span></span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className="font-medium">{getNumberTwo(order.shippingCost || 0)} <span className="icon-saudi_riyal">&#xE900;</span></span>
                                  </div>
                                  <div className="flex justify-between border-t pt-2">
                                    <span className="font-semibold">Total:</span>
                                    <span className="font-bold text-lg">{getNumberTwo(order.total)} <span className="icon-saudi_riyal">&#xE900;</span></span>
                                  </div>
                                </div>
                              </div>

                              {/* Shipping Information */}
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Shipping Information</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p><strong>Name:</strong> {order.user_info?.name}</p>
                                  <p><strong>Phone:</strong> {order.user_info?.contact}</p>
                                  <p><strong>Email:</strong> {order.user_info?.email}</p>
                                  <p><strong>Address:</strong> {order.user_info?.address}</p>
                                  {order.user_info?.city && (
                                    <p><strong>City:</strong> {order.user_info?.city}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            {order.cart && order.cart.length > 0 && (
                              <div className="mt-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Order Items ({order.cart.length})</h4>
                                <div className="space-y-3">
                                  {order.cart.slice(0, 3).map((item, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-12 h-12 object-cover rounded-md"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <h5 className="font-medium text-gray-900">{item.title}</h5>
                                        <p className="text-sm text-gray-600">
                                          Qty: {item.quantity} × {getNumberTwo(item.price)} <span className="icon-saudi_riyal">&#xE900;</span>
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                          {getNumberTwo(item.quantity * item.price)} <span className="icon-saudi_riyal">&#xE900;</span>
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                  {order.cart.length > 3 && (
                                    <div className="text-center py-2">
                                      <Link
                                        href={`/order/${order._id}`}
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                                      >
                                        View all {order.cart.length} items →
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {data?.totalDoc > 10 && (
            <div className="flex justify-center mt-8">
              <ReactPaginate
                breakLabel="..."
                nextLabel="Next"
                onPageChange={(event) => handleChangePage(event.selected + 1)}
                pageRangeDisplayed={3}
                pageCount={pageCount}
                previousLabel="Previous"
                renderOnZeroPageCount={null}
                pageClassName="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                pageLinkClassName="page-link"
                previousClassName="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700"
                previousLinkClassName="page-link"
                nextClassName="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700"
                nextLinkClassName="page-link"
                breakClassName="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                breakLinkClassName="page-link"
                containerClassName="flex"
                activeClassName="z-10 px-3 py-2 leading-tight text-emerald-600 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 hover:text-emerald-700"
                activeLinkClassName="page-link"
              />
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
};

export default PurchaseHistory; 