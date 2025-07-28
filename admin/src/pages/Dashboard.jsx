import {
  Pagination,
  Table,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  WindmillContext,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@windmill/react-ui";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiRefreshCw, FiShoppingCart, FiTruck, FiTrendingUp, FiDollarSign, FiPackage, FiClock, FiActivity, FiEye, FiDownload, FiFilter, FiStar, FiZap, FiTarget, FiUsers, FiTrash2, FiTrendingDown, FiMinus } from "react-icons/fi";
import { ImCreditCard, ImStack } from "react-icons/im";
import { useHistory } from "react-router-dom";

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
              className={`flex items-center text-base font-semibold px-4 py-2 rounded-full space-x-2 ${
                changeType === "up" ? "bg-emerald-100 text-emerald-700" : changeType === "down" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-500"
              }`}
            >
              {changeType === "up" ? (
                <FiTrendingUp className="w-5 h-5" />
              ) : changeType === "down" ? (
                <FiTrendingDown className="w-5 h-5" />
              ) : (
                <FiMinus className="w-5 h-5" />
              )}
              <span>{change}</span>
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
  const [activeChartTab, setActiveChartTab] = useState('Sales'); // New state for chart selection

  // New state for low stock and promotions
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  // New state for active promotions by type
  const [fixedPriceCount, setFixedPriceCount] = useState(0);
  const [comboCount, setComboCount] = useState(0);

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

  const history = useHistory();
  const handleViewOrder = (order) => {
    if (order._id) {
      history.push(`/order/${order._id}`);
    }
  };
  const handleDeleteOrder = (order) => {
    // TODO: Implement delete logic (e.g., show confirmation, call API)
    if (window.confirm(`${t("AreYouSureDeleteOrder")} #${order.invoice}?`)) {
      alert(`${t("OrderDeleted")} #${order.invoice}!`);
    }
  };

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

    // === Sales and Orders Chart Data (Last 7 Days) ===
    const dailyReportMap = {};
    const today = dayjs();

    // Initialize 7 days with default values
    for (let i = 6; i >= 0; i--) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      dailyReportMap[date] = { date: date, total: 0, order: 0 };
    }

    // Populate with actual order data
    dashboardOrderAmount?.ordersData?.forEach((value) => {
      const onlyDate = dayjs(value.updatedAt).format('YYYY-MM-DD');
      if (dailyReportMap[onlyDate]) {
        dailyReportMap[onlyDate].total += value.total;
        dailyReportMap[onlyDate].order += 1;
      }
    });

    // Convert map to sorted array
    const newSalesReport = Object.values(dailyReportMap).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    setSalesReport(newSalesReport);
    console.log("Weekly Performance salesReport data:", newSalesReport); // Updated log

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
      setLowStockProducts(res || []); // Use 'res' directly as it contains the array
      console.log("Dashboard Low Stock Products:", res);
    }).catch(err => {
      console.error("Error fetching low stock products:", err);
      setLowStockProducts([]);
    });
    // Fetch all promotions and count by type, filtering for truly active
    PromotionServices.getAllPromotions({ limit: 1000 }).then(data => {
      let promotions = [];
      if (Array.isArray(data)) {
        promotions = data;
      } else if (Array.isArray(data?.promotions)) {
        promotions = data.promotions;
      }
      const now = new Date();
      const trulyActive = promotions.filter(p =>
        p.isActive === true &&
        new Date(p.startDate) <= now &&
        new Date(p.endDate) >= now
      );
      setFixedPriceCount(trulyActive.filter(p => p.type === 'fixed_price').length);
      setComboCount(trulyActive.filter(p => p.type === 'bulk_purchase' || p.type === 'assorted_items').length);
    }).catch(() => {
      setFixedPriceCount(0);
      setComboCount(0);
    });

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
      case "Received":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "Out for Delivery":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20"
      case "Cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-5 animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 pb-8 pt-4">
          {/* Page Header */}
          <div className="mx-6 mb-12">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
                    {t("SaptMarketsAnalytics")}
                  </h1>
                  <p className="text-gray-500 mt-3 text-lg">{t("RealTimeInsights")}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{dashboardOrderCount?.totalOrder || 0}</div>
                    <div className="text-gray-500">{t("TotalOrders")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{currency}{getNumberTwo(dashboardOrderAmount?.totalAmount || 0)}</div>
                    <div className="text-gray-500">{t("TotalRevenue")}</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Main Stats */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dynamic Today's Revenue StatCard */}
              {(() => {
                const today = todayOrderAmount || 0;
                const yesterday = yesterdayOrderAmount || 0;
                let percentageChange = 0;
                let changeType = "neutral";
                let changeText = "";
                if (yesterday > 0) {
                  percentageChange = ((today - yesterday) / yesterday) * 100;
                  changeType = percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";
                  changeText = `${percentageChange > 0 ? '+' : ''}${getNumberTwo(percentageChange)}%`;
                } else if (today > 0) {
                  percentageChange = 100;
                  changeType = "up";
                  changeText = `+${getNumberTwo(percentageChange)}%`;
                } else {
                  changeText = "0.0%";
                  changeType = "neutral";
                }
                return (
                  <StatCard
                    title={t("TodayRevenue")}
                    value={`${currency}${getNumberTwo(today)}`}
                    change={changeText}
                    changeType={changeType}
                    icon={FiDollarSign}
                    gradient="from-emerald-500 to-teal-600"
                    sparkle={true}
                  />
                );
              })()}
              {/* Dynamic Yesterday's Sales StatCard */}
              {(() => {
                const today = todayOrderAmount || 0;
                const yesterday = yesterdayOrderAmount || 0;
                let percentageChange = 0;
                let changeType = "neutral";
                let changeText = "";
                if (yesterday > 0) {
                  percentageChange = ((today - yesterday) / yesterday) * 100;
                  changeType = percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";
                  changeText = `${percentageChange > 0 ? '+' : ''}${getNumberTwo(percentageChange)}%`;
                } else if (today > 0) {
                  percentageChange = 100;
                  changeType = "up";
                  changeText = `+${getNumberTwo(percentageChange)}%`;
                } else {
                  changeText = "0.0%";
                  changeType = "neutral";
                }
                return (
                  <StatCard
                    title={t("YesterdaySales")}
                    value={`${currency}${getNumberTwo(yesterday)}`}
                    change={changeText}
                    changeType={changeType}
                    icon={FiTrendingUp}
                    gradient="from-blue-500 to-indigo-600"
                  />
                );
              })()}
              {/* Dynamic Monthly Total StatCard */}
              {(() => {
                const thisMonth = dashboardOrderAmount?.thisMonthlyOrderAmount || 0;
                const lastMonth = dashboardOrderAmount?.lastMonthlyOrderAmount || 0;
                let percentageChange = 0;
                let changeType = "neutral";
                let changeText = "";
                if (lastMonth > 0) {
                  percentageChange = ((thisMonth - lastMonth) / lastMonth) * 100;
                  changeType = percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";
                  changeText = `${percentageChange > 0 ? '+' : ''}${getNumberTwo(percentageChange)}%`;
                } else if (thisMonth > 0) {
                  percentageChange = 100;
                  changeType = "up";
                  changeText = `+${getNumberTwo(percentageChange)}%`;
                } else {
                  changeText = "0.0%";
                  changeType = "neutral";
                }
                return (
                  <StatCard
                    title={t("MonthlyTotal")}
                    value={`${currency}${getNumberTwo(thisMonth)}`}
                    change={changeText}
                    changeType={changeType}
                    icon={FiTarget}
                    gradient="from-purple-500 to-pink-600"
                    sparkle={true}
                  />
                );
              })()}
            </div>
        </div>

          {/* Order Metrics */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title={t("TotalOrders")}
                value={dashboardOrderCount?.totalOrder || 0}
                icon={FiPackage}
                color="bg-gradient-to-r from-violet-500 to-purple-600"
                trend={t("AllTimeOrders")}
              />
              <MetricCard
                title={t("PendingOrders")}
                value={dashboardOrderCount?.totalPendingOrder?.count || 0}
                icon={FiClock}
                color="bg-gradient-to-r from-amber-500 to-orange-600"
                trend={t("AwaitingProcessing")}
              />
              <MetricCard
                title={t("ProcessingOrders")}
                value={dashboardOrderCount?.totalProcessingOrder || 0}
                icon={FiActivity}
                color="bg-gradient-to-r from-blue-500 to-cyan-600"
                trend={t("BeingPrepared")}
              />
              <MetricCard
                title={t("CompletedOrders")}
                value={dashboardOrderCount?.totalDeliveredOrder || 0}
                icon={FiCheck}
                color="bg-gradient-to-r from-emerald-500 to-green-600"
                trend={t("SuccessfullyDelivered")}
              />
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
                    <h3 className="text-2xl font-bold text-gray-900">{t("InventoryManagement")}</h3>
                    <p className={`font-semibold mt-2 text-lg ${lowStockProducts.length === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lowStockProducts.length === 0
                        ? t("ExcellentStockStatus")
                        : `⚠️ ${lowStockProducts.length} ${t("ProductsRequireAttention")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">128</p>
                    <p className="text-gray-500">{t("TotalProducts")}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${lowStockProducts.length === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {lowStockProducts.length === 0 ? '100%' : `${Math.round((128 - lowStockProducts.length) / 128 * 100)}%`}
                    </p>
                    <p className="text-gray-500">{t("StockHealth")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{lowStockProducts.length}</p>
                    <p className="text-gray-500">{t("LowStockAlerts")}</p>
                    {lowStockProducts.length > 0 && (
                      <button
                        onClick={() => setShowLowStockModal(true)}
                        className="mt-2 px-4 py-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-semibold transition-all transform hover:scale-105"
                      >
                        {t("ViewDetails")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
          {/* Active Campaigns Card (Moved and Cleaned) */}
          <div className="mx-6 mb-8">
            <GlassCard className="p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 opacity-90"></div>
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <FiZap className="w-6 h-6 text-yellow-300" />
                      <h2 className="text-2xl font-bold">{t("ActiveCampaigns")}</h2>
                    </div>
                    <p className="mb-4 text-lg">
                      {fixedPriceCount + comboCount === 0
                        ? t("NoActivePromotions")
                        : `You have ${fixedPriceCount} ${t("FixedPricePromotions")} and ${comboCount} ${t("ComboPromotions")} active.`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-12">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{fixedPriceCount}</div>
                      <div className="text-white/70">{t("FixedPrice")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{comboCount}</div>
                      <div className="text-white/70">Combo</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Analytics Section */}
          <div className="mx-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Performance */}
              <GlassCard className="p-8">
                {/* Top controls container: Heading, Tabs, Legend */}
                <div className="w-full">
                  <div className="flex items-center justify-between w-full">
                    {/* Heading on the left, allow wrapping */}
                    <h3 className="text-2xl font-bold text-gray-900 flex-1 break-words whitespace-normal">{t("WeeklyPerformance")}</h3>
                    {/* Tabs in the center */}
                    <div className="flex-1 flex justify-center">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setActiveChartTab('Sales')}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            activeChartTab === 'Sales'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {t("Sales")}
                        </button>
                        <button
                          onClick={() => setActiveChartTab('Orders')}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            activeChartTab === 'Orders'
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {t("Orders")}
                        </button>
                      </div>
                    </div>
                    {/* Legend on the right */}
                    <div className="flex-1 flex justify-end items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                        <span className="font-medium text-gray-600">{t("Revenue")}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        <span className="font-medium text-gray-600">{t("Orders")}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Spacing between controls and chart */}
                <div className="mt-12"></div>
                {/* Chart container: Bars only, never overlaps controls */}
                <div className="w-full flex items-end justify-between space-x-3 px-4 pb-4" style={{height: '16rem'}}>
                  {salesReport.length > 0 && salesReport.map((item, index) => {
                    const value = activeChartTab === 'Sales' ? item.total : item.order;
                    const maxValue = Math.max(...salesReport.map(reportItem => activeChartTab === 'Sales' ? reportItem.total : reportItem.order));
                    // Scale bar height to fit within the fixed 16rem (h-64) container
                    const barHeight = maxValue > 0 ? (value / maxValue) * 150 : 0;
                    const barGradient = activeChartTab === 'Sales' 
                      ? 'from-emerald-500 to-emerald-300' 
                      : 'from-blue-500 to-blue-300';
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        {/* The 'tube' container with fixed height and border */}
                        <div className="relative w-8 h-64 border border-gray-200 rounded-lg overflow-hidden">
                          {/* The liquid fill */}
                          <div
                            style={{ height: `${barHeight}px` }}
                            className={`w-full absolute bottom-0 bg-gradient-to-t ${barGradient} transition-all duration-300 ease-out`}
                          ></div>

                          {/* The numerical label (centered in the full tube, then rotated) */}
                          {value > 0 && (
                            <div
                              className="absolute inset-0 flex items-center justify-center z-10"
                            >
                              <span
                                className={`text-base font-bold transform -rotate-90 whitespace-nowrap ${
                                  activeChartTab === 'Sales' ? 'text-blue-700' : 'text-emerald-700'
                                }`}
                                style={{ visibility: barHeight < 20 ? 'hidden' : 'visible' }}
                              >
                                {activeChartTab === 'Sales' ? `${currency}${getNumberTwo(value)}` : value}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Date label below the bar */}
                        <span className="mt-2 text-xs text-gray-500">{dayjs(item.date).format('MMM DD')}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Top Selling Products */}
              <GlassCard className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{t("TopSellingProducts")}</h3>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold">
                    {t("ViewAllProducts")}
                  </button>
                </div>
                {/* Product List with Scrollbar */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Product 1 - Mega Combo Deal */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <FiStar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{t("MegaComboDeal")}</h4>
                      <p className="text-sm text-gray-600">45% of total sales • {currency}25,420</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
                    </div>
                  </div>

                  {/* Product 2 - Britannia Sweets */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <FiStar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{t("BritanniaSweets")}</h4>
                      <p className="text-sm text-gray-600">30% of total sales • {currency}15,680</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                    </div>
                  </div>

                  {/* Product 3 - Betty Crocker */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FiStar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{t("BettyCrocker")}</h4>
                      <p className="text-sm text-gray-600">20% of total sales • {currency}8,940</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                    </div>
        </div>

                  {/* Product 4 - Smartline Water */}
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-2xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <FiStar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{t("SmartlineWater")}</h4>
                      <p className="text-sm text-gray-600">15% of total sales • {currency}4,320</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Orders Table */}
          <GlassCard className="overflow-hidden">
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{t("RecentOrderActivity")}</h3>
                <div className="flex items-center space-x-3">
                  <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                    <FiFilter className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-semibold transition-colors">
                    {t("ExportData")}
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
              <div className="overflow-x-auto max-h-96 custom-scrollbar">
                <TableContainer>
                  <Table className="min-w-full text-sm text-gray-900">
            <TableHeader>
                      <tr className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
                        <TableCell className="px-8 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("InvoiceNo")}</TableCell>
                        <TableCell className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("CustomerName")}</TableCell>
                        <TableCell className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("TimeTbl")}</TableCell>
                        <TableCell className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("MethodTbl")}</TableCell>
                        <TableCell className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("AmountTbl")}</TableCell>
                        <TableCell className="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("OderStatusTbl")}</TableCell>
                        <TableCell className="px-8 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">{t("ActionTbl")}</TableCell>
              </tr>
            </TableHeader>
                    {/* Modernized OrderTable rows with hover and status pill */}
                    <tbody>
                      {(dataTable || []).map((order, idx) => (
                        <tr key={order._id || order.id || idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                          <TableCell className="px-8 py-4">{order.invoice}</TableCell>
                          <TableCell className="px-6 py-4">{order.user_info?.name}</TableCell>
                          <TableCell className="px-6 py-4">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                          <TableCell className="px-6 py-4">{order.paymentMethod}</TableCell>
                          <TableCell className="px-6 py-4">{currency}{getNumberTwo(order.total)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
                          </TableCell>
                          <TableCell className="px-8 py-4 flex space-x-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 shadow-sm transition-all"
                              title="View Order"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
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
        <NotFound title={t("SorryNoOrders")} />
              </div>
            )}
          </GlassCard>
        </div>
      </div>
      {/* Low Stock Modal */}
      <Modal isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)}>
        <ModalHeader className="text-2xl font-bold text-gray-900">{t("LowStockProducts")}</ModalHeader>
        <ModalBody className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t("NoLowStockProducts")}</p>
            ) : (
              lowStockProducts.map((unit) => (
                <div key={unit._id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    {unit.images && unit.images[0] ? (
                      <img src={unit.images[0]} alt={unit.title || "Product"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiPackage className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{unit.title || unit.sku || t("UnknownProduct")}</h4>
                    <p className="text-sm text-gray-600">{t("SKU")}: {unit.sku || t("NA")} | {t("Barcode")}: {unit.barcode || t("NA")}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm font-semibold text-red-600">{t("StockTbl")}: {unit.stock}</span>
                      <span className="text-sm text-gray-500">{t("PackQty")}: {unit.packQty}</span>
                      <span className="text-sm text-gray-500">{t("Price")}: {currency}{unit.price}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      {unit.stock === 0 ? t("OutOfStock") : t("LowStock")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setShowLowStockModal(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
          >
            {t("Close")}
          </button>
        </ModalFooter>
      </Modal>
      <style>{`
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #a5b4fc 0%, #6ee7b7 100%);
  border-radius: 8px;
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #a5b4fc #f3f4f6;
}
`}</style>
    </>
  );
};

export default Dashboard;
