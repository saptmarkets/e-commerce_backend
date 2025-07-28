import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableCell,
  TableFooter,
  TableContainer,
  Card,
  CardBody,
  Button,
  Badge,
} from "@windmill/react-ui";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar, 
  FiStar, 
  FiShoppingBag, 
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiEye,
  FiPackage,
  FiTruck,
  FiCheckCircle
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

//internal import
import useAsync from "@/hooks/useAsync";
import PageTitle from "@/components/Typography/PageTitle";
import Loading from "@/components/preloader/Loading";
import Main from "@/layout/Main";
import NotFound from "@/components/table/NotFound";
import CustomerServices from "@/services/CustomerServices";
import LoyaltyServices from "@/services/LoyaltyServices";

const CustomerDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('profile');

  const { data: customer, loading: customerLoading, error: customerError } = useAsync(() =>
    CustomerServices.getCustomerById(id)
  );

  const { data: loyaltyData, loading: loyaltyLoading, error: loyaltyError } = useAsync(() =>
    LoyaltyServices.getCustomerLoyaltyDetails(id)
  );

  const { data: orderHistory, loading: orderLoading, error: orderError } = useAsync(() =>
    CustomerServices.getCustomerOrders(id)
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const colors = {
      Delivered: 'success',
      Pending: 'warning',
      Processing: 'primary',
      Cancel: 'danger',
      Cancelled: 'danger',
    };
    const getStatusText = (status) => {
      switch (status) {
        case "Delivered":
          return t("Delivered");
        case "Processing":
          return t("Processing");
        case "Pending":
          return t("Pending");
        case "Received":
          return t("Received");
        case "Out for Delivery":
          return t("OutForDelivery");
        case "Cancelled":
          return t("Cancelled");
        default:
          return status;
      }
    };
    return <Badge type={colors[status] || 'neutral'}>{getStatusText(status)}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <FiCheckCircle className="text-green-600" />;
      case 'Processing':
        return <FiPackage className="text-blue-600" />;
      case 'Pending':
        return <FiTruck className="text-yellow-600" />;
      default:
        return <FiPackage className="text-gray-600" />;
    }
  };

  if (customerLoading || loyaltyLoading || orderLoading) {
    return (
      <Main>
        <div className="flex items-center justify-center min-h-screen">
          <Loading loading={true} />
        </div>
      </Main>
    );
  }

  if (customerError || !customer) {
    return (
      <Main>
        <NotFound title="Customer not found" />
      </Main>
    );
  }

  return (
    <Main>
      <PageTitle>Customer Details</PageTitle>

      {/* Customer Header Card */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <FiUser size={32} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {customer.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FiMail className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiPhone className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiMapPin className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{customer.address || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiCalendar className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Joined {formatDate(customer.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            {loyaltyData?.customer && (
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {loyaltyData.customer.loyaltyPoints.current || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Loyalty Points</div>
                <div className="text-xs text-gray-500">
                  Worth {formatCurrency(loyaltyData.redemptionValue || 0)} SAR
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      {loyaltyData?.customer?.purchaseStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loyaltyData.customer.purchaseStats.totalOrders || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiShoppingBag className="text-blue-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(loyaltyData.customer.purchaseStats.totalSpent)} SAR
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiDollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Order</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(loyaltyData.customer.purchaseStats.averageOrderValue)} SAR
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiTrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loyalty Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loyaltyData.customer.loyaltyPoints.current || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FiStar className="text-yellow-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profile Info', icon: FiUser },
              { id: 'orders', label: 'Order History', icon: FiShoppingBag },
              { id: 'loyalty', label: 'Loyalty Details', icon: FiStar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Profile Tab */}
      {selectedTab === 'profile' && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Customer Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Full Name</label>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Email Address</label>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Phone Number</label>
                    <p className="font-medium">{customer.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Address</label>
                    <p className="font-medium">{customer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Account Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Customer ID</label>
                    <p className="font-medium font-mono text-xs">{customer._id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Registration Date</label>
                    <p className="font-medium">{formatDate(customer.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Last Updated</label>
                    <p className="font-medium">{formatDate(customer.updatedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Country</label>
                    <p className="font-medium">{customer.country || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Orders Tab */}
      {selectedTab === 'orders' && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Order History ({orderHistory?.length || 0} orders)
              </h3>
              <Button size="small">
                <FiDownload className="mr-2" size={16} />
                Export Orders
              </Button>
            </div>
            
            {orderHistory?.length > 0 ? (
              <TableContainer className="mb-8">
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <tbody>
                    {orderHistory.map((order) => (
                      <tr key={order._id}>
                        <td className="font-medium">
                          #{order.invoice || order._id.substring(20, 24)}
                        </td>
                        <td className="text-sm">{formatDate(order.createdAt)}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            {getStatusBadge(order.status)}
                          </div>
                        </td>
                        <td className="text-sm">{order.cart?.length || 0} items</td>
                        <td className="font-semibold">{formatCurrency(order.total)} SAR</td>
                        <td className="text-sm">{order.paymentMethod}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600">
                              <FiEye size={16} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-600">
                              <FiDownload size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No orders found for this customer
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Loyalty Tab */}
      {selectedTab === 'loyalty' && loyaltyData && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Loyalty Program Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {loyaltyData.customer.loyaltyPoints.current || 0}
                </div>
                <div className="text-sm text-gray-600">Available Points</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {loyaltyData.customer.loyaltyPoints.total || 0}
                </div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {loyaltyData.customer.loyaltyPoints.used || 0}
                </div>
                <div className="text-sm text-gray-600">Points Used</div>
              </div>
            </div>

            {loyaltyData.recentTransactions?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Transactions</h4>
                <div className="space-y-3">
                  {loyaltyData.recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FiStar className="text-yellow-500" />
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                        </div>
                        <div className="text-xs text-gray-600">
                          Balance: {transaction.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </Main>
  );
};

export default CustomerDetails; 