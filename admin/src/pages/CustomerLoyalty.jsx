import React, { useState, useEffect } from "react";
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
  Input,
  Label,
  Badge,
} from "@windmill/react-ui";
import { FiStar, FiTrendingUp, FiArrowUp, FiArrowDown, FiGift, FiClock, FiUser, FiShoppingBag } from "react-icons/fi";
import { useTranslation } from "react-i18next";

//internal import
import useAsync from "@/hooks/useAsync";
import PageTitle from "@/components/Typography/PageTitle";
import Loading from "@/components/preloader/Loading";
import Main from "@/layout/Main";
import NotFound from "@/components/table/NotFound";
import CustomerServices from "@/services/CustomerServices";
import LoyaltyServices from "@/services/LoyaltyServices";

const CustomerLoyalty = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusDescription, setBonusDescription] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: customer, loading: customerLoading, error: customerError } = useAsync(() =>
    CustomerServices.getCustomerById(id)
  );

  const { data: loyaltyData, loading: loyaltyLoading, error: loyaltyError } = useAsync(() =>
    LoyaltyServices.getCustomerLoyaltyDetails(id)
  );

  const { data: orderHistory, loading: orderLoading, error: orderError } = useAsync(() =>
    CustomerServices.getCustomerOrders(id)
  );

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned':
        return <FiTrendingUp className="text-green-600" />;
      case 'bonus':
        return <FiGift className="text-purple-600" />;
      case 'redeemed':
        return <FiArrowDown className="text-red-600" />;
      case 'expired':
        return <FiClock className="text-gray-600" />;
      default:
        return <FiStar className="text-blue-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earned':
      case 'bonus':
        return 'text-green-600';
      case 'redeemed':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Delivered: 'green',
      Pending: 'yellow',
      Processing: 'blue',
      Cancel: 'red',
      Cancelled: 'red',
    };
    return <Badge type={colors[status] || 'neutral'}>{status}</Badge>;
  };

  const handleAwardBonus = async () => {
    if (!bonusPoints || bonusPoints <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    setIsAwarding(true);
    try {
      await LoyaltyServices.awardBonusPoints(id, parseInt(bonusPoints), bonusDescription);
      setBonusPoints('');
      setBonusDescription('');
      alert('Bonus points awarded successfully!');
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error awarding bonus points:', error);
      alert('Failed to award bonus points');
    } finally {
      setIsAwarding(false);
    }
  };

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
    }).format(amount);
  };

  if (customerLoading || loyaltyLoading) {
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
      <PageTitle>Customer Loyalty Management</PageTitle>

      {/* Customer Header */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <FiUser size={24} className="text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {customer.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{customer.email}</p>
              <p className="text-gray-600 dark:text-gray-400">{customer.phone}</p>
            </div>
            {loyaltyData?.customer && (
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">
                  {loyaltyData.customer.loyaltyPoints.current}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available Points</div>
                <div className="text-xs text-gray-500">
                  Worth {formatCurrency(loyaltyData.redemptionValue)} SAR
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Loyalty Overview', icon: FiStar },
              { id: 'transactions', label: 'Transactions', icon: FiClock },
              { id: 'orders', label: 'Order History', icon: FiShoppingBag },
              { id: 'award', label: 'Award Points', icon: FiGift }
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

      {/* Overview Tab */}
      {selectedTab === 'overview' && loyaltyData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loyaltyData.customer.loyaltyPoints.current}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiStar className="text-purple-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loyaltyData.customer.loyaltyPoints.total}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiTrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Points Used</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loyaltyData.customer.loyaltyPoints.used}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <FiArrowDown className="text-red-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {loyaltyData.pointsExpiringIn30Days}
                  </p>
                  <p className="text-xs text-gray-500">Next 30 days</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FiClock className="text-orange-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Purchase Statistics */}
      {selectedTab === 'overview' && loyaltyData?.customer?.purchaseStats && (
        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Purchase Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {loyaltyData.customer.purchaseStats.totalOrders}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(loyaltyData.customer.purchaseStats.totalSpent)} SAR
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(loyaltyData.customer.purchaseStats.averageOrderValue)} SAR
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Order</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Transactions Tab */}
      {selectedTab === 'transactions' && loyaltyData?.recentTransactions && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Loyalty Transactions
            </h3>
            {loyaltyData.recentTransactions.length > 0 ? (
              <TableContainer className="mb-8">
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Points</th>
                      <th>Balance After</th>
                      <th>Date</th>
                      <th>Order</th>
                    </tr>
                  </TableHeader>
                  {loyaltyData.recentTransactions.map((transaction, index) => (
                    <tr key={index}>
                      <td>
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="text-sm">{transaction.description}</td>
                      <td>
                        <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </td>
                      <td>{transaction.balanceAfter}</td>
                      <td className="text-sm">{formatDate(transaction.createdAt)}</td>
                      <td>
                        {transaction.order ? (
                          <span className="text-xs text-purple-600">
                            #{transaction.order.invoice}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
              </TableContainer>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No transactions found
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Orders Tab */}
      {selectedTab === 'orders' && orderHistory && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Order History
            </h3>
            {orderHistory.length > 0 ? (
              <TableContainer className="mb-8">
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Payment Method</th>
                      <th>Items</th>
                    </tr>
                  </TableHeader>
                  {orderHistory.map((order) => (
                    <tr key={order._id}>
                      <td className="font-medium">
                        #{order.invoice || order._id.substring(20, 24)}
                      </td>
                      <td className="text-sm">{formatDate(order.createdAt)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td className="font-semibold">{formatCurrency(order.total)} SAR</td>
                      <td className="text-sm">{order.paymentMethod}</td>
                      <td className="text-sm">{order.cart?.length || 0} items</td>
                    </tr>
                  ))}
                </Table>
              </TableContainer>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No orders found
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Award Points Tab */}
      {selectedTab === 'award' && (
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Award Bonus Points
            </h3>
            <div className="max-w-md space-y-4">
              <div>
                <Label>
                  <span>Points to Award</span>
                  <Input
                    type="number"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    placeholder="Enter number of points"
                    className="mt-1"
                    min="1"
                  />
                </Label>
              </div>
              
              <div>
                <Label>
                  <span>Description (Optional)</span>
                  <Input
                    type="text"
                    value={bonusDescription}
                    onChange={(e) => setBonusDescription(e.target.value)}
                    placeholder="Reason for awarding points"
                    className="mt-1"
                  />
                </Label>
              </div>
              
              <Button
                onClick={handleAwardBonus}
                disabled={!bonusPoints || bonusPoints <= 0 || isAwarding}
                className="flex items-center space-x-2"
              >
                <FiGift size={16} />
                <span>{isAwarding ? 'Awarding...' : 'Award Points'}</span>
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </Main>
  );
};

export default CustomerLoyalty; 