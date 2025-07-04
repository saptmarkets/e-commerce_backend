import {
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  WindmillContext,
} from "@windmill/react-ui";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiRefreshCw, FiShoppingCart, FiTruck, FiTrendingUp, FiDollarSign, FiPackage, FiClock, FiActivity, FiEye, FiDownload, FiFilter, FiStar, FiZap, FiTarget, FiUsers } from "react-icons/fi";
import { ImCreditCard, ImStack } from "react-icons/im";

//internal import
import useAsync from "@/hooks/useAsync";
import useFilter from "@/hooks/useFilter";
import LineChart from "@/components/chart/LineChart/LineChart";
import PieChart from "@/components/chart/Pie/PieChart";
import CardItem from "@/components/dashboard/CardItem";
import CardItemTwo from "@/components/dashboard/CardItemTwo";
import ChartCard from "@/components/chart/ChartCard";
import OrderTable from "@/components/order/OrderTable";
import TableLoading from "@/components/preloader/TableLoading";
import NotFound from "@/components/table/NotFound";
import PageTitle from "@/components/Typography/PageTitle";
import { SidebarContext } from "@/context/SidebarContext";
import OrderServices from "@/services/OrderServices";
import AnimatedContent from "@/components/common/AnimatedContent";
import ProductUnitServices from '@/services/ProductUnitServices';
import PromotionServices from '@/services/PromotionServices';
import useUtilsFunction from '@/hooks/useUtilsFunction';

// Modern Glass Card Component
const GlassCard = ({ children, className = "" }) => (
  <div
    className={`backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-black/5 ${className}`}
  >
    {children}
  </div>
);

// Modern Stat Card Component
const StatCard = ({ title, value, change, changeType, icon: Icon, gradient, sparkle }) => (
  <GlassCard className="p-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
    ></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {sparkle && <FiZap className="w-5 h-5 text-yellow-400 animate-pulse" />}
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {value}
          </h3>
          {change && (
            <div
              className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full ${
                changeType === "up" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}
            >
              <FiTrendingUp className="w-3 h-3 mr-1" />
              {change}
            </div>
          )}
        </div>
        <p className="text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  </GlassCard>
);

// Modern Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color, trend }) => (
  <GlassCard className="p-6 group hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{trend}</p>
      </div>
    </div>
    <p className="text-sm font-medium text-gray-600">{title}</p>
  </GlassCard>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { mode } = useContext(WindmillContext);

  dayjs.extend(isBetween);
  dayjs.extend(isToday);
  dayjs.extend(isYesterday);

  const { currentPage, handleChangePage } = useContext(SidebarContext);
  const { currency, getNumberTwo } = useUtilsFunction();

  // react hook
  const [todayOrderAmount, setTodayOrderAmount] = useState(0);
  const [yesterdayOrderAmount, setYesterdayOrderAmount] = useState(0);
  const [salesReport, setSalesReport] = useState([]);
  const [todayCashPayment, setTodayCashPayment] = useState(0);
  const [todayCardPayment, setTodayCardPayment] = useState(0);
  const [todayCreditPayment, setTodayCreditPayment] = useState(0);
  const [yesterdayCashPayment, setYesterdayCashPayment] = useState(0);
  const [yesterdayCardPayment, setYesterdayCardPayment] = useState(0);
  const [yesterdayCreditPayment, setYesterdayCreditPayment] = useState(0);

  // New state for low stock and promotions
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);

  const {
    data: bestSellerProductChart,
    loading: loadingBestSellerProduct,
    error,
  } = useAsync(OrderServices.getBestSellerProductChart);

  const { data: dashboardRecentOrder, loading: loadingRecentOrder } = useAsync(
    () => OrderServices.getDashboardRecentOrder({ page: currentPage, limit: 8 })
  );

  const { data: dashboardOrderCount, loading: loadingOrderCount } = useAsync(
    OrderServices.getDashboardCount
  );

  const { data: dashboardOrderAmount, loading: loadingOrderAmount } = useAsync(
    OrderServices.getDashboardAmount
  );

  const { dataTable, serviceData } = useFilter(dashboardRecentOrder?.orders);

  useEffect(() => {
    // today orders show
    const todayOrder = dashboardOrderAmount?.ordersData?.filter((order) =>
      dayjs(order.updatedAt).isToday()
    );
    const todayReport = todayOrder?.reduce((pre, acc) => pre + acc.total, 0);
    setTodayOrderAmount(todayReport);

    // yesterday orders
    const yesterdayOrder = dashboardOrderAmount?.ordersData?.filter((order) =>
      dayjs(order.updatedAt).set(-1, "day").isYesterday()
    );

    const yesterdayReport = yesterdayOrder?.reduce(
      (pre, acc) => pre + acc.total,
      0
    );
    setYesterdayOrderAmount(yesterdayReport);

    // sales orders chart data
    const salesOrderChartData = dashboardOrderAmount?.ordersData?.filter(
      (order) =>
        dayjs(order.updatedAt).isBetween(
          new Date().setDate(new Date().getDate() - 7),
          new Date()
        )
    );

    salesOrderChartData?.reduce((res, value) => {
      let onlyDate = value.updatedAt.split("T")[0];

      if (!res[onlyDate]) {
        res[onlyDate] = { date: onlyDate, total: 0, order: 0 };
        salesReport.push(res[onlyDate]);
      }
      res[onlyDate].total += value.total;
      res[onlyDate].order += 1;
      return res;
    }, {});

    setSalesReport(salesReport);

    const todayPaymentMethodData = [];
    const yesterDayPaymentMethodData = [];

    // today order payment method
    dashboardOrderAmount?.ordersData?.filter((item, value) => {
      if (dayjs(item.updatedAt).isToday()) {
        if (item.paymentMethod === "Cash") {
          let cashMethod = {
            paymentMethod: "Cash",
            total: item.total,
          };
          todayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Credit") {
          const cashMethod = {
            paymentMethod: "Credit",
            total: item.total,
          };

          todayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Card") {
          const cashMethod = {
            paymentMethod: "Card",
            total: item.total,
          };

          todayPaymentMethodData.push(cashMethod);
        }
      }

      return item;
    });
    // yesterday order payment method
    dashboardOrderAmount?.ordersData?.filter((item, value) => {
      if (dayjs(item.updatedAt).set(-1, "day").isYesterday()) {
        if (item.paymentMethod === "Cash") {
          let cashMethod = {
            paymentMethod: "Cash",
            total: item.total,
          };
          yesterDayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Credit") {
          const cashMethod = {
            paymentMethod: "Credit",
            total: item?.total,
          };

          yesterDayPaymentMethodData.push(cashMethod);
        }

        if (item.paymentMethod === "Card") {
          const cashMethod = {
            paymentMethod: "Card",
            total: item?.total,
          };

          yesterDayPaymentMethodData.push(cashMethod);
        }
      }

      return item;
    });

    const todayCsCdCit = Object.values(
      todayPaymentMethodData.reduce((r, { paymentMethod, total }) => {
        if (!r[paymentMethod]) {
          r[paymentMethod] = { paymentMethod, total: 0 };
        }
        r[paymentMethod].total += total;

        return r;
      }, {})
    );
    const today_cash_payment = todayCsCdCit.find(
      (el) => el.paymentMethod === "Cash"
    );
    setTodayCashPayment(today_cash_payment?.total);
    const today_card_payment = todayCsCdCit.find(
      (el) => el.paymentMethod === "Card"
    );
    setTodayCardPayment(today_card_payment?.total);
    const today_credit_payment = todayCsCdCit.find(
      (el) => el.paymentMethod === "Credit"
    );
    setTodayCreditPayment(today_credit_payment?.total);

    const yesterDayCsCdCit = Object.values(
      yesterDayPaymentMethodData.reduce((r, { paymentMethod, total }) => {
        if (!r[paymentMethod]) {
          r[paymentMethod] = { paymentMethod, total: 0 };
        }
        r[paymentMethod].total += total;

        return r;
      }, {})
    );
    const yesterday_cash_payment = yesterDayCsCdCit.find(
      (el) => el.paymentMethod === "Cash"
    );
    setYesterdayCashPayment(yesterday_cash_payment?.total);
    const yesterday_card_payment = yesterDayCsCdCit.find(
      (el) => el.paymentMethod === "Card"
    );
    setYesterdayCardPayment(yesterday_card_payment?.total);
    const yesterday_credit_payment = yesterDayCsCdCit.find(
      (el) => el.paymentMethod === "Credit"
    );
    setYesterdayCreditPayment(yesterday_credit_payment?.total);

    // Fetch low stock products and active promotions
    ProductUnitServices.getUnitsRequiringRefill().then(res => {
      setLowStockProducts(res?.data || []);
    }).catch(() => setLowStockProducts([]));
    PromotionServices.getActivePromotions().then(res => {
      setActivePromotions(Array.isArray(res) ? res : (res?.promotions || []));
    }).catch(() => setActivePromotions([]));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardOrderAmount]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "Processing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "Pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-5 animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 pb-8">
          {/* Page Header */}
          <div className="mx-6 mb-8">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    SaptMarkets Analytics
                  </h1>
                  <p className="text-gray-500 mt-2 text-lg">Real-time insights and performance metrics for your business</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardOrderCount?.totalOrder || 0}</div>
                    <div className="text-gray-500">Total Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{currency}{getNumberTwo(dashboardOrderAmount?.totalAmount || 0)}</div>
                    <div className="text-gray-500">Total Revenue</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Promotion Banner */}
          <div className="mx-6 mb-8">
            <GlassCard className="p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 opacity-90"></div>
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <FiZap className="w-6 h-6 text-yellow-300" />
                      <h2 className="text-2xl font-bold">Active Campaigns</h2>
                    </div>
                    <p className="text-white/90 mb-4 text-lg">
                      {activePromotions.length === 0 
                        ? "No active promotions at the moment - Create engaging campaigns to boost your sales!" 
                        : `${activePromotions.length} active promotions driving your sales forward!`}
                    </p>
                    <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-semibold backdrop-blur-sm transition-all duration-300 border-0">
                      Launch New Campaign
                    </button>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{activePromotions.length}</div>
                      <div className="text-white/70">Active Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{lowStockProducts.length}</div>
                      <div className="text-white/70">Low Stock Alerts</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Main Stats */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Today's Revenue"
                value={`${currency}${getNumberTwo(todayOrderAmount || 0)}`}
                change="+12.5%"
                changeType="up"
                icon={FiDollarSign}
                gradient="from-emerald-500 to-teal-600"
                sparkle={true}
              />
              <StatCard
                title="Yesterday's Sales"
                value={`${currency}${getNumberTwo(yesterdayOrderAmount || 0)}`}
                change="-2.1%"
                changeType="down"
                icon={FiTrendingUp}
                gradient="from-blue-500 to-indigo-600"
              />
              <StatCard
                title="Monthly Total"
                value={`${currency}${getNumberTwo(dashboardOrderAmount?.thisMonthlyOrderAmount || 0)}`}
                change="+24.3%"
                changeType="up"
                icon={FiTarget}
                gradient="from-purple-500 to-pink-600"
                sparkle={true}
              />
            </div>
          </div>

          {/* Order Metrics */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Orders"
                value={dashboardOrderCount?.totalOrder || 0}
                icon={FiPackage}
                color="bg-gradient-to-r from-violet-500 to-purple-600"
                trend="All time orders"
              />
              <MetricCard
                title="Pending Orders"
                value={dashboardOrderCount?.totalPendingOrder?.count || 0}
                icon={FiClock}
                color="bg-gradient-to-r from-amber-500 to-orange-600"
                trend="Awaiting processing"
              />
              <MetricCard
                title="Processing"
                value={dashboardOrderCount?.totalProcessingOrder || 0}
                icon={FiActivity}
                color="bg-gradient-to-r from-blue-500 to-cyan-600"
                trend="Being prepared"
              />
              <MetricCard
                title="Completed"
                value={dashboardOrderCount?.totalDeliveredOrder || 0}
                icon={FiCheck}
                color="bg-gradient-to-r from-emerald-500 to-green-600"
                trend="Successfully delivered"
              />
            </div>
          </div>

          {/* Analytics Section */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Performance */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Weekly Performance</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                      <span className="font-medium text-gray-600">Revenue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span className="font-medium text-gray-600">Orders</span>
                    </div>
                  </div>
                </div>
                <ChartCard mode={mode} loading={loadingOrderAmount} title="">
                  <LineChart salesReport={salesReport} />
                </ChartCard>
              </GlassCard>

              {/* Top Products */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Best Selling Products</h3>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold">
                    View All Products
                  </button>
                </div>
                <ChartCard mode={mode} loading={loadingBestSellerProduct} title="">
                  <PieChart data={bestSellerProductChart} />
                </ChartCard>
              </GlassCard>
            </div>
          </div>

          {/* Stock Status */}
          <div className="mx-6 mb-8">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                    <FiCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Inventory Management</h3>
                    <p className={`font-semibold mt-2 text-lg ${lowStockProducts.length === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lowStockProducts.length === 0 
                        ? "Excellent! All products are well stocked 🎉" 
                        : `⚠️ ${lowStockProducts.length} products require attention`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">128</p>
                    <p className="text-gray-500">Total Products</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${lowStockProducts.length === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lowStockProducts.length === 0 ? '100%' : `${Math.round((128 - lowStockProducts.length) / 128 * 100)}%`}
                    </p>
                    <p className="text-gray-500">Stock Health</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{lowStockProducts.length}</p>
                    <p className="text-gray-500">Low Stock Alerts</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Orders Table */}
          <div className="mx-6 mb-8">
            <GlassCard className="overflow-hidden">
              <div className="p-8 pb-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Recent Order Activity</h3>
                  <div className="flex items-center space-x-3">
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                      <FiFilter className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-semibold transition-colors">
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
              
              {loadingRecentOrder ? (
                <div className="p-8">
                  <TableLoading row={5} col={4} />
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
              ) : serviceData?.length !== 0 ? (
                <div className="overflow-x-auto">
                  <TableContainer>
                    <Table>
                      <TableHeader>
                        <tr className="border-b border-gray-200/50">
                          <TableCell className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("InvoiceNo")}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("CustomerName")}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("TimeTbl")}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("MethodTbl")}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("AmountTbl")}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("OderStatusTbl")}
                          </TableCell>
                          <TableCell className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {t("ActionTbl")}
                          </TableCell>
                        </tr>
                      </TableHeader>
                      <OrderTable orders={dataTable} />
                    </Table>
                    <TableFooter>
                      <Pagination
                        totalResults={dashboardRecentOrder?.totalOrder}
                        resultsPerPage={8}
                        onChange={handleChangePage}
                        label="Table navigation"
                      />
                    </TableFooter>
                  </TableContainer>
                </div>
              ) : (
                <div className="p-8">
                  <NotFound title="Sorry, There are no orders right now." />
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
