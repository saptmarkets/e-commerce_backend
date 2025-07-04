import { useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FiGift, 
  FiTrendingUp, 
  FiClock, 
  FiStar,
  FiArrowUp,
  FiArrowDown,
  FiInfo
} from "react-icons/fi";
import { IoTrophyOutline } from "react-icons/io5";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

//internal import
import Dashboard from "./dashboard";
import useGetSetting from "@hooks/useGetSetting";
import Loading from "@components/preloader/Loading";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { SidebarContext } from "@context/SidebarContext";
import LoyaltyServices from "@services/LoyaltyServices";

const LoyaltyDashboard = () => {
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const { t } = useTranslation('common');
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue, getNumberTwo, showDateFormat } = useUtilsFunction();
  
  const [selectedTab, setSelectedTab] = useState('overview');

  const {
    data: loyaltySummary,
    error: summaryError,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ["loyalty-summary"],
    queryFn: async () => await LoyaltyServices.getLoyaltySummary(),
  });

  const {
    data: transactionHistory,
    error: historyError,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ["loyalty-transactions"],
    queryFn: async () => await LoyaltyServices.getTransactionHistory(),
    enabled: selectedTab === 'history'
  });

  const {
    data: loyaltyConfig,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ["loyalty-config"],
    queryFn: async () => await LoyaltyServices.getLoyaltyConfig(),
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

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
        return <FiInfo className="text-blue-600" />;
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

  if (isLoading || summaryLoading) {
    return <Loading loading={true} />;
  }

  return (
    <Dashboard
      title={t('loyaltyProgram')}
      description={t('earnPointsWithEveryPurchase')}
    >
      <div className="font-serif">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('loyaltyProgram')}
            </h2>
            <p className="text-gray-600">
              {t('earnPointsWithEveryPurchase')}
            </p>
          </div>
          
          {loyaltySummary?.customer && (
            <div className="mt-4 lg:mt-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {loyaltySummary.customer.loyaltyPoints.current}
                </div>
                <div className="text-sm opacity-90">{t('availablePoints')}</div>
                <div className="text-xs opacity-75 mt-1">
                  {t('worth')} {getNumberTwo(loyaltySummary.redemptionValue)} <span className="icon-saudi_riyal">&#xE900;</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: t('overview'), icon: FiStar },
              { id: 'history', label: t('transactionHistory'), icon: FiClock },
              { id: 'how-it-works', label: t('howItWorks'), icon: FiInfo }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && loyaltySummary && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('currentPoints')}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loyaltySummary.customer.loyaltyPoints.current}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FiStar className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('totalEarned')}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loyaltySummary.customer.loyaltyPoints.total}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <FiTrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('pointsUsed')}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loyaltySummary.customer.loyaltyPoints.used}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <FiArrowDown className="text-red-600" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('expiringSoon')}</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {loyaltySummary.pointsExpiringIn30Days}
                    </p>
                    <p className="text-xs text-gray-500">{t('next30Days')}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <FiClock className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Stats */}
            {loyaltySummary.customer.purchaseStats && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <IoTrophyOutline className="mr-2 text-purple-600" />
                  {t('purchaseStatistics')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {loyaltySummary.customer.purchaseStats.totalOrders}
                    </div>
                    <div className="text-sm text-gray-600">{t('totalOrders')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {getNumberTwo(loyaltySummary.customer.purchaseStats.totalSpent)} <span className="icon-saudi_riyal">&#xE900;</span>
                    </div>
                    <div className="text-sm text-gray-600">{t('totalSpent')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {getNumberTwo(loyaltySummary.customer.purchaseStats.averageOrderValue)} <span className="icon-saudi_riyal">&#xE900;</span>
                    </div>
                    <div className="text-sm text-gray-600">{t('averageOrder')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {loyaltySummary.recentTransactions && loyaltySummary.recentTransactions.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recentActivity')}</h3>
                <div className="space-y-3">
                  {loyaltySummary.recentTransactions.slice(0, 5).map((transaction, index) => {
                    const valueText = transaction.type === 'redeemed' 
                      ? t('redeemedPoints', { points: transaction.points, discount: getNumberTwo(transaction.value) })
                      : transaction.type === 'earned' || transaction.type === 'bonus'
                        ? t('earnedPointsFromOrder', { points: transaction.points, orderId: transaction.orderId || 'N/A' })
                        : transaction.type === 'expired'
                          ? `${t('removedPointsFromCancelledOrder', { points: transaction.points, orderId: transaction.orderId || 'N/A' })}`
                          : null;

                    return (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className={`text-xl ${getTransactionColor(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {valueText}
                            </p>
                            {transaction.balance !== undefined && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Balance: {transaction.balance} {t('points')}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                              {showDateFormat(transaction.date)}
                            </p>
                          </div>
                        </div>
                        {transaction.orderId && (
                          <Link href={`/order/${transaction.orderId}`} className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                            Order #{transaction.orderInvoice}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setSelectedTab('history')}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    View All Transactions →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction History Tab */}
        {selectedTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
            </div>
            
            {historyLoading ? (
              <div className="p-8 text-center">
                <Loading loading={true} />
              </div>
            ) : transactionHistory?.transactions?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {transactionHistory.transactions.map((transaction, index) => (
                  <div key={index} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {showDateFormat(transaction.createdAt)}
                        </p>
                        {transaction.order && (
                          <p className="text-xs text-purple-600">
                            Order #{transaction.order.invoice}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                      </div>
                      <div className="text-sm text-gray-500">
                        Balance: {transaction.balanceAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FiClock size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Start shopping to earn loyalty points!</p>
              </div>
            )}
          </div>
        )}

        {/* How It Works Tab */}
        {selectedTab === 'how-it-works' && loyaltyConfig && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">{t('howOurLoyaltyProgramWorks')}</h3>
              <p className="text-purple-100">
                {t('earnPointsWithEveryPurchaseAndRedeem')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earning Points */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
                    <FiArrowUp className="text-green-600" size={24} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{t('earningPoints')}</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">{t('earningPointsExplanation')}</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('perSARSpent')}:</span>
                    <span className="font-semibold">{loyaltyConfig.config.pointsPerSAR} {t('point')}</span>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('bonusPoints')}:</p>
                    {loyaltyConfig.config.bonusThresholds.map((threshold, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('ordersOver')} {threshold.amount} <span className="icon-saudi_riyal">&#xE900;</span>:</span>
                        <span className="font-semibold text-purple-600">+{threshold.bonus} {t('bonus')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Redeeming Points */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-red-100 rounded-full mr-4">
                    <FiArrowDown className="text-red-600" size={24} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{t('redeemingPoints')}</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">{t('redeemingPointsExplanation')}</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('pointValue')}:</span>
                    <span className="font-semibold">{loyaltyConfig.config.pointValue} <span className="icon-saudi_riyal">&#xE900;</span> {t('perPoint')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('minimumRedemption')}:</span>
                    <span className="font-semibold">{loyaltyConfig.config.minimumRedemption} {t('points')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('pointsExpireAfter')}:</span>
                    <span className="font-semibold">{loyaltyConfig.config.pointsExpiry} {t('days')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiInfo className="mr-2 text-blue-600" />
                {t('exampleCalculation')}
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>{t('orderOf', { amount: 1500 })} <span className="icon-saudi_riyal">&#xE900;</span>:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {t('basePoints')}: 1,500 × {loyaltyConfig.config.pointsPerSAR} = 1,500 {t('points')}</li>
                  <li>• {t('bonusPoints')}: +150 {t('points')} ({t('forOrdersOver', { amount: 1000 })} <span className="icon-saudi_riyal">&#xE900;</span>)</li>
                  <li>• <strong>{t('totalEarned')}: 1,650 {t('points')}</strong></li>
                  <li>• {t('redemptionValue')}: 1,650 × {loyaltyConfig.config.pointValue} = {getNumberTwo(1650 * loyaltyConfig.config.pointValue)} <span className="icon-saudi_riyal">&#xE900;</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default LoyaltyDashboard; 